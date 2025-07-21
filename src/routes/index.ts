import { Router } from 'express';

import cvRoutes from './cv';
import authRoutes from './auth';
import contactRoutes from './contact';
import coverLetterRoutes from './coverLetter';
import stagedCoverLetterRoutes from './stagedCoverLetter';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cv', cvRoutes);
router.use('/cover-letter', coverLetterRoutes);
router.use('/staged-cover-letter', stagedCoverLetterRoutes);
router.use('/contact', contactRoutes);

export default router;
