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
 * @access Public
 */
router.get(
  '/',
  validate(getTemplatesSchema, 'query'),
  templateController.getTemplates.bind(templateController)
);

/**
 * @route GET /api/templates/categories
 * @description Get template categories
 * @access Public
 */
router.get(
  '/categories',
  templateController.getTemplateCategories.bind(templateController)
);

/**
 * @route GET /api/templates/industry/:industry
 * @description Get templates by industry
 * @access Public
 */
router.get(
  '/industry/:industry',
  templateController.getTemplatesByIndustry.bind(templateController)
);

/**
 * @route GET /api/templates/:templateId
 * @description Get template by ID
 * @access Public
 */
router.get(
  '/:templateId',
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

export default router;