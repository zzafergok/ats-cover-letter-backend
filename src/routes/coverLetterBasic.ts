import { Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { CoverLetterBasicController } from '../controllers/coverLetterBasic.controller';

const router = Router();
const coverLetterBasicController = new CoverLetterBasicController();

router.post(
  '/',
  authenticateToken,
  coverLetterBasicController.createCoverLetter
);

router.get(
  '/:id',
  authenticateToken,
  coverLetterBasicController.getCoverLetter
);

router.put(
  '/:id',
  authenticateToken,
  coverLetterBasicController.updateCoverLetter
);

router.get(
  '/',
  authenticateToken,
  coverLetterBasicController.getUserCoverLetters
);

router.delete(
  '/:id',
  authenticateToken,
  coverLetterBasicController.deleteCoverLetter
);

router.get(
  '/:id/download/pdf',
  authenticateToken,
  coverLetterBasicController.downloadPdf
);

export default router;
