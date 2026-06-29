package com.companion.protocol;

import com.google.gson.JsonObject;

/**
 * Base message record — represents a single WebSocket protocol message.
 *
 * @param version   Protocol version (always "1.0")
 * @param type      Message type string
 * @param id        UUID v4 message identifier
 * @param timestamp Unix millisecond timestamp
 * @param payload   Type-specific payload data
 */
public record Message(
        String version,
        String type,
        String id,
        long timestamp,
        JsonObject payload
) {
    /**
     * Get the parsed MessageType enum.
     *
     * @return MessageType enum value
     * @throws IllegalArgumentException if type is unknown
     */
    public MessageType messageType() {
        return MessageType.fromValue(type);
    }
}
