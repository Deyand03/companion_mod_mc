package com.companion.client.ui;

import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.render.RenderTickCounter;
import net.minecraft.client.MinecraftClient;
import net.minecraft.text.Text;

/**
 * HUD overlay showing backend connection status.
 * Displays a small indicator in the top-right corner.
 */
public class StatusIndicator {

    public enum Status {
        CONNECTED("● Connected", 0xFF55FF55),       // Green
        DISCONNECTED("● Disconnected", 0xFFFF5555),  // Red
        RECONNECTING("● Reconnecting...", 0xFFFFFF55); // Yellow

        private final String label;
        private final int color;

        Status(String label, int color) {
            this.label = label;
            this.color = color;
        }
    }

    private volatile Status status = Status.DISCONNECTED;

    /** Set the current connection status. Must be called from render thread. */
    public void setStatus(Status status) {
        this.status = status;
    }

    /** Get current status. */
    public Status getStatus() {
        return status;
    }

    /**
     * Render the status indicator on the HUD.
     * Called every frame via HudRenderCallback.
     */
    public void render(DrawContext drawContext, RenderTickCounter renderTickCounter) {
        MinecraftClient mc = MinecraftClient.getInstance();
        if (mc.options.debugEnabled) return; // Don't draw over F3

        int screenWidth = drawContext.getScaledWindowWidth();
        String text = status.label;
        int textWidth = mc.textRenderer.getWidth(text);
        int x = screenWidth - textWidth - 5;
        int y = 5;

        // Draw background
        drawContext.fill(x - 3, y - 2, screenWidth - 2, y + 11, 0x80000000);

        // Draw text
        drawContext.drawText(mc.textRenderer, Text.literal(text), x, y, status.color, true);
    }
}
