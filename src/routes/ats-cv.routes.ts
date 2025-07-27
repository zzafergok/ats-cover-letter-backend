import { Router } from 'express';
import { ATSCVController } from '../controllers/ats-cv.controller';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const atsController = new ATSCVController();

// ATS CV Generation Routes

/**
 * @route   POST /api/ats-cv/generate
 * @desc    Generate ATS Compliant CV from structured data
 * @access  Private
 * @body    ATSCVData - Structured CV data
 */
router.post('/generate', 
  authMiddleware, 
  rateLimiter.atsGeneration,
  atsController.generateATSCV
);

/**
 * @route   GET /api/ats-cv/test
 * @desc    Generate test ATS CV with sample data
 * @access  Private (for development/testing)
 */
router.get('/test', 
  authMiddleware,
  atsController.generateTestCV
);

/**
 * @route   GET /api/ats-cv/schema
 * @desc    Get ATS CV data structure schema for frontend
 * @access  Public
 */
router.get('/schema', atsController.getATSSchema);

/**
 * @route   GET /api/ats-cv/validation-tips
 * @desc    Get ATS validation tips and best practices
 * @access  Public
 */
router.get('/validation-tips', atsController.getATSValidationTips);

// CRUD Routes

/**
 * @route   GET /api/ats-cv
 * @desc    Get user's ATS CVs
 * @access  Private
 */
router.get('/', 
  authMiddleware,
  atsController.getUserATSCVs
);

/**
 * @route   GET /api/ats-cv/stats
 * @desc    Get user's ATS CV statistics
 * @access  Private
 */
router.get('/stats', 
  authMiddleware,
  atsController.getATSCVStats
);

/**
 * @route   GET /api/ats-cv/:id
 * @desc    Get specific ATS CV by ID
 * @access  Private
 */
router.get('/:id', 
  authMiddleware,
  atsController.getATSCV
);

/**
 * @route   GET /api/ats-cv/:id/download
 * @desc    Download specific ATS CV as PDF
 * @access  Private
 */
router.get('/:id/download', 
  authMiddleware,
  atsController.downloadATSCV
);

/**
 * @route   DELETE /api/ats-cv/:id
 * @desc    Delete specific ATS CV by ID
 * @access  Private
 */
router.delete('/:id', 
  authMiddleware,
  atsController.deleteATSCV
);

export default router;