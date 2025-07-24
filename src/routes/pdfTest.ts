import { Router } from 'express';
import { PdfTestController } from '../controllers/pdfTest.controller';

const router = Router();
const pdfTestController = new PdfTestController();

// Turkish character test endpoint
router.get('/turkish-test', pdfTestController.testTurkishCharacters);

export default router;