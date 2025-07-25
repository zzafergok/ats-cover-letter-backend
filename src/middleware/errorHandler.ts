import { Request, Response, NextFunction } from 'express';

import { sendError, sendServerError } from '../utils/response';

import logger from '../config/logger';
import { SERVICE_MESSAGES, createErrorMessage } from '../constants/messages';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error(createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, err), {
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    userId: req.user?.userId,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  logger.error(SERVICE_MESSAGES.LOGGER.ERROR_OCCURRED.message, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    timestamp: new Date().toISOString(),
  });

  // Email verification errors (check first for specific cases)
  if (err.code === 'P2002' && err.meta?.target?.includes('emailVerifyToken')) {
    return sendError(res, SERVICE_MESSAGES.ERROR.EMAIL_VERIFICATION_CONFLICT.message, 409);
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return sendError(res, SERVICE_MESSAGES.ERROR.DATA_CONFLICT.message, 409);
  }

  // Prisma foreign key constraint violation
  if (err.code === 'P2003') {
    return sendError(res, SERVICE_MESSAGES.ERROR.RELATIONSHIP_ERROR.message, 400);
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return sendError(res, SERVICE_MESSAGES.ERROR.RECORD_NOT_FOUND.message, 404);
  }

  // Prisma connection error
  if (err.code === 'P1001') {
    return sendError(res, SERVICE_MESSAGES.ERROR.DATABASE_CONNECTION_ERROR.message, 503);
  }

  // Prisma timeout
  if (err.code === 'P1008') {
    return sendError(res, SERVICE_MESSAGES.ERROR.TIMEOUT_ERROR.message, 504);
  }

  // JWT token errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, SERVICE_MESSAGES.ERROR.JWT_TOKEN_INVALID.message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, SERVICE_MESSAGES.ERROR.JWT_TOKEN_EXPIRED.message, 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return sendError(res, SERVICE_MESSAGES.ERROR.VALIDATION_ERROR.message, 400);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errorMessage =
      err.errors?.map((e: any) => e.message).join(', ') ||
      SERVICE_MESSAGES.ERROR.ZOD_VALIDATION_DEFAULT.message;
    return sendError(
      res,
      `${SERVICE_MESSAGES.ERROR.ZOD_VALIDATION_FAILED.code}: ${SERVICE_MESSAGES.ERROR.ZOD_VALIDATION_FAILED.message} - ${errorMessage}`,
      400
    );
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, SERVICE_MESSAGES.ERROR.FILE_SIZE_LIMIT.message, 413);
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return sendError(res, SERVICE_MESSAGES.ERROR.FILE_COUNT_LIMIT.message, 413);
  }

  // Network/CORS errors
  if (err.type === 'entity.parse.failed') {
    return sendError(res, SERVICE_MESSAGES.ERROR.JSON_PARSE_ERROR.message, 400);
  }

  // Rate limiting
  if (err.status === 429) {
    return sendError(res, SERVICE_MESSAGES.ERROR.RATE_LIMIT_EXCEEDED.message, 429);
  }

  // Database connection pool exhausted
  if (err.message?.includes('connection pool')) {
    return sendError(res, SERVICE_MESSAGES.ERROR.CONNECTION_POOL_EXHAUSTED.message, 503);
  }

  // Out of memory errors
  if (err.code === 'ENOMEM') {
    return sendError(res, SERVICE_MESSAGES.ERROR.MEMORY_ERROR.message, 507);
  }

  // Email service errors
  if (err.message?.startsWith('EMAIL_')) {
    return sendError(res, SERVICE_MESSAGES.ERROR.EMAIL_SERVICE_ERROR.message, 503);
  }

  // JWT email verification errors
  if (err.message?.startsWith('JWT_S01')) {
    return sendError(res, SERVICE_MESSAGES.ERROR.EMAIL_TOKEN_ERROR.message, 400);
  }

  if (err.message?.startsWith('AUTH_039')) {
    return sendError(res, SERVICE_MESSAGES.ERROR.EMAIL_SERVICE_ERROR.message, 503);
  }

  // Default error
  return sendServerError(res, SERVICE_MESSAGES.ERROR.UNEXPECTED_ERROR.message);
};
