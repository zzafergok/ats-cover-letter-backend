import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';

import { db } from '../services/database.service';
import { JwtService } from '../services/jwt.service';
import { EmailService } from '../services/email.service';

import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  UpdateUserProfileRequest,
  ResetPasswordRequest,
} from '../types';
import {
  sendError,
  sendSuccess,
  sendNotFound,
  sendServerError,
} from '../utils/response';

export class AuthController {
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[REGISTER] İşlem başlatıldı:', {
        email: req.body.email,
        timestamp: new Date().toISOString(),
      });

      const { email, password, name, role }: RegisterRequest = req.body;

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(email);

      // Password format validation (minimum 8 characters, at least one letter and one number)
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
      const isValidPassword = passwordRegex.test(password);

      // Combined email and password validation error
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

      // Existing user check
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        console.log('[REGISTER] Duplicate email tespit edildi:', email);
        sendError(res, 'AUTH_005: Bu email adresi zaten kullanımda', 400);
        return;
      }
      console.log('[REGISTER] Email uniqueness validation geçti');

      // Role validation for specific roles
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

      // Password hashing
      const hashedPassword = await bcrypt.hash(password, 12);
      console.log('[REGISTER] Password hashing tamamlandı');

      // JWT token generation
      const emailVerifyToken = JwtService.generateEmailVerifyToken(
        'temp',
        email
      );
      const emailVerifyExpiry = new Date(Date.now() + 30 * 60 * 1000);
      console.log('[REGISTER] Email verification token oluşturuldu');

      // User creation in transaction
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || ('DEVELOPER' as any),
          emailVerified: false,
          emailVerifyToken,
          emailVerifyExpiry,
        },
      });
      console.log('[REGISTER] User veritabanında oluşturuldu:', user.id);

      // Update token with real user ID
      const finalEmailVerifyToken = JwtService.generateEmailVerifyToken(
        user.id,
        email
      );

      await db.user.update({
        where: { id: user.id },
        data: { emailVerifyToken: finalEmailVerifyToken },
      });
      console.log('[REGISTER] Token güncelleme tamamlandı');

      // Email sending with rollback capability
      try {
        await EmailService.sendEmailVerification(
          email,
          finalEmailVerifyToken,
          name
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

        // Rollback user creation if email fails
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

      // findUnique kullanarak daha güvenli yaklaşım
      const user = await db.user.findUnique({
        where: {
          id: decoded.userId,
          emailVerifyToken: token,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          emailVerifyToken: true,
          emailVerifyExpiry: true,
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

      if (user.emailVerified) {
        sendError(res, 'AUTH_019: Email adresi zaten doğrulanmış', 400);
        return;
      }

      if (user.emailVerifyExpiry && user.emailVerifyExpiry < new Date()) {
        sendError(res, 'AUTH_020: Email doğrulama süresi dolmuş', 400);
        return;
      }

      console.log('Email doğrulama işlemi başlatılıyor');
      await db.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifyToken: null,
          emailVerifyExpiry: null,
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
          name: user.name,
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

      if (user.emailVerified) {
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
          emailVerifyExpiry,
        },
      });

      await EmailService.sendEmailVerification(
        email,
        emailVerifyToken,
        user.name
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
      console.log('Login işlemi başlatıldı');
      const { email, password }: LoginRequest = req.body;

      console.log('Kullanıcı sorgusu yapılıyor:', email);
      const user = await db.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          emailVerified: true,
        },
      });

      if (!user) {
        sendError(
          res,
          'AUTH_001: Kullanıcı girişi başarısız - Email adresi bulunamadı',
          401
        );
        return;
      }

      console.log('Şifre kontrolü yapılıyor');
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        sendError(
          res,
          'AUTH_002: Kullanıcı girişi başarısız - Şifre hatalı',
          401
        );
        return;
      }

      if (!user.emailVerified) {
        sendError(
          res,
          'AUTH_025: Giriş engellendi - Email adresinizi doğrulamanız gerekiyor',
          403
        );
        return;
      }

      console.log('Token oluşturma işlemi başlatılıyor');
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
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
        expiresIn: JwtService.getExpiresInSeconds(),
      };

      console.log('Login işlemi başarıyla tamamlandı');
      sendSuccess(res, response, 'Başarıyla giriş yapıldı');
    } catch (error) {
      console.error('Login hatası detayı:', {
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        stack: error instanceof Error ? error.stack : undefined,
        dbStatus: typeof db,
      });
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

      // Session kontrolü olmadan doğrudan kullanıcı kontrolü
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
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

      if (!user.emailVerified) {
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
          name: user.name,
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
      sendSuccess(res, null, 'Başarıyla çıkış yapıldı');
    } catch (error) {
      console.error('Logout hatası:', error);
      sendServerError(
        res,
        'AUTH_010: Sistem hatası - Çıkış işlemi tamamlanamadı'
      );
    }
  };

  public logoutAll = async (req: Request, res: Response): Promise<void> => {
    try {
      sendSuccess(res, null, 'Tüm cihazlardan çıkış yapıldı');
    } catch (error) {
      console.error('Logout all hatası:', error);
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
          name: true,
          role: true,
          emailVerified: true,
          lastPasswordResetAt: true,
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

      if (!user.emailVerified) {
        sendError(
          res,
          'AUTH_034: Email adresi doğrulanmamış - Önce email doğrulaması yapmanız gerekiyor',
          400
        );
        return;
      }

      // Günlük sınırlama kontrolü (24 saat) - Güncellendi
      if (user.lastPasswordResetAt) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (user.lastPasswordResetAt > oneDayAgo) {
          const nextAllowedTime = new Date(
            user.lastPasswordResetAt.getTime() + 24 * 60 * 60 * 1000
          );
          const hoursLeft = Math.ceil(
            (nextAllowedTime.getTime() - Date.now()) / (1000 * 60 * 60)
          );

          sendError(
            res,
            `AUTH_037: Şifre sıfırlama günlük limitine ulaşıldı - ${hoursLeft} saat sonra tekrar deneyebilirsiniz`,
            429
          );
          return;
        }
      }

      // Token oluşturma
      const resetToken = JwtService.generatePasswordResetToken(
        user.id,
        user.email
      );
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

      // Token'ı database'e kaydetme ve lastPasswordResetAt güncelleme - Önemli değişiklik
      await db.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpiry: resetExpiry,
          lastPasswordResetAt: new Date(), // Şimdi güncellenir
        },
      });

      // Email gönderme
      try {
        await EmailService.sendPasswordResetEmail(email, resetToken);

        sendSuccess(
          res,
          null,
          'Şifre sıfırlama bağlantısı email adresinize gönderildi'
        );
      } catch (emailError) {
        console.error('Email gönderim hatası:', emailError);

        // Email gönderilemezse lastPasswordResetAt'i geri al
        await db.user.update({
          where: { id: user.id },
          data: {
            passwordResetToken: null,
            passwordResetExpiry: null,
            lastPasswordResetAt: user.lastPasswordResetAt, // Eski değeri geri yükle
          },
        });

        sendServerError(
          res,
          'AUTH_039: Email gönderimi başarısız - Lütfen daha sonra tekrar deneyiniz'
        );
      }
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      sendServerError(
        res,
        'AUTH_012: Sistem hatası - Şifre sıfırlama talebi işlenemedi'
      );
    }
  };

  // src/controllers/auth.controller.ts
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword }: ResetPasswordRequest = req.body;

      console.log('Reset token received:', token?.substring(0, 20) + '...');

      // 1. JWT Token doğrulama
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

      // 2. Kullanıcı varlık kontrolü (token kontrolü olmadan)
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          passwordResetToken: true,
          passwordResetExpiry: true,
        },
      });

      if (!user) {
        console.log('User not found for ID:', decoded.userId);
        sendError(res, 'AUTH_035: Geçersiz şifre sıfırlama token', 400);
        return;
      }

      // 3. Database token kontrolü
      if (user.passwordResetToken !== token) {
        console.log('Token mismatch in database');
        console.log(
          'DB token:',
          user.passwordResetToken?.substring(0, 20) + '...'
        );
        console.log('Request token:', token.substring(0, 20) + '...');
        sendError(res, 'AUTH_035: Geçersiz şifre sıfırlama token', 400);
        return;
      }

      // 4. Database expiry kontrolü
      if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
        console.log('Token expired in database:', user.passwordResetExpiry);
        sendError(res, 'AUTH_036: Şifre sıfırlama süresi dolmuş', 400);
        return;
      }

      // 5. Şifre güncelleme
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiry: null,
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
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        sendNotFound(res, 'AUTH_013: Kullanıcı bilgisi bulunamadı');
        return;
      }

      sendSuccess(res, user);
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
      const { name, email }: UpdateUserProfileRequest = req.body;

      const existingUser = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!existingUser) {
        sendNotFound(res, 'AUTH_027: Kullanıcı bulunamadı');
        return;
      }

      if (email !== existingUser.email) {
        const emailExists = await db.user.findUnique({
          where: { email, NOT: { id: userId } },
        });

        if (emailExists) {
          sendError(
            res,
            'AUTH_028: Bu email adresi başka bir kullanıcı tarafından kullanılmaktadır',
            400
          );
          return;
        }
      }

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { name, email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          updatedAt: true,
        },
      });

      sendSuccess(res, updatedUser, 'Profil bilgileri başarıyla güncellendi');
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
      sendSuccess(res, []);
    } catch (error) {
      console.error('Oturumlar getirilemedi:', error);
      sendServerError(
        res,
        'AUTH_015: Sistem hatası - Oturum bilgileri alınamadı'
      );
    }
  };
}
