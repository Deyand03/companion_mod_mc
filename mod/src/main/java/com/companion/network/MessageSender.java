package com.companion.network;

import com.companion.CompanionMod;
import com.companion.protocol.Message;
import com.companion.protocol.MessageSerializer;
import com.companion.protocol.MessageType;
import com.companion.protocol.ProtocolVersion;
import com.google.gson.JsonObject;
import net.minecraft.client.MinecraftClient;

/**
 * Constructs and sends protocol messages to the backend.
 */
public class MessageSender {

    private final WebSocketClient webSocketClient;

    public MessageSender(WebSocketClient webSocketClient) {
        this.webSocketClient = webSocketClient;
    }

    /**
     * Send connection_init handshake to backend.
     */
    public void sendConnectionInit() {
        MinecraftClient mc = MinecraftClient.getInstance();
        String playerName = mc.getSession().getUsername();
        String playerUuid = mc.getSession().getUuidOrNull() != null
                ? mc.getSession().getUuidOrNull().toString()
                : "unknown";

        JsonObject payload = new JsonObject();
        payload.addProperty("protocol_version", ProtocolVersion.VERSION);
        payload.addProperty("mod_version", ProtocolVersion.MOD_VERSION);
        payload.addProperty("player_name", playerName);
        payload.addProperty("player_uuid", playerUuid);
        payload.addProperty("minecraft_version", ProtocolVersion.MINECRAFT_VERSION);

        Message message = MessageSerializer.createMessage(MessageType.CONNECTION_INIT, payload);
        webSocketClient.send(message);

        CompanionMod.LOGGER.info("Sent connection_init (player: {})", playerName);
    }

    /**
     * Send a chat message from the player.
     *
     * @param content the player's message text
     */
    public void sendChat(String content) {
        JsonObject payload = new JsonObject();
        payload.addProperty("from", "player");
        payload.addProperty("format", "text");
        payload.addProperty("content", content);

        Message message = MessageSerializer.createMessage(MessageType.CHAT, payload);
        webSocketClient.send(message);

        CompanionMod.LOGGER.debug("Sent chat message: {}", content.substring(0, Math.min(content.length(), 50)));
    }

    /**
     * Send a heartbeat to the backend.
     */
    public void sendHeartbeat() {
        JsonObject payload = new JsonObject();
        Message message = MessageSerializer.createMessage(MessageType.HEARTBEAT, payload);
        webSocketClient.send(message);
    }
}
