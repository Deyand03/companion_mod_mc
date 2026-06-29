/**
 * Token Tracker — Tracks Gemini API token usage per session.
 */

import pino from 'pino';

const logger = pino({ name: 'token-tracker' });

export class TokenTracker {
  private inputTokens = 0;
  private outputTokens = 0;
  private callCount = 0;

  /** Record token usage from a Gemini API call. */
  record(input: number, output: number): void {
    this.inputTokens += input;
    this.outputTokens += output;
    this.callCount++;
    logger.debug(
      { input, output, totalInput: this.inputTokens, totalOutput: this.outputTokens, calls: this.callCount },
      'Tokens recorded',
    );
  }

  /** Get current session usage. */
  getUsage(): { input_tokens: number; output_tokens: number; total_cost_estimate: number; call_count: number } {
    return {
      input_tokens: this.inputTokens,
      output_tokens: this.outputTokens,
      // Rough estimate: Gemini Flash pricing (~$0.075/M input, ~$0.30/M output)
      total_cost_estimate:
        (this.inputTokens / 1_000_000) * 0.075 + (this.outputTokens / 1_000_000) * 0.3,
      call_count: this.callCount,
    };
  }

  /** Reset counters (e.g., on new session). */
  reset(): void {
    this.inputTokens = 0;
    this.outputTokens = 0;
    this.callCount = 0;
  }
}
