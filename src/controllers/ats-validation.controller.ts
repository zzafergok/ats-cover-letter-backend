import { Request, Response } from 'express';
import { ATSValidationService } from '../services/ats-validation.service';
import { ATSCVData } from '../types/cv.types';
import logger from '../config/logger';
import { createResponse } from '../utils/response';
import { z } from 'zod';

// Validation schema for ATS validation request
const ATSValidationRequestSchema = z.object({
  cvData: z.object({
    personalInfo: z.any(),
    professionalSummary: z.any(),
    workExperience: z.array(z.any()),
    education: z.array(z.any()),
    skills: z.any(),
    certifications: z.array(z.any()).optional(),
    projects: z.array(z.any()).optional(),
    configuration: z.any()
  }),
  jobDescription: z.string().optional()
});

export class ATSValidationController {
  private validationService: ATSValidationService;

  constructor() {
    this.validationService = ATSValidationService.getInstance();
  }

  /**
   * CV'yi ATS uyumluluğu açısından validate et
   */
  validateCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = ATSValidationRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json(createResponse(false, 'Invalid request data', {
          errors: validationResult.error.issues
        }));
        return;
      }

      const { cvData, jobDescription } = validationResult.data;

      logger.info('ATS validation request received', {
        applicantName: `${cvData.personalInfo?.firstName} ${cvData.personalInfo?.lastName}`,
        hasJobDescription: !!jobDescription,
        userId: req.user?.userId
      });

      // Perform ATS validation
      const atsResult = await this.validationService.validateCV(
        cvData as ATSCVData, 
        jobDescription
      );

      logger.info('ATS validation completed', {
        score: atsResult.score,
        issuesCount: atsResult.issues.length,
        userId: req.user?.userId
      });

      res.json(createResponse(true, 'ATS validation completed successfully', atsResult));

    } catch (error) {
      logger.error('ATS validation failed:', error);
      res.status(500).json(createResponse(false, 'ATS validation could not be completed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  /**
   * ATS validation sonuçlarını analiz et ve öneriler sun
   */
  getValidationAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { score } = req.params;
      const scoreNum = parseInt(score, 10);

      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        res.status(400).json(createResponse(false, 'Invalid score parameter'));
        return;
      }

      const analysis = this.generateScoreAnalysis(scoreNum);

      res.json(createResponse(true, 'Validation analysis retrieved successfully', analysis));

    } catch (error) {
      logger.error('Failed to get validation analysis:', error);
      res.status(500).json(createResponse(false, 'Analysis could not be generated'));
    }
  };

  /**
   * ATS best practices guide
   */
  getBestPractices = async (_req: Request, res: Response): Promise<void> => {
    try {
      const bestPractices = {
        formatting: {
          title: 'Formatting Best Practices',
          practices: [
            'Use a single-column layout',
            'Stick to standard fonts (Arial, Calibri, Times New Roman)',
            'Use 11-12pt font size for body text',
            'Maintain 1-inch margins on all sides',
            'Save as PDF or DOCX format',
            'Keep file size under 2MB'
          ]
        },
        content: {
          title: 'Content Optimization',
          practices: [
            'Include exact keywords from job description',
            'Use standard section headers (WORK EXPERIENCE, EDUCATION, SKILLS)',
            'Quantify achievements with specific numbers',
            'Write 3-4 sentence professional summary',
            'List experience in reverse chronological order',
            'Include relevant technical and soft skills'
          ]
        },
        keywords: {
          title: 'Keyword Strategy',
          practices: [
            'Match 60-80% of job posting keywords',
            'Include job title exactly as posted',
            'Use both acronyms and full terms (e.g., AI and Artificial Intelligence)',
            'Integrate keywords naturally into content',
            'Focus on hard skills and technical terms',
            'Include industry-specific terminology'
          ]
        },
        structure: {
          title: 'Structure Guidelines',
          practices: [
            'Start with contact information',
            'Follow with professional summary',
            'List work experience (most important section)',
            'Include education details',
            'End with skills and certifications',
            'Keep CV to 1-2 pages maximum'
          ]
        },
        avoid: {
          title: 'What to Avoid',
          practices: [
            'Photos or images',
            'Tables or multiple columns',
            'Headers and footers',
            'Graphics or charts',
            'Special characters or symbols',
            'Creative or unusual fonts',
            'Text boxes or shapes'
          ]
        }
      };

      res.json(createResponse(true, 'Best practices retrieved successfully', bestPractices));

    } catch (error) {
      logger.error('Failed to get best practices:', error);
      res.status(500).json(createResponse(false, 'Best practices could not be retrieved'));
    }
  };

  /**
   * Common ATS issues ve çözümleri
   */
  getCommonIssues = async (_req: Request, res: Response): Promise<void> => {
    try {
      const commonIssues = {
        parsing: {
          title: 'ATS Parsing Issues',
          issues: [
            {
              problem: 'ATS cannot read text in images or graphics',
              solution: 'Use plain text format for all content',
              impact: 'Critical - content becomes invisible to ATS'
            },
            {
              problem: 'Complex formatting confuses parsing',
              solution: 'Use simple, linear layout with clear sections',
              impact: 'High - information may be misplaced or lost'
            },
            {
              problem: 'Non-standard section headers',
              solution: 'Use conventional headers like "WORK EXPERIENCE" and "EDUCATION"',
              impact: 'Medium - sections may not be properly categorized'
            }
          ]
        },
        keywords: {
          title: 'Keyword Optimization Issues',
          issues: [
            {
              problem: 'Missing exact job title keywords',
              solution: 'Include exact job title from posting in summary or objective',
              impact: 'High - may not appear in filtered search results'
            },
            {
              problem: 'Low keyword density',
              solution: 'Naturally integrate 60-80% of job posting keywords',
              impact: 'High - CV may rank lower in search results'
            },
            {
              problem: 'Using synonyms instead of exact terms',
              solution: 'Use exact terminology from job description',
              impact: 'Medium - may miss keyword matching algorithms'
            }
          ]
        },
        formatting: {
          title: 'Formatting Problems',
          issues: [
            {
              problem: 'Inconsistent date formats',
              solution: 'Use consistent MM/YYYY format throughout',
              impact: 'Low - may cause minor parsing errors'
            },
            {
              problem: 'Mixed font styles and sizes',
              solution: 'Stick to one professional font family',
              impact: 'Low - affects readability and parsing accuracy'
            },
            {
              problem: 'Insufficient white space',
              solution: 'Ensure proper spacing between sections',
              impact: 'Medium - can affect content parsing accuracy'
            }
          ]
        }
      };

      res.json(createResponse(true, 'Common issues retrieved successfully', commonIssues));

    } catch (error) {
      logger.error('Failed to get common issues:', error);
      res.status(500).json(createResponse(false, 'Common issues could not be retrieved'));
    }
  };

  /**
   * Score analizi oluştur
   */
  private generateScoreAnalysis(score: number) {
    let level: string;
    let description: string;
    let recommendations: string[];
    let nextSteps: string[];

    if (score >= 85) {
      level = 'Excellent';
      description = 'Your CV is highly optimized for ATS systems and should pass most automated screenings successfully.';
      recommendations = [
        'Your CV is in excellent shape for ATS systems',
        'Consider minor tweaks based on specific job descriptions',
        'Keep updating content for different roles'
      ];
      nextSteps = [
        'Tailor keywords for each application',
        'Keep content fresh and updated',
        'Monitor application success rates'
      ];
    } else if (score >= 70) {
      level = 'Good';
      description = 'Your CV is well-optimized for ATS but has room for improvement in certain areas.';
      recommendations = [
        'Address any keyword gaps identified',
        'Improve quantification of achievements',
        'Optimize professional summary'
      ];
      nextSteps = [
        'Review and address flagged issues',
        'Add more relevant keywords',
        'Enhance achievement descriptions'
      ];
    } else if (score >= 55) {
      level = 'Fair';
      description = 'Your CV needs significant improvements to be fully ATS-compatible.';
      recommendations = [
        'Focus on keyword optimization',
        'Improve content structure and formatting',
        'Add more quantified achievements'
      ];
      nextSteps = [
        'Restructure CV sections',
        'Add missing keywords from job descriptions',
        'Quantify all achievements with numbers'
      ];
    } else {
      level = 'Needs Improvement';
      description = 'Your CV requires major revisions to pass ATS screening effectively.';
      recommendations = [
        'Complete restructuring needed',
        'Add essential keywords and skills',
        'Improve formatting for ATS compatibility'
      ];
      nextSteps = [
        'Start with a fresh ATS-optimized template',
        'Research industry keywords thoroughly',
        'Follow ATS formatting guidelines strictly'
      ];
    }

    return {
      score,
      level,
      description,
      recommendations,
      nextSteps,
      benchmarks: {
        excellent: { min: 85, max: 100 },
        good: { min: 70, max: 84 },
        fair: { min: 55, max: 69 },
        poor: { min: 0, max: 54 }
      }
    };
  }
}