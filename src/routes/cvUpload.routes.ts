import { Router } from 'express';

import { cvUpload } from '../middleware/upload';
import { authenticateToken } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';

import { CvUploadController } from '../controllers/cvUpload.controller';

const router = Router();
const cvUploadController = new CvUploadController();

/**
 * CV Upload Routes (for Cover Letter functionality)
 */

router.post(
  '/upload',
  authenticateToken,
  uploadLimiter,
  cvUpload.single('cvFile'),
  cvUploadController.uploadCv
);

router.get('/uploads', authenticateToken, cvUploadController.getCvUploads);

router.get(
  '/upload/status/:id',
  authenticateToken,
  cvUploadController.getCvUploadStatus
);

router.delete('/uploads/:id', authenticateToken, cvUploadController.deleteCvUpload);

export default router;