// src/middleware/rateLimiter.ts - Vercel için güncellenmiş
import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Vercel'de Redis olmadığı için memory store kullanıyoruz
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.headers['x-forwarded-for']?.toString() || 'anonymous';
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Çok fazla giriş denemesi, lütfen daha sonra tekrar deneyin',
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    const identifier = req.body.email || req.ip || 'anonymous';
    return `auth_${identifier}`;
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Saatlik yükleme limitine ulaştınız',
  keyGenerator: (req: Request) => {
    return `upload_${req.user?.userId || req.ip || 'anonymous'}`;
  },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'API rate limit aşıldı',
});
