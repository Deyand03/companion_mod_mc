export { type Result, ok, err, unwrap } from './result.js';

/** Position in Minecraft world. */
export interface Position {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Player rotation. */
export interface Rotation {
  readonly yaw: number;
  readonly pitch: number;
}

/** Day phase derived from MC tick time. */
export type DayPhase = 'dawn' | 'noon' | 'dusk' | 'night';

/** Weather state. */
export type Weather = 'clear' | 'rain' | 'thunder';

/** Threat assessment level. */
export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

/** Player intent classification. */
export type PlayerIntent = 'chat' | 'question' | 'command' | 'goal';

/** AI companion status. */
export type AIStatus = 'idle' | 'thinking' | 'talking' | 'planning' | 'executing';

/** Scheduler priority levels. */
export enum SchedulerPriority {
  P0_CRITICAL = 0,
  P1_HIGH = 1,
  P2_NORMAL = 2,
  P3_LOW = 3,
  P4_IDLE = 4,
}

/** Inventory slot data. */
export interface InventorySlot {
  readonly item: string;
  readonly count: number;
  readonly durability: number | undefined;
  readonly enchantments: readonly string[];
  readonly custom_name: string | undefined;
}

/** Nearby entity data. */
export interface NearbyEntity {
  readonly type: string;
  readonly name: string | undefined;
  readonly distance: number;
  readonly health: number;
  readonly max_health: number;
  readonly position: Position;
  readonly is_hostile: boolean;
  readonly is_tamed: boolean;
}

/** Token usage tracking. */
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_cost_estimate: number;
}
