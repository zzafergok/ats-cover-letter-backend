import rateLimit from 'express-rate-limit';
import { SERVICE_MESSAGES } from '../constants/messages';

const isProduction = process.env.NODE_ENV === 'production';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: SERVICE_MESSAGES.RATE_LIMIT.GENERAL_EXCEEDED.message,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: isProduction ? undefined : () => 'development-key',
  skip: () => !isProduction,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: SERVICE_MESSAGES.RATE_LIMIT.AUTH_EXCEEDED.message,
  skipSuccessfulRequests: true,
  keyGenerator: isProduction ? undefined : () => 'development-auth-key',
  skip: () => !isProduction,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: SERVICE_MESSAGES.RATE_LIMIT.UPLOAD_EXCEEDED.message,
  keyGenerator: isProduction ? undefined : () => 'development-upload-key',
  skip: () => !isProduction,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: SERVICE_MESSAGES.RATE_LIMIT.API_EXCEEDED.message,
  keyGenerator: isProduction ? undefined : () => 'development-api-key',
  skip: () => !isProduction,
});

export const atsGenerationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Maximum 5 CV generations per 10 minutes
  message: 'Too many ATS CV generation requests. Please try again later.',
  keyGenerator: isProduction ? undefined : () => 'development-ats-key',
  skip: () => !isProduction,
});

export const rateLimiter = {
  general: generalLimiter,
  auth: authLimiter,
  upload: uploadLimiter,
  api: apiLimiter,
  atsGeneration: atsGenerationLimiter,
};
