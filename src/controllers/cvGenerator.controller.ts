import { Request, Response } from 'express';
import { CVGeneratorService, CVTemplateType } from '../services/cvGenerator.service';
import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';

export class CVGeneratorController {
  private cvGeneratorService: CVGeneratorService;

  constructor() {
    this.cvGeneratorService = CVGeneratorService.getInstance();
  }

  // Generate CV
  generateCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role || 'FREE';

      if (!userId) {
        res.status(401).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.GENERAL.UNAUTHORIZED),
        });
        return;
      }

      const { templateType, data } = req.body;

      // Validate input
      if (!templateType || !data) {
        res.status(400).json({
          success: false,
          message: 'Template type and data are required',
        });
        return;
      }

      // Validate template type
      const validTemplates = ['basic_hr', 'office_manager', 'simple_classic', 'stylish_accounting', 'minimalist_turkish'];
      if (!validTemplates.includes(templateType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid template type',
        });
        return;
      }

      // Validate template data
      if (!this.cvGeneratorService.validateTemplateData(templateType as CVTemplateType, data)) {
        res.status(400).json({
          success: false,
          message: 'Invalid template data structure',
        });
        return;
      }

      logger.info(`CV generation started for user ${userId} with template ${templateType}`);

      const result = await this.cvGeneratorService.generateCV(userId, userRole, {
        templateType: templateType as CVTemplateType,
        data,
      });

      logger.info(`CV generated successfully for user ${userId}: ${result.id}`);

      res.status(201).json({
        success: true,
        message: 'CV generated successfully',
        data: {
          id: result.id,
          templateType: result.templateType,
          generationStatus: result.generationStatus,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
      });
    } catch (error) {
      const errorMessage = createErrorMessage(
        SERVICE_MESSAGES.CV.GENERATION_ERROR,
        error as Error
      );
      logger.error(errorMessage);

      if ((error as Error).message.includes('limite ulaştınız')) {
        res.status(429).json({
          success: false,
          message: (error as Error).message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.GENERATION_ERROR),
        });
      }
    }
  };

  // Get CV
  getCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { cvId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.GENERAL.UNAUTHORIZED),
        });
        return;
      }

      const cv = await this.cvGeneratorService.getCV(userId, cvId);

      if (!cv) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: cv.id,
          templateType: cv.templateType,
          generationStatus: cv.generationStatus,
          createdAt: cv.createdAt,
          updatedAt: cv.updatedAt,
        },
      });
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CV.LIST_ERROR, error as Error)
      );

      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.LIST_ERROR),
      });
    }
  };

  // Download CV PDF
  downloadCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { cvId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.GENERAL.UNAUTHORIZED),
        });
        return;
      }

      const cv = await this.cvGeneratorService.getCV(userId, cvId);

      if (!cv) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
        });
        return;
      }

      if (!cv.pdfBuffer) {
        res.status(404).json({
          success: false,
          message: 'PDF not found or generation failed',
        });
        return;
      }

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="cv_${cv.templateType}_${cvId}.pdf"`);
      res.setHeader('Content-Length', cv.pdfBuffer.length);

      // Send PDF buffer
      res.send(cv.pdfBuffer);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CV.DOWNLOAD_ERROR, error as Error)
      );

      res.status(500).json({
        success: false,
        message: 'CV download failed',
      });
    }
  };

  // Get user CVs
  getUserCVs = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role || 'FREE';

      if (!userId) {
        res.status(401).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.GENERAL.UNAUTHORIZED),
        });
        return;
      }

      const result = await this.cvGeneratorService.getUserCVs(userId, userRole);

      res.status(200).json({
        success: true,
        data: result.cvs,
        limitInfo: result.limitInfo,
      });
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.CV.LIST_ERROR, error as Error)
      );

      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.LIST_ERROR),
      });
    }
  };

  // Delete CV
  deleteCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { cvId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.GENERAL.UNAUTHORIZED),
        });
        return;
      }

      await this.cvGeneratorService.deleteCV(userId, cvId);

      res.status(200).json({
        success: true,
        message: 'CV deleted successfully',
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
        });
      } else {
        logger.error(
          createErrorMessage(SERVICE_MESSAGES.CV.DELETE_ERROR, error as Error)
        );

        res.status(500).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.DELETE_ERROR),
        });
      }
    }
  };

  // Regenerate CV
  regenerateCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { cvId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.GENERAL.UNAUTHORIZED),
        });
        return;
      }

      logger.info(`CV regeneration started for user ${userId}, CV ${cvId}`);

      const result = await this.cvGeneratorService.regenerateCV(userId, cvId);

      logger.info(`CV regenerated successfully for user ${userId}: ${result.id}`);

      res.status(200).json({
        success: true,
        message: 'CV regenerated successfully',
        data: {
          id: result.id,
          templateType: result.templateType,
          generationStatus: result.generationStatus,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        },
      });
    } catch (error) {
      if ((error as Error).message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
        });
      } else {
        logger.error(
          createErrorMessage(SERVICE_MESSAGES.CV.GENERATION_ERROR, error as Error)
        );

        res.status(500).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.GENERATION_ERROR),
        });
      }
    }
  };

  // Get available templates
  getAvailableTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = this.cvGeneratorService.getAvailableTemplates();

      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error) {
      logger.error('Failed to fetch available templates:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch available templates',
      });
    }
  };
}