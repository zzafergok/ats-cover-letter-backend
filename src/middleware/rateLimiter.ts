// src/middleware/rateLimiter.ts - Fixed for IPv6 compatibility
import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Çok fazla giriş denemesi, lütfen daha sonra tekrar deneyin',
  skipSuccessfulRequests: true,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Saatlik yükleme limitine ulaştınız',
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'API rate limit aşıldı',
});
