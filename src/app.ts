// src/app.ts
import dotenv from 'dotenv';
import express from 'express';
import apiRoutes from './routes';
import logger from './config/logger';

import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { helmetConfig, securityHeaders } from './middleware/security';
import { generalLimiter, apiLimiter } from './middleware/rateLimiter';

import { DatabaseService } from './services/database.service';

dotenv.config();

const app = express();

// Trust proxy ayarını ortama göre yapılandır
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', false);
}

app.use(helmetConfig);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(generalLimiter);

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

app.get('/health', async (req, res) => {
  try {
    const dbHealth = await DatabaseService.getInstance().healthCheck();

    res.json({
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      services: {
        database: dbHealth.connected ? 'connected' : 'disconnected',
      },
      platform: 'Vercel',
      region: process.env.VERCEL_REGION || 'unknown',
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/v1', apiLimiter, apiRoutes);
app.use('/api', apiLimiter, apiRoutes);
app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

export default app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;

  DatabaseService.getInstance()
    .connect()
    .then(() => {
      app.listen(PORT, () => {
        logger.info(`🚀 API running on port ${PORT}`);
        logger.info(`📊 Health: http://localhost:${PORT}/health`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
      });
    })
    .catch((error) => {
      logger.error('Server startup failed:', error);
      process.exit(1);
    });
}
