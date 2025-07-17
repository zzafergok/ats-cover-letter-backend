import { Router } from 'express';
import authRoutes from './auth';
import contactRoutes from './contact';
import cvRoutes from './cv';
import coverLetterRoutes from './coverLetter';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cv', cvRoutes);
router.use('/cover-letter', coverLetterRoutes);
router.use('/contact', contactRoutes);

export default router;
