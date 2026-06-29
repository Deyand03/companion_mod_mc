package com.companion.network;

import com.companion.CompanionMod;
import com.companion.config.CompanionConfig;
import com.companion.protocol.Message;
import com.companion.protocol.MessageSerializer;
import org.java_websocket.handshake.ServerHandshake;

import java.net.URI;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * WebSocket client for communication with the AI backend.
 * Runs on a separate thread — never blocks the game thread.
 */
public class WebSocketClient {

    private final CompanionConfig config;
    private final MessageHandler messageHandler;
    private volatile InternalClient client;
    private final AtomicBoolean connected = new AtomicBoolean(false);
    private final AtomicBoolean intentionalClose = new AtomicBoolean(false);

    public WebSocketClient(CompanionConfig config, MessageHandler messageHandler) {
        this.config = config;
        this.messageHandler = messageHandler;
    }

    /**
     * Connect to the backend asynchronously (non-blocking).
     */
    public void connectAsync() {
        intentionalClose.set(false);
        Thread connectThread = new Thread(() -> {
            try {
                URI uri = new URI(config.getBackendUrl());
                client = new InternalClient(uri);
                client.connect();
                CompanionMod.LOGGER.info("Connecting to backend at {}", uri);
            } catch (Exception e) {
                CompanionMod.LOGGER.error("Failed to initiate connection: {}", e.getMessage());
                messageHandler.onConnectionFailed(e.getMessage());
            }
        }, "Companion-WS-Connect");
        connectThread.setDaemon(true);
        connectThread.start();
    }

    /**
     * Send a raw JSON string to the backend.
     *
     * @param json the serialized message
     * @return true if sent successfully
     */
    public boolean send(String json) {
        if (client == null || !connected.get()) {
            CompanionMod.LOGGER.warn("Cannot send — not connected");
            return false;
        }
        try {
            client.send(json);
            return true;
        } catch (Exception e) {
            CompanionMod.LOGGER.error("Failed to send message: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Send a Message object to the backend.
     *
     * @param message the protocol message
     * @return true if sent successfully
     */
    public boolean send(Message message) {
        return send(MessageSerializer.serialize(message));
    }

    /** Check if connected. */
    public boolean isConnected() {
        return connected.get();
    }

    /** Close the connection intentionally. */
    public void close() {
        intentionalClose.set(true);
        if (client != null) {
            client.close();
        }
    }

    /**
     * Internal java-websocket client implementation.
     * Handles WebSocket events on a background thread.
     */
    private class InternalClient extends org.java_websocket.client.WebSocketClient {

        public InternalClient(URI serverUri) {
            super(serverUri);
            this.setConnectionLostTimeout(0); // We handle heartbeat ourselves
        }

        @Override
        public void onOpen(ServerHandshake handshake) {
            connected.set(true);
            CompanionMod.LOGGER.info("WebSocket connected (status: {})", handshake.getHttpStatus());
            messageHandler.onConnected();
        }

        @Override
        public void onMessage(String rawMessage) {
            MessageSerializer.deserialize(rawMessage).ifPresentOrElse(
                    messageHandler::onMessageReceived,
                    () -> CompanionMod.LOGGER.warn("Received unparseable message")
            );
        }

        @Override
        public void onClose(int code, String reason, boolean remote) {
            connected.set(false);
            CompanionMod.LOGGER.info("WebSocket closed (code={}, reason={}, remote={})", code, reason, remote);
            if (!intentionalClose.get()) {
                messageHandler.onDisconnected(reason);
            }
        }

        @Override
        public void onError(Exception ex) {
            CompanionMod.LOGGER.error("WebSocket error: {}", ex.getMessage());
            messageHandler.onConnectionFailed(ex.getMessage());
        }
    }
}
