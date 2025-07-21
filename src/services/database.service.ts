import { PrismaClient } from '@prisma/client';

import logger from '../config/logger';

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
      throw new Error('DB_001: Veritabanı istemci başlatma başarısız');
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
      throw new Error(
        'DB_025: Prisma client başlatılmamış - Database service düzgün başlatılamadı'
      );
    }
    return this.prisma;
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database connection closed successfully');
    } catch (error) {
      logger.error('DB_002: Database connection close error:', error);
      throw new Error('DB_002: Veritabanı bağlantı kapatma işlemi başarısız');
    }
  }

  public async connect(): Promise<void> {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error(
          'DB_003: Konfigürasyon hatası - DATABASE_URL ortam değişkeni tanımlanmamış'
        );
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
          throw new Error(
            'DB_005: Bağlantı hatası - Veritabanı sunucusuna erişilemiyor'
          );
        }

        if (errorCode === 'P1002') {
          throw new Error(
            'DB_006: Bağlantı zaman aşımı - Veritabanı yanıt vermiyor'
          );
        }

        if (errorCode === 'P1003') {
          throw new Error(
            'DB_007: Veritabanı bulunamadı - Belirtilen veritabanı mevcut değil'
          );
        }

        if (errorCode === 'P1008') {
          throw new Error(
            'DB_008: İşlem zaman aşımı - Veritabanı sorgusu çok uzun sürdü'
          );
        }

        if (errorCode === 'P1009') {
          throw new Error(
            'DB_009: Veritabanı zaten mevcut - Oluşturma işlemi başarısız'
          );
        }

        if (errorCode === 'P1010') {
          throw new Error(
            'DB_010: Erişim reddedildi - Veritabanı kullanıcı izinleri yetersiz'
          );
        }

        if (errorCode === 'P1011') {
          throw new Error(
            'DB_011: TLS bağlantı hatası - Güvenli bağlantı kurulamadı'
          );
        }

        if (errorCode === 'P1012') {
          throw new Error(
            'DB_012: Şema doğrulama hatası - Veritabanı şeması geçersiz'
          );
        }

        if (errorCode === 'P1013') {
          throw new Error(
            'DB_013: Geçersiz veritabanı dizesi - DATABASE_URL formatı hatalı'
          );
        }

        if (errorCode === 'P1014') {
          throw new Error(
            'DB_014: Temel model bulunamadı - Veritabanı şeması eksik'
          );
        }

        if (errorCode === 'P1015') {
          throw new Error(
            'DB_015: Prisma şeması geçersiz - Schema dosyasında hata'
          );
        }
      }

      throw new Error('DB_016: Veritabanı bağlantı kurma işlemi başarısız');
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
      throw new Error('DB_022: Token temizleme işlemi başarısız');
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
      throw new Error(
        'DB_024: Doğrulanmamış kullanıcı temizleme işlemi başarısız'
      );
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
        'DB_027: Password reset token temizleme işlemi başarısız'
      );
    }
  }
}

export const db = DatabaseService.getInstance().getClient();
