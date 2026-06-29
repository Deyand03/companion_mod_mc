/**
 * Error Codes — SDS Section 12
 *
 * Pattern: CATEGORY_SPECIFIC_ERROR
 */

// === Network Errors ===
export const NETWORK_WEBSOCKET_TIMEOUT = 'NETWORK_WEBSOCKET_TIMEOUT' as const;
export const NETWORK_WEBSOCKET_CLOSED = 'NETWORK_WEBSOCKET_CLOSED' as const;
export const NETWORK_MESSAGE_TOO_LARGE = 'NETWORK_MESSAGE_TOO_LARGE' as const;
export const NETWORK_SEND_FAILED = 'NETWORK_SEND_FAILED' as const;

// === API Errors ===
export const API_RATE_LIMITED = 'API_RATE_LIMITED' as const;
export const API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED' as const;
export const API_UNAVAILABLE = 'API_UNAVAILABLE' as const;
export const API_INVALID_RESPONSE = 'API_INVALID_RESPONSE' as const;
export const API_CONTEXT_OVERFLOW = 'API_CONTEXT_OVERFLOW' as const;
export const API_TIMEOUT = 'API_TIMEOUT' as const;

// === Game State Errors ===
export const GAME_BLOCK_UNBREAKABLE = 'GAME_BLOCK_UNBREAKABLE' as const;
export const GAME_NO_PATH = 'GAME_NO_PATH' as const;
export const GAME_TOO_FAR = 'GAME_TOO_FAR' as const;
export const GAME_NO_TOOL = 'GAME_NO_TOOL' as const;
export const GAME_INVENTORY_FULL = 'GAME_INVENTORY_FULL' as const;
export const GAME_MISSING_INGREDIENTS = 'GAME_MISSING_INGREDIENTS' as const;
export const GAME_ENTITY_NOT_FOUND = 'GAME_ENTITY_NOT_FOUND' as const;
export const GAME_PROTECTED_ENTITY = 'GAME_PROTECTED_ENTITY' as const;
export const GAME_SAFETY_BOUNDARY = 'GAME_SAFETY_BOUNDARY' as const;

// === Validation Errors ===
export const VALIDATION_UNKNOWN_TYPE = 'VALIDATION_UNKNOWN_TYPE' as const;
export const VALIDATION_INVALID_PAYLOAD = 'VALIDATION_INVALID_PAYLOAD' as const;
export const VALIDATION_VERSION_MISMATCH = 'VALIDATION_VERSION_MISMATCH' as const;
export const VALIDATION_UNKNOWN_FUNCTION = 'VALIDATION_UNKNOWN_FUNCTION' as const;
export const VALIDATION_INVALID_PARAMS = 'VALIDATION_INVALID_PARAMS' as const;
export const VALIDATION_MESSAGE_TOO_LARGE = 'VALIDATION_MESSAGE_TOO_LARGE' as const;

// === Rate Limit Errors ===
export const RATE_FUNCTION_LIMIT = 'RATE_FUNCTION_LIMIT' as const;
export const RATE_MESSAGE_LIMIT = 'RATE_MESSAGE_LIMIT' as const;

// === Internal Errors ===
export const INTERNAL_MODULE_ERROR = 'INTERNAL_MODULE_ERROR' as const;
export const INTERNAL_DB_ERROR = 'INTERNAL_DB_ERROR' as const;
export const INTERNAL_MEMORY_OVERFLOW = 'INTERNAL_MEMORY_OVERFLOW' as const;

/** Error category type. */
export type ErrorCategory =
  | 'NetworkError'
  | 'APIError'
  | 'GameStateError'
  | 'ValidationError'
  | 'RateError'
  | 'InternalError';

/** Severity level. */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';
