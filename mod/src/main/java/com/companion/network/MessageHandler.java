package com.companion.network;

import com.companion.CompanionMod;
import com.companion.client.CompanionClient;
import com.companion.client.ui.ChatOverlay;
import com.companion.client.ui.StatusIndicator;
import com.companion.protocol.Message;
import com.companion.protocol.MessageType;
import net.minecraft.client.MinecraftClient;

/**
 * Routes incoming WebSocket messages to appropriate handlers.
 * All UI updates are scheduled to the render thread.
 */
public class MessageHandler {

    private final ChatOverlay chatOverlay;
    private final StatusIndicator statusIndicator;

    public MessageHandler(ChatOverlay chatOverlay, StatusIndicator statusIndicator) {
        this.chatOverlay = chatOverlay;
        this.statusIndicator = statusIndicator;
    }

    /**
     * Called when WebSocket connection is established.
     */
    public void onConnected() {
        MinecraftClient.getInstance().execute(() -> {
            statusIndicator.setStatus(StatusIndicator.Status.CONNECTED);
        });

        // Send connection_init handshake
        CompanionClient client = CompanionClient.getInstance();
        if (client != null) {
            new MessageSender(client.getWebSocketClient()).sendConnectionInit();
        }
    }

    /**
     * Called when WebSocket connection is lost.
     *
     * @param reason disconnect reason
     */
    public void onDisconnected(String reason) {
        MinecraftClient.getInstance().execute(() -> {
            statusIndicator.setStatus(StatusIndicator.Status.RECONNECTING);
            chatOverlay.addMessage("system", "⚠️ Disconnected from companion. Reconnecting...");
        });
    }

    /**
     * Called when a connection attempt fails.
     *
     * @param error error message
     */
    public void onConnectionFailed(String error) {
        MinecraftClient.getInstance().execute(() -> {
            statusIndicator.setStatus(StatusIndicator.Status.DISCONNECTED);
        });
    }

    /**
     * Called when a protocol message is received from the backend.
     *
     * @param message the parsed Message
     */
    public void onMessageReceived(Message message) {
        try {
            MessageType type = message.messageType();

            switch (type) {
                case CONNECTION_ACK -> handleConnectionAck(message);
                case CHAT -> handleChat(message);
                case ERROR -> handleError(message);
                case HEARTBEAT -> handleHeartbeat(message);
                case FUNCTION_CALL -> handleFunctionCall(message);
                default -> CompanionMod.LOGGER.debug("Unhandled message type: {}", type);
            }
        } catch (IllegalArgumentException e) {
            CompanionMod.LOGGER.warn("Unknown message type: {}", message.type());
        }
    }

    private void handleConnectionAck(Message message) {
        String status = message.payload().has("status")
                ? message.payload().get("status").getAsString()
                : "unknown";
        String companionName = message.payload().has("companion_name")
                ? message.payload().get("companion_name").getAsString()
                : "Companion";

        if ("ok".equals(status)) {
            CompanionMod.LOGGER.info("Connection acknowledged — companion: {}", companionName);
            MinecraftClient.getInstance().execute(() -> {
                statusIndicator.setStatus(StatusIndicator.Status.CONNECTED);
            });
        } else {
            CompanionMod.LOGGER.warn("Connection rejected: {}", status);
            MinecraftClient.getInstance().execute(() -> {
                statusIndicator.setStatus(StatusIndicator.Status.DISCONNECTED);
                chatOverlay.addMessage("system", "❌ Connection rejected: " + status);
            });
        }
    }

    private void handleChat(Message message) {
        String content = message.payload().has("content")
                ? message.payload().get("content").getAsString()
                : "";
        String from = message.payload().has("from")
                ? message.payload().get("from").getAsString()
                : "ai";

        if ("ai".equals(from) && !content.isEmpty()) {
            MinecraftClient.getInstance().execute(() -> {
                chatOverlay.addMessage("ai", content);
            });
        }
    }

    private void handleError(Message message) {
        String code = message.payload().has("code")
                ? message.payload().get("code").getAsString()
                : "UNKNOWN";
        String errorMessage = message.payload().has("message")
                ? message.payload().get("message").getAsString()
                : "Unknown error";

        CompanionMod.LOGGER.warn("Error from backend: {} — {}", code, errorMessage);
        MinecraftClient.getInstance().execute(() -> {
            chatOverlay.addMessage("system", "⚠️ " + errorMessage);
        });
    }

    private void handleHeartbeat(Message message) {
        // Heartbeat received — connection is alive
        // Nothing to do; the WebSocket client tracks liveness
    }

    private void handleFunctionCall(Message message) {
        // Phase 5 — stub for now
        CompanionMod.LOGGER.debug("Function call received (not yet implemented)");
    }
}
