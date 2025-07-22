import { LRUCache } from 'lru-cache';

import logger from './logger';

import { SERVICE_MESSAGES, createErrorMessage } from '../constants/messages';

class InMemoryCacheService {
  private cache: LRUCache<string, any>;
  private static instance: InMemoryCacheService;

  private constructor() {
    this.cache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 5, // 5 dakika default TTL
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  public static getInstance(): InMemoryCacheService {
    if (!InMemoryCacheService.instance) {
      InMemoryCacheService.instance = new InMemoryCacheService();
    }
    return InMemoryCacheService.instance;
  }

  async get(key: string): Promise<any> {
    try {
      return this.cache.get(key);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CACHE.GET_ERROR, error as Error)
      );
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const options = ttl ? { ttl: ttl * 1000 } : undefined;
      this.cache.set(key, value, options);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CACHE.SET_ERROR, error as Error)
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.cache.delete(key);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CACHE.DELETE_ERROR, error as Error)
      );
    }
  }

  async flush(): Promise<void> {
    try {
      this.cache.clear();
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CACHE.FLUSH_ERROR, error as Error)
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return this.cache.has(key);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CACHE.EXISTS_ERROR, error as Error)
      );
      return false;
    }
  }
}

export const cacheService = InMemoryCacheService.getInstance();
