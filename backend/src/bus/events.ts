/**
 * Bus Event Definitions — All internal events that flow through the EventBus.
 *
 * Add new events here when modules need to communicate.
 * This is the type map that makes the EventBus type-safe.
 */

import type {
  ChatPayload,
  ConnectionInitPayload,
  StateUpdatePayload,
  EventPayload,
  FunctionResultPayload,
  ErrorPayload,
} from '../protocol/messages.js';

/** Map of event name → payload type. */
export interface BusEvents {
  // === WebSocket Events (from handler) ===
  /** A new mod client connected and sent connection_init. */
  connection_init: { clientId: string; payload: ConnectionInitPayload };
  /** A mod client disconnected. */
  connection_closed: { clientId: string; reason: string };

  // === Chat Events ===
  /** Player sent a chat message. */
  chat_received: { clientId: string; payload: ChatPayload };
  /** AI generated a response to send to the player. */
  chat_response: { clientId: string; content: string; replyTo: string | undefined };

  // === State Events (Phase 2+, stub for now) ===
  /** Game state update received from mod. */
  state_update: { clientId: string; payload: StateUpdatePayload };

  // === Game Events (Phase 2+, stub for now) ===
  /** Game event received from mod. */
  game_event: { clientId: string; payload: EventPayload };

  // === Function Events (Phase 5+, stub for now) ===
  /** Function call result received from mod. */
  function_result: { clientId: string; payload: FunctionResultPayload };

  // === Error Events ===
  /** Error occurred in a module. */
  module_error: { module: string; error: ErrorPayload };

  // === System Events ===
  /** Backend is shutting down. */
  shutdown: { reason: string };
}
