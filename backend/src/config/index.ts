/**
 * Configuration Loader — Reads .env and config.json, validates, exports.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';
import pino from 'pino';
import { envSchema, configSchema, type EnvConfig, type AppConfig } from './schema.js';

const logger = pino({ name: 'config' });

/** Loaded and validated environment variables. */
let envConfig: EnvConfig;

/** Loaded and validated application config. */
let appConfig: AppConfig;

/**
 * Load and validate all configuration.
 * Call once at startup before initializing any modules.
 */
export function loadConfig(): { env: EnvConfig; app: AppConfig } {
  // Load .env file
  dotenvConfig();

  // Validate environment variables
  const envResult = envSchema.safeParse(process.env);
  if (!envResult.success) {
    logger.fatal({ errors: envResult.error.flatten() }, 'Invalid environment variables');
    process.exit(1);
  }
  envConfig = envResult.data;

  // Load config.json (optional — use defaults if not found)
  const configPath = resolve(process.cwd(), 'config.json');
  let rawConfig = {};

  if (existsSync(configPath)) {
    try {
      const fileContent = readFileSync(configPath, 'utf-8');
      rawConfig = JSON.parse(fileContent);
      logger.info({ path: configPath }, 'Loaded config.json');
    } catch (e) {
      logger.warn({ path: configPath, error: e }, 'Failed to parse config.json, using defaults');
    }
  } else {
    logger.info('No config.json found, using defaults');
  }

  // Validate app config (with defaults)
  const configResult = configSchema.safeParse(rawConfig);
  if (!configResult.success) {
    logger.fatal({ errors: configResult.error.flatten() }, 'Invalid config.json');
    process.exit(1);
  }
  appConfig = configResult.data;

  logger.info(
    {
      companion: appConfig.companion.name,
      personality: appConfig.companion.personality,
      model: appConfig.gemini.model,
      wsPort: envConfig.WEBSOCKET_PORT,
    },
    'Configuration loaded',
  );

  return { env: envConfig, app: appConfig };
}

/** Get environment config (must call loadConfig first). */
export function getEnv(): EnvConfig {
  if (!envConfig) throw new Error('Config not loaded. Call loadConfig() first.');
  return envConfig;
}

/** Get application config (must call loadConfig first). */
export function getAppConfig(): AppConfig {
  if (!appConfig) throw new Error('Config not loaded. Call loadConfig() first.');
  return appConfig;
}
