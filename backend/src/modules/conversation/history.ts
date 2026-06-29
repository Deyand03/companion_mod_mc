/**
 * Conversation History — In-memory sliding window of chat messages.
 *
 * Phase 1: Simple in-memory list. Phase 2 will add DB persistence and summarization.
 */

export interface HistoryEntry {
  readonly role: 'user' | 'model';
  readonly content: string;
  readonly timestamp: number;
}

/**
 * Manages conversation history with a sliding window.
 */
export class ConversationHistory {
  private readonly entries: HistoryEntry[] = [];

  constructor(private readonly maxEntries: number = 50) {}

  /** Add a message to history. */
  add(role: 'user' | 'model', content: string): void {
    this.entries.push({ role, content, timestamp: Date.now() });

    // Trim if over max
    while (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  /** Get all entries for prompt construction. */
  getEntries(): readonly HistoryEntry[] {
    return this.entries;
  }

  /** Convert to Gemini API message format. */
  toGeminiMessages(): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
    return this.entries.map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.content }],
    }));
  }

  /** Get approximate token count (rough estimate: 1 token ≈ 4 chars). */
  estimateTokens(): number {
    return this.entries.reduce((sum, e) => sum + Math.ceil(e.content.length / 4), 0);
  }

  /** Clear all history. */
  clear(): void {
    this.entries.length = 0;
  }

  /** Get entry count. */
  get length(): number {
    return this.entries.length;
  }
}
