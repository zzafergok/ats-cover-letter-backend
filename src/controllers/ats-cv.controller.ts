import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PdfService } from '../services/pdf.service';
import { ATSPDFService } from '../services/ats-pdf.service';
import { DocxTemplatePdfService } from '../services/docx-template-pdf.service';
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
          .transform((str) => str === "" ? null : new Date(str))
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
          .transform((str) => str === "" ? null : new Date(str))
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
          .transform((str) => str === "" ? null : new Date(str))
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
  private atsPdfService: ATSPDFService;
  private docxTemplateService: DocxTemplatePdfService;

  constructor() {
    this.pdfService = PdfService.getInstance();
    this.atsPdfService = ATSPDFService.getInstance();
    this.docxTemplateService = DocxTemplatePdfService.getInstance();
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
        // Generate PDF using appropriate service
        let pdfBuffer: Buffer;
        
        // Check if DOCX template is requested and available
        if (req.body.useDocxTemplate && req.body.docxTemplateId) {
          try {
            // Check if ATS optimization with Claude API is requested
            if (req.body.useClaudeOptimization) {
              // Use Claude-optimized DOCX template generation
              pdfBuffer = await this.docxTemplateService.generateATSOptimizedPdfFromDocxTemplate(
                req.body.docxTemplateId,
                cvData,
                cvData.configuration.jobDescription,
                cvData.configuration.targetCompany
              );
              
              logger.info('PDF generated using Claude-optimized DOCX template', {
                templateId: req.body.docxTemplateId,
                applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
                hasJobDescription: !!cvData.configuration.jobDescription,
                hasTargetCompany: !!cvData.configuration.targetCompany
              });
            } else {
              // Use standard DOCX template service
              pdfBuffer = await this.docxTemplateService.generatePdfFromDocxTemplate(
                req.body.docxTemplateId,
                cvData
              );
              
              logger.info('PDF generated using standard DOCX template', {
                templateId: req.body.docxTemplateId,
                applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`
              });
            }
          } catch (docxError) {
            logger.warn('DOCX template generation failed, falling back to ATS service:', docxError);
            // Fallback to ATS PDF service
            pdfBuffer = await this.generateWithATSService(cvData);
          }
        } else {
          // Use ATS PDF service (existing logic)
          pdfBuffer = await this.generateWithATSService(cvData);
        }

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

      // CV datasını parse et ve date'leri düzelt
      const cvData = {
        personalInfo: atsCv.personalInfo,
        professionalSummary: atsCv.professionalSummary,
        workExperience: Array.isArray(atsCv.workExperience) ? 
          (atsCv.workExperience as any[]).map(exp => ({
            ...exp,
            startDate: exp.startDate ? new Date(exp.startDate) : undefined,
            endDate: exp.endDate ? new Date(exp.endDate) : null
          })) : [],
        education: Array.isArray(atsCv.education) ? 
          (atsCv.education as any[]).map(edu => ({
            ...edu,
            startDate: edu.startDate ? new Date(edu.startDate) : undefined,
            endDate: edu.endDate ? new Date(edu.endDate) : null
          })) : [],
        skills: atsCv.skills,
        certifications: Array.isArray(atsCv.certifications) ? 
          (atsCv.certifications as any[]).map(cert => ({
            ...cert,
            issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
            expirationDate: cert.expirationDate ? new Date(cert.expirationDate) : null
          })) : [],
        projects: Array.isArray(atsCv.projects) ? 
          (atsCv.projects as any[]).map(proj => ({
            ...proj,
            startDate: proj.startDate ? new Date(proj.startDate) : undefined,
            endDate: proj.endDate ? new Date(proj.endDate) : null
          })) : [],
        configuration: atsCv.configuration,
      } as any;

      // PDF'i yeniden oluştur - Modern ATS PDF service kullan
      let pdfBuffer: Buffer;
      
      logger.info('Starting PDF generation for download', {
        cvId: id,
        applicantName: `${(cvData.personalInfo as any).firstName} ${(cvData.personalInfo as any).lastName}`,
        useAI: (cvData.configuration as any).useAI,
        templateStyle: (cvData.configuration as any).templateStyle
      });

      try {
        if ((cvData.configuration as any).useAI) {
          // AI-optimized generation using modern HTML-to-PDF
          pdfBuffer = await this.atsPdfService.generateAIOptimized(cvData);
        } else if ((cvData.configuration as any).templateStyle && 
                   ['PROFESSIONAL', 'MODERN', 'EXECUTIVE'].includes((cvData.configuration as any).templateStyle)) {
          // Template-based generation using modern approach
          pdfBuffer = await this.atsPdfService.generateWithTemplate(
            cvData, 
            (cvData.configuration as any).templateStyle as 'PROFESSIONAL' | 'MODERN' | 'EXECUTIVE'
          );
        } else {
          // Standard ATS-compliant CV using modern approach
          pdfBuffer = await this.atsPdfService.generateSimpleATS(cvData);
        }
      } catch (pdfGenerationError) {
        logger.error('PDF generation failed during download:', {
          error: pdfGenerationError instanceof Error ? pdfGenerationError.message : 'Unknown error',
          stack: pdfGenerationError instanceof Error ? pdfGenerationError.stack : undefined,
          cvId: id,
          userId
        });
        
        // Throw more specific error
        throw new Error(`PDF generation failed: ${pdfGenerationError instanceof Error ? pdfGenerationError.message : 'Unknown error'}`);
      }

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
      logger.error('Failed to download ATS CV:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        cvId: req.params.id,
        userId: req.user?.userId
      });
      res.status(500).json(
        createResponse(false, 'ATS CV indirilemedi', {
          error: error instanceof Error ? error.message : 'Unknown error',
          details: 'PDF generation failed during download'
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

  /**
   * Export ATS CV in multiple formats
   */
  async exportMultiFormat(req: Request, res: Response): Promise<void> {
    try {
      const { cvData, formats, options } = req.body;
      
      if (!cvData || !formats || !Array.isArray(formats)) {
        res.status(400).json(createResponse(false, 'CV verisi ve formatlar gerekli'));
        return;
      }

      const results = await this.atsPdfService.exportMultiFormat(cvData, formats, options);

      if (results.length === 0) {
        res.status(400).json(createResponse(false, 'Hiçbir format başarıyla oluşturulamadı'));
        return;
      }

      // Convert buffers to base64 for JSON response
      const responseData = results.map(result => ({
        format: result.format,
        filename: result.filename,
        data: result.buffer.toString('base64'),
        size: result.buffer.length
      }));

      res.json(createResponse(true, 'CV başarıyla export edildi', responseData));
    } catch (error) {
      logger.error('Multi-format export failed:', error);
      res.status(500).json(createResponse(false, 'Export hatası', null, [
        { message: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      ]));
    }
  }

  /**
   * Get available CV templates
   */
  getAvailableTemplates = async (_req: Request, res: Response): Promise<void> => {
    try {
      const templates = this.atsPdfService.getAvailableTemplates();
      res.json(createResponse(true, 'Template listesi başarıyla alındı', templates));
    } catch (error) {
      logger.error('Failed to get templates:', error);
      res.status(500).json(createResponse(false, 'Template listesi alınamadı', null, [
        { message: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      ]));
    }
  };

  /**
   * Validate CV data against ATS requirements
   */
  validateATSRequirements = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cvData } = req.body;
      
      if (!cvData) {
        res.status(400).json(createResponse(false, 'CV verisi gerekli'));
        return;
      }

      const validation = this.atsPdfService.validateATSRequirements(cvData);
      
      res.json(createResponse(true, 'CV validasyonu tamamlandı', validation));
    } catch (error) {
      logger.error('CV validation failed:', error);
      res.status(500).json(createResponse(false, 'Validasyon hatası', null, [
        { message: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      ]));
    }
  };

  /**
   * Generate modern test CV using HTML-to-PDF
   */
  generateModernTestCV = async (_req: Request, res: Response): Promise<void> => {
    try {
      const pdfBuffer = await this.atsPdfService.generateTestCV();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Modern_Test_ATS_CV.pdf"');
      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Modern test CV generation failed:', error);
      res.status(500).json(createResponse(false, 'Modern test CV oluşturulamadı', null, [
        { message: error instanceof Error ? error.message : 'Bilinmeyen hata' }
      ]));
    }
  };

  /**
   * ATS PDF Service ile PDF oluştur (helper method)
   */
  private async generateWithATSService(cvData: ATSCVData): Promise<Buffer> {
    if (cvData.configuration.useAI) {
      // AI-optimized generation using modern HTML-to-PDF
      return await this.atsPdfService.generateAIOptimized(cvData);
    } else if (cvData.configuration.templateStyle && 
               ['PROFESSIONAL', 'MODERN', 'EXECUTIVE'].includes(cvData.configuration.templateStyle)) {
      // Template-based generation using modern approach
      return await this.atsPdfService.generateWithTemplate(
        cvData, 
        cvData.configuration.templateStyle as 'PROFESSIONAL' | 'MODERN' | 'EXECUTIVE'
      );
    } else {
      // Standard ATS-compliant CV using modern approach
      return await this.atsPdfService.generateSimpleATS(cvData);
    }
  }
}
