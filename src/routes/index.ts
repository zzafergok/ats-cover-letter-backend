// src/routes/index.ts
import { Router } from 'express';
import { authRoutes } from './auth';
import { contactRoutes } from './contact';
import cvRoutes from './cv';
import coverLetterRoutes from './coverLetter';
import { DatabaseService } from '../services/database.service';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cv', cvRoutes);
router.use('/cover-letter', coverLetterRoutes);
router.use('/contact', contactRoutes);

router.get('/health', async (req, res) => {
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
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      database: 'error',
    });
  }
});

export { router as apiRoutes };
