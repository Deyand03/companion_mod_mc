/**
 * Backend Entry Point — Bootstraps all modules and starts the server.
 */

import pino from 'pino';
import { loadConfig } from './config/index.js';
import { EventBus } from './bus/index.js';
import { CompanionWebSocketServer } from './websocket/server.js';
import { GeminiClient } from './gemini/index.js';
import { ConversationManager } from './modules/conversation/index.js';
import type { ChatPayload } from './protocol/messages.js';

const logger = pino({
  name: 'companion-backend',
  level: process.env.LOG_LEVEL ?? 'info',
});

async function main(): Promise<void> {
  logger.info('=== Minecraft AI Companion Backend ===');

  // 1. Load configuration
  const { env, app } = loadConfig();

  // 2. Create shared infrastructure
  const bus = new EventBus();

  // 3. Create Gemini client
  const gemini = new GeminiClient(env.GEMINI_API_KEY, app);

  // 4. Create WebSocket server
  const wsServer = new CompanionWebSocketServer(bus, app);

  // 5. Create modules (Phase 1: only ConversationManager)
  // ConversationManager self-registers via EventBus — no reference needed
  void new ConversationManager(bus, gemini, app);

  // 6. Wire up: chat_response → send to mod via WebSocket
  bus.on('chat_response', (data) => {
    const payload: ChatPayload = {
      from: 'ai',
      format: 'text',
      content: data.content,
      reply_to: data.replyTo,
      streaming: false,
    };
    wsServer.send(data.clientId, 'chat', payload);
  });

  // 7. Start WebSocket server
  wsServer.start(env.WEBSOCKET_PORT, env.WEBSOCKET_HOST);

  logger.info(
    {
      companion: app.companion.name,
      personality: app.companion.personality,
      model: app.gemini.model,
      port: env.WEBSOCKET_PORT,
    },
    'Backend ready — waiting for Minecraft mod connection',
  );

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    bus.emit('shutdown', { reason: signal });
    wsServer.stop();
    gemini.destroy();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.fatal({ error }, 'Failed to start backend');
  process.exit(1);
});
