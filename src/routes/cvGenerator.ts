import { Router } from 'express';
import { CVGeneratorController } from '../controllers/cvGenerator.controller';
import { authenticateToken } from '../middleware/auth';
import { atsGenerationLimiter } from '../middleware/rateLimiter';

const router = Router();
const cvGeneratorController = new CVGeneratorController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get available templates (no rate limiting needed)
router.get('/templates', cvGeneratorController.getAvailableTemplates);

// Generate CV (with rate limiting)
router.post('/generate', atsGenerationLimiter, cvGeneratorController.generateCV);

// Get user's CVs
router.get('/', cvGeneratorController.getUserCVs);

// Get specific CV
router.get('/:cvId', cvGeneratorController.getCV);

// Download CV PDF
router.get('/:cvId/download', cvGeneratorController.downloadCV);

// Regenerate CV (with rate limiting)
router.post(
  '/:cvId/regenerate',
  atsGenerationLimiter,
  cvGeneratorController.regenerateCV
);

// Delete CV
router.delete('/:cvId', cvGeneratorController.deleteCV);

export default router;
