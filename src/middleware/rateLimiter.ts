// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

const trustedProxies = [
  'loopback',
  'linklocal',
  'uniquelocal',
  '127.0.0.1',
  '::1',
];

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (!isProduction) {
      return 'development-key';
    }
    return req.ip || '';
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Çok fazla giriş denemesi, lütfen daha sonra tekrar deneyin',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    if (!isProduction) {
      return 'development-auth-key';
    }
    return req.ip || '';
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Saatlik yükleme limitine ulaştınız',
  keyGenerator: (req) => {
    if (!isProduction) {
      return 'development-upload-key';
    }
    return req.ip || '';
  },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'API rate limit aşıldı',
  keyGenerator: (req) => {
    if (!isProduction) {
      return 'development-api-key';
    }
    return req.ip || '';
  },
});
