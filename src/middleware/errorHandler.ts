import { Request, Response } from 'express';

import { sendServerError } from '../utils/response';

import logger from '../config/logger';
import { SERVICE_MESSAGES, createErrorMessage } from '../constants/messages';

export const errorHandler = (err: any, req: Request, res: Response): void => {
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

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    res.status(409);
    sendServerError(res, SERVICE_MESSAGES.ERROR.DATA_CONFLICT.message);
    return;
  }

  // Prisma foreign key constraint violation
  if (err.code === 'P2003') {
    res.status(400);
    sendServerError(res, SERVICE_MESSAGES.ERROR.RELATIONSHIP_ERROR.message);
    return;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    res.status(404);
    sendServerError(res, SERVICE_MESSAGES.ERROR.RECORD_NOT_FOUND.message);
    return;
  }

  // Prisma connection error
  if (err.code === 'P1001') {
    res.status(503);
    sendServerError(
      res,
      SERVICE_MESSAGES.ERROR.DATABASE_CONNECTION_ERROR.message
    );
    return;
  }

  // Prisma timeout
  if (err.code === 'P1008') {
    res.status(504);
    sendServerError(res, SERVICE_MESSAGES.ERROR.TIMEOUT_ERROR.message);
    return;
  }

  // JWT token errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401);
    sendServerError(res, SERVICE_MESSAGES.ERROR.JWT_TOKEN_INVALID.message);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401);
    sendServerError(res, SERVICE_MESSAGES.ERROR.JWT_TOKEN_EXPIRED.message);
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400);
    sendServerError(res, SERVICE_MESSAGES.ERROR.VALIDATION_ERROR.message);
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errorMessage =
      err.errors?.map((e: any) => e.message).join(', ') ||
      SERVICE_MESSAGES.ERROR.ZOD_VALIDATION_DEFAULT.message;
    res.status(400);
    sendServerError(
      res,
      `${SERVICE_MESSAGES.ERROR.ZOD_VALIDATION_FAILED.code}: ${SERVICE_MESSAGES.ERROR.ZOD_VALIDATION_FAILED.message} - ${errorMessage}`
    );
    return;
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413);
    sendServerError(res, SERVICE_MESSAGES.ERROR.FILE_SIZE_LIMIT.message);
    return;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    res.status(413);
    sendServerError(res, SERVICE_MESSAGES.ERROR.FILE_COUNT_LIMIT.message);
    return;
  }

  // Network/CORS errors
  if (err.type === 'entity.parse.failed') {
    res.status(400);
    sendServerError(res, SERVICE_MESSAGES.ERROR.JSON_PARSE_ERROR.message);
    return;
  }

  // Rate limiting
  if (err.status === 429) {
    res.status(429);
    sendServerError(res, SERVICE_MESSAGES.ERROR.RATE_LIMIT_EXCEEDED.message);
    return;
  }

  // Database connection pool exhausted
  if (err.message?.includes('connection pool')) {
    res.status(503);
    sendServerError(
      res,
      SERVICE_MESSAGES.ERROR.CONNECTION_POOL_EXHAUSTED.message
    );
    return;
  }

  // Out of memory errors
  if (err.code === 'ENOMEM') {
    res.status(507);
    sendServerError(res, SERVICE_MESSAGES.ERROR.MEMORY_ERROR.message);
    return;
  }

  // Default error
  res.status(500);
  sendServerError(res, SERVICE_MESSAGES.ERROR.UNEXPECTED_ERROR.message);

  // Email verification errors
  if (err.code === 'P2002' && err.meta?.target?.includes('emailVerifyToken')) {
    res.status(409);
    sendServerError(
      res,
      SERVICE_MESSAGES.ERROR.EMAIL_VERIFICATION_CONFLICT.message
    );
    return;
  }

  // Email service errors
  if (err.message?.startsWith('EMAIL_')) {
    res.status(503);
    sendServerError(res, SERVICE_MESSAGES.ERROR.EMAIL_SERVICE_ERROR.message);
    return;
  }

  // JWT email verification errors
  if (err.message?.startsWith('JWT_S01')) {
    res.status(400);
    sendServerError(res, SERVICE_MESSAGES.ERROR.EMAIL_TOKEN_ERROR.message);
    return;
  }

  if (err.message?.startsWith('AUTH_039')) {
    res.status(503);
    sendServerError(res, SERVICE_MESSAGES.ERROR.EMAIL_SERVICE_ERROR.message);
    return;
  }
};
