import logger from './logger';

import {
  formatMessage,
  SERVICE_MESSAGES,
  createErrorMessage,
} from '../constants/messages';

import { envSchema } from '../schemas';

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    logger.info(formatMessage(SERVICE_MESSAGES.GENERAL.SUCCESS));
    return env;
  } catch (error) {
    logger.error(
      createErrorMessage(
        SERVICE_MESSAGES.GENERAL.VALIDATION_ERROR,
        error as Error
      )
    );
    process.exit(1);
  }
}

export const config = validateEnv();
