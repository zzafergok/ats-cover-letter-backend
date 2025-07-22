import { Router } from 'express';

import { cvUpload } from '../middleware/upload';
import { authenticateToken } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';

import { CvController } from '../controllers/cv.controller';

const router = Router();
const cvController = new CvController();

router.post(
  '/upload',
  authenticateToken,
  uploadLimiter,
  cvUpload.single('cvFile'),
  cvController.uploadCv
);
router.get('/uploads', authenticateToken, cvController.getCvUploads);
router.get(
  '/upload/status/:id',
  authenticateToken,
  cvController.getCvUploadStatus
);
router.delete('/uploads/:id', authenticateToken, cvController.deleteCvUpload);
router.post('/generate', authenticateToken, cvController.generateCv);
router.post('/save', authenticateToken, cvController.saveCv);
router.get('/saved', authenticateToken, cvController.getSavedCvs);
router.delete('/saved/:id', authenticateToken, cvController.deleteSavedCv);
router.get('/download/:id', authenticateToken, cvController.downloadCv);

// Detailed CV generation endpoints (profile-based)
router.post('/generate-detailed', authenticateToken, cvController.generateDetailedCv);
router.get('/detailed', authenticateToken, cvController.getUserDetailedCvs);
router.get('/detailed/:id', authenticateToken, cvController.getDetailedCv);
router.delete('/detailed/:id', authenticateToken, cvController.deleteDetailedCv);
router.get('/detailed/:id/download/pdf', authenticateToken, cvController.downloadDetailedCvPdf);

export default router;
