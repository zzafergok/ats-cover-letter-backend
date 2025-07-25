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

export default router;