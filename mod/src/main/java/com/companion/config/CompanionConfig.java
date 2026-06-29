package com.companion.config;

import com.companion.CompanionMod;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Mod-side configuration.
 * Loaded from .minecraft/config/companion.json.
 * Uses sensible defaults if file doesn't exist.
 */
public class CompanionConfig {

    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

    // Connection
    private String backendUrl = "ws://localhost:3000";
    private long reconnectMaxWaitMs = 30000;
    private long heartbeatIntervalMs = 15000;
    private long heartbeatTimeoutMs = 45000;

    // State Tracking
    private long positionUpdateIntervalMs = 5000;
    private int positionChangeThresholdBlocks = 10;
    private long entityUpdateIntervalMs = 3000;
    private int entityMaxCount = 10;
    private int entityMaxDistance = 30;

    // Events
    private long debouncePlayerHurtMs = 2000;
    private long debounceItemPickupMs = 3000;
    private long debounceBlockMinedMs = 5000;
    private int eventBufferMaxSize = 100;

    // UI
    private boolean showChatOverlay = true;
    private boolean showStatusIndicator = true;
    private boolean showDebugOverlay = false;
    private int chatOverlayMaxMessages = 10;
    private long chatOverlayFadeMs = 10000;

    // Gameplay
    private boolean proactiveSuggestions = true;
    private int maxActionsPer10s = 5;

    /** Load config from file, or create default if it doesn't exist. */
    public static CompanionConfig load() {
        Path configDir = FabricLoader.getInstance().getConfigDir();
        Path configFile = configDir.resolve("companion.json");

        if (Files.exists(configFile)) {
            try {
                String json = Files.readString(configFile);
                CompanionConfig config = GSON.fromJson(json, CompanionConfig.class);
                CompanionMod.LOGGER.info("Loaded config from {}", configFile);
                return config != null ? config : new CompanionConfig();
            } catch (IOException e) {
                CompanionMod.LOGGER.warn("Failed to read config, using defaults: {}", e.getMessage());
            }
        }

        // Create default config file
        CompanionConfig defaultConfig = new CompanionConfig();
        defaultConfig.save();
        return defaultConfig;
    }

    /** Save config to file. */
    public void save() {
        Path configDir = FabricLoader.getInstance().getConfigDir();
        Path configFile = configDir.resolve("companion.json");

        try {
            Files.createDirectories(configDir);
            Files.writeString(configFile, GSON.toJson(this));
            CompanionMod.LOGGER.info("Config saved to {}", configFile);
        } catch (IOException e) {
            CompanionMod.LOGGER.error("Failed to save config: {}", e.getMessage());
        }
    }

    // === Getters ===

    public String getBackendUrl() { return backendUrl; }
    public long getReconnectMaxWaitMs() { return reconnectMaxWaitMs; }
    public long getHeartbeatIntervalMs() { return heartbeatIntervalMs; }
    public long getHeartbeatTimeoutMs() { return heartbeatTimeoutMs; }
    public long getPositionUpdateIntervalMs() { return positionUpdateIntervalMs; }
    public int getPositionChangeThresholdBlocks() { return positionChangeThresholdBlocks; }
    public long getEntityUpdateIntervalMs() { return entityUpdateIntervalMs; }
    public int getEntityMaxCount() { return entityMaxCount; }
    public int getEntityMaxDistance() { return entityMaxDistance; }
    public long getDebouncePlayerHurtMs() { return debouncePlayerHurtMs; }
    public long getDebounceItemPickupMs() { return debounceItemPickupMs; }
    public long getDebounceBlockMinedMs() { return debounceBlockMinedMs; }
    public int getEventBufferMaxSize() { return eventBufferMaxSize; }
    public boolean isShowChatOverlay() { return showChatOverlay; }
    public boolean isShowStatusIndicator() { return showStatusIndicator; }
    public boolean isShowDebugOverlay() { return showDebugOverlay; }
    public int getChatOverlayMaxMessages() { return chatOverlayMaxMessages; }
    public long getChatOverlayFadeMs() { return chatOverlayFadeMs; }
    public boolean isProactiveSuggestions() { return proactiveSuggestions; }
    public int getMaxActionsPer10s() { return maxActionsPer10s; }
}
