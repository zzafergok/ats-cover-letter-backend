import { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

import { sendError } from '../utils/response';

import {
  formatMessage,
  SERVICE_MESSAGES,
  createDynamicMessage,
} from '../constants/messages';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues.map((err) => err.message).join(', ');
        sendError(
          res,
          createDynamicMessage(
            SERVICE_MESSAGES.VALIDATION.INPUT_VALIDATION_ERROR,
            { details: errorMessage }
          ),
          400
        );
      } else {
        sendError(
          res,
          formatMessage(
            SERVICE_MESSAGES.VALIDATION.UNEXPECTED_VALIDATION_ERROR
          ),
          400
        );
      }
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues.map((err) => err.message).join(', ');
        sendError(
          res,
          createDynamicMessage(
            SERVICE_MESSAGES.VALIDATION.PARAMS_VALIDATION_ERROR,
            { details: errorMessage }
          ),
          400
        );
      } else {
        sendError(
          res,
          formatMessage(
            SERVICE_MESSAGES.VALIDATION.UNEXPECTED_PARAMS_VALIDATION_ERROR
          ),
          400
        );
      }
    }
  };
};

export {
  loginSchema,
  registerSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  contactMessageSchema,
  saveCoverLetterSchema,
  updateUserProfileSchema,
  analyzeCoverLetterSchema,
  generateCoverLetterSchema,
  resendEmailVerificationSchema,
  generateMinimalCoverLetterSchema,
} from '../schemas';
