// src/middleware/auth.ts güncellenmiş hali
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from '../services/database.service';
import { SessionService } from '../services/session.service';
import logger from '../config/logger';

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
        message: "Erişim token'ı gereklidir",
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const sessionService = SessionService.getInstance();
    const sessionData = await sessionService.getSession(decoded.sessionId);

    if (!sessionData) {
      res.status(401).json({
        success: false,
        message: 'Oturum süresi dolmuş',
      });
      return;
    }

    await sessionService.extendSession(decoded.sessionId);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    next();
    return;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token attempt', { error: error.message });
      res.status(401).json({
        success: false,
        message: 'Geçersiz token',
      });
      return;
    }

    logger.error('Auth middleware hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
    return;
  }
};
