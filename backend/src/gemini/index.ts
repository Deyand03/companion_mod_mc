/**
 * Gemini API Client — Wrapper for all Gemini API interactions.
 *
 * All modules call Gemini through this wrapper. Never import @google/generative-ai directly.
 * Implements circuit breaker, token tracking, and structured logging.
 */

import { GoogleGenerativeAI, type GenerateContentResult } from '@google/generative-ai';
import pino from 'pino';
import { CircuitBreaker } from './circuit-breaker.js';
import { TokenTracker } from './token-tracker.js';
import { type Result, ok, err } from '../types/result.js';
import type { AppConfig } from '../config/schema.js';

const logger = pino({ name: 'gemini' });

export interface GeminiResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export type GeminiError =
  | { type: 'circuit_open'; message: string }
  | { type: 'api_error'; message: string; status?: number }
  | { type: 'rate_limited'; message: string; retryAfterMs?: number }
  | { type: 'timeout'; message: string };

/**
 * Gemini API client with circuit breaker and token tracking.
 */
export class GeminiClient {
  private readonly genAI: GoogleGenerativeAI;
  private readonly circuitBreaker: CircuitBreaker;
  readonly tokenTracker: TokenTracker;
  private readonly modelName: string;
  private readonly maxOutputTokens: number;
  private readonly temperature: number;

  constructor(apiKey: string, config: AppConfig) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = config.gemini.model;
    this.maxOutputTokens = config.gemini.max_output_tokens;
    this.temperature = config.gemini.temperature;
    this.circuitBreaker = new CircuitBreaker(
      config.gemini.circuit_breaker.failure_threshold,
      config.gemini.circuit_breaker.reset_timeout_ms,
    );
    this.tokenTracker = new TokenTracker();

    logger.info({ model: this.modelName }, 'Gemini client initialized');
  }

  /**
   * Generate content from Gemini.
   *
   * @param systemPrompt - System instruction
   * @param messages - Conversation history in Gemini format
   * @returns Result with generated text or error
   */
  async generateContent(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  ): Promise<Result<GeminiResponse, GeminiError>> {
    // Check circuit breaker
    if (!this.circuitBreaker.isAllowed()) {
      logger.warn('Gemini call blocked — circuit breaker open');
      return err({ type: 'circuit_open', message: 'Gemini API circuit breaker is open. Service degraded.' });
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: this.maxOutputTokens,
          temperature: this.temperature,
        },
      });

      logger.debug(
        { messageCount: messages.length, systemPromptLength: systemPrompt.length },
        'Sending request to Gemini',
      );

      const result: GenerateContentResult = await model.generateContent({
        contents: messages,
      });

      const response = result.response;
      const text = response.text();

      // Extract token counts
      const usage = response.usageMetadata;
      const inputTokens = usage?.promptTokenCount ?? 0;
      const outputTokens = usage?.candidatesTokenCount ?? 0;

      // Track tokens
      this.tokenTracker.record(inputTokens, outputTokens);
      this.circuitBreaker.onSuccess();

      logger.debug(
        { inputTokens, outputTokens, responseLength: text.length },
        'Gemini response received',
      );

      return ok({ text, inputTokens, outputTokens });
    } catch (error) {
      this.circuitBreaker.onFailure();

      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMessage }, 'Gemini API call failed');

      // Detect rate limiting
      if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate')) {
        return err({ type: 'rate_limited', message: errorMessage });
      }

      return err({ type: 'api_error', message: errorMessage });
    }
  }

  /** Get circuit breaker state. */
  getCircuitState() {
    return this.circuitBreaker.getState();
  }

  /** Clean up resources. */
  destroy(): void {
    this.circuitBreaker.destroy();
  }
}
