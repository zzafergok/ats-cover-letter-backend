import { Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { CoverLetterDetailedController } from '../controllers/coverLetterDetailed.controller';

const router = Router();
const coverLetterDetailedController = new CoverLetterDetailedController();

router.post(
  '/',
  authenticateToken,
  coverLetterDetailedController.createDetailedCoverLetter
);

router.get(
  '/:id',
  authenticateToken,
  coverLetterDetailedController.getDetailedCoverLetter
);

router.put(
  '/:id',
  authenticateToken,
  coverLetterDetailedController.updateDetailedCoverLetter
);

router.get(
  '/',
  authenticateToken,
  coverLetterDetailedController.getUserDetailedCoverLetters
);

router.delete(
  '/:id',
  authenticateToken,
  coverLetterDetailedController.deleteDetailedCoverLetter
);

router.get(
  '/:id/download/pdf',
  authenticateToken,
  coverLetterDetailedController.downloadDetailedCoverLetterPdf
);

export default router;