/**
 * Configuration Schema — Zod validation for all backend config.
 * Matches SDS Section 10.
 */

import { z } from 'zod';

export const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  WEBSOCKET_PORT: z.coerce.number().int().default(3000),
  WEBSOCKET_HOST: z.string().default('localhost'),
  DATABASE_PATH: z.string().default('./data/companion.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const configSchema = z.object({
  companion: z.object({
    name: z.string().default('Luna'),
    personality: z.string().default('friendly'),
    language: z.string().default('id'),
  }),
  gemini: z.object({
    model: z.string().default('gemini-2.0-flash'),
    max_output_tokens: z.number().int().default(2048),
    temperature: z.number().min(0).max(2).default(0.8),
    circuit_breaker: z.object({
      failure_threshold: z.number().int().default(3),
      reset_timeout_ms: z.number().int().default(60_000),
    }),
  }),
  context: z.object({
    max_tokens: z.number().int().default(30_000),
    system_prompt_budget: z.number().int().default(2_000),
    working_memory_budget: z.number().int().default(2_000),
    episodic_memory_budget: z.number().int().default(3_000),
    episodic_memory_top_k: z.number().int().default(5),
    rag_budget: z.number().int().default(3_000),
    rag_top_k: z.number().int().default(3),
    conversation_history_budget: z.number().int().default(15_000),
    response_reserve: z.number().int().default(5_000),
  }),
  memory: z.object({
    importance_threshold_keep: z.number().default(7),
    importance_threshold_discard: z.number().default(4),
    consolidation_interval_messages: z.number().int().default(50),
    max_memories_per_player: z.number().int().default(1_000),
  }),
  scheduler: z.object({
    max_queue_size: z.number().int().default(50),
    max_pause_stack: z.number().int().default(5),
  }),
  planner: z.object({
    max_replans: z.number().int().default(3),
    simple_plan_max_steps: z.number().int().default(2),
    medium_plan_max_steps: z.number().int().default(5),
  }),
  gameplay: z.object({
    max_actions_per_10s: z.number().int().default(5),
    safety_boundary_radius: z.number().int().default(10),
    confirm_destructive: z.boolean().default(true),
  }),
});

export type EnvConfig = z.infer<typeof envSchema>;
export type AppConfig = z.infer<typeof configSchema>;
