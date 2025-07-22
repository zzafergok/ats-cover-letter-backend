import logger from '../config/logger';
import { cacheService } from '../config/cache';
import { SERVICE_MESSAGES, createErrorMessage } from '../constants/messages';

export class CacheService {
  private static instance: CacheService;

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get(key: string): Promise<any> {
    try {
      return await cacheService.get(key);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CACHE.GET_ERROR, error as Error)
      );
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await cacheService.set(key, value, ttl);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CACHE.SET_ERROR, error as Error)
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await cacheService.del(key);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CACHE.DELETE_ERROR, error as Error)
      );
    }
  }

  async flush(): Promise<void> {
    try {
      await cacheService.flush();
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CACHE.FLUSH_ERROR, error as Error)
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await cacheService.exists(key);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CACHE.EXISTS_ERROR, error as Error)
      );
      return false;
    }
  }
}
