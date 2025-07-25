import { Request, Response } from 'express';
import { PdfService } from '../services/pdf.service';
import { ATSCVData } from '../types/cv.types';
import logger from '../config/logger';
import { createResponse } from '../utils/response';
import { z } from 'zod';

// Validation schema for ATS CV
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
    summary: z.string().min(100).max(1000),
    targetPosition: z.string().min(2).max(100),
    yearsOfExperience: z.number().min(0).max(50),
    keySkills: z.array(z.string()).min(3).max(20),
  }),

  workExperience: z.array(z.object({
    id: z.string(),
    companyName: z.string().min(2),
    position: z.string().min(2),
    location: z.string().min(2),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)).optional(),
    isCurrentRole: z.boolean(),
    achievements: z.array(z.string()).min(2).max(10),
    technologies: z.array(z.string()).optional(),
    industryType: z.string().optional(),
  })).min(1),

  education: z.array(z.object({
    id: z.string(),
    institution: z.string().min(2),
    degree: z.string().min(2),
    fieldOfStudy: z.string().min(2),
    location: z.string().min(2),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)).optional(),
    gpa: z.number().min(0).max(4).optional(),
    honors: z.array(z.string()).optional(),
    relevantCoursework: z.array(z.string()).optional(),
  })).min(1),

  skills: z.object({
    technical: z.array(z.object({
      category: z.string(),
      items: z.array(z.object({
        name: z.string(),
        proficiencyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
      })),
    })),
    languages: z.array(z.object({
      language: z.string(),
      proficiency: z.enum(['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic']),
    })),
    soft: z.array(z.string()),
  }),

  certifications: z.array(z.object({
    id: z.string(),
    name: z.string(),
    issuingOrganization: z.string(),
    issueDate: z.string().transform((str) => new Date(str)),
    expirationDate: z.string().transform((str) => new Date(str)).optional(),
    credentialId: z.string().optional(),
    verificationUrl: z.string().url().optional(),
  })).optional(),

  projects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)).optional(),
    url: z.string().url().optional(),
    achievements: z.array(z.string()),
  })).optional(),

  configuration: z.object({
    targetJobTitle: z.string(),
    targetCompany: z.string().optional(),
    jobDescription: z.string().optional(),
    language: z.enum(['TURKISH', 'ENGLISH']),
    cvType: z.enum(['ATS_OPTIMIZED', 'TECHNICAL', 'EXECUTIVE']),
    includePhoto: z.literal(false),
    templateStyle: z.enum(['MINIMAL', 'PROFESSIONAL', 'MODERN']),
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
        res.status(400).json(createResponse(false, 'Validation failed', {
          errors: validationResult.error.issues
        }));
        return;
      }

      const cvData: ATSCVData = validationResult.data;

      logger.info('ATS CV generation started', {
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        targetPosition: cvData.professionalSummary.targetPosition,
        language: cvData.configuration.language,
        cvType: cvData.configuration.cvType
      });

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateATSCompliantCV(cvData);

      // Set headers for PDF download
      const fileName = `${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV_ATS.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);

      logger.info('ATS CV generated successfully', {
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        pdfSize: pdfBuffer.length,
        fileName
      });

    } catch (error) {
      logger.error('ATS CV generation failed:', error);
      res.status(500).json(createResponse(false, 'ATS CV oluşturulamadı', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
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
      res.setHeader('Content-Disposition', 'attachment; filename="ATS_Test_CV.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);

      logger.info('ATS Test CV generated successfully', {
        pdfSize: pdfBuffer.length
      });

    } catch (error) {
      logger.error('ATS Test CV generation failed:', error);
      res.status(500).json(createResponse(false, 'Test CV oluşturulamadı', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
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
            optional: ['street', 'state', 'postalCode']
          }
        },
        professionalSummary: {
          required: ['summary', 'targetPosition', 'yearsOfExperience', 'keySkills'],
          limits: {
            summary: { min: 100, max: 1000 },
            keySkills: { min: 3, max: 20 }
          }
        },
        workExperience: {
          required: ['companyName', 'position', 'location', 'startDate', 'achievements'],
          optional: ['endDate', 'technologies', 'industryType'],
          limits: {
            achievements: { min: 2, max: 10 },
            minimum: 1
          }
        },
        education: {
          required: ['institution', 'degree', 'fieldOfStudy', 'location', 'startDate'],
          optional: ['endDate', 'gpa', 'honors', 'relevantCoursework'],
          limits: {
            minimum: 1,
            gpa: { min: 0, max: 4 }
          }
        },
        skills: {
          structure: {
            technical: {
              category: 'string',
              items: [{ name: 'string', proficiencyLevel: 'enum' }]
            },
            languages: [{ language: 'string', proficiency: 'enum' }],
            soft: ['string']
          },
          enums: {
            proficiencyLevel: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
            languageProficiency: ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic']
          }
        },
        configuration: {
          required: ['targetJobTitle', 'language', 'cvType', 'templateStyle'],
          optional: ['targetCompany', 'jobDescription'],
          enums: {
            language: ['TURKISH', 'ENGLISH'],
            cvType: ['ATS_OPTIMIZED', 'TECHNICAL', 'EXECUTIVE'],
            templateStyle: ['MINIMAL', 'PROFESSIONAL', 'MODERN']
          },
          fixed: {
            includePhoto: false
          }
        },
        optional: ['certifications', 'projects']
      };

      res.json(createResponse(true, 'ATS CV Schema retrieved successfully', schemaStructure));

    } catch (error) {
      logger.error('Failed to get ATS schema:', error);
      res.status(500).json(createResponse(false, 'Schema bilgisi alınamadı'));
    }
  };

  /**
   * ATS Validation Tips - Frontend için ipuçları
   */
  getATSValidationTips = async (_req: Request, res: Response): Promise<void> => {
    try {
      const tips = {
        general: [
          'Use standard section headings like "WORK EXPERIENCE", "EDUCATION", "SKILLS"',
          'Keep formatting simple - avoid images, tables, or complex layouts',
          'Use a single-column layout',
          'Save as PDF or DOCX format',
          'Keep file size under 2MB'
        ],
        formatting: [
          'Use standard fonts: Arial, Calibri, Helvetica, Times New Roman',
          'Font size should be 11-12pt for body text, 14-16pt for headers',
          'Use 1-inch margins on all sides',
          'Use bullet points for achievements',
          'Align text to the left'
        ],
        content: [
          'Include relevant keywords from the job description',
          'Use action verbs and quantify achievements with numbers',
          'Keep summary section to 3-4 sentences',
          'List work experience in reverse chronological order',
          'Include only relevant information'
        ],
        keywords: [
          'Match exact job title if possible',
          'Include technical skills mentioned in job posting',
          'Use industry-specific terminology',
          'Avoid keyword stuffing - use naturally',
          'Include both acronyms and full terms (e.g., "AI" and "Artificial Intelligence")'
        ],
        avoid: [
          'Headers and footers',
          'Images, photos, or graphics',
          'Tables or multiple columns',
          'Special characters or symbols',
          'Creative fonts or colors',
          'Text boxes or shapes'
        ]
      };

      res.json(createResponse(true, 'ATS validation tips retrieved successfully', tips));

    } catch (error) {
      logger.error('Failed to get ATS tips:', error);
      res.status(500).json(createResponse(false, 'ATS ipuçları alınamadı'));
    }
  };
}