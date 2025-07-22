import { Router } from 'express';

import { authenticateToken } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { cvUpload } from '../middleware/upload';
import { CvController } from '../controllers/cv.controller';

const router = Router();
const cvController = new CvController();

router.post('/upload', authenticateToken, uploadLimiter, cvUpload.single('cvFile'), cvController.uploadCv);
router.get('/uploads', authenticateToken, cvController.getCvUploads);
router.get('/upload/status/:id', authenticateToken, cvController.getCvUploadStatus);
router.delete('/uploads/:id', authenticateToken, cvController.deleteCvUpload);
router.post('/generate', authenticateToken, cvController.generateCv);
router.post('/save', authenticateToken, cvController.saveCv);
router.get('/saved', authenticateToken, cvController.getSavedCvs);
router.delete('/saved/:id', authenticateToken, cvController.deleteSavedCv);
router.get('/download/:id', authenticateToken, cvController.downloadCv);

export default router;