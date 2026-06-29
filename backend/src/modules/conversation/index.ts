/**
 * Conversation Manager — Handles chat messages between player and AI.
 *
 * Subscribes to chat_received events from the EventBus, assembles prompts,
 * calls Gemini, and emits chat_response events.
 */

import pino from 'pino';
import { EventBus } from '../../bus/index.js';
import { GeminiClient } from '../../gemini/index.js';
import { ConversationHistory } from './history.js';
import { ContextBuilder } from './context-builder.js';
import type { AppConfig } from '../../config/schema.js';

const logger = pino({ name: 'conversation' });

/**
 * ConversationManager module.
 *
 * Follows the module pattern: receives EventBus via constructor,
 * subscribes to events, and communicates only through the bus.
 */
export class ConversationManager {
  private readonly history: ConversationHistory;
  private readonly contextBuilder: ContextBuilder;

  constructor(
    private readonly bus: EventBus,
    private readonly gemini: GeminiClient,
    private readonly config: AppConfig,
  ) {
    this.history = new ConversationHistory(50);
    this.contextBuilder = new ContextBuilder(config);
    this.subscribeToEvents();

    logger.info('ConversationManager initialized');
  }

  private subscribeToEvents(): void {
    this.bus.on('chat_received', this.handleChatReceived.bind(this));
    this.bus.on('connection_init', this.handleConnectionInit.bind(this));
  }

  private handleConnectionInit(data: { clientId: string; payload: { player_name: string } }): void {
    // Clear history on new connection
    this.history.clear();
    logger.info({ player: data.payload.player_name }, 'New session — history cleared');

    // Send welcome message
    const welcomeMessage = this.getWelcomeMessage(data.payload.player_name);
    this.bus.emit('chat_response', {
      clientId: data.clientId,
      content: welcomeMessage,
      replyTo: undefined,
    });
  }

  private async handleChatReceived(data: {
    clientId: string;
    payload: { from: string; content: string };
  }): Promise<void> {
    const { clientId, payload } = data;

    // Only handle player messages
    if (payload.from !== 'player') return;

    logger.info({ player: payload.content.substring(0, 100) }, 'Player message received');

    // Add to history
    this.history.add('user', payload.content);

    // Build prompt and call Gemini
    const systemPrompt = this.contextBuilder.getSystemPrompt();
    const messages = this.history.toGeminiMessages();

    const result = await this.gemini.generateContent(systemPrompt, messages);

    if (result.ok) {
      const responseText = result.value.text;

      // Add AI response to history
      this.history.add('model', responseText);

      // Emit response event
      this.bus.emit('chat_response', {
        clientId,
        content: responseText,
        replyTo: undefined,
      });

      logger.info(
        { responseLength: responseText.length, tokens: result.value.inputTokens + result.value.outputTokens },
        'AI response generated',
      );
    } else {
      // Handle error
      const errorMsg = this.getErrorMessage(result.error.type);
      this.bus.emit('chat_response', {
        clientId,
        content: errorMsg,
        replyTo: undefined,
      });

      logger.error({ error: result.error }, 'Failed to generate AI response');
    }
  }

  private getWelcomeMessage(playerName: string): string {
    const { name } = this.config.companion;
    const greetings = [
      `Hai ${playerName}! Aku ${name}, companion kamu di Minecraft. Ada apa hari ini? 😄`,
      `Hey ${playerName}! ${name} di sini. Siap petualangan hari ini? ⚔️`,
      `${playerName}! Senang ketemu lagi. Aku ${name}, mau ngapain hari ini? 🎮`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  private getErrorMessage(errorType: string): string {
    switch (errorType) {
      case 'circuit_open':
        return '⚠️ Maaf, aku lagi ada masalah koneksi ke server AI. Coba lagi nanti ya.';
      case 'rate_limited':
        return '⚠️ Terlalu banyak pesan, aku butuh istirahat sebentar. Coba lagi dalam 30 detik.';
      default:
        return '⚠️ Maaf, terjadi error. Coba kirim pesanmu lagi.';
    }
  }
}
