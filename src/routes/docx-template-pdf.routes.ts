import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { DocxTemplatePdfController, templateUpload } from '../controllers/docx-template-pdf.controller';

const router = Router();
const controller = new DocxTemplatePdfController();

/**
 * @route   GET /api/docx-template-pdf/templates
 * @desc    Get available DOCX templates
 * @access  Private
 */
router.get('/templates', 
  authMiddleware,
  controller.getTemplates.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/professional
 * @desc    Generate PDF using Professional template
 * @access  Private
 */
router.post('/professional',
  authMiddleware,
  rateLimiter.atsGeneration,
  controller.generateProfessionalPdf.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/modern
 * @desc    Generate PDF using Modern template
 * @access  Private
 */
router.post('/modern',
  authMiddleware,
  rateLimiter.atsGeneration,
  controller.generateModernPdf.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/academic
 * @desc    Generate PDF using Academic template
 * @access  Private
 */
router.post('/academic',
  authMiddleware,
  rateLimiter.atsGeneration,
  controller.generateAcademicPdf.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/executive
 * @desc    Generate PDF using Executive template
 * @access  Private
 */
router.post('/executive',
  authMiddleware,
  rateLimiter.atsGeneration,
  controller.generateExecutivePdf.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/classic
 * @desc    Generate PDF using Classic template
 * @access  Private
 */
router.post('/classic',
  authMiddleware,
  rateLimiter.atsGeneration,
  controller.generateClassicPdf.bind(controller)
);

// Microsoft ATS-Optimized Template Routes
/**
 * @route   POST /api/docx-template-pdf/office-manager
 * @desc    Generate PDF using Office Manager template
 * @access  Private
 */
router.post('/office-manager',
  authMiddleware,
  rateLimiter.atsGeneration,
  controller.generateOfficeManagerPdf.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/office-manager-alt
 * @desc    Generate PDF using Office Manager Alternative template
 * @access  Private
 */
router.post('/office-manager-alt',
  authMiddleware,
  rateLimiter.atsGeneration,
  controller.generateOfficeManagerAltPdf.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/turkish-general
 * @desc    Generate PDF using Turkish General template
 * @access  Private
 */
router.post('/turkish-general',
  authMiddleware,
  rateLimiter.atsGeneration,
  controller.generateTurkishGeneralPdf.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/accountant
 * @desc    Generate PDF using Accountant template
 * @access  Private
 */
router.post('/accountant',
  authMiddleware,
  rateLimiter.atsGeneration,
  controller.generateAccountantPdf.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/hr-manager
 * @desc    Generate PDF using HR Manager template
 * @access  Private
 */
router.post('/hr-manager',
  authMiddleware,
  rateLimiter.atsGeneration,
  controller.generateHRManagerPdf.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/generate/:templateId
 * @desc    Generate PDF using specified template ID
 * @access  Private
 */
router.post('/generate/:templateId',
  authMiddleware,
  rateLimiter.atsGeneration,
  (req, res) => controller.generatePdfByTemplate(req, res)
);

/**
 * @route   POST /api/docx-template-pdf/generate-multiple
 * @desc    Generate PDFs using multiple templates
 * @access  Private
 */
router.post('/generate-multiple',
  authMiddleware,
  rateLimiter.atsGeneration, // bulkGeneration yerine atsGeneration kullan
  controller.generateMultipleTemplatesPdf.bind(controller)
);

/**
 * @route   GET /api/docx-template-pdf/preview/:templateId
 * @desc    Preview template with sample data
 * @access  Private
 */
router.get('/preview/:templateId',
  authMiddleware,
  controller.previewTemplate.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/admin/upload-analyze/:templateId
 * @desc    Admin: Upload and analyze DOCX template file
 * @access  Private (Admin only)
 */
router.post('/admin/upload-analyze/:templateId',
  authMiddleware,
  // adminMiddleware, // Admin kontrolü eklenebilir
  templateUpload,
  controller.uploadAndAnalyzeTemplate.bind(controller)
);

/**
 * @route   POST /api/docx-template-pdf/upload/:templateId
 * @desc    Upload DOCX template file (simple)
 * @access  Private (Admin only)
 */
router.post('/upload/:templateId',
  authMiddleware,
  // adminMiddleware, // Admin kontrolü eklenebilir
  templateUpload,
  controller.uploadTemplate.bind(controller)
);

export default router;