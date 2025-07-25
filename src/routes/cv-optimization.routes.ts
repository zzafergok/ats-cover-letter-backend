import { Router } from 'express';
import { CVOptimizationController } from '../controllers/cv-optimization.controller';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const optimizationController = new CVOptimizationController();

/**
 * @route   POST /api/cv-optimization/optimize
 * @desc    Optimize CV based on job description
 * @access  Private
 * @body    { cvData: ATSCVData, jobDescription: string }
 */
router.post('/optimize', 
  authMiddleware, 
  rateLimiter.atsGeneration, // Same rate limit as CV generation
  optimizationController.optimizeCV
);

/**
 * @route   POST /api/cv-optimization/keyword-suggestions
 * @desc    Get keyword suggestions from job description
 * @access  Private
 * @body    { jobDescription: string, targetPosition: string }
 */
router.post('/keyword-suggestions',
  authMiddleware,
  rateLimiter.api,
  optimizationController.getKeywordSuggestions
);

/**
 * @route   GET /api/cv-optimization/section-tips/:section
 * @desc    Get optimization tips for specific CV section
 * @access  Public
 * @params  section - CV section name (professionalSummary, workExperience, etc.)
 */
router.get('/section-tips/:section', optimizationController.getSectionOptimizationTips);

/**
 * @route   POST /api/cv-optimization/analyze-keywords
 * @desc    Quick keyword analysis for content vs job description
 * @access  Private
 * @body    { content: string, jobDescription: string }
 */
router.post('/analyze-keywords',
  authMiddleware,
  rateLimiter.api,
  optimizationController.analyzeKeywords
);

export default router;