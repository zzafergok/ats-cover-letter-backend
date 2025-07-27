import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PdfService } from '../services/pdf.service';
import { ATSCVData } from '../types/cv.types';
import logger from '../config/logger';
import { createResponse } from '../utils/response';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schema for ATS CV
const ATSCVSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[\d\s\-()]{10,}$/),
    address: z.object({
      city: z.string(),
      country: z.string(),
    }),
    linkedIn: z.string().url().optional(),
    github: z.string().url().optional(),
    portfolio: z.string().url().optional(),
  }),

  professionalSummary: z.object({
    summary: z.string().min(100).max(1000),
    targetPosition: z.string().min(2).max(100),
    yearsOfExperience: z.number().min(0).max(50),
    keySkills: z.array(z.string()).min(3).max(20),
  }),

  workExperience: z
    .array(
      z.object({
        id: z.string(),
        companyName: z.string().min(2),
        position: z.string().min(2),
        location: z.string().min(2),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z
          .string()
          .transform((str) => new Date(str))
          .optional(),
        isCurrentRole: z.boolean(),
        achievements: z.array(z.string()).min(2).max(10),
        technologies: z.array(z.string()).optional(),
        industryType: z.string().optional(),
      })
    )
    .min(1),

  education: z
    .array(
      z.object({
        id: z.string(),
        institution: z.string().min(2),
        degree: z.string().min(2),
        fieldOfStudy: z.string().min(2),
        location: z.string().min(2),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z
          .string()
          .transform((str) => new Date(str))
          .optional(),
        gpa: z.number().min(0).max(4).optional(),
        honors: z.array(z.string()).optional(),
        relevantCoursework: z.array(z.string()).optional(),
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
            proficiencyLevel: z.enum([
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
          'Native',
          'Fluent',
          'Advanced',
          'Intermediate',
          'Basic',
        ]),
      })
    ),
    soft: z.array(z.string()),
  }),

  certifications: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        issuingOrganization: z.string(),
        issueDate: z.string().transform((str) => new Date(str)),
        expirationDate: z
          .string()
          .transform((str) => new Date(str))
          .optional(),
        credentialId: z.string().optional(),
        verificationUrl: z.string().url().optional(),
      })
    )
    .optional(),

  projects: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        technologies: z.array(z.string()),
        startDate: z.string().transform((str) => new Date(str)),
        endDate: z
          .string()
          .transform((str) => new Date(str))
          .optional(),
        url: z.string().url().optional(),
        achievements: z.array(z.string()),
      })
    )
    .optional(),

  configuration: z.object({
    targetCompany: z.string().optional(),
    jobDescription: z.string().optional(),
    language: z.enum(['TURKISH', 'ENGLISH']),
    cvType: z.enum(['ATS_OPTIMIZED', 'TECHNICAL', 'EXECUTIVE']),
    templateStyle: z.enum(['MINIMAL', 'PROFESSIONAL', 'MODERN']),
    useAI: z.boolean().default(false),
  }),
});

export class ATSCVController {
  private pdfService: PdfService;

  constructor() {
    this.pdfService = PdfService.getInstance();
  }

  /**
   * ATS Uyumlu CV Oluştur
   */
  generateATSCV = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate input data
      const validationResult = ATSCVSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json(
          createResponse(false, 'Validation failed', {
            errors: validationResult.error.issues,
          })
        );
        return;
      }

      const cvData: ATSCVData = validationResult.data;
      const userId = req.user!.userId;

      logger.info('ATS CV generation started', {
        userId,
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        targetPosition: cvData.professionalSummary.targetPosition,
        language: cvData.configuration.language,
        cvType: cvData.configuration.cvType,
      });

      // Database'e kaydet (PROCESSING durumunda)
      const atsCv = await prisma.atsCv.create({
        data: {
          userId,
          personalInfo: cvData.personalInfo,
          professionalSummary: cvData.professionalSummary,
          workExperience: cvData.workExperience,
          education: cvData.education,
          skills: cvData.skills,
          certifications: cvData.certifications || undefined,
          projects: cvData.projects || undefined,
          configuration: cvData.configuration,
          generationStatus: 'PROCESSING',
        },
      });

      try {
        // Generate PDF - AI or simple based on user preference
        const pdfBuffer = cvData.configuration.useAI
          ? await this.pdfService.generateAIOptimizedATSCV(cvData)
          : await this.pdfService.generateSimpleATSCV(cvData);

        // Generate filename
        const fileName = `${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV_ATS.pdf`;

        // Update database with generated content and status
        const updatedAtsCv = await prisma.atsCv.update({
          where: { id: atsCv.id },
          data: {
            generationStatus: 'COMPLETED',
            fileName,
            fileSize: pdfBuffer.length,
            generatedContent: `ATS CV successfully generated for ${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
            updatedAt: new Date(),
          },
        });

        logger.info('ATS CV generated successfully', {
          userId,
          atsCvId: atsCv.id,
          applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
          pdfSize: pdfBuffer.length,
          fileName,
        });

        // JSON response döndür (PDF yerine)
        res.json(
          createResponse(true, 'ATS CV başarıyla oluşturuldu', {
            cvId: updatedAtsCv.id,
            fileName: updatedAtsCv.fileName,
            fileSize: updatedAtsCv.fileSize,
            generationStatus: updatedAtsCv.generationStatus,
            downloadUrl: `/api/ats-cv/${updatedAtsCv.id}/download`,
            createdAt: updatedAtsCv.createdAt,
            applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
            targetPosition: cvData.professionalSummary.targetPosition,
            language: cvData.configuration.language,
            useAI: cvData.configuration.useAI,
          })
        );
      } catch (pdfError) {
        // PDF generation failed, update status to FAILED
        await prisma.atsCv.update({
          where: { id: atsCv.id },
          data: {
            generationStatus: 'FAILED',
            updatedAt: new Date(),
          },
        });
        throw pdfError;
      }
    } catch (error) {
      logger.error('ATS CV generation failed:', error);
      res.status(500).json(
        createResponse(false, 'ATS CV oluşturulamadı', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    }
  };

  /**
   * ATS CV Test - Örnek veri ile test
   */
  generateTestCV = async (_req: Request, res: Response): Promise<void> => {
    try {
      logger.info('ATS Test CV generation started');

      const pdfBuffer = await this.pdfService.generateATSTestCV();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="ATS_Test_CV.pdf"'
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);

      logger.info('ATS Test CV generated successfully', {
        pdfSize: pdfBuffer.length,
      });
    } catch (error) {
      logger.error('ATS Test CV generation failed:', error);
      res.status(500).json(
        createResponse(false, 'Test CV oluşturulamadı', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    }
  };

  /**
   * ATS CV Schema'sını döndür - Frontend için
   */
  getATSSchema = async (_req: Request, res: Response): Promise<void> => {
    try {
      const schemaStructure = {
        personalInfo: {
          required: ['firstName', 'lastName', 'email', 'phone', 'address'],
          optional: ['linkedIn', 'website', 'github', 'portfolio'],
          address: {
            required: ['city', 'country'],
            optional: ['street', 'state', 'postalCode'],
          },
        },
        professionalSummary: {
          required: [
            'summary',
            'targetPosition',
            'yearsOfExperience',
            'keySkills',
          ],
          limits: {
            summary: { min: 100, max: 1000 },
            keySkills: { min: 3, max: 20 },
          },
        },
        workExperience: {
          required: [
            'companyName',
            'position',
            'location',
            'startDate',
            'achievements',
          ],
          optional: ['endDate', 'technologies', 'industryType'],
          limits: {
            achievements: { min: 2, max: 10 },
            minimum: 1,
          },
        },
        education: {
          required: [
            'institution',
            'degree',
            'fieldOfStudy',
            'location',
            'startDate',
          ],
          optional: ['endDate', 'gpa', 'honors', 'relevantCoursework'],
          limits: {
            minimum: 1,
            gpa: { min: 0, max: 4 },
          },
        },
        skills: {
          structure: {
            technical: {
              category: 'string',
              items: [{ name: 'string', proficiencyLevel: 'enum' }],
            },
            languages: [{ language: 'string', proficiency: 'enum' }],
            soft: ['string'],
          },
          enums: {
            proficiencyLevel: [
              'Beginner',
              'Intermediate',
              'Advanced',
              'Expert',
            ],
            languageProficiency: [
              'Native',
              'Fluent',
              'Advanced',
              'Intermediate',
              'Basic',
            ],
          },
        },
        configuration: {
          required: ['language', 'cvType', 'templateStyle'],
          optional: ['targetCompany', 'jobDescription', 'useAI'],
          enums: {
            language: ['TURKISH', 'ENGLISH'],
            cvType: ['ATS_OPTIMIZED', 'TECHNICAL', 'EXECUTIVE'],
            templateStyle: ['MINIMAL', 'PROFESSIONAL', 'MODERN'],
          },
        },
        optional: ['certifications', 'projects'],
      };

      res.json(
        createResponse(
          true,
          'ATS CV Schema retrieved successfully',
          schemaStructure
        )
      );
    } catch (error) {
      logger.error('Failed to get ATS schema:', error);
      res.status(500).json(createResponse(false, 'Schema bilgisi alınamadı'));
    }
  };

  /**
   * ATS Validation Tips - Frontend için ipuçları
   */
  getATSValidationTips = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const tips = {
        general: [
          'Use standard section headings like "WORK EXPERIENCE", "EDUCATION", "SKILLS"',
          'Keep formatting simple - avoid images, tables, or complex layouts',
          'Use a single-column layout',
          'Save as PDF or DOCX format',
          'Keep file size under 2MB',
        ],
        formatting: [
          'Use standard fonts: Arial, Calibri, Helvetica, Times New Roman',
          'Font size should be 11-12pt for body text, 14-16pt for headers',
          'Use 1-inch margins on all sides',
          'Use bullet points for achievements',
          'Align text to the left',
        ],
        content: [
          'Include relevant keywords from the job description',
          'Use action verbs and quantify achievements with numbers',
          'Keep summary section to 3-4 sentences',
          'List work experience in reverse chronological order',
          'Include only relevant information',
        ],
        keywords: [
          'Match exact job title if possible',
          'Include technical skills mentioned in job posting',
          'Use industry-specific terminology',
          'Avoid keyword stuffing - use naturally',
          'Include both acronyms and full terms (e.g., "AI" and "Artificial Intelligence")',
        ],
        avoid: [
          'Headers and footers',
          'Images, photos, or graphics',
          'Tables or multiple columns',
          'Special characters or symbols',
          'Creative fonts or colors',
          'Text boxes or shapes',
        ],
      };

      res.json(
        createResponse(true, 'ATS validation tips retrieved successfully', tips)
      );
    } catch (error) {
      logger.error('Failed to get ATS tips:', error);
      res.status(500).json(createResponse(false, 'ATS ipuçları alınamadı'));
    }
  };

  /**
   * Kullanıcının ATS CV'lerini listele
   */
  getUserATSCVs = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const atsCvs = await prisma.atsCv.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          personalInfo: true,
          configuration: true,
          fileName: true,
          fileSize: true,
          generationStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(
        createResponse(true, 'ATS CV listesi başarıyla getirildi', {
          cvs: atsCvs,
          total: atsCvs.length,
        })
      );
    } catch (error) {
      logger.error('Failed to get user ATS CVs:', error);
      res.status(500).json(createResponse(false, 'ATS CV listesi alınamadı'));
    }
  };

  /**
   * Belirli bir ATS CV'yi getir
   */
  getATSCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const atsCv = await prisma.atsCv.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!atsCv) {
        res.status(404).json(createResponse(false, 'ATS CV bulunamadı'));
        return;
      }

      res.json(createResponse(true, 'ATS CV başarıyla getirildi', atsCv));
    } catch (error) {
      logger.error('Failed to get ATS CV:', error);
      res.status(500).json(createResponse(false, 'ATS CV alınamadı'));
    }
  };

  /**
   * ATS CV'yi sil
   */
  deleteATSCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const atsCv = await prisma.atsCv.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!atsCv) {
        res.status(404).json(createResponse(false, 'ATS CV bulunamadı'));
        return;
      }

      await prisma.atsCv.delete({
        where: { id },
      });

      logger.info('ATS CV deleted successfully', {
        userId,
        atsCvId: id,
      });

      res.json(createResponse(true, 'ATS CV başarıyla silindi'));
    } catch (error) {
      logger.error('Failed to delete ATS CV:', error);
      res.status(500).json(createResponse(false, 'ATS CV silinemedi'));
    }
  };

  /**
   * ATS CV PDF İndir
   */
  downloadATSCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const atsCv = await prisma.atsCv.findFirst({
        where: {
          id,
          userId,
          generationStatus: 'COMPLETED', // Sadece tamamlanmış CV'leri indir
        },
      });

      if (!atsCv) {
        res.status(404).json(
          createResponse(false, 'ATS CV bulunamadı veya henüz tamamlanmamış')
        );
        return;
      }

      // CV datasını parse et
      const cvData = {
        personalInfo: atsCv.personalInfo,
        professionalSummary: atsCv.professionalSummary,
        workExperience: atsCv.workExperience,
        education: atsCv.education,
        skills: atsCv.skills,
        certifications: atsCv.certifications,
        projects: atsCv.projects,
        configuration: atsCv.configuration,
      } as any;

      // PDF'i yeniden oluştur
      const pdfBuffer = (cvData.configuration as any).useAI
        ? await this.pdfService.generateAIOptimizedATSCV(cvData)
        : await this.pdfService.generateSimpleATSCV(cvData);

      // PDF download headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${atsCv.fileName || 'ATS_CV.pdf'}"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      // PDF'i gönder
      res.send(pdfBuffer);

      logger.info('ATS CV downloaded successfully', {
        userId,
        atsCvId: id,
        fileName: atsCv.fileName,
        pdfSize: pdfBuffer.length,
      });
    } catch (error) {
      logger.error('Failed to download ATS CV:', error);
      res.status(500).json(
        createResponse(false, 'ATS CV indirilemedi', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );
    }
  };

  /**
   * ATS CV istatistikleri
   */
  getATSCVStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const stats = await prisma.atsCv.groupBy({
        by: ['generationStatus'],
        where: { userId },
        _count: {
          id: true,
        },
      });

      const totalCVs = await prisma.atsCv.count({
        where: { userId },
      });

      const latestCV = await prisma.atsCv.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          personalInfo: true,
          configuration: true,
          generationStatus: true,
          createdAt: true,
        },
      });

      const formattedStats = {
        total: totalCVs,
        byStatus: stats.reduce(
          (acc, stat) => {
            acc[stat.generationStatus] = stat._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
        latest: latestCV,
      };

      res.json(
        createResponse(
          true,
          'ATS CV istatistikleri başarıyla getirildi',
          formattedStats
        )
      );
    } catch (error) {
      logger.error('Failed to get ATS CV stats:', error);
      res
        .status(500)
        .json(createResponse(false, 'ATS CV istatistikleri alınamadı'));
    }
  };
}
