// src/config/logger.ts - Vercel için güncellenmiş
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ats-cv-api' },
  transports: [
    // Vercel'de file transport kullanamayız, sadece console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: process.env.NODE_ENV !== 'production' }),
        winston.format.simple()
      ),
    }),
  ],
});

export default logger;
