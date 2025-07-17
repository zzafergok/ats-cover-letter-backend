import { Router } from 'express';

import cvRoutes from './cv';
import { authRoutes } from './auth';
import { contactRoutes } from './contact';
import coverLetterRoutes from './coverLetter';

import { DatabaseService } from '../services/database.service';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cv', cvRoutes);
router.use('/cover-letter', coverLetterRoutes);
router.use('/contact', contactRoutes);

// Enhanced health check endpoint
router.get('/health', async (req, res) => {
  try {
    const dbHealth = await DatabaseService.getInstance().healthCheck();

    res.json({
      success: true,
      message: 'Kanban API is running',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      database: dbHealth.connected ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('ROUTE_001: Health check hatası:', error);
    res.status(503).json({
      success: false,
      error: 'ROUTE_001: Sistem sağlık kontrolü başarısız',
      timestamp: new Date().toISOString(),
      database: 'error',
    });
  }
});

export { router as apiRoutes };
