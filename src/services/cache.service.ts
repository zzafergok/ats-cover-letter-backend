// src/services/cache.service.ts
import redisClient from '../config/redis';
import logger from '../config/logger';

export class CacheService {
  private static instance: CacheService;
  private defaultTTL = 3600;

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get(key: string): Promise<any> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get hatası:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redisClient.setex(key, ttl, serialized);
      } else {
        await redisClient.setex(key, this.defaultTTL, serialized);
      }
    } catch (error) {
      logger.error('Cache set hatası:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Cache delete hatası:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      await redisClient.flushdb();
    } catch (error) {
      logger.error('Cache flush hatası:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists hatası:', error);
      return false;
    }
  }
}
