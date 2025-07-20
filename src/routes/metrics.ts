// src/routes/metrics.ts
import { Router } from 'express';
import { register } from '../monitoring/metrics';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/metrics', authenticateToken, requireAdmin, async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;
