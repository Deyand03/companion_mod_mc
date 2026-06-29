package com.companion.protocol;

/**
 * All WebSocket message types as defined in SDS Section 2.
 */
public enum MessageType {
    CHAT("chat"),
    STATE_UPDATE("state_update"),
    EVENT("event"),
    FUNCTION_CALL("function_call"),
    FUNCTION_RESULT("function_result"),
    ERROR("error"),
    HEARTBEAT("heartbeat"),
    CONNECTION_INIT("connection_init"),
    CONNECTION_ACK("connection_ack");

    private final String value;

    MessageType(String value) {
        this.value = value;
    }

    /** Get the wire format string value. */
    public String getValue() {
        return value;
    }

    /**
     * Parse a string into a MessageType.
     *
     * @param value the wire format string
     * @return the matching MessageType
     * @throws IllegalArgumentException if the value is unknown
     */
    public static MessageType fromValue(String value) {
        for (MessageType type : values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown message type: " + value);
    }
}
