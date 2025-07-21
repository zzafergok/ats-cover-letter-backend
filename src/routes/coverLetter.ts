// src/routes/coverLetter.ts
import { Router } from 'express';
import { CoverLetterController } from '../controllers/coverLetter.controller';
import { authenticateToken } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();
const coverLetterController = new CoverLetterController();

router.post(
  '/generate',
  authenticateToken,
  apiLimiter,
  coverLetterController.generateCoverLetter
);
router.get('/template/:category', coverLetterController.getTemplateByCategory);
router.post('/save', authenticateToken, coverLetterController.saveCoverLetter);
router.get(
  '/saved',
  authenticateToken,
  coverLetterController.getSavedCoverLetters
);
router.get(
  '/saved/:id',
  authenticateToken,
  coverLetterController.getCoverLetterById
);
router.delete(
  '/saved/:id',
  authenticateToken,
  coverLetterController.deleteCoverLetter
);
router.get(
  '/download/:id',
  authenticateToken,
  coverLetterController.downloadCoverLetter
);
router.post(
  '/analyze',
  authenticateToken,
  coverLetterController.analyzeCoverLetter
);

router.post(
  '/generate-minimal',
  authenticateToken,
  apiLimiter,
  coverLetterController.generateMinimalCoverLetter
);

export default router;
