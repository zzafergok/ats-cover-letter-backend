import { Router } from 'express';
import { ATSValidationController } from '../controllers/ats-validation.controller';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const validationController = new ATSValidationController();

/**
 * @route   POST /api/ats-validation/validate
 * @desc    Validate CV for ATS compliance
 * @access  Private
 * @body    { cvData: ATSCVData, jobDescription?: string }
 */
router.post('/validate', 
  authMiddleware, 
  rateLimiter.api,
  validationController.validateCV
);

/**
 * @route   GET /api/ats-validation/analysis/:score
 * @desc    Get detailed analysis for a given ATS score
 * @access  Private
 * @params  score - ATS score (0-100)
 */
router.get('/analysis/:score',
  authMiddleware,
  validationController.getValidationAnalysis
);

/**
 * @route   GET /api/ats-validation/best-practices
 * @desc    Get ATS best practices guide
 * @access  Public
 */
router.get('/best-practices', validationController.getBestPractices);

/**
 * @route   GET /api/ats-validation/common-issues
 * @desc    Get common ATS issues and solutions
 * @access  Public
 */
router.get('/common-issues', validationController.getCommonIssues);

export default router;