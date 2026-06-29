package com.companion.protocol;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import com.companion.CompanionMod;

import java.util.Optional;
import java.util.UUID;

/**
 * JSON serialization and deserialization for WebSocket protocol messages.
 * Uses Gson (bundled with Minecraft).
 */
public final class MessageSerializer {

    private static final Gson GSON = new GsonBuilder().create();

    private MessageSerializer() {} // Prevent instantiation

    /**
     * Serialize a Message to JSON string.
     *
     * @param message the message to serialize
     * @return JSON string
     */
    public static String serialize(Message message) {
        return GSON.toJson(message);
    }

    /**
     * Deserialize a JSON string to a Message.
     *
     * @param json the raw JSON string
     * @return Optional containing the parsed Message, or empty on failure
     */
    public static Optional<Message> deserialize(String json) {
        try {
            Message message = GSON.fromJson(json, Message.class);
            if (message == null || message.version() == null || message.type() == null) {
                CompanionMod.LOGGER.warn("Invalid message structure: missing required fields");
                return Optional.empty();
            }
            return Optional.of(message);
        } catch (JsonSyntaxException e) {
            CompanionMod.LOGGER.warn("Failed to parse message JSON: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Create a new outgoing message with auto-generated id and timestamp.
     *
     * @param type    message type
     * @param payload message payload
     * @return the constructed Message
     */
    public static Message createMessage(MessageType type, JsonObject payload) {
        return new Message(
                ProtocolVersion.VERSION,
                type.getValue(),
                UUID.randomUUID().toString(),
                System.currentTimeMillis(),
                payload
        );
    }

    /**
     * Build a simple key-value payload as a JsonObject.
     */
    public static JsonObject buildPayload() {
        return new JsonObject();
    }
}
