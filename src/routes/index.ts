import { Router } from 'express';

import authRoutes from './auth';
import contactRoutes from './contact';
import coverLetterBasicRoutes from './coverLetterBasic';
import coverLetterDetailedRoutes from './coverLetterDetailed';
import userProfileRoutes from './userProfile';
import highSchoolRoutes from './highSchool';
import universityRoutes from './university';
import locationRoutes from './location';
import cvUploadRoutes from './cvUpload.routes';
import templateRoutes from './template.routes';
import cvGeneratorRoutes from './cvGenerator';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cv-upload', cvUploadRoutes);
router.use('/cv-generator', cvGeneratorRoutes);
router.use('/cover-letter-basic', coverLetterBasicRoutes);
router.use('/cover-letter-detailed', coverLetterDetailedRoutes);
router.use('/user-profile', userProfileRoutes);
router.use('/contact', contactRoutes);
router.use('/high-schools', highSchoolRoutes);
router.use('/universities', universityRoutes);
router.use('/locations', locationRoutes);
router.use('/templates', templateRoutes);

export default router;
