import { Request, Response } from 'express';
import { DocxTemplatePdfService } from '../services/docx-template-pdf.service';
import { ATSCVData } from '../types/cv.types';
import { createResponse } from '../utils/response';
import logger from '../config/logger';
import multer from 'multer';
import { z } from 'zod';

// Template upload için multer konfigürasyonu
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return cb(new Error('Sadece .docx dosyaları kabul edilir'));
    }
    cb(null, true);
  }
});

// CV data validation schema (simplified version)
const CVDataSchema = z.object({
  personalInfo: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.object({
      city: z.string(),
      country: z.string()
    }),
    linkedIn: z.string().optional(),
    portfolio: z.string().optional(),
    github: z.string().optional()
  }),
  professionalSummary: z.object({
    summary: z.string(),
    targetPosition: z.string(),
    yearsOfExperience: z.number(),
    keySkills: z.array(z.string())
  }),
  workExperience: z.array(z.any()),
  education: z.array(z.any()),
  skills: z.object({
    technical: z.array(z.any()),
    languages: z.array(z.any()),
    soft: z.array(z.string())
  }),
  certifications: z.array(z.any()).optional(),
  projects: z.array(z.any()).optional(),
  configuration: z.object({
    language: z.enum(['TURKISH', 'ENGLISH']),
    cvType: z.string(),
    templateStyle: z.string()
  })
});

export class DocxTemplatePdfController {
  private templateService: DocxTemplatePdfService;

  constructor() {
    this.templateService = DocxTemplatePdfService.getInstance();
  }

  /**
   * Mevcut template'leri listele
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = await this.templateService.getAvailableTemplates();
      
      res.json(createResponse(true, 'Template listesi başarıyla alındı', {
        templates,
        total: templates.length
      }));
    } catch (error) {
      logger.error('Failed to get templates:', error);
      res.status(500).json(
        createResponse(false, 'Template listesi alınamadı', null, [
          { message: error instanceof Error ? error.message : 'Bilinmeyen hata' }
        ])
      );
    }
  }

  /**
   * Professional template ile PDF oluştur
   */
  async generateProfessionalPdf(req: Request, res: Response): Promise<void> {
    await this.generatePdfByTemplate(req, res, 'professional');
  }

  /**
   * Modern template ile PDF oluştur
   */
  async generateModernPdf(req: Request, res: Response): Promise<void> {
    await this.generatePdfByTemplate(req, res, 'modern');
  }

  /**
   * Academic template ile PDF oluştur
   */
  async generateAcademicPdf(req: Request, res: Response): Promise<void> {
    await this.generatePdfByTemplate(req, res, 'academic');
  }

  /**
   * Executive template ile PDF oluştur
   */
  async generateExecutivePdf(req: Request, res: Response): Promise<void> {
    await this.generatePdfByTemplate(req, res, 'executive');
  }

  /**
   * Classic template ile PDF oluştur
   */
  async generateClassicPdf(req: Request, res: Response): Promise<void> {
    await this.generatePdfByTemplate(req, res, 'classic');
  }

  /**
   * Belirtilen template ile PDF oluştur (genel method)
   */
  async generatePdfByTemplate(req: Request, res: Response, templateId?: string): Promise<void> {
    try {
      const selectedTemplateId = templateId || req.params.templateId || req.body.templateId;
      
      if (!selectedTemplateId) {
        res.status(400).json(
          createResponse(false, 'Template ID belirtilmedi')
        );
        return;
      }

      // CV data validation
      const validation = CVDataSchema.safeParse(req.body.cvData || req.body);
      if (!validation.success) {
        res.status(400).json(
          createResponse(false, 'CV verisi geçersiz', {
            errors: validation.error.issues
          })
        );
        return;
      }

      const cvData: ATSCVData = validation.data as ATSCVData;

      logger.info('DOCX template PDF generation started', {
        templateId: selectedTemplateId,
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        userId: req.user?.userId
      });

      // PDF oluştur
      const pdfBuffer = await this.templateService.generatePdfFromDocxTemplate(
        selectedTemplateId,
        cvData
      );

      // PDF filename
      const filename = `${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV_${selectedTemplateId}.pdf`;

      // PDF headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // PDF'i gönder
      res.send(pdfBuffer);

      logger.info('DOCX template PDF generation completed', {
        templateId: selectedTemplateId,
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        filename,
        pdfSize: pdfBuffer.length
      });

    } catch (error) {
      logger.error('DOCX template PDF generation failed:', {
        templateId: templateId || req.params.templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      res.status(500).json(
        createResponse(false, 'Template PDF oluşturulamadı', null, [
          { message: error instanceof Error ? error.message : 'Bilinmeyen hata' }
        ])
      );
    }
  }

  /**
   * Template yükle ve analiz et (ADMIN)
   */
  async uploadAndAnalyzeTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      
      if (!req.file) {
        res.status(400).json(
          createResponse(false, 'Template dosyası yüklenmedi')
        );
        return;
      }

      if (!templateId) {
        res.status(400).json(
          createResponse(false, 'Template ID belirtilmedi')
        );
        return;
      }

      logger.info('Admin template upload and analysis started', {
        templateId,
        filename: req.file.originalname,
        size: req.file.size
      });

      // Template'i yükle ve analiz et
      const analysisResult = await this.templateService.uploadAndAnalyzeTemplate(
        templateId, 
        req.file.buffer
      );

      res.json(
        createResponse(true, 'Template başarıyla yüklendi ve analiz edildi', {
          templateId: analysisResult.templateId,
          filename: req.file.originalname,
          size: req.file.size,
          analysis: {
            existingPlaceholders: analysisResult.analyzedFields,
            recommendedFields: analysisResult.recommendedFields,
            templateStructure: analysisResult.templateStructure,
            fieldMapping: this.generateFieldMapping(analysisResult.recommendedFields)
          }
        })
      );

      logger.info('Admin template upload and analysis completed', {
        templateId,
        filename: req.file.originalname,
        analyzedFields: analysisResult.analyzedFields.length,
        recommendedFields: analysisResult.recommendedFields.length
      });

    } catch (error) {
      logger.error('Admin template upload and analysis failed:', {
        templateId: req.params.templateId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createResponse(false, 'Template yüklenemedi ve analiz edilemedi', null, [
          { message: error instanceof Error ? error.message : 'Bilinmeyen hata' }
        ])
      );
    }
  }

  /**
   * Template yükle (basit versiyon)
   */
  async uploadTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      
      if (!req.file) {
        res.status(400).json(
          createResponse(false, 'Template dosyası yüklenmedi')
        );
        return;
      }

      if (!templateId) {
        res.status(400).json(
          createResponse(false, 'Template ID belirtilmedi')
        );
        return;
      }

      logger.info('Template upload started', {
        templateId,
        filename: req.file.originalname,
        size: req.file.size
      });

      await this.templateService.uploadTemplate(templateId, req.file.buffer);

      res.json(
        createResponse(true, 'Template başarıyla yüklendi', {
          templateId,
          filename: req.file.originalname,
          size: req.file.size
        })
      );

      logger.info('Template upload completed', {
        templateId,
        filename: req.file.originalname
      });

    } catch (error) {
      logger.error('Template upload failed:', {
        templateId: req.params.templateId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json(
        createResponse(false, 'Template yüklenemedi', null, [
          { message: error instanceof Error ? error.message : 'Bilinmeyen hata' }
        ])
      );
    }
  }

  /**
   * Önerilen alanlar için field mapping oluştur
   */
  private generateFieldMapping(recommendedFields: string[]): any {
    const mapping: any = {};

    recommendedFields.forEach(field => {
      if (field.startsWith('personalInfo.')) {
        if (!mapping.personalInfo) mapping.personalInfo = [];
        mapping.personalInfo.push(field);
      } else if (field.startsWith('professionalSummary.')) {
        if (!mapping.professionalSummary) mapping.professionalSummary = [];
        mapping.professionalSummary.push(field);
      } else if (field.startsWith('skills.')) {
        if (!mapping.skills) mapping.skills = [];
        mapping.skills.push(field);
      } else {
        if (!mapping.other) mapping.other = [];
        mapping.other.push(field);
      }
    });

    return mapping;
  }

  /**
   * Batch PDF generation - Birden fazla template ile
   */
  async generateMultipleTemplatesPdf(req: Request, res: Response): Promise<void> {
    try {
      const { templateIds, cvData } = req.body;

      if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
        res.status(400).json(
          createResponse(false, 'Template ID listesi belirtilmedi')
        );
        return;
      }

      // CV data validation
      const validation = CVDataSchema.safeParse(cvData);
      if (!validation.success) {
        res.status(400).json(
          createResponse(false, 'CV verisi geçersiz', {
            errors: validation.error.issues
          })
        );
        return;
      }

      const validCvData: ATSCVData = validation.data as ATSCVData;
      const results = [];

      logger.info('Multiple template PDF generation started', {
        templateIds,
        applicantName: `${validCvData.personalInfo.firstName} ${validCvData.personalInfo.lastName}`,
        templateCount: templateIds.length
      });

      for (const templateId of templateIds) {
        try {
          const pdfBuffer = await this.templateService.generatePdfFromDocxTemplate(
            templateId,
            validCvData
          );

          const filename = `${validCvData.personalInfo.firstName}_${validCvData.personalInfo.lastName}_CV_${templateId}.pdf`;

          results.push({
            templateId,
            filename,
            size: pdfBuffer.length,
            success: true,
            pdf: pdfBuffer.toString('base64')
          });

        } catch (error) {
          results.push({
            templateId,
            success: false,
            error: error instanceof Error ? error.message : 'PDF oluşturulamadı'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json(
        createResponse(true, `${successCount}/${templateIds.length} template başarıyla işlendi`, {
          results,
          totalTemplates: templateIds.length,
          successCount,
          failureCount: templateIds.length - successCount
        })
      );

    } catch (error) {
      logger.error('Multiple template PDF generation failed:', error);
      res.status(500).json(
        createResponse(false, 'Çoklu template PDF oluşturulamadı', null, [
          { message: error instanceof Error ? error.message : 'Bilinmeyen hata' }
        ])
      );
    }
  }

  /**
   * Template preview - Sadece ilk sayfa görüntüle
   */
  async previewTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      // Örnek CV verisi ile preview oluştur
      const sampleCvData: ATSCVData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@email.com',
          phone: '+90 555 123 45 67',
          address: {
            city: 'Istanbul',
            country: 'Turkey'
          },
          linkedIn: 'https://linkedin.com/in/johndoe',
          portfolio: 'https://johndoe.dev',
          github: 'https://github.com/johndoe'
        },
        professionalSummary: {
          summary: 'Experienced software developer with expertise in modern web technologies...',
          targetPosition: 'Senior Software Developer',
          yearsOfExperience: 5,
          keySkills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker']
        },
        workExperience: [],
        education: [],
        skills: {
          technical: [],
          languages: [],
          soft: []
        },
        configuration: {
          language: 'ENGLISH',
          cvType: 'ATS_OPTIMIZED',
          templateStyle: 'MODERN'
        }
      } as ATSCVData;

      const pdfBuffer = await this.templateService.generatePdfFromDocxTemplate(
        templateId,
        sampleCvData
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="template_preview_${templateId}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      logger.error('Template preview failed:', error);
      res.status(500).json(
        createResponse(false, 'Template önizleme oluşturulamadı', null, [
          { message: error instanceof Error ? error.message : 'Bilinmeyen hata' }
        ])
      );
    }
  }
}

// Export multer upload middleware
export const templateUpload = upload.single('template');