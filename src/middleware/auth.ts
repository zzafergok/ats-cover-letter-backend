import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

import { db } from '../services/database.service';
import { SessionService } from '../services/session.service';

import logger from '../config/logger';
import { SERVICE_MESSAGES, formatMessage, createErrorMessage } from '../constants/messages';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.GENERAL.UNAUTHORIZED),
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const sessionService = SessionService.getInstance();
    const sessionData = await sessionService.getSession(decoded.sessionId);

    if (!sessionData) {
      res.status(401).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.GENERAL.UNAUTHORIZED),
      });
      return;
    }

    // Fetch complete user data from database to ensure all required fields are present
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.GENERAL.NOT_FOUND),
      });
      return;
    }

    await sessionService.extendSession(decoded.sessionId);

    req.user = {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      emailVerified: user.isEmailVerified,
      deviceLimit: 5, // Default device limit
      isMultiDevice: true, // Default multi-device support
      sessionId: decoded.sessionId,
    };

    next();
    return;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token attempt', { error: error.message });
      res.status(401).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.AUTH.TOKEN_VERIFICATION_FAILED),
      });
      return;
    }

    logger.error(createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error));
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
    return;
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: formatMessage(SERVICE_MESSAGES.GENERAL.UNAUTHORIZED),
    });
    return;
  }
  next();
};
