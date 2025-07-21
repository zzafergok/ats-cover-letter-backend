import { Request, Response, NextFunction } from 'express';

import { sendServerError } from '../utils/response';

import logger from '../config/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    userId: req.user?.userId,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    timestamp: new Date().toISOString(),
  });

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    res.status(409);
    sendServerError(
      res,
      'ERR_001: Veri çakışması - Bu kayıt zaten mevcut (Unique constraint)'
    );
    return;
  }

  // Prisma foreign key constraint violation
  if (err.code === 'P2003') {
    res.status(400);
    sendServerError(
      res,
      'ERR_002: İlişki hatası - Bağlantılı kayıt bulunamadı (Foreign key constraint)'
    );
    return;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    res.status(404);
    sendServerError(
      res,
      'ERR_003: Kayıt bulunamadı - İşlem yapılacak veri mevcut değil'
    );
    return;
  }

  // Prisma connection error
  if (err.code === 'P1001') {
    res.status(503);
    sendServerError(
      res,
      'ERR_004: Veritabanı bağlantı hatası - Lütfen daha sonra tekrar deneyin'
    );
    return;
  }

  // Prisma timeout
  if (err.code === 'P1008') {
    res.status(504);
    sendServerError(
      res,
      'ERR_005: İşlem zaman aşımı - Veritabanı yanıt vermiyor'
    );
    return;
  }

  // JWT token errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401);
    sendServerError(
      res,
      'ERR_006: Token formatı geçersiz - Yeniden giriş yapın'
    );
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401);
    sendServerError(res, 'ERR_007: Token süresi dolmuş - Yeniden giriş yapın');
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400);
    sendServerError(
      res,
      'ERR_008: Giriş verisi doğrulama hatası - Geçersiz format'
    );
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errorMessage =
      err.errors?.map((e: any) => e.message).join(', ') || 'Doğrulama hatası';
    res.status(400);
    sendServerError(res, `ERR_009: Veri doğrulama başarısız - ${errorMessage}`);
    return;
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413);
    sendServerError(
      res,
      'ERR_010: Dosya boyutu hatası - Maksimum dosya boyutu aşıldı'
    );
    return;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    res.status(413);
    sendServerError(
      res,
      'ERR_011: Dosya sayısı hatası - Çok fazla dosya yüklendi'
    );
    return;
  }

  // Network/CORS errors
  if (err.type === 'entity.parse.failed') {
    res.status(400);
    sendServerError(res, 'ERR_012: JSON parse hatası - Geçersiz JSON formatı');
    return;
  }

  // Rate limiting
  if (err.status === 429) {
    res.status(429);
    sendServerError(
      res,
      'ERR_013: Çok fazla istek - Lütfen daha sonra tekrar deneyin'
    );
    return;
  }

  // Database connection pool exhausted
  if (err.message?.includes('connection pool')) {
    res.status(503);
    sendServerError(
      res,
      'ERR_014: Bağlantı havuzu dolu - Sistem yoğun, daha sonra deneyin'
    );
    return;
  }

  // Out of memory errors
  if (err.code === 'ENOMEM') {
    res.status(507);
    sendServerError(res, 'ERR_015: Bellek yetersiz - İşlem çok büyük');
    return;
  }

  // Default error
  res.status(500);
  sendServerError(
    res,
    'ERR_016: Beklenmeyen sistem hatası - Teknik ekip bilgilendirildi'
  );

  // Email verification errors
  if (err.code === 'P2002' && err.meta?.target?.includes('emailVerifyToken')) {
    res.status(409);
    sendServerError(
      res,
      'ERR_017: Email doğrulama çakışması - Token çakışması tespit edildi'
    );
    return;
  }

  // Email service errors
  if (err.message?.startsWith('EMAIL_')) {
    res.status(503);
    sendServerError(
      res,
      'ERR_018: Email gönderme hatası - Mail servisi geçici olarak kullanılamıyor'
    );
    return;
  }

  // JWT email verification errors
  if (err.message?.startsWith('JWT_S01')) {
    res.status(400);
    sendServerError(
      res,
      'ERR_019: Email doğrulama token hatası - Token işlenemedi'
    );
    return;
  }

  if (err.message?.startsWith('AUTH_039')) {
    res.status(503);
    sendServerError(
      res,
      'ERR_019: Email gönderme hatası - Mail servisi geçici olarak kullanılamıyor'
    );
    return;
  }
};
