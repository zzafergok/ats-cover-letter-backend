import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { requireAdmin, authenticateToken } from '../middleware/auth';
import { validate, contactMessageSchema } from '../middleware/validation';

const router = Router();
const contactController = new ContactController();

router.post(
  '/send',
  validate(contactMessageSchema),
  contactController.sendMessage
);
router.get(
  '/messages',
  authenticateToken,
  requireAdmin,
  contactController.getMessages
);
router.get('/limit', contactController.checkLimit);

export default router;
