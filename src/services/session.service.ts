import { v4 as uuidv4 } from 'uuid';

import logger from '../config/logger';
import { cacheService } from '../config/cache';
import { SERVICE_MESSAGES, createErrorMessage } from '../constants/messages';

export class SessionService {
  private static instance: SessionService;
  private sessionTTL = 86400; // 24 hours in seconds

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
      const sessionData = { userId, ...data };

      await cacheService.set(sessionKey, sessionData, this.sessionTTL);

      // Store user sessions list
      const userSessionsKey = `user:${userId}:sessions`;
      const existingSessions = (await cacheService.get(userSessionsKey)) || [];
      existingSessions.push(sessionId);
      await cacheService.set(
        userSessionsKey,
        existingSessions,
        this.sessionTTL
      );

      return sessionId;
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.SESSION.CREATION_ERROR,
          error as Error
        )
      );
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<any> {
    try {
      const sessionKey = `session:${sessionId}`;
      return await cacheService.get(sessionKey);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.SESSION.GET_ERROR, error as Error)
      );
      return null;
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    try {
      const sessionKey = `session:${sessionId}`;
      const sessionData = await this.getSession(sessionId);

      if (sessionData) {
        const userSessionsKey = `user:${sessionData.userId}:sessions`;
        const sessions = (await cacheService.get(userSessionsKey)) || [];
        const updatedSessions = sessions.filter(
          (id: string) => id !== sessionId
        );
        await cacheService.set(
          userSessionsKey,
          updatedSessions,
          this.sessionTTL
        );
      }

      await cacheService.del(sessionKey);
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.SESSION.DELETE_ERROR,
          error as Error
        )
      );
    }
  }

  async destroyAllUserSessions(userId: string): Promise<void> {
    try {
      const sessionsKey = `user:${userId}:sessions`;
      const sessionIds = (await cacheService.get(sessionsKey)) || [];

      for (const sessionId of sessionIds) {
        await cacheService.del(`session:${sessionId}`);
      }

      await cacheService.del(sessionsKey);
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.SESSION.DELETE_ALL_ERROR,
          error as Error
        )
      );
    }
  }

  async extendSession(sessionId: string): Promise<void> {
    try {
      const sessionKey = `session:${sessionId}`;
      const sessionData = await cacheService.get(sessionKey);
      if (sessionData) {
        await cacheService.set(sessionKey, sessionData, this.sessionTTL);
      }
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.SESSION.EXTEND_ERROR,
          error as Error
        )
      );
    }
  }
}
