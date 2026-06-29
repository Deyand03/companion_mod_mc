package com.companion.client.ui;

import com.companion.config.CompanionConfig;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.render.RenderTickCounter;
import net.minecraft.text.Text;

import java.util.ArrayList;
import java.util.List;

/**
 * Chat overlay that displays AI companion messages on the HUD.
 * Shows messages in the bottom-left area with auto-fade.
 */
public class ChatOverlay {

    private static final int MAX_MESSAGES = 10;
    private static final int LINE_HEIGHT = 12;
    private static final int PADDING = 4;
    private static final int MAX_WIDTH = 300;

    private final List<ChatEntry> messages = new ArrayList<>();
    private final long fadeTimeMs;

    public ChatOverlay(CompanionConfig config) {
        this.fadeTimeMs = config.getChatOverlayFadeMs();
    }

    /**
     * Add a message to the overlay.
     * Must be called from the render thread.
     *
     * @param from   message source: "player", "ai", or "system"
     * @param content message text
     */
    public void addMessage(String from, String content) {
        String prefix = switch (from) {
            case "player" -> "§bYou§r: ";
            case "ai" -> "§d" + "Luna" + "§r: ";
            case "system" -> "§7";
            default -> "";
        };

        messages.add(new ChatEntry(prefix + content, System.currentTimeMillis()));

        // Trim old messages
        while (messages.size() > MAX_MESSAGES) {
            messages.removeFirst();
        }
    }

    /**
     * Render the chat overlay on the HUD.
     * Called every frame via HudRenderCallback.
     */
    public void render(DrawContext drawContext, RenderTickCounter renderTickCounter) {
        if (messages.isEmpty()) return;

        MinecraftClient mc = MinecraftClient.getInstance();
        if (mc.options.debugEnabled) return;

        int screenHeight = drawContext.getScaledWindowHeight();
        long now = System.currentTimeMillis();

        // Remove expired messages
        messages.removeIf(entry -> (now - entry.timestamp) > fadeTimeMs);

        if (messages.isEmpty()) return;

        // Calculate rendering position (bottom-left)
        int baseY = screenHeight - 50 - (messages.size() * LINE_HEIGHT);
        int x = 5;

        for (int i = 0; i < messages.size(); i++) {
            ChatEntry entry = messages.get(i);
            long age = now - entry.timestamp;

            // Calculate fade alpha
            float fadeStart = fadeTimeMs * 0.7f;
            float alpha = 1.0f;
            if (age > fadeStart) {
                alpha = 1.0f - ((age - fadeStart) / (fadeTimeMs - fadeStart));
            }
            alpha = Math.max(0, Math.min(1, alpha));

            if (alpha <= 0) continue;

            int y = baseY + (i * LINE_HEIGHT);
            int bgAlpha = (int) (alpha * 128);
            int textAlpha = (int) (alpha * 255);

            // Wrap long messages
            List<String> lines = wrapText(mc, entry.text, MAX_WIDTH);
            for (String line : lines) {
                int lineWidth = mc.textRenderer.getWidth(line);

                // Draw background
                drawContext.fill(x - 2, y - 1, x + lineWidth + 2, y + LINE_HEIGHT - 2,
                        (bgAlpha << 24));

                // Draw text with alpha
                int color = 0xFFFFFF | (textAlpha << 24);
                drawContext.drawText(mc.textRenderer, Text.literal(line), x, y, color, true);
                y += LINE_HEIGHT;
            }
        }
    }

    private List<String> wrapText(MinecraftClient mc, String text, int maxWidth) {
        List<String> lines = new ArrayList<>();
        // Simple word wrap
        StringBuilder currentLine = new StringBuilder();
        for (String word : text.split(" ")) {
            String test = currentLine.isEmpty() ? word : currentLine + " " + word;
            if (mc.textRenderer.getWidth(test) > maxWidth && !currentLine.isEmpty()) {
                lines.add(currentLine.toString());
                currentLine = new StringBuilder(word);
            } else {
                if (!currentLine.isEmpty()) currentLine.append(" ");
                currentLine.append(word);
            }
        }
        if (!currentLine.isEmpty()) {
            lines.add(currentLine.toString());
        }
        return lines;
    }

    /**
     * A single chat message entry with timestamp for fading.
     */
    private record ChatEntry(String text, long timestamp) {}
}
