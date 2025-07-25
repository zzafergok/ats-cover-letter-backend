import { Request, Response } from 'express';
import {
  DOCXExportService,
  DOCXGenerationOptions,
} from '../services/docx-export.service';
import { ATSCVData } from '../types/cv.types';
import { createResponse } from '../utils/response';
import logger from '../config/logger';
import { z } from 'zod';

// ATS CV validation schema
const ATSCVSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[\d\s\-()]{10,}$/),
    address: z.object({
      street: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string(),
    }),
    linkedIn: z.string().url().optional(),
    website: z.string().url().optional(),
    github: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }),
  professionalSummary: z.object({
    summary: z.string().min(50).max(500),
    targetPosition: z.string(),
    yearsOfExperience: z.number().min(0).max(50),
    keySkills: z.array(z.string()).min(3).max(15),
  }),
  workExperience: z
    .array(
      z.object({
        position: z.string(),
        companyName: z.string(),
        location: z.string(),
        startDate: z.date(),
        endDate: z.date().optional(),
        isCurrentRole: z.boolean(),
        achievements: z.array(z.string()).min(2).max(8),
        technologies: z.array(z.string()).optional(),
      })
    )
    .min(1),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        fieldOfStudy: z.string(),
        startDate: z.date(),
        endDate: z.date().optional(),
        gpa: z.number().min(0).max(4).optional(),
        honors: z.array(z.string()).optional(),
      })
    )
    .min(1),
  skills: z.object({
    technical: z.array(
      z.object({
        category: z.string(),
        items: z.array(
          z.object({
            name: z.string(),
            proficiency: z.enum([
              'Beginner',
              'Intermediate',
              'Advanced',
              'Expert',
            ]),
          })
        ),
      })
    ),
    languages: z.array(
      z.object({
        language: z.string(),
        proficiency: z.enum([
          'Beginner',
          'Intermediate',
          'Advanced',
          'Native',
          'Conversational',
        ]),
      })
    ),
    soft: z.array(z.string()),
  }),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuingOrganization: z.string(),
        issueDate: z.date(),
        expirationDate: z.date().optional(),
        credentialId: z.string().optional(),
        credentialUrl: z.string().url().optional(),
      })
    )
    .optional(),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        technologies: z.array(z.string()),
        url: z.string().url().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .optional(),
  configuration: z.object({
    targetJobTitle: z.string(),
    desiredSalary: z.string().optional(),
    availabilityDate: z.date().optional(),
    workLocation: z.enum(['Remote', 'On-site', 'Hybrid']).optional(),
    relocatable: z.boolean().optional(),
  }),
});

// DOCX generation options validation schema
const DOCXOptionsSchema = z.object({
  format: z.enum(['ATS_OPTIMIZED', 'STANDARD']).optional(),
  includePageNumbers: z.boolean().optional(),
  fontFamily: z.enum(['Arial', 'Calibri', 'Times New Roman']).optional(),
  fontSize: z.number().min(9).max(14).optional(),
  margins: z
    .object({
      top: z.number().min(0.5).max(2),
      bottom: z.number().min(0.5).max(2),
      left: z.number().min(0.5).max(2),
      right: z.number().min(0.5).max(2),
    })
    .optional(),
});

export class DOCXExportController {
  private docxService: DOCXExportService;

  constructor() {
    this.docxService = DOCXExportService.getInstance();
  }

  /**
   * ATS-uyumlu DOCX CV oluştur
   */
  async generateDOCXCV(req: Request, res: Response): Promise<void> {
    try {
      // Validate CV data
      const cvDataResult = ATSCVSchema.safeParse(req.body.cvData);
      if (!cvDataResult.success) {
        res
          .status(400)
          .json(
            createResponse(
              false,
              'Invalid CV data format',
              null,
              cvDataResult.error.errors
            )
          );
        return;
      }

      // Validate options if provided
      let options: Partial<DOCXGenerationOptions> = {};
      if (req.body.options) {
        const optionsResult = DOCXOptionsSchema.safeParse(req.body.options);
        if (!optionsResult.success) {
          res
            .status(400)
            .json(
              createResponse(
                false,
                'Invalid DOCX generation options',
                null,
                optionsResult.error.errors
              )
            );
          return;
        }
        options = optionsResult.data;
      }

      logger.info('DOCX CV generation request received', {
        applicantName: `${cvDataResult.data.personalInfo.firstName} ${cvDataResult.data.personalInfo.lastName}`,
        requestId: req.headers['x-request-id'],
        options: options,
      });

      // Generate DOCX
      const docxBuffer = await this.docxService.generateATSCompliantDOCX(
        cvDataResult.data as unknown as ATSCVData,
        options
      );

      // Set response headers for file download
      const fileName = `${cvDataResult.data.personalInfo.firstName}_${cvDataResult.data.personalInfo.lastName}_CV.docx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
      );
      res.setHeader('Content-Length', docxBuffer.length);

      logger.info('DOCX CV generation completed successfully', {
        applicantName: `${cvDataResult.data.personalInfo.firstName} ${cvDataResult.data.personalInfo.lastName}`,
        fileSize: docxBuffer.length,
        fileName: fileName,
      });

      res.send(docxBuffer);
    } catch (error) {
      logger.error('DOCX CV generation failed:', error);
      res
        .status(500)
        .json(
          createResponse(false, 'DOCX CV generation failed', null, [
            {
              message:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred',
            },
          ])
        );
    }
  }

  /**
   * DOCX format best practices'lerini getir
   */
  async getDOCXBestPractices(_req: Request, res: Response): Promise<void> {
    try {
      const bestPractices = this.docxService.getATSDOCXBestPractices();

      res.json(
        createResponse(
          true,
          'DOCX best practices retrieved successfully',
          bestPractices
        )
      );
    } catch (error) {
      logger.error('Failed to retrieve DOCX best practices:', error);
      res
        .status(500)
        .json(
          createResponse(
            false,
            'Failed to retrieve DOCX best practices',
            null,
            [
              {
                message:
                  error instanceof Error
                    ? error.message
                    : 'Unknown error occurred',
              },
            ]
          )
        );
    }
  }

  /**
   * DOCX vs PDF karşılaştırması
   */
  async getDOCXvsPDFComparison(_req: Request, res: Response): Promise<void> {
    try {
      const comparison = this.docxService.getDOCXvsPDFComparison();

      res.json(
        createResponse(
          true,
          'DOCX vs PDF comparison retrieved successfully',
          comparison
        )
      );
    } catch (error) {
      logger.error('Failed to retrieve DOCX vs PDF comparison:', error);
      res
        .status(500)
        .json(
          createResponse(
            false,
            'Failed to retrieve DOCX vs PDF comparison',
            null,
            [
              {
                message:
                  error instanceof Error
                    ? error.message
                    : 'Unknown error occurred',
              },
            ]
          )
        );
    }
  }

  /**
   * DOCX generation options'ları validate et
   */
  async validateDOCXOptions(req: Request, res: Response): Promise<void> {
    try {
      const optionsResult = DOCXOptionsSchema.safeParse(req.body);

      if (!optionsResult.success) {
        res
          .status(400)
          .json(
            createResponse(
              false,
              'Invalid DOCX options',
              null,
              optionsResult.error.errors
            )
          );
        return;
      }

      const validationErrors = this.docxService.validateDOCXOptions(
        optionsResult.data
      );

      const isValid = validationErrors.length === 0;
      res.json(
        createResponse(
          isValid,
          isValid ? 'DOCX options are valid' : 'DOCX options validation failed',
          {
            isValid,
            errors: validationErrors,
            validatedOptions: optionsResult.data,
          }
        )
      );
    } catch (error) {
      logger.error('DOCX options validation failed:', error);
      res
        .status(500)
        .json(
          createResponse(false, 'DOCX options validation failed', null, [
            {
              message:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred',
            },
          ])
        );
    }
  }

  /**
   * DOCX generation preview (metadata only)
   */
  async previewDOCXGeneration(req: Request, res: Response): Promise<void> {
    try {
      // Validate CV data
      const cvDataResult = ATSCVSchema.safeParse(req.body.cvData);
      if (!cvDataResult.success) {
        res
          .status(400)
          .json(
            createResponse(
              false,
              'Invalid CV data format',
              null,
              cvDataResult.error.errors
            )
          );
        return;
      }

      // Validate options if provided
      let options: Partial<DOCXGenerationOptions> = {};
      if (req.body.options) {
        const optionsResult = DOCXOptionsSchema.safeParse(req.body.options);
        if (!optionsResult.success) {
          res
            .status(400)
            .json(
              createResponse(
                false,
                'Invalid DOCX generation options',
                null,
                optionsResult.error.errors
              )
            );
          return;
        }
        options = optionsResult.data;
      }

      // Create preview metadata
      const finalOptions = {
        format: 'ATS_OPTIMIZED',
        includePageNumbers: false,
        fontFamily: 'Arial',
        fontSize: 11,
        margins: {
          top: 1,
          bottom: 1,
          left: 1,
          right: 1,
        },
        ...options,
      };

      const preview = {
        applicantName: `${cvDataResult.data.personalInfo.firstName} ${cvDataResult.data.personalInfo.lastName}`,
        fileName: `${cvDataResult.data.personalInfo.firstName}_${cvDataResult.data.personalInfo.lastName}_CV.docx`,
        estimatedFileSize: '8-12 KB',
        options: finalOptions,
        sections: {
          personalInfo: true,
          professionalSummary: true,
          workExperience: cvDataResult.data.workExperience.length,
          education: cvDataResult.data.education.length,
          skills: {
            technical: cvDataResult.data.skills.technical.length,
            languages: cvDataResult.data.skills.languages.length,
            soft: cvDataResult.data.skills.soft.length,
          },
          certifications: cvDataResult.data.certifications?.length || 0,
          projects: cvDataResult.data.projects?.length || 0,
        },
        atsCompliance: {
          format: 'DOCX - ATS Optimized',
          font: `${finalOptions.fontFamily} ${finalOptions.fontSize}pt`,
          margins: `${finalOptions.margins.top}" margins`,
          structure: 'Single column, standard sections',
        },
      };

      res.json(
        createResponse(
          true,
          'DOCX generation preview created successfully',
          preview
        )
      );
    } catch (error) {
      logger.error('DOCX generation preview failed:', error);
      res
        .status(500)
        .json(
          createResponse(false, 'DOCX generation preview failed', null, [
            {
              message:
                error instanceof Error
                  ? error.message
                  : 'Unknown error occurred',
            },
          ])
        );
    }
  }
}
