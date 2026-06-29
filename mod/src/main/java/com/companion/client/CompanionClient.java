package com.companion.client;

import com.companion.CompanionMod;
import com.companion.client.ui.ChatOverlay;
import com.companion.client.ui.StatusIndicator;
import com.companion.config.CompanionConfig;
import com.companion.network.MessageHandler;
import com.companion.network.MessageSender;
import com.companion.network.WebSocketClient;
import com.companion.network.ReconnectionManager;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandManager;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.MinecraftClient;
import com.mojang.brigadier.arguments.StringArgumentType;

/**
 * Client-side mod entry point.
 * Initializes WebSocket connection, UI overlays, and chat command.
 */
public class CompanionClient implements ClientModInitializer {

    private static CompanionClient instance;

    private CompanionConfig config;
    private WebSocketClient webSocketClient;
    private ReconnectionManager reconnectionManager;
    private MessageSender messageSender;
    private MessageHandler messageHandler;
    private ChatOverlay chatOverlay;
    private StatusIndicator statusIndicator;

    @Override
    public void onInitializeClient() {
        instance = this;
        CompanionMod.LOGGER.info("AI Companion Client initializing");

        // Load config
        config = CompanionConfig.load();

        // Initialize UI overlays
        chatOverlay = new ChatOverlay(config);
        statusIndicator = new StatusIndicator();

        // Initialize message handler (processes incoming messages)
        messageHandler = new MessageHandler(chatOverlay, statusIndicator);

        // Initialize WebSocket client
        webSocketClient = new WebSocketClient(config, messageHandler);

        // Initialize message sender
        messageSender = new MessageSender(webSocketClient);

        // Initialize reconnection manager
        reconnectionManager = new ReconnectionManager(webSocketClient, config);

        // Register HUD overlays
        HudRenderCallback.EVENT.register((drawContext, renderTickCounter) -> {
            statusIndicator.render(drawContext, renderTickCounter);
            chatOverlay.render(drawContext, renderTickCounter);
        });

        // Register /companion command
        registerCommand();

        // Connect to backend
        CompanionMod.LOGGER.info("Connecting to backend at {}", config.getBackendUrl());
        webSocketClient.connectAsync();
    }

    /**
     * Registers the /companion chat command.
     * Usage: /companion <message>
     */
    private void registerCommand() {
        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) ->
            dispatcher.register(
                ClientCommandManager.literal("companion")
                    .then(ClientCommandManager.argument("message", StringArgumentType.greedyString())
                        .executes(context -> {
                            String message = StringArgumentType.getString(context, "message");
                            handlePlayerMessage(message);
                            return 1;
                        })
                    )
            )
        );
        CompanionMod.LOGGER.info("/companion command registered");
    }

    /**
     * Handles a message sent by the player via /companion command.
     */
    private void handlePlayerMessage(String message) {
        if (!webSocketClient.isConnected()) {
            chatOverlay.addMessage("system", "⚠️ Not connected to backend. Reconnecting...");
            reconnectionManager.scheduleReconnect();
            return;
        }

        // Display player message in overlay
        chatOverlay.addMessage("player", message);

        // Send to backend
        messageSender.sendChat(message);
    }

    public static CompanionClient getInstance() {
        return instance;
    }

    public ChatOverlay getChatOverlay() {
        return chatOverlay;
    }

    public WebSocketClient getWebSocketClient() {
        return webSocketClient;
    }
}
