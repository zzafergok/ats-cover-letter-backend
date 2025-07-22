import { PrismaClient } from '@prisma/client';

import logger from '../config/logger';
import { SERVICE_MESSAGES } from '../constants/messages';

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;

  private constructor() {
    try {
      this.prisma = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['query', 'error']
            : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      this.setupEventListeners();
    } catch (error) {
      logger.error('DB_001: Prisma client creation error:', error);
      throw new Error(SERVICE_MESSAGES.DATABASE.CLIENT_CREATION_FAILED.message);
    }
  }

  private setupEventListeners(): void {
    process.on('beforeExit', async () => {
      await this.disconnect();
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient(): PrismaClient {
    if (!this.prisma) {
      throw new Error(SERVICE_MESSAGES.DATABASE.CLIENT_CREATION_FAILED.message);
    }
    return this.prisma;
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database connection closed successfully');
    } catch (error) {
      logger.error('DB_002: Database connection close error:', error);
      throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_CLOSED.message);
    }
  }

  public async connect(): Promise<void> {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_FAILED.message);
      }

      await this.prisma.$connect();
      logger.info('Database connection established successfully');
    } catch (error) {
      logger.error('DB_004: Database connection error:', error);

      if (error instanceof Error) {
        if (error.message.startsWith('DB_')) {
          throw error;
        }
      }

      if (typeof error === 'object' && error !== null && 'code' in error) {
        const errorCode = (error as { code: string }).code;
        if (errorCode === 'P1001') {
          throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_FAILED.message);
        }

        if (errorCode === 'P1002') {
          throw new Error(SERVICE_MESSAGES.ERROR.TIMEOUT_ERROR.message);
        }

        if (errorCode === 'P1003') {
          throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_FAILED.message);
        }

        if (errorCode === 'P1008') {
          throw new Error(SERVICE_MESSAGES.ERROR.TIMEOUT_ERROR.message);
        }

        if (errorCode === 'P1009') {
          throw new Error(SERVICE_MESSAGES.ERROR.DATA_CONFLICT.message);
        }

        if (errorCode === 'P1010') {
          throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_FAILED.message);
        }

        if (errorCode === 'P1011') {
          throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_FAILED.message);
        }

        if (errorCode === 'P1012') {
          throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_FAILED.message);
        }

        if (errorCode === 'P1013') {
          throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_FAILED.message);
        }

        if (errorCode === 'P1014') {
          throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_FAILED.message);
        }

        if (errorCode === 'P1015') {
          throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_FAILED.message);
        }
      }

      throw new Error(SERVICE_MESSAGES.DATABASE.CONNECTION_FAILED.message);
    }
  }

  public async healthCheck(): Promise<{
    connected: boolean;
    sessionCount: number;
    expiredSessions: number;
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return { connected: true, sessionCount: 0, expiredSessions: 0 };
    } catch (error) {
      logger.error('DB_017: Database health check failed:', error);
      return { connected: false, sessionCount: 0, expiredSessions: 0 };
    }
  }

  public async cleanupExpiredEmailTokens(): Promise<number> {
    try {
      const emailResult = await this.prisma.user.updateMany({
        where: {
          emailVerifyExpires: {
            lt: new Date(),
          },
          isEmailVerified: false,
        },
        data: {
          emailVerifyToken: null,
          emailVerifyExpires: null,
        },
      });

      const passwordResult = await this.cleanupExpiredPasswordResetTokens();

      const totalCleaned = emailResult.count + passwordResult;

      if (totalCleaned > 0) {
        logger.info(
          `DB_021: ${emailResult.count} email + ${passwordResult} password reset tokens cleaned up`
        );
      }

      return totalCleaned;
    } catch (error) {
      logger.error('DB_022: Token cleanup error:', error);
      throw new Error(SERVICE_MESSAGES.DATABASE.TOKEN_CLEANUP_FAILED.message);
    }
  }

  public async deleteUnverifiedUsers(): Promise<number> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await this.prisma.user.deleteMany({
        where: {
          isEmailVerified: false,
          createdAt: {
            lt: oneDayAgo,
          },
        },
      });

      if (result.count > 0) {
        logger.info(`DB_023: ${result.count} unverified users cleaned up`);
      }

      return result.count;
    } catch (error) {
      logger.error('DB_024: Unverified user cleanup error:', error);
      throw new Error(SERVICE_MESSAGES.DATABASE.USER_CLEANUP_FAILED.message);
    }
  }

  public async cleanupExpiredPasswordResetTokens(): Promise<number> {
    try {
      const result = await this.prisma.user.updateMany({
        where: {
          passwordResetExpires: {
            lt: new Date(),
          },
        },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      if (result.count > 0) {
        logger.info(
          `DB_026: ${result.count} expired password reset tokens cleaned up`
        );
      }

      return result.count;
    } catch (error) {
      logger.error('DB_027: Password reset token cleanup error:', error);
      throw new Error(
        SERVICE_MESSAGES.DATABASE.PASSWORD_RESET_CLEANUP_FAILED.message
      );
    }
  }
}

export const db = DatabaseService.getInstance().getClient();
