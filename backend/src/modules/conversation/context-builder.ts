/**
 * Context Builder — Assembles the Gemini prompt from system prompt + history.
 *
 * Phase 1: System prompt + personality + conversation history.
 * Phase 2+ will add: working memory, episodic memory, RAG results.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import pino from 'pino';
import type { AppConfig } from '../../config/schema.js';

const logger = pino({ name: 'context-builder' });

/** Personality presets matching SDS Appendix A. */
const PERSONALITY_PRESETS: Record<string, string> = {
  friendly:
    'You are warm, supportive, and enthusiastic. You celebrate the player\'s achievements, encourage them when things go wrong, and show genuine curiosity about what they\'re building or exploring. Your tone is like a close friend who loves Minecraft.',
  mentor:
    'You are a calm and knowledgeable guide. You patiently explain game mechanics, suggest optimal strategies, and share interesting Minecraft facts. You teach without being condescending and adapt your advice to the player\'s skill level.',
  adventurer:
    'You are a bold adventurer who treats every Minecraft session as an epic quest. You dramatize encounters, suggest daring strategies, and push the player to explore. You celebrate combat victories and narrate dramatic moments.',
};

/**
 * Builds the complete prompt context for Gemini.
 */
export class ContextBuilder {
  private systemPrompt: string;

  constructor(private readonly config: AppConfig) {
    this.systemPrompt = this.buildSystemPrompt();
  }

  /** Get the fully assembled system prompt. */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /** Rebuild system prompt (e.g., if config changed). */
  rebuild(): void {
    this.systemPrompt = this.buildSystemPrompt();
  }

  private buildSystemPrompt(): string {
    const { name, personality, language } = this.config.companion;
    const personalityBlock = PERSONALITY_PRESETS[personality] ?? PERSONALITY_PRESETS['friendly'];

    // Try to load system prompt template
    const templatePath = resolve(process.cwd(), '..', 'docs', 'prompts', 'system.md');
    let template: string;

    if (existsSync(templatePath)) {
      template = readFileSync(templatePath, 'utf-8');
      logger.info({ path: templatePath }, 'Loaded system prompt template');
    } else {
      // Fallback inline template
      template = this.getDefaultTemplate();
      logger.info('Using default system prompt template');
    }

    // Replace template variables
    const prompt = template
      .replace(/\{companion_name\}/g, name)
      .replace(/\{personality_block\}/g, personalityBlock)
      .replace(/\{language\}/g, language === 'id' ? 'Bahasa Indonesia' : 'English')
      .replace(/\{player_name\}/g, 'Player'); // Will be dynamic when Blackboard exists

    return prompt;
  }

  private getDefaultTemplate(): string {
    return `You are {companion_name}, an AI companion in Minecraft.

## Your Personality
{personality_block}

## Communication Rules
- Respond in {language}.
- Keep responses concise (1-3 sentences for quick replies, more for explanations).
- Be proactive: comment on interesting things, warn about danger.
- Speak like a friend, not an assistant.
- Use the player's name when appropriate.

## Important
- You are a companion, not a servant. You have your own personality and opinions.
- Be helpful but also fun and engaging.
- If you don't know something, say so honestly.
- Keep the conversation natural and flowing.`;
  }
}
