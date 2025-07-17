// src/app.ts
import dotenv from 'dotenv';
import express from 'express';
import { apiRoutes } from './routes';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { DatabaseService } from './services/database.service';
import { SchedulerService } from './services/scheduler.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', true);

app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
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
      database: dbHealth.connected ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api', apiRoutes);

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

const gracefulShutdown = async () => {
  console.log('Shutting down server...');
  try {
    SchedulerService.stopAllCleanup();
    await DatabaseService.getInstance().disconnect();
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Shutdown error:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

const startServer = async () => {
  try {
    await DatabaseService.getInstance().connect();
    SchedulerService.startEmailTokenCleanup();

    app.listen(PORT, () => {
      console.log(`🚀 API running on port ${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
