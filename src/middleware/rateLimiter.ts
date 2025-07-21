import rateLimit from 'express-rate-limit';

const isProduction = process.env.NODE_ENV === 'production';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: isProduction ? undefined : () => 'development-key',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Çok fazla giriş denemesi, lütfen daha sonra tekrar deneyin',
  skipSuccessfulRequests: true,
  keyGenerator: isProduction ? undefined : () => 'development-auth-key',
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Saatlik yükleme limitine ulaştınız',
  keyGenerator: isProduction ? undefined : () => 'development-upload-key',
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'API rate limit aşıldı',
  keyGenerator: isProduction ? undefined : () => 'development-api-key',
});
