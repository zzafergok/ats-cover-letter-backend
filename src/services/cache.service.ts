// src/services/cache.service.ts - Remove Redis dependency
import { cacheService } from '../config/cache';
import logger from '../config/logger';

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
      logger.error('Cache get hatası:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await cacheService.set(key, value, ttl);
    } catch (error) {
      logger.error('Cache set hatası:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await cacheService.del(key);
    } catch (error) {
      logger.error('Cache delete hatası:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      await cacheService.flush();
    } catch (error) {
      logger.error('Cache flush hatası:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await cacheService.exists(key);
    } catch (error) {
      logger.error('Cache exists hatası:', error);
      return false;
    }
  }
}
