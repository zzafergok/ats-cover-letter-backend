import { Router } from 'express';
import { DOCXExportController } from '../controllers/docx-export.controller';
import { authMiddleware } from '../middleware/auth';
import { generalLimiter } from '../middleware/rateLimiter';

const router = Router();
const docxExportController = new DOCXExportController();

/**
 * DOCX Export Routes
 * All routes require authentication
 */

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route POST /api/docx/generate
 * @desc Generate ATS-compliant DOCX CV
 * @access Private
 * @rateLimit 10 requests per 15 minutes
 */
router.post(
  '/generate',
  generalLimiter,
  docxExportController.generateDOCXCV.bind(docxExportController)
);

/**
 * @route POST /api/docx/preview
 * @desc Preview DOCX generation metadata (no actual file generation)
 * @access Private
 * @rateLimit 30 requests per 15 minutes
 */
router.post(
  '/preview',
  generalLimiter,
  docxExportController.previewDOCXGeneration.bind(docxExportController)
);

/**
 * @route POST /api/docx/validate-options
 * @desc Validate DOCX generation options
 * @access Private
 * @rateLimit 50 requests per 15 minutes
 */
router.post(
  '/validate-options',
  generalLimiter,
  docxExportController.validateDOCXOptions.bind(docxExportController)
);

/**
 * @route GET /api/docx/best-practices
 * @desc Get DOCX format best practices for ATS compliance
 * @access Private
 * @rateLimit 100 requests per 15 minutes
 */
router.get(
  '/best-practices',
  generalLimiter,
  docxExportController.getDOCXBestPractices.bind(docxExportController)
);

/**
 * @route GET /api/docx/vs-pdf
 * @desc Get DOCX vs PDF format comparison
 * @access Private
 * @rateLimit 100 requests per 15 minutes
 */
router.get(
  '/vs-pdf',
  generalLimiter,
  docxExportController.getDOCXvsPDFComparison.bind(docxExportController)
);

export default router;
