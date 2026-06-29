package com.companion.network;

import com.companion.CompanionMod;
import com.companion.config.CompanionConfig;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Manages exponential backoff reconnection to the backend.
 * Intervals: 1s, 2s, 4s, 8s, 16s, max 30s.
 */
public class ReconnectionManager {

    private static final long[] BACKOFF_MS = {1000, 2000, 4000, 8000, 16000, 30000};

    private final WebSocketClient webSocketClient;
    private final CompanionConfig config;
    private final ScheduledExecutorService scheduler;
    private final AtomicInteger attemptCount = new AtomicInteger(0);
    private volatile ScheduledFuture<?> pendingReconnect;

    public ReconnectionManager(WebSocketClient webSocketClient, CompanionConfig config) {
        this.webSocketClient = webSocketClient;
        this.config = config;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "Companion-Reconnect");
            t.setDaemon(true);
            return t;
        });
    }

    /**
     * Schedule a reconnection attempt with exponential backoff.
     */
    public void scheduleReconnect() {
        if (webSocketClient.isConnected()) {
            return;
        }

        int attempt = attemptCount.getAndIncrement();
        long delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];

        CompanionMod.LOGGER.info("Scheduling reconnect attempt {} in {}ms", attempt + 1, delay);

        pendingReconnect = scheduler.schedule(() -> {
            if (!webSocketClient.isConnected()) {
                CompanionMod.LOGGER.info("Reconnecting... (attempt {})", attempt + 1);
                webSocketClient.connectAsync();
            }
        }, delay, TimeUnit.MILLISECONDS);
    }

    /**
     * Reset the backoff counter (call on successful connection).
     */
    public void reset() {
        attemptCount.set(0);
        if (pendingReconnect != null) {
            pendingReconnect.cancel(false);
        }
        CompanionMod.LOGGER.info("Reconnection manager reset");
    }

    /**
     * Cancel any pending reconnection.
     */
    public void cancel() {
        if (pendingReconnect != null) {
            pendingReconnect.cancel(false);
        }
    }

    /** Get current attempt count. */
    public int getAttemptCount() {
        return attemptCount.get();
    }
}
