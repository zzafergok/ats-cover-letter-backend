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
import { SERVICE_MESSAGES } from '../constants/messages';

export class AuthController {
  private sessionService = SessionService.getInstance();
  private cacheService = CacheService.getInstance();

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_STARTED.message, {
        email: req.body.email,
        timestamp: new Date().toISOString(),
      });

      const { email, password, firstName, lastName, role }: RegisterRequest =
        req.body;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(email);

      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
      const isValidPassword = passwordRegex.test(password);

      if (!isValidEmail || !isValidPassword) {
        logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_FORMAT_ERROR.message);
        sendError(
          res,
          SERVICE_MESSAGES.SCHEMA.EMAIL_REQUIRED.message,
          400
        );
        return;
      }

      logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_VALIDATION_PASSED.message);

      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_DUPLICATE_EMAIL.message, email);
        sendError(res, SERVICE_MESSAGES.AUTH.TOKEN_VERIFICATION_FAILED.message, 400);
        return;
      }
      logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_EMAIL_UNIQUE.message);

      if (role && ['ADMIN'].includes(role)) {
        const roleUser = await db.user.findFirst({
          where: { role: role as any },
        });
        if (roleUser) {
          logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_ROLE_CONFLICT.message, role);
          sendError(
            res,
            SERVICE_MESSAGES.AUTH_EXT.REGISTER_ROLE_CONFLICT.message,
            400
          );
          return;
        }
      }
      logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_ROLE_VALIDATED.message);

      const hashedPassword = await bcrypt.hash(password, 12);
      logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_PASSWORD_HASHED.message);

      const emailVerifyToken = JwtService.generateEmailVerifyToken(
        'temp',
        email
      );
      const emailVerifyExpiry = new Date(Date.now() + 30 * 60 * 1000);
      logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_TOKEN_CREATED.message);

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
      logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_USER_CREATED.message, user.id);

      const finalEmailVerifyToken = JwtService.generateEmailVerifyToken(
        user.id,
        email
      );

      await db.user.update({
        where: { id: user.id },
        data: { emailVerifyToken: finalEmailVerifyToken },
      });
      logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_TOKEN_UPDATED.message);

      try {
        await EmailService.sendEmailVerification(
          email,
          finalEmailVerifyToken,
          `${firstName} ${lastName}`
        );
        logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_EMAIL_SENT.message);

        sendSuccess(
          res,
          {
            message: SERVICE_MESSAGES.EMAIL.VERIFICATION_SENT.message,
            email: email,
            emailSent: true,
          },
          SERVICE_MESSAGES.EMAIL.VERIFICATION_SENT.message
        );
      } catch (emailError) {
        logger.error(SERVICE_MESSAGES.AUTH_EXT.REGISTER_EMAIL_ERROR.message, emailError);

        await db.user.delete({ where: { id: user.id } });
        logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_ROLLBACK.message);

        sendError(
          res,
          SERVICE_MESSAGES.EMAIL.VERIFICATION_SEND_FAILED.message,
          500
        );
        return;
      }
    } catch (error) {
      logger.error(SERVICE_MESSAGES.AUTH_EXT.REGISTER_CRITICAL_ERROR.message, {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        code:
          error && typeof error === 'object' && 'code' in error
            ? (error as any).code
            : undefined,
      });
      sendServerError(
        res,
        SERVICE_MESSAGES.AUTH_EXT.REGISTER_CRITICAL_ERROR.message
      );
    }
  };

  public verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        sendError(res, SERVICE_MESSAGES.SCHEMA.EMAIL_VERIFICATION_TOKEN_REQUIRED.message, 400);
        return;
      }

      logger.info('Token doğrulama başlatıldı');
      const decoded = JwtService.verifyEmailVerifyToken(token);
      logger.info('Token decode edildi:', decoded.userId);

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

      logger.info(
        'Kullanıcı sorgusu tamamlandı:',
        user ? 'bulundu' : 'bulunamadı'
      );

      if (!user) {
        sendError(res, SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_INVALID.message, 400);
        return;
      }

      if (user.isEmailVerified) {
        sendError(res, SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_EXPIRED.message, 400);
        return;
      }

      if (user.emailVerifyExpires && user.emailVerifyExpires < new Date()) {
        sendError(res, SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_EXPIRED.message, 400);
        return;
      }

      logger.info('Email doğrulama işlemi başlatılıyor');
      await db.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifyToken: null,
          emailVerifyExpires: null,
        },
      });

      logger.info('Token generation başlatılıyor');
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

      logger.info('Email doğrulama başarıyla tamamlandı');
      sendSuccess(res, response, SERVICE_MESSAGES.EMAIL.VERIFICATION_SENT.message);
    } catch (error) {
      logger.error('Email doğrulama hatası detayı:', {
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined,
      });
      sendServerError(res, SERVICE_MESSAGES.EMAIL.VERIFICATION_SEND_FAILED.message);
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
          SERVICE_MESSAGES.EMAIL.VERIFICATION_SENT.message
        );
        return;
      }

      if (user.isEmailVerified) {
        sendError(res, SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_EXPIRED.message, 400);
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

      sendSuccess(res, null, SERVICE_MESSAGES.EMAIL.VERIFICATION_SENT.message);
    } catch (error) {
      logger.error('Email doğrulama yeniden gönderme hatası:', error);
      sendServerError(
        res,
        SERVICE_MESSAGES.EMAIL.VERIFICATION_SEND_FAILED.message
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
        logger.warn(SERVICE_MESSAGES.LOGGER.COVER_LETTER_GET_ERROR.message, { email });
        sendError(
          res,
          SERVICE_MESSAGES.GENERAL.NOT_FOUND.message,
          401
        );
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        logger.warn(SERVICE_MESSAGES.AUTH_EXT.REGISTER_FORMAT_ERROR.message, { email });
        sendError(
          res,
          SERVICE_MESSAGES.AUTH.TOKEN_VERIFICATION_FAILED.message,
          401
        );
        return;
      }

      if (!user.isEmailVerified) {
        logger.warn(SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_INVALID.message, { email });
        sendError(
          res,
          SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_INVALID.message,
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

      logger.info(SERVICE_MESSAGES.AUTH_EXT.REGISTER_USER_CREATED.message, { userId: user.id, email });
      sendSuccess(res, response, SERVICE_MESSAGES.GENERAL.SUCCESS.message);
    } catch (error) {
      logger.error(SERVICE_MESSAGES.LOGGER.COVER_LETTER_GET_ERROR.message, error);
      sendServerError(
        res,
        SERVICE_MESSAGES.ERROR.SERVER_ERROR.message
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
          SERVICE_MESSAGES.GENERAL.NOT_FOUND.message,
          401
        );
        return;
      }

      if (!user.isEmailVerified) {
        sendError(
          res,
          SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_INVALID.message,
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
      logger.error('Token yenileme hatası:', error);
      sendError(
        res,
        SERVICE_MESSAGES.AUTH.TOKEN_VERIFICATION_FAILED.message,
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

      logger.info(SERVICE_MESSAGES.GENERAL.SUCCESS.message, { userId: req.user?.userId });
      sendSuccess(res, null, SERVICE_MESSAGES.GENERAL.SUCCESS.message);
    } catch (error) {
      logger.error('Logout hatası:', error);
      sendServerError(
        res,
        SERVICE_MESSAGES.ERROR.SERVER_ERROR.message
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

      logger.info(SERVICE_MESSAGES.GENERAL.SUCCESS.message, { userId });
      sendSuccess(res, null, SERVICE_MESSAGES.GENERAL.SUCCESS.message);
    } catch (error) {
      logger.error('Logout all hatası:', error);
      sendServerError(
        res,
        SERVICE_MESSAGES.ERROR.SERVER_ERROR.message
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
          SERVICE_MESSAGES.GENERAL.NOT_FOUND.message,
          404
        );
        return;
      }

      if (!user.isEmailVerified) {
        sendError(
          res,
          SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_INVALID.message,
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
        SERVICE_MESSAGES.EMAIL.PASSWORD_RESET_SENT.message
      );
    } catch (error) {
      logger.error('Şifre sıfırlama hatası:', error);
      sendServerError(
        res,
        SERVICE_MESSAGES.ERROR.SERVER_ERROR.message
      );
    }
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword }: ResetPasswordRequest = req.body;

      logger.info('Reset token received:', token?.substring(0, 20) + '...');

      let decoded;
      try {
        decoded = JwtService.verifyPasswordResetToken(token);
        logger.info('JWT verification successful for user:', decoded.userId);
      } catch (jwtError) {
        if (jwtError instanceof Error) {
          logger.info('JWT verification failed:', jwtError.message);
          if (
            jwtError.message.includes('süresi dolmuş') ||
            jwtError.message.includes('expired')
          ) {
            sendError(res, 'AUTH_036: Şifre sıfırlama süresi dolmuş', 400);
            return;
          }
        } else {
          logger.info('JWT verification failed:', jwtError);
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
        logger.info('User not found for ID:', decoded.userId);
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

      logger.info('Password reset successful for user:', user.email);
      sendSuccess(res, null, 'Şifre başarıyla sıfırlandı');
    } catch (error) {
      logger.error('Şifre sıfırlama hatası:', error);
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
      logger.error('Kullanıcı bilgileri getirilemedi:', error);
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
      logger.error('Profil güncelleme hatası:', error);
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
      logger.error('Şifre değiştirme hatası:', error);
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
