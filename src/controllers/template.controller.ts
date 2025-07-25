import { Request, Response } from 'express';
import { TemplateService } from '../services/template.service';
import { PdfService } from '../services/pdf.service';
import { UserProfileService } from '../services/userProfile.service';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';
import { TemplateIndustry } from '@prisma/client';
import {
  SERVICE_MESSAGES,
  createErrorMessage,
} from '../constants/messages';

export class TemplateController {
  private templateService: TemplateService;
  private pdfService: PdfService;
  private userProfileService: UserProfileService;

  constructor() {
    this.templateService = TemplateService.getInstance();
    this.pdfService = PdfService.getInstance();
    this.userProfileService = UserProfileService.getInstance();
  }

  /**
   * Get all templates with optional filters
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { industry, category, language } = req.query;

      const filters = {
        ...(industry && { industry: industry as 'TECHNOLOGY' | 'FINANCE' }),
        ...(category && { category: category as string }),
        ...(language && { language: language as 'TURKISH' | 'ENGLISH' }),
      };

      const templates = await this.templateService.getTemplates(filters);

      logger.info('Templates retrieved successfully', {
        count: templates.length,
        filters,
      });

      sendSuccess(res, templates, 'Templates retrieved successfully');
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error)
      );
      sendError(res, 'Template listesi alınamadı', 500);
    }
  }

  /**
   * Get templates by industry
   */
  async getTemplatesByIndustry(req: Request, res: Response): Promise<void> {
    try {
      const { industry } = req.params;

      if (
        ![
          'TECHNOLOGY',
          'FINANCE',
          'HEALTHCARE',
          'EDUCATION',
          'MARKETING',
        ].includes(industry)
      ) {
        return sendError(res, 'Geçersiz endüstri türü', 400);
      }

      const templates = await this.templateService.getTemplatesByIndustry(
        industry as TemplateIndustry
      );

      logger.info('Templates retrieved by industry', {
        industry,
        count: templates.length,
      });

      sendSuccess(
        res,
        templates,
        `${industry} templates retrieved successfully`
      );
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error)
      );
      sendError(res, 'Template listesi alınamadı', 500);
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      const template = await this.templateService.getTemplateById(templateId);

      if (!template) {
        return sendError(res, 'Template bulunamadı', 404);
      }

      logger.info('Template retrieved by ID', {
        templateId,
        category: template.category,
        industry: template.industry,
      });

      sendSuccess(res, template, 'Template retrieved successfully');
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error)
      );
      sendError(res, 'Template bulunamadı', 500);
    }
  }

  /**
   * Create cover letter from template
   */
  async createCoverLetterFromTemplate(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { templateId, positionTitle, companyName, personalizations } =
        req.body;

      // Get user information from request
      if (!req.user) {
        return sendError(res, 'Kullanıcı bilgisi bulunamadı', 401);
      }

      const userInfo = {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      };

      const coverLetterContent =
        await this.templateService.createCoverLetterFromTemplate(
          {
            templateId,
            positionTitle,
            companyName,
            personalizations,
          },
          userInfo
        );

      logger.info('Cover letter created from template', {
        templateId,
        positionTitle,
        companyName,
        userId: req.user?.userId,
      });

      sendSuccess(
        res,
        {
          content: coverLetterContent,
          templateId,
          positionTitle,
          companyName,
        },
        'Cover letter created from template successfully'
      );
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error)
      );
      sendError(
        res,
        (error as Error).message || 'Cover letter oluşturulamadı',
        500
      );
    }
  }

  /**
   * Get template categories
   */
  async getTemplateCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = {
        TECHNOLOGY: [
          'SOFTWARE_DEVELOPER',
          'FRONTEND_DEVELOPER',
          'BACKEND_DEVELOPER',
          'FULLSTACK_DEVELOPER',
          'DATA_SCIENTIST',
        ],
        FINANCE: [
          'FINANCIAL_ANALYST',
          'INVESTMENT_BANKER',
          'FINANCIAL_ADVISOR',
          'ACCOUNTING_SPECIALIST',
          'RISK_ANALYST',
        ],
        HEALTHCARE: ['NURSE', 'DOCTOR', 'PHARMACIST'],
        EDUCATION: ['TEACHER', 'ACADEMIC_ADMINISTRATOR'],
        MARKETING: ['MARKETING_SPECIALIST'],
      };

      logger.info('Template categories retrieved');

      sendSuccess(
        res,
        categories,
        'Template categories retrieved successfully'
      );
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error)
      );
      sendError(res, 'Kategori listesi alınamadı', 500);
    }
  }

  /**
   * Initialize templates (Admin only)
   */
  async initializeTemplates(req: Request, res: Response): Promise<void> {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return sendError(res, 'Bu işlem için admin yetkisi gereklidir', 403);
      }

      await this.templateService.initializeTemplates();

      logger.info('Templates initialized successfully', {
        adminUserId: req.user.userId,
      });

      sendSuccess(res, null, 'Templates initialized successfully');
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error)
      );
      sendError(
        res,
        (error as Error).message || 'Template başlatma işlemi başarısız',
        500
      );
    }
  }

  /**
   * Download custom PDF from template content
   */
  async downloadCustomPdf(req: Request, res: Response): Promise<void> {
    try {
      const { content, positionTitle, companyName, templateTitle, language = 'TURKISH' } = req.body;

      if (!content || !positionTitle || !companyName) {
        res.status(400).json({
          success: false,
          message: 'Content, position title ve company name alanları zorunludur',
        });
        return;
      }

      // User bilgilerini al
      const userProfile = await this.userProfileService.getUserProfile(req.user!.userId);
      const fullName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : undefined;

      // PDF oluştur
      const pdfBuffer = await this.pdfService.generateCoverLetterPdfWithCustomFormat(
        content,
        positionTitle,
        companyName,
        fullName,
        language as 'TURKISH' | 'ENGLISH'
      );

      // PDF dosya adı oluştur
      const sanitizedCompany = companyName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const sanitizedPosition = positionTitle
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const fileName = `${sanitizedCompany}_${sanitizedPosition}_Cover_Letter.pdf`;

      // HTTP headers ayarla
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      logger.info('Custom PDF generated from template', {
        positionTitle,
        companyName,
        templateTitle,
        userId: req.user?.userId,
        fileSize: pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Custom PDF generation failed:', error);
      res.status(500).json({
        success: false,
        message: 'PDF oluşturma işlemi başarısız oldu',
      });
    }
  }
}
