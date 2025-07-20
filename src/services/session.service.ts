// src/services/session.service.ts
import redisClient from '../config/redis';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';

export class SessionService {
  private static instance: SessionService;
  private sessionTTL = 86400;

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  async createSession(userId: string, data: any): Promise<string> {
    try {
      const sessionId = uuidv4();
      const sessionKey = `session:${sessionId}`;

      await redisClient.setex(
        sessionKey,
        this.sessionTTL,
        JSON.stringify({ userId, ...data })
      );

      await redisClient.sadd(`user:${userId}:sessions`, sessionId);

      return sessionId;
    } catch (error) {
      logger.error('Session oluşturma hatası:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<any> {
    try {
      const sessionKey = `session:${sessionId}`;
      const data = await redisClient.get(sessionKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Session getirme hatası:', error);
      return null;
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    try {
      const sessionKey = `session:${sessionId}`;
      const sessionData = await this.getSession(sessionId);

      if (sessionData) {
        await redisClient.srem(
          `user:${sessionData.userId}:sessions`,
          sessionId
        );
      }

      await redisClient.del(sessionKey);
    } catch (error) {
      logger.error('Session silme hatası:', error);
    }
  }

  async destroyAllUserSessions(userId: string): Promise<void> {
    try {
      const sessionsKey = `user:${userId}:sessions`;
      const sessionIds = await redisClient.smembers(sessionsKey);

      for (const sessionId of sessionIds) {
        await redisClient.del(`session:${sessionId}`);
      }

      await redisClient.del(sessionsKey);
    } catch (error) {
      logger.error('Tüm session silme hatası:', error);
    }
  }

  async extendSession(sessionId: string): Promise<void> {
    try {
      const sessionKey = `session:${sessionId}`;
      await redisClient.expire(sessionKey, this.sessionTTL);
    } catch (error) {
      logger.error('Session uzatma hatası:', error);
    }
  }
}
