import { Router } from 'express';

import authRoutes from './auth';
import contactRoutes from './contact';
import coverLetterBasicRoutes from './coverLetterBasic';
import coverLetterDetailedRoutes from './coverLetterDetailed';
import userProfileRoutes from './userProfile';
import highSchoolRoutes from './highSchool';
import universityRoutes from './university';
import locationRoutes from './location';
import pdfTestRoutes from './pdfTest';
import templateRoutes from './template.routes';
import atsCvRoutes from './ats-cv.routes';
import atsValidationRoutes from './ats-validation.routes';
import cvOptimizationRoutes from './cv-optimization.routes';
import docxExportRoutes from './docx-export.routes';
import cvUploadRoutes from './cvUpload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/ats-cv', atsCvRoutes);
router.use('/ats-validation', atsValidationRoutes);
router.use('/cv-optimization', cvOptimizationRoutes);
router.use('/docx', docxExportRoutes);
router.use('/cv-upload', cvUploadRoutes);
router.use('/cover-letter-basic', coverLetterBasicRoutes);
router.use('/cover-letter-detailed', coverLetterDetailedRoutes);
router.use('/user-profile', userProfileRoutes);
router.use('/contact', contactRoutes);
router.use('/high-schools', highSchoolRoutes);
router.use('/universities', universityRoutes);
router.use('/locations', locationRoutes);
router.use('/pdf-test', pdfTestRoutes);
router.use('/templates', templateRoutes);

export default router;
