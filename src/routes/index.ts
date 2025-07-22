import { Router } from 'express';

import cvRoutes from './cv';
import authRoutes from './auth';
import contactRoutes from './contact';
import coverLetterBasicRoutes from './coverLetterBasic';

const router = Router();

router.use('/auth', authRoutes);
router.use('/cv', cvRoutes);
router.use('/cover-letter-basic', coverLetterBasicRoutes);
router.use('/contact', contactRoutes);

export default router;
