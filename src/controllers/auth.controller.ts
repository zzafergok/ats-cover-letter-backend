// src/controllers/auth.controller.ts - Düzeltilmiş hali
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';

import { db } from '../services/database.service';
import { JwtService } from '../services/jwt.service';
import { EmailService } from '../services/email.service';
import { CacheService } from '../services/cache.service';
import { SessionService } from '../services/session.service';


import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  UpdateUserProfileRequest,
} from '../types';

import {
  sendError,
  sendSuccess,
  sendNotFound,
  sendServerError,
} from '../utils/response';

import logger from '../config/logger';

export class AuthController {
  private sessionService = SessionService.getInstance();
  private cacheService = CacheService.getInstance();

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[REGISTER] İşlem başlatıldı:', {
        email: req.body.email,
        timestamp: new Date().toISOString(),
      });

      const { email, password, firstName, lastName, role }: RegisterRequest = req.body;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(email);

      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
      const isValidPassword = passwordRegex.test(password);

      if (!isValidEmail || !isValidPassword) {
        console.log('[REGISTER] Email veya password format hatası');
        sendError(
          res,
          'AUTH_025: Email adresi ve parolanızı kontrol ediniz',
          400
        );
        return;
      }

      console.log('[REGISTER] Email ve password format validation geçti');

      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        console.log('[REGISTER] Duplicate email tespit edildi:', email);
        sendError(res, 'AUTH_005: Bu email adresi zaten kullanımda', 400);
        return;
      }
      console.log('[REGISTER] Email uniqueness validation geçti');

      if (role && ['ADMIN'].includes(role)) {
        const roleUser = await db.user.findFirst({
          where: { role: role as any },
        });
        if (roleUser) {
          console.log('[REGISTER] Rol çakışması tespit edildi:', role);
          sendError(
            res,
            `AUTH_006: ${role} rolü için kullanıcı zaten mevcut`,
            400
          );
          return;
        }
      }
      console.log('[REGISTER] Role validation geçti');

      const hashedPassword = await bcrypt.hash(password, 12);
      console.log('[REGISTER] Password hashing tamamlandı');

      const emailVerifyToken = JwtService.generateEmailVerifyToken(
        'temp',
        email
      );
      const emailVerifyExpiry = new Date(Date.now() + 30 * 60 * 1000);
      console.log('[REGISTER] Email verification token oluşturuldu');

      // firstName and lastName already extracted from request body

      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || ('USER' as any),
          isEmailVerified: false,
          emailVerifyToken,
          emailVerifyExpires: emailVerifyExpiry,
        },
      });
      console.log('[REGISTER] User veritabanında oluşturuldu:', user.id);

      const finalEmailVerifyToken = JwtService.generateEmailVerifyToken(
        user.id,
        email
      );

      await db.user.update({
        where: { id: user.id },
        data: { emailVerifyToken: finalEmailVerifyToken },
      });
      console.log('[REGISTER] Token güncelleme tamamlandı');

      try {
        await EmailService.sendEmailVerification(
          email,
          finalEmailVerifyToken,
          `${firstName} ${lastName}`
        );
        console.log('[REGISTER] Email doğrulama başarıyla gönderildi');

        sendSuccess(
          res,
          {
            message: 'Hesap oluşturuldu, email adresinizi doğrulayın',
            email: email,
            emailSent: true,
          },
          'Kayıt başarılı - Email doğrulama gönderildi'
        );
      } catch (emailError) {
        console.error('[REGISTER] Email gönderim hatası:', emailError);

        await db.user.delete({ where: { id: user.id } });
        console.log('[REGISTER] User kaydı email hatası nedeniyle geri alındı');

        sendError(
          res,
          'AUTH_026: Email gönderimi başarısız - Kayıt işlemi iptal edildi',
          500
        );
        return;
      }
    } catch (error) {
      console.error('[REGISTER] Kritik hata:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code:
          error && typeof error === 'object' && 'code' in error
            ? (error as any).code
            : undefined,
      });
      sendServerError(
        res,
        'AUTH_007: Sistem hatası - Hesap oluşturma işlemi başarısız'
      );
    }
  };

  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        sendError(res, 'AUTH_017: Email doğrulama token gerekli', 400);
        return;
      }

      console.log('Token doğrulama başlatıldı');
      const decoded = JwtService.verifyEmailVerifyToken(token);
      console.log('Token decode edildi:', decoded.userId);

      const user = await db.user.findUnique({
        where: {
          id: decoded.userId,
          emailVerifyToken: token,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isEmailVerified: true,
          emailVerifyToken: true,
          emailVerifyExpires: true,
        },
      });

      console.log(
        'Kullanıcı sorgusu tamamlandı:',
        user ? 'bulundu' : 'bulunamadı'
      );

      if (!user) {
        sendError(res, 'AUTH_018: Geçersiz email doğrulama token', 400);
        return;
      }

      if (user.isEmailVerified) {
        sendError(res, 'AUTH_019: Email adresi zaten doğrulanmış', 400);
        return;
      }

      if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
        sendError(res, 'AUTH_020: Email doğrulama süresi dolmuş', 400);
        return;
      }

      console.log('Email doğrulama işlemi başlatılıyor');
      await db.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifyToken: null,
          emailVerifyExpires: null,
        },
      });

      console.log('Token generation başlatılıyor');
      const accessToken = JwtService.generateAccessToken(
        user.id,
        user.email,
        user.role,
        'no-session'
      );
      const refreshToken = JwtService.generateRefreshToken(
        user.id,
        user.email,
        user.role,
        'no-session'
      );

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
        expiresIn: JwtService.getExpiresInSeconds(),
      };

      console.log('Email doğrulama başarıyla tamamlandı');
      sendSuccess(res, response, 'Email doğrulandı ve giriş yapabilirsiniz');
    } catch (error) {
      console.error('Email doğrulama hatası detayı:', {
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined,
      });
      sendServerError(res, 'AUTH_022: Email doğrulama işlemi başarısız');
    }
  };

  public resendEmailVerification = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { email } = req.body;

      const user = await db.user.findUnique({ where: { email } });

      if (!user) {
        sendSuccess(
          res,
          null,
          'Eğer email geçerliyse, doğrulama bağlantısı gönderildi'
        );
        return;
      }

      if (user.isEmailVerified) {
        sendError(res, 'AUTH_023: Email adresi zaten doğrulanmış', 400);
        return;
      }

      const emailVerifyToken = JwtService.generateEmailVerifyToken(
        user.id,
        email
      );
      const emailVerifyExpiry = new Date(Date.now() + 30 * 60 * 1000);

      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerifyToken,
          emailVerifyExpires: emailVerifyExpiry,
        },
      });

      await EmailService.sendEmailVerification(
        email,
        emailVerifyToken,
        `${user.firstName} ${user.lastName}`.trim()
      );

      sendSuccess(res, null, 'Email doğrulama bağlantısı yeniden gönderildi');
    } catch (error) {
      console.error('Email doğrulama yeniden gönderme hatası:', error);
      sendServerError(
        res,
        'AUTH_024: Email doğrulama yeniden gönderme başarısız'
      );
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Login işlemi başlatıldı', { email: req.body.email });
      const { email, password }: LoginRequest = req.body;

      const cacheKey = `user:${email}`;
      let user = await this.cacheService.get(cacheKey);

      if (!user) {
        user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            password: true,
            role: true,
            isEmailVerified: true,
          },
        });

        if (user) {
          await this.cacheService.set(cacheKey, user, 300);
        }
      }

      if (!user) {
        logger.warn('Login başarısız - kullanıcı bulunamadı', { email });
        sendError(
          res,
          'AUTH_001: Kullanıcı girişi başarısız - Email adresi bulunamadı',
          401
        );
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        logger.warn('Login başarısız - hatalı şifre', { email });
        sendError(
          res,
          'AUTH_002: Kullanıcı girişi başarısız - Şifre hatalı',
          401
        );
        return;
      }

      if (!user.isEmailVerified) {
        logger.warn('Login başarısız - email doğrulanmamış', { email });
        sendError(
          res,
          'AUTH_025: Giriş engellendi - Email adresinizi doğrulamanız gerekiyor',
          403
        );
        return;
      }

      const sessionId = await this.sessionService.createSession(user.id, {
        email: user.email,
        role: user.role,
      });

      const accessToken = JwtService.generateAccessToken(
        user.id,
        user.email,
        user.role,
        sessionId
      );
      const refreshToken = JwtService.generateRefreshToken(
        user.id,
        user.email,
        user.role,
        sessionId
      );

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
        expiresIn: JwtService.getExpiresInSeconds(),
      };

      logger.info('Login başarılı', { userId: user.id, email });
      sendSuccess(res, response, 'Başarıyla giriş yapıldı');
    } catch (error) {
      logger.error('Login hatası:', error);
      sendServerError(
        res,
        'AUTH_004: Sistem hatası - Giriş işlemi tamamlanamadı'
      );
    }
  };

  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken }: RefreshTokenRequest = req.body;

      const payload = JwtService.verifyRefreshToken(refreshToken);

      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isEmailVerified: true,
        },
      });

      if (!user) {
        sendError(
          res,
          'AUTH_008: Token yenileme başarısız - Kullanıcı bulunamadı',
          401
        );
        return;
      }

      if (!user.isEmailVerified) {
        sendError(
          res,
          'AUTH_008: Token yenileme başarısız - Email doğrulama gerekli',
          401
        );
        return;
      }

      const newAccessToken = JwtService.generateAccessToken(
        user.id,
        user.email,
        user.role,
        'no-session'
      );
      const newRefreshToken = JwtService.generateRefreshToken(
        user.id,
        user.email,
        user.role,
        'no-session'
      );

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: JwtService.getExpiresInSeconds(),
      };

      sendSuccess(res, response);
    } catch (error) {
      console.error('Token yenileme hatası:', error);
      sendError(
        res,
        'AUTH_009: Token yenileme başarısız - Token doğrulama hatası',
        401
      );
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.user?.sessionId;

      if (sessionId) {
        await this.sessionService.destroySession(sessionId);
      }

      logger.info('Logout başarılı', { userId: req.user?.userId });
      sendSuccess(res, null, 'Başarıyla çıkış yapıldı');
    } catch (error) {
      logger.error('Logout hatası:', error);
      sendServerError(
        res,
        'AUTH_010: Sistem hatası - Çıkış işlemi tamamlanamadı'
      );
    }
  };

  public logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (userId) {
        await this.sessionService.destroyAllUserSessions(userId);
        await this.cacheService.del(`user:sessions:${userId}`);
      }

      logger.info('Tüm oturumlardan çıkış yapıldı', { userId });
      sendSuccess(res, null, 'Tüm cihazlardan çıkış yapıldı');
    } catch (error) {
      logger.error('Logout all hatası:', error);
      sendServerError(
        res,
        'AUTH_011: Sistem hatası - Toplu çıkış işlemi başarısız'
      );
    }
  };

  public forgotPassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { email }: ForgotPasswordRequest = req.body;

      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isEmailVerified: true,
        },
      });

      if (!user) {
        sendError(
          res,
          'AUTH_033: Email adresi sistemde bulunamadı - Lütfen kayıtlı email adresinizi kontrol edin',
          404
        );
        return;
      }

      if (!user.isEmailVerified) {
        sendError(
          res,
          'AUTH_034: Email adresi doğrulanmamış - Önce email doğrulaması yapmanız gerekiyor',
          400
        );
        return;
      }

      const resetToken = JwtService.generatePasswordResetToken(
        user.id,
        user.email
      );

      await EmailService.sendPasswordResetEmail(email, resetToken);

      sendSuccess(
        res,
        null,
        'Şifre sıfırlama bağlantısı email adresinize gönderildi'
      );
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      sendServerError(
        res,
        'AUTH_012: Sistem hatası - Şifre sıfırlama talebi işlenemedi'
      );
    }
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword }: ResetPasswordRequest = req.body;

      console.log('Reset token received:', token?.substring(0, 20) + '...');

      let decoded;
      try {
        decoded = JwtService.verifyPasswordResetToken(token);
        console.log('JWT verification successful for user:', decoded.userId);
      } catch (jwtError) {
        if (jwtError instanceof Error) {
          console.log('JWT verification failed:', jwtError.message);
          if (
            jwtError.message.includes('süresi dolmuş') ||
            jwtError.message.includes('expired')
          ) {
            sendError(res, 'AUTH_036: Şifre sıfırlama süresi dolmuş', 400);
            return;
          }
        } else {
          console.log('JWT verification failed:', jwtError);
        }
        sendError(res, 'AUTH_035: Geçersiz şifre sıfırlama token', 400);
        return;
      }

      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
        },
      });

      if (!user) {
        console.log('User not found for ID:', decoded.userId);
        sendError(res, 'AUTH_035: Geçersiz şifre sıfırlama token', 400);
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
        },
      });

      console.log('Password reset successful for user:', user.email);
      sendSuccess(res, null, 'Şifre başarıyla sıfırlandı');
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      if (error instanceof Error && error.message.startsWith('JWT_S')) {
        sendError(res, error.message, 400);
      } else {
        sendServerError(
          res,
          'AUTH_038: Sistem hatası - Şifre sıfırlama işlemi başarısız'
        );
      }
    }
  };

  public getCurrentUser = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        sendNotFound(res, 'AUTH_013: Kullanıcı bilgisi bulunamadı');
        return;
      }

      sendSuccess(res, {
        ...user,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      console.error('Kullanıcı bilgileri getirilemedi:', error);
      sendServerError(
        res,
        'AUTH_014: Sistem hatası - Kullanıcı bilgileri alınamadı'
      );
    }
  };

  public updateUserProfile = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId as string;
      const { firstName, lastName }: UpdateUserProfileRequest = req.body;

      const existingUser = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, email: true },
      });

      if (!existingUser) {
        sendNotFound(res, 'AUTH_027: Kullanıcı bulunamadı');
        return;
      }

      // Email updates not allowed in this implementation

      // firstName and lastName already extracted from request body

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { firstName, lastName },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          updatedAt: true,
        },
      });

      sendSuccess(
        res,
        {
          ...updatedUser,
          name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
        },
        'Profil bilgileri başarıyla güncellendi'
      );
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      sendServerError(
        res,
        'AUTH_029: Sistem hatası - Profil güncelleme işlemi başarısız'
      );
    }
  };

  public changePassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId as string;
      const { currentPassword, newPassword }: ChangePasswordRequest = req.body;

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true, email: true },
      });

      if (!user) {
        sendNotFound(res, 'AUTH_030: Kullanıcı bulunamadı');
        return;
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        sendError(res, 'AUTH_031: Mevcut şifre hatalı', 400);
        return;
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      await db.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      sendSuccess(res, null, 'Şifre başarıyla değiştirildi');
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      sendServerError(
        res,
        'AUTH_032: Sistem hatası - Şifre değiştirme işlemi başarısız'
      );
    }
  };

  public getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendError(res, 'Kullanıcı bulunamadı', 401);
        return;
      }

      const sessionsKey = `user:${userId}:sessions`;
      const sessionIds = (await this.cacheService.get(sessionsKey)) || [];

      const sessions = await Promise.all(
        sessionIds.map(async (sessionId: string) => {
          const sessionData = await this.sessionService.getSession(sessionId);
          return sessionData
            ? {
                sessionId,
                ...sessionData,
                current: sessionId === req.user?.sessionId,
              }
            : null;
        })
      );

      sendSuccess(
        res,
        sessions.filter((s) => s !== null)
      );
    } catch (error) {
      logger.error('Oturumlar getirilemedi:', error);
      sendServerError(
        res,
        'AUTH_015: Sistem hatası - Oturum bilgileri alınamadı'
      );
    }
  };
}
