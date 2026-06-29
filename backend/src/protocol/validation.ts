/**
 * Message Validation — Zod schemas for incoming WebSocket messages.
 *
 * All messages from the mod are validated before being processed.
 */

import { z } from 'zod';
import { PROTOCOL_VERSION } from './version.js';

/** Base message envelope schema. */
const baseMessage = z.object({
  version: z.literal(PROTOCOL_VERSION),
  type: z.string(),
  id: z.string().uuid(),
  timestamp: z.number().int().positive(),
  payload: z.record(z.unknown()),
});

/** connection_init payload. */
export const connectionInitPayload = z.object({
  protocol_version: z.string(),
  mod_version: z.string(),
  player_name: z.string().min(1),
  player_uuid: z.string(),
  minecraft_version: z.string(),
});

/** chat payload (from player). */
export const chatPayload = z.object({
  from: z.enum(['player', 'ai']),
  format: z.enum(['text', 'voice']),
  content: z.string().min(1),
  reply_to: z.string().uuid().optional(),
});

/** state_update payload. */
export const stateUpdatePayload = z.object({
  is_full_sync: z.boolean(),
  changes: z.record(z.unknown()),
});

/** event payload. */
export const eventPayload = z.object({
  event_type: z.string().min(1),
  buffered: z.boolean(),
  data: z.record(z.unknown()),
});

/** function_result payload. */
export const functionResultPayload = z.object({
  call_id: z.string().uuid(),
  status: z.enum(['success', 'failure', 'partial', 'cancelled', 'rejected']),
  result: z.record(z.unknown()).optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
  duration_ms: z.number().int().nonnegative(),
});

/** error payload. */
export const errorPayloadSchema = z.object({
  code: z.string(),
  category: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error', 'fatal']),
  retry_after_ms: z.number().int().optional(),
  context: z.record(z.unknown()).optional(),
});

/** heartbeat payload (empty). */
export const heartbeatPayload = z.object({});

/** Valid incoming message types from the mod. */
const INCOMING_TYPES = [
  'connection_init',
  'chat',
  'state_update',
  'event',
  'function_result',
  'error',
  'heartbeat',
] as const;

/** Payload validators keyed by message type. */
const payloadValidators: Record<string, z.ZodSchema> = {
  connection_init: connectionInitPayload,
  chat: chatPayload,
  state_update: stateUpdatePayload,
  event: eventPayload,
  function_result: functionResultPayload,
  error: errorPayloadSchema,
  heartbeat: heartbeatPayload,
};

/**
 * Validates a raw JSON message from the mod.
 * Returns the parsed message or a validation error.
 */
export function validateIncomingMessage(
  raw: unknown,
): { valid: true; message: z.infer<typeof baseMessage> } | { valid: false; error: string } {
  // Step 1: Validate base envelope
  const envelopeResult = baseMessage.safeParse(raw);
  if (!envelopeResult.success) {
    return { valid: false, error: `Invalid message envelope: ${envelopeResult.error.message}` };
  }

  const msg = envelopeResult.data;

  // Step 2: Check message type is known
  if (!INCOMING_TYPES.includes(msg.type as (typeof INCOMING_TYPES)[number])) {
    return { valid: false, error: `Unknown message type: ${msg.type}` };
  }

  // Step 3: Validate payload for this message type
  const payloadValidator = payloadValidators[msg.type];
  if (payloadValidator) {
    const payloadResult = payloadValidator.safeParse(msg.payload);
    if (!payloadResult.success) {
      return {
        valid: false,
        error: `Invalid payload for ${msg.type}: ${payloadResult.error.message}`,
      };
    }
  }

  return { valid: true, message: msg };
}
