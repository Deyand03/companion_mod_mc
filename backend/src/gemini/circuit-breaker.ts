/**
 * Circuit Breaker — Protects against cascading Gemini API failures.
 *
 * States: CLOSED (normal) → OPEN (blocking) → HALF_OPEN (testing)
 */

import pino from 'pino';

const logger = pino({ name: 'circuit-breaker' });

export type CircuitState = 'closed' | 'open' | 'half_open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly failureThreshold: number,
    private readonly resetTimeoutMs: number,
  ) {}

  /** Check if requests are allowed. */
  isAllowed(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'half_open') return true; // Allow one test request
    return false; // open — blocked
  }

  /** Report a successful call. */
  onSuccess(): void {
    if (this.state === 'half_open') {
      logger.info('Circuit breaker: half_open → closed (success)');
      this.state = 'closed';
      this.failureCount = 0;
    }
  }

  /** Report a failed call. */
  onFailure(): void {
    this.failureCount++;

    if (this.state === 'half_open') {
      logger.warn('Circuit breaker: half_open → open (test failed)');
      this.state = 'open';
      this.scheduleReset();
      return;
    }

    if (this.failureCount >= this.failureThreshold) {
      logger.warn(
        { failures: this.failureCount, threshold: this.failureThreshold },
        'Circuit breaker: closed → open',
      );
      this.state = 'open';
      this.scheduleReset();
    }
  }

  /** Get current state. */
  getState(): CircuitState {
    return this.state;
  }

  /** Clean up timers. */
  destroy(): void {
    if (this.resetTimer) clearTimeout(this.resetTimer);
  }

  private scheduleReset(): void {
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      logger.info('Circuit breaker: open → half_open (testing)');
      this.state = 'half_open';
    }, this.resetTimeoutMs);
  }
}
