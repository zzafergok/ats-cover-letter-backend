import express from 'express';
import { TemplateController } from '../controllers/template.controller';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  getTemplatesSchema,
  createCoverLetterFromTemplateSchema,
} from '../schemas';

const router = express.Router();
const templateController = new TemplateController();

/**
 * @route GET /api/templates
 * @description Get all templates with optional filters
 * @access Private
 */
router.get(
  '/',
  authenticateToken,
  validate(getTemplatesSchema, 'query'),
  templateController.getTemplates.bind(templateController)
);

/**
 * @route GET /api/templates/categories
 * @description Get template categories
 * @access Private
 */
router.get(
  '/categories',
  authenticateToken,
  templateController.getTemplateCategories.bind(templateController)
);

/**
 * @route GET /api/templates/industry/:industry
 * @description Get templates by industry
 * @access Private
 */
router.get(
  '/industry/:industry',
  authenticateToken,
  templateController.getTemplatesByIndustry.bind(templateController)
);

/**
 * @route GET /api/templates/:templateId
 * @description Get template by ID
 * @access Private
 */
router.get(
  '/:templateId',
  authenticateToken,
  templateController.getTemplateById.bind(templateController)
);

/**
 * @route POST /api/templates/create-cover-letter
 * @description Create cover letter from template
 * @access Private
 */
router.post(
  '/create-cover-letter',
  authenticateToken,
  validate(createCoverLetterFromTemplateSchema),
  templateController.createCoverLetterFromTemplate.bind(templateController)
);

/**
 * @route POST /api/templates/initialize
 * @description Initialize templates (Admin only)
 * @access Private (Admin)
 */
router.post(
  '/initialize',
  authenticateToken,
  templateController.initializeTemplates.bind(templateController)
);

/**
 * @route POST /api/templates/download/custom-pdf
 * @description Download custom PDF from template content
 * @access Private
 */
router.post(
  '/download/custom-pdf',
  authenticateToken,
  templateController.downloadCustomPdf.bind(templateController)
);

export default router;