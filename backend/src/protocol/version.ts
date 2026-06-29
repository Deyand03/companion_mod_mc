/** WebSocket protocol version. Must match mod-side ProtocolVersion. */
export const PROTOCOL_VERSION = '1.0' as const;

/** Maximum message size in bytes (1 MB). */
export const MAX_MESSAGE_SIZE = 1_048_576;

/** Heartbeat interval in milliseconds. */
export const HEARTBEAT_INTERVAL_MS = 15_000;

/** Heartbeat timeout — connection dead if no heartbeat within this window. */
export const HEARTBEAT_TIMEOUT_MS = 45_000;
