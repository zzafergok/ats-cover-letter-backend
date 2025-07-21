import { z } from 'zod';

import logger from './logger';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  RESEND_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  FRONTEND_URL: z.string().url(),
  ADMIN_EMAIL: z.string().email(),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    logger.info('Environment variables validated successfully');
    return env;
  } catch (error) {
    logger.error('Environment validation failed:', error);
    process.exit(1);
  }
}

export const config = validateEnv();
