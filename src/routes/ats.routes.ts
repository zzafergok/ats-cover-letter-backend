import { Router } from 'express';
import { ATSController } from '../controllers/ats.controller';
import { authenticateToken } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const atsController = new ATSController();

// Use existing rate limiter for ATS endpoints
const atsRateLimit = rateLimiter.api;

// TODO: Add proper validation when validation middleware is available

// Job Posting Analysis Routes
/**
 * @route   POST /api/ats/analyze-job-posting
 * @desc    Analyze a job posting for ATS optimization
 * @access  Private
 * @body    { jobPostingText?: string, jobPostingUrl?: string, companyName?: string, positionTitle?: string }
 */
router.post(
  '/analyze-job-posting',
  authenticateToken,
  atsRateLimit,
  async (req, res) => {
    await atsController.analyzeJobPosting(req, res);
  }
);

/**
 * @route   GET /api/ats/job-analysis/:analysisId
 * @desc    Get job analysis by ID
 * @access  Private
 */
router.get('/job-analysis/:analysisId', authenticateToken, async (req, res) => {
  await atsController.getJobAnalysis(req, res);
});

// CV-Job Matching Routes
/**
 * @route   POST /api/ats/analyze-match/:jobAnalysisId
 * @desc    Analyze how well a CV matches a job posting
 * @access  Private
 * @body    { useUserProfile?: boolean, cvData?: object }
 */
router.post(
  '/analyze-match/:jobAnalysisId',
  authenticateToken,
  atsRateLimit,
  async (req, res) => {
    await atsController.analyzeMatch(req, res);
  }
);

/**
 * @route   GET /api/ats/match-analysis/:matchId
 * @desc    Get match analysis by ID
 * @access  Private
 */
router.get('/match-analysis/:matchId', authenticateToken, async (req, res) => {
  await atsController.getMatchAnalysis(req, res);
});

// ATS Optimization Routes
/**
 * @route   POST /api/ats/optimize/:matchAnalysisId
 * @desc    Optimize CV based on match analysis
 * @access  Private
 * @body    { optimizationLevel: string, targetSections?: array, preserveOriginal?: boolean }
 */
router.post(
  '/optimize/:matchAnalysisId',
  authenticateToken,
  atsRateLimit,
  async (req, res) => {
    await atsController.optimizeCV(req, res);
  }
);

/**
 * @route   GET /api/ats/optimization/:optimizationId
 * @desc    Get optimization result by ID
 * @access  Private
 */
router.get(
  '/optimization/:optimizationId',
  authenticateToken,
  async (req, res) => {
    await atsController.getOptimization(req, res);
  }
);

/**
 * @route   POST /api/ats/apply-optimization/:optimizationId
 * @desc    Apply optimization results to user profile
 * @access  Private
 */
router.post(
  '/apply-optimization/:optimizationId',
  authenticateToken,
  async (req, res) => {
    await atsController.applyOptimization(req, res);
  }
);

// Complete Analysis Pipeline
/**
 * @route   POST /api/ats/complete-analysis
 * @desc    Run the complete ATS analysis pipeline (analyze job -> match CV -> optimize)
 * @access  Private
 * @body    { jobPostingAnalysis: object, optimizationLevel?: string, targetSections?: array }
 */
router.post(
  '/complete-analysis',
  authenticateToken,
  atsRateLimit,
  async (req, res) => {
    await atsController.completeAnalysis(req, res);
  }
);

// User Analysis History
/**
 * @route   GET /api/ats/my-analyses
 * @desc    Get user's ATS analysis history with pagination
 * @access  Private
 * @query   { page?: number, limit?: number, type?: string }
 */
router.get('/my-analyses', authenticateToken, async (req, res) => {
  await atsController.getUserAnalyses(req, res);
});

// Batch Operations (Future Enhancement)
/**
 * @route   POST /api/ats/batch-optimize
 * @desc    Optimize CV for multiple job postings
 * @access  Private
 * @body    { jobPostings: array, optimizationLevel: string }
 */
router.post(
  '/batch-optimize',
  authenticateToken,
  atsRateLimit,
  async (req, res) => {
    await atsController.batchOptimize(req, res);
  }
);

// Health Check for ATS Service
/**
 * @route   GET /api/ats/health
 * @desc    Health check for ATS service
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ATS service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
