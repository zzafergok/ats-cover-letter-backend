import jwt from 'jsonwebtoken';
import { SERVICE_MESSAGES, formatMessage } from '../constants/messages';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  type: 'access' | 'refresh';
}

export class JwtService {
  private static getAccessSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_S001: Konfigürasyon hatası - JWT_SECRET ortam değişkeni tanımlanmamış'
      );
    }
    return secret;
  }

  private static getRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_S002: Konfigürasyon hatası - JWT_REFRESH_SECRET ortam değişkeni tanımlanmamış'
      );
    }
    return secret;
  }

  private static getAccessExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '4h';
  }

  private static getRefreshExpiresIn(): string {
    return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  public static generateAccessToken(
    userId: string,
    email: string,
    role: string,
    sessionId: string
  ): string {
    try {
      const payload: Omit<JwtPayload, 'type'> & { type: 'access' } = {
        userId,
        email,
        role,
        sessionId,
        type: 'access',
      };

      return jwt.sign(payload, this.getAccessSecret(), {
        expiresIn: this.getAccessExpiresIn(),
      } as jwt.SignOptions);
    } catch (error) {
      throw new Error(
        'JWT_S003: Token oluşturma hatası - Access token üretimi başarısız'
      );
    }
  }

  public static generatePasswordResetToken(
    userId: string,
    email: string
  ): string {
    try {
      const payload = {
        userId,
        email,
        type: 'password_reset',
        iat: Math.floor(Date.now() / 1000),
      };

      return jwt.sign(payload, this.getAccessSecret(), {
        expiresIn: '1h', // 1 saat
      } as jwt.SignOptions);
    } catch (error) {
      throw new Error(
        formatMessage(
          SERVICE_MESSAGES.AUTH.PASSWORD_RESET_TOKEN_GENERATION_FAILED
        )
      );
    }
  }

  public static verifyPasswordResetToken(token: string): {
    userId: string;
    email: string;
    iat: number;
  } {
    try {
      const decoded = jwt.verify(token, this.getAccessSecret()) as any;

      if (decoded.type !== 'password_reset') {
        throw new Error(
          'JWT_S020: Geçersiz token tipi - Şifre sıfırlama token değil'
        );
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
        iat: decoded.iat,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error(
          formatMessage(SERVICE_MESSAGES.AUTH.PASSWORD_RESET_TOKEN_EXPIRED)
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(
          formatMessage(SERVICE_MESSAGES.AUTH.PASSWORD_RESET_TOKEN_INVALID)
        );
      }
      throw new Error(
        formatMessage(SERVICE_MESSAGES.AUTH.PASSWORD_RESET_TOKEN_INVALID)
      );
    }
  }

  public static generateRefreshToken(
    userId: string,
    email: string,
    role: string,
    sessionId: string
  ): string {
    try {
      const payload: Omit<JwtPayload, 'type'> & { type: 'refresh' } = {
        userId,
        email,
        role,
        sessionId,
        type: 'refresh',
      };

      return jwt.sign(payload, this.getRefreshSecret(), {
        expiresIn: this.getRefreshExpiresIn(),
      } as jwt.SignOptions);
    } catch (error) {
      throw new Error(
        'JWT_S004: Token oluşturma hatası - Refresh token üretimi başarısız'
      );
    }
  }

  public static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.getAccessSecret());
      return decoded as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error(
          'JWT_S005: Token süresi dolmuş - Access token geçerliliğini yitirmiş'
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(
          'JWT_S006: Token geçersiz - Access token formatı hatalı'
        );
      }
      throw new Error(
        'JWT_S007: Token doğrulama hatası - Access token işlenemedi'
      );
    }
  }

  public static verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.getRefreshSecret());
      return decoded as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error(
          'JWT_S008: Token süresi dolmuş - Refresh token geçerliliğini yitirmiş'
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(
          'JWT_S009: Token geçersiz - Refresh token formatı hatalı'
        );
      }
      throw new Error(
        'JWT_S010: Token doğrulama hatası - Refresh token işlenemedi'
      );
    }
  }

  public static getExpiresInSeconds(): number {
    try {
      const expiresIn = this.getAccessExpiresIn();

      if (expiresIn.endsWith('h')) {
        return parseInt(expiresIn.slice(0, -1)) * 3600;
      }
      if (expiresIn.endsWith('m')) {
        return parseInt(expiresIn.slice(0, -1)) * 60;
      }
      if (expiresIn.endsWith('d')) {
        return parseInt(expiresIn.slice(0, -1)) * 24 * 3600;
      }
      if (expiresIn.endsWith('s')) {
        return parseInt(expiresIn.slice(0, -1));
      }

      return parseInt(expiresIn);
    } catch (error) {
      throw new Error(
        'JWT_S011: Konfigürasyon hatası - Token süre hesaplama başarısız'
      );
    }
  }

  public static generateEmailVerifyToken(
    userId: string,
    email: string
  ): string {
    try {
      const payload = {
        userId,
        email,
        type: 'email_verify',
      };

      return jwt.sign(payload, this.getAccessSecret(), {
        expiresIn: '30m', // 30 dakika
      } as jwt.SignOptions);
    } catch (error) {
      throw new Error(
        formatMessage(
          SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_GENERATION_FAILED
        )
      );
    }
  }

  public static verifyEmailVerifyToken(token: string): {
    userId: string;
    email: string;
  } {
    try {
      const decoded = jwt.verify(token, this.getAccessSecret()) as any;

      if (decoded.type !== 'email_verify') {
        throw new Error(
          'JWT_S015: Geçersiz token tipi - Email doğrulama token değil'
        );
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error(
          'JWT_S016: Email doğrulama süresi dolmuş - Yeni doğrulama talebi gerekli'
        );
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(
          formatMessage(SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_INVALID)
        );
      }
      throw new Error(
        formatMessage(SERVICE_MESSAGES.AUTH.EMAIL_VERIFICATION_TOKEN_INVALID)
      );
    }
  }
}
