import { Router } from 'express';

import cvRoutes from './cv';
import authRoutes from './auth';
import contactRoutes from './contact';
import coverLetterBasicRoutes from './coverLetterBasic';
import coverLetterDetailedRoutes from './coverLetterDetailed';
import userProfileRoutes from './userProfile';
import highSchoolRoutes from './highSchool';
import universityRoutes from './university';
import locationRoutes from './location';
import pdfTestRoutes from './pdfTest';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cv', cvRoutes);
router.use('/cover-letter-basic', coverLetterBasicRoutes);
router.use('/cover-letter-detailed', coverLetterDetailedRoutes);
router.use('/user-profile', userProfileRoutes);
router.use('/contact', contactRoutes);
router.use('/high-schools', highSchoolRoutes);
router.use('/universities', universityRoutes);
router.use('/locations', locationRoutes);
router.use('/pdf-test', pdfTestRoutes);

export default router;
