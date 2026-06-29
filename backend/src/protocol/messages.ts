/**
 * WebSocket Protocol v1.0 — Message Type Definitions
 *
 * All message types between Mod and Backend as defined in SDS Section 2.
 * This is the single source of truth for TypeScript message shapes.
 */


// ============================================================
// Base Message
// ============================================================

/** All valid message types. */
export type MessageType =
  | 'chat'
  | 'state_update'
  | 'event'
  | 'function_call'
  | 'function_result'
  | 'error'
  | 'heartbeat'
  | 'connection_init'
  | 'connection_ack';

/** Base message envelope — every message has this shape. */
export interface Message<T extends MessageType = MessageType, P = unknown> {
  readonly version: '1.0';
  readonly type: T;
  readonly id: string;
  readonly timestamp: number;
  readonly payload: P;
}

// ============================================================
// Payload Types
// ============================================================

/** connection_init (Mod → Backend) */
export interface ConnectionInitPayload {
  readonly protocol_version: string;
  readonly mod_version: string;
  readonly player_name: string;
  readonly player_uuid: string;
  readonly minecraft_version: string;
}

/** connection_ack (Backend → Mod) */
export interface ConnectionAckPayload {
  readonly status: 'ok' | 'version_mismatch' | 'rejected';
  readonly session_id: string;
  readonly companion_name: string;
  readonly features: readonly string[];
}

/** chat (Bidirectional) */
export interface ChatPayload {
  readonly from: 'player' | 'ai';
  readonly format: 'text' | 'voice';
  readonly content: string;
  readonly reply_to: string | undefined;
  readonly streaming?: boolean;
}

/** state_update (Mod → Backend) */
export interface StateUpdatePayload {
  readonly is_full_sync: boolean;
  readonly changes: Record<string, unknown>;
}

/** event (Mod → Backend) */
export interface EventPayload {
  readonly event_type: string;
  readonly buffered: boolean;
  readonly data: Record<string, unknown>;
}

/** function_call (Backend → Mod) */
export interface FunctionCallPayload {
  readonly call_id: string;
  readonly function: string;
  readonly params: Record<string, unknown>;
  readonly requires_confirmation: boolean;
  readonly confirmation_message: string | undefined;
}

/** function_result (Mod → Backend) */
export interface FunctionResultPayload {
  readonly call_id: string;
  readonly status: 'success' | 'failure' | 'partial' | 'cancelled' | 'rejected';
  readonly result: Record<string, unknown> | undefined;
  readonly error: ErrorDetail | undefined;
  readonly duration_ms: number;
}

/** error (Bidirectional) */
export interface ErrorPayload {
  readonly code: string;
  readonly category: string;
  readonly message: string;
  readonly severity: 'info' | 'warning' | 'error' | 'fatal';
  readonly retry_after_ms?: number;
  readonly context?: Record<string, unknown>;
}

/** Error detail within function results */
export interface ErrorDetail {
  readonly code: string;
  readonly message: string;
}

/** heartbeat (Bidirectional) — empty payload */
export type HeartbeatPayload = Record<string, never>;

// ============================================================
// Typed Message Aliases
// ============================================================

export type ConnectionInitMessage = Message<'connection_init', ConnectionInitPayload>;
export type ConnectionAckMessage = Message<'connection_ack', ConnectionAckPayload>;
export type ChatMessage = Message<'chat', ChatPayload>;
export type StateUpdateMessage = Message<'state_update', StateUpdatePayload>;
export type EventMessage = Message<'event', EventPayload>;
export type FunctionCallMessage = Message<'function_call', FunctionCallPayload>;
export type FunctionResultMessage = Message<'function_result', FunctionResultPayload>;
export type ErrorMessage = Message<'error', ErrorPayload>;
export type HeartbeatMessage = Message<'heartbeat', HeartbeatPayload>;

/** Union of all possible incoming messages from the mod. */
export type IncomingMessage =
  | ConnectionInitMessage
  | ChatMessage
  | StateUpdateMessage
  | EventMessage
  | FunctionResultMessage
  | ErrorMessage
  | HeartbeatMessage;

/** Union of all possible outgoing messages to the mod. */
export type OutgoingMessage =
  | ConnectionAckMessage
  | ChatMessage
  | FunctionCallMessage
  | ErrorMessage
  | HeartbeatMessage;

// ============================================================
// Message Factory
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import { PROTOCOL_VERSION } from './version.js';

/** Creates a new message with auto-generated id and timestamp. */
export function createMessage<T extends MessageType, P>(
  type: T,
  payload: P,
): Message<T, P> {
  return {
    version: PROTOCOL_VERSION,
    type,
    id: uuidv4(),
    timestamp: Date.now(),
    payload,
  };
}
