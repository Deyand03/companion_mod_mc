/**
 * WebSocket Server — Handles mod connections, heartbeat, and message routing.
 */

import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { EventBus } from '../bus/index.js';
import { validateIncomingMessage } from '../protocol/validation.js';
import {
  createMessage,
  type ChatPayload,
  type StateUpdatePayload,
  type EventPayload,
  type FunctionResultPayload,
  type ConnectionInitPayload,
  type ConnectionAckPayload,
  type ErrorPayload,
  type MessageType,
} from '../protocol/messages.js';
import { PROTOCOL_VERSION, MAX_MESSAGE_SIZE, HEARTBEAT_INTERVAL_MS, HEARTBEAT_TIMEOUT_MS } from '../protocol/version.js';
import type { AppConfig } from '../config/schema.js';

const logger = pino({ name: 'websocket' });

interface ClientState {
  id: string;
  ws: WebSocket;
  playerName: string | undefined;
  playerUuid: string | undefined;
  sessionId: string;
  lastHeartbeat: number;
  heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  timeoutTimer: ReturnType<typeof setTimeout> | undefined;
}

/**
 * WebSocket server that manages mod connections.
 */
export class CompanionWebSocketServer {
  private wss: WebSocketServer | undefined;
  private readonly clients = new Map<string, ClientState>();

  constructor(
    private readonly bus: EventBus,
    private readonly config: AppConfig,
  ) {}

  /** Start the WebSocket server. */
  start(port: number, host: string): void {
    this.wss = new WebSocketServer({
      port,
      host,
      maxPayload: MAX_MESSAGE_SIZE,
    });

    this.wss.on('connection', (ws) => this.handleConnection(ws));
    this.wss.on('error', (error) => logger.error({ error }, 'WebSocket server error'));

    logger.info({ port, host }, 'WebSocket server started');
  }

  /** Stop the server and close all connections. */
  stop(): void {
    for (const client of this.clients.values()) {
      this.cleanupClient(client);
    }
    this.clients.clear();
    this.wss?.close();
    logger.info('WebSocket server stopped');
  }

  /** Send a typed message to a specific client. */
  send<T extends MessageType>(clientId: string, type: T, payload: unknown): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      logger.warn({ clientId }, 'Cannot send — client not connected');
      return false;
    }

    const message = createMessage(type, payload);
    try {
      client.ws.send(JSON.stringify(message));
      logger.debug({ clientId, type }, 'Message sent');
      return true;
    } catch (error) {
      logger.error({ clientId, type, error }, 'Failed to send message');
      return false;
    }
  }

  /** Send a message to all connected clients. */
  broadcast<T extends MessageType>(type: T, payload: unknown): void {
    for (const clientId of this.clients.keys()) {
      this.send(clientId, type, payload);
    }
  }

  /** Get the first connected client ID (single-player for now). */
  getFirstClientId(): string | undefined {
    const first = this.clients.keys().next();
    return first.done ? undefined : first.value;
  }

  private handleConnection(ws: WebSocket): void {
    const clientId = uuidv4();
    const sessionId = uuidv4();

    const client: ClientState = {
      id: clientId,
      ws,
      playerName: undefined,
      playerUuid: undefined,
      sessionId,
      lastHeartbeat: Date.now(),
      heartbeatTimer: undefined,
      timeoutTimer: undefined,
    };

    this.clients.set(clientId, client);
    logger.info({ clientId }, 'New connection');

    // Start heartbeat
    this.startHeartbeat(client);

    ws.on('message', (data: RawData) => this.handleMessage(client, data));
    ws.on('close', (code, reason) => {
      logger.info({ clientId, code, reason: reason.toString() }, 'Connection closed');
      this.cleanupClient(client);
      this.clients.delete(clientId);
      this.bus.emit('connection_closed', { clientId, reason: reason.toString() });
    });
    ws.on('error', (error) => {
      logger.error({ clientId, error }, 'Connection error');
    });
  }

  private handleMessage(client: ClientState, rawData: RawData): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData.toString());
    } catch {
      logger.warn({ clientId: client.id }, 'Received non-JSON message');
      this.sendError(client.id, 'VALIDATION_INVALID_PAYLOAD', 'Message is not valid JSON', 'warning');
      return;
    }

    // Validate message
    const validation = validateIncomingMessage(parsed);
    if (!validation.valid) {
      logger.warn({ clientId: client.id, error: validation.error }, 'Invalid message');
      this.sendError(client.id, 'VALIDATION_INVALID_PAYLOAD', validation.error, 'warning');
      return;
    }

    const msg = validation.message;
    logger.debug({ clientId: client.id, type: msg.type }, 'Message received');

    // Route by message type
    switch (msg.type) {
      case 'connection_init':
        this.handleConnectionInit(client, msg.payload as Record<string, unknown>);
        break;
      case 'chat':
        this.bus.emit('chat_received', {
          clientId: client.id,
          payload: msg.payload as unknown as ChatPayload,
        });
        break;
      case 'state_update':
        this.bus.emit('state_update', {
          clientId: client.id,
          payload: msg.payload as unknown as StateUpdatePayload,
        });
        break;
      case 'event':
        this.bus.emit('game_event', {
          clientId: client.id,
          payload: msg.payload as unknown as EventPayload,
        });
        break;
      case 'function_result':
        this.bus.emit('function_result', {
          clientId: client.id,
          payload: msg.payload as unknown as FunctionResultPayload,
        });
        break;
      case 'heartbeat':
        client.lastHeartbeat = Date.now();
        break;
      case 'error':
        logger.warn({ clientId: client.id, payload: msg.payload }, 'Error from mod');
        break;
      default:
        this.sendError(client.id, 'VALIDATION_UNKNOWN_TYPE', `Unknown type: ${msg.type}`, 'warning');
    }
  }

  private handleConnectionInit(client: ClientState, payload: Record<string, unknown>): void {
    const protocolVersion = payload.protocol_version as string;

    // Check version compatibility
    if (protocolVersion !== PROTOCOL_VERSION) {
      const ackPayload: ConnectionAckPayload = {
        status: 'version_mismatch',
        session_id: client.sessionId,
        companion_name: this.config.companion.name,
        features: [],
      };
      this.send(client.id, 'connection_ack', ackPayload);
      logger.warn({ clientId: client.id, expected: PROTOCOL_VERSION, got: protocolVersion }, 'Version mismatch');
      client.ws.close(1002, 'Protocol version mismatch');
      return;
    }

    client.playerName = payload.player_name as string;
    client.playerUuid = payload.player_uuid as string;

    const ackPayload: ConnectionAckPayload = {
      status: 'ok',
      session_id: client.sessionId,
      companion_name: this.config.companion.name,
      features: ['chat', 'function_call', 'proactive'],
    };
    this.send(client.id, 'connection_ack', ackPayload);

    logger.info(
      { clientId: client.id, player: client.playerName, session: client.sessionId },
      'Connection established',
    );

    this.bus.emit('connection_init', {
      clientId: client.id,
      payload: payload as unknown as ConnectionInitPayload,
    });
  }

  private startHeartbeat(client: ClientState): void {
    // Send heartbeat every interval
    client.heartbeatTimer = setInterval(() => {
      this.send(client.id, 'heartbeat', {});
    }, HEARTBEAT_INTERVAL_MS);

    // Check for heartbeat timeout
    client.timeoutTimer = setInterval(() => {
      const elapsed = Date.now() - client.lastHeartbeat;
      if (elapsed > HEARTBEAT_TIMEOUT_MS) {
        logger.warn({ clientId: client.id, elapsed }, 'Heartbeat timeout — closing connection');
        client.ws.close(1001, 'Heartbeat timeout');
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private cleanupClient(client: ClientState): void {
    if (client.heartbeatTimer) clearInterval(client.heartbeatTimer);
    if (client.timeoutTimer) clearInterval(client.timeoutTimer);
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.close();
    }
  }

  private sendError(clientId: string, code: string, message: string, severity: ErrorPayload['severity']): void {
    this.send(clientId, 'error', {
      code,
      category: 'ValidationError',
      message,
      severity,
    });
  }
}
