import { Router } from 'express';

import cvRoutes from './cv';
import authRoutes from './auth';
import contactRoutes from './contact';
import coverLetterRoutes from './coverLetter';
import coverLetterTemplateRoutes from './coverLetterTemplate';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cv', cvRoutes);
router.use('/cover-letter', coverLetterRoutes);
router.use('/cover-letter-templates', coverLetterTemplateRoutes);
router.use('/contact', contactRoutes);

export default router;
