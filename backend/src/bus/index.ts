/**
 * EventBus — Internal pub/sub system for inter-module communication.
 *
 * All modules subscribe to events they care about and emit events
 * for other modules to consume. Modules never import each other directly.
 */

import { EventEmitter } from 'events';
import type { BusEvents } from './events.js';
import pino from 'pino';

const logger = pino({ name: 'event-bus' });

/**
 * Typed EventBus.
 *
 * Usage:
 * ```ts
 * bus.on('chat_received', (data) => { ... });
 * bus.emit('chat_received', { from: 'player', content: 'hello' });
 * ```
 */
export class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    // Allow many listeners since multiple modules subscribe
    this.emitter.setMaxListeners(50);
  }

  /** Subscribe to an event. */
  on<K extends keyof BusEvents>(event: K, handler: (data: BusEvents[K]) => void): void {
    this.emitter.on(event, handler as (...args: unknown[]) => void);
    logger.debug({ event }, 'Subscribed to event');
  }

  /** Unsubscribe from an event. */
  off<K extends keyof BusEvents>(event: K, handler: (data: BusEvents[K]) => void): void {
    this.emitter.off(event, handler as (...args: unknown[]) => void);
  }

  /** Emit an event to all subscribers. */
  emit<K extends keyof BusEvents>(event: K, data: BusEvents[K]): void {
    logger.debug({ event }, 'Event emitted');
    this.emitter.emit(event, data);
  }

  /** Subscribe to an event, but only fire once. */
  once<K extends keyof BusEvents>(event: K, handler: (data: BusEvents[K]) => void): void {
    this.emitter.once(event, handler as (...args: unknown[]) => void);
  }

  /** Get the number of listeners for an event. */
  listenerCount<K extends keyof BusEvents>(event: K): number {
    return this.emitter.listenerCount(event);
  }
}
