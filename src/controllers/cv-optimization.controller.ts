import { Request, Response } from 'express';
import { CVOptimizationService } from '../services/cv-optimization.service';
import { ATSCVData } from '../types/cv.types';
import logger from '../config/logger';
import { createResponse } from '../utils/response';
import { z } from 'zod';

// Validation schema for optimization request
const OptimizationRequestSchema = z.object({
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
  jobDescription: z.string().min(50).max(10000)
});

export class CVOptimizationController {
  private optimizationService: CVOptimizationService;

  constructor() {
    this.optimizationService = CVOptimizationService.getInstance();
  }

  /**
   * CV'yi job description'a göre optimize et
   */
  optimizeCV = async (req: Request, res: Response): Promise<void> => {
    try {
      const validationResult = OptimizationRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json(createResponse(false, 'Invalid request data', {
          errors: validationResult.error.issues
        }));
        return;
      }

      const { cvData, jobDescription } = validationResult.data;

      logger.info('CV optimization request received', {
        applicantName: `${cvData.personalInfo?.firstName} ${cvData.personalInfo?.lastName}`,
        targetPosition: cvData.professionalSummary?.targetPosition,
        jobDescriptionLength: jobDescription.length,
        userId: req.user?.userId
      });

      // Perform CV optimization
      const optimizationResult = await this.optimizationService.optimizeCV(
        cvData as ATSCVData,
        jobDescription
      );

      logger.info('CV optimization completed', {
        originalScore: optimizationResult.originalScore,
        optimizedScore: optimizationResult.estimatedScore,
        improvement: optimizationResult.estimatedScore - optimizationResult.originalScore,
        improvementsCount: optimizationResult.improvements.length,
        addedKeywords: optimizationResult.keywordEnhancements.addedKeywords.length,
        userId: req.user?.userId
      });

      res.json(createResponse(true, 'CV optimization completed successfully', optimizationResult));

    } catch (error) {
      logger.error('CV optimization failed:', error);
      res.status(500).json(createResponse(false, 'CV optimization could not be completed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  /**
   * Keyword suggestions al
   */
  getKeywordSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobDescription, targetPosition } = req.body;

      if (!jobDescription || !targetPosition) {
        res.status(400).json(createResponse(false, 'Job description and target position are required'));
        return;
      }

      logger.info('Keyword suggestions request received', {
        targetPosition,
        jobDescriptionLength: jobDescription.length,
        userId: req.user?.userId
      });

      // Extract keywords from job description
      const suggestions = this.extractKeywordSuggestions(jobDescription, targetPosition);

      res.json(createResponse(true, 'Keyword suggestions retrieved successfully', suggestions));

    } catch (error) {
      logger.error('Failed to get keyword suggestions:', error);
      res.status(500).json(createResponse(false, 'Keyword suggestions could not be generated'));
    }
  };

  /**
   * CV section'larını optimize etmek için öneriler
   */
  getSectionOptimizationTips = async (req: Request, res: Response): Promise<void> => {
    try {
      const { section } = req.params;
      
      const validSections = [
        'professionalSummary', 
        'workExperience', 
        'education', 
        'skills', 
        'certifications', 
        'projects'
      ];

      if (!validSections.includes(section)) {
        res.status(400).json(createResponse(false, 'Invalid section parameter'));
        return;
      }

      const tips = this.getSectionSpecificTips(section);

      res.json(createResponse(true, `Optimization tips for ${section} retrieved successfully`, tips));

    } catch (error) {
      logger.error('Failed to get section optimization tips:', error);
      res.status(500).json(createResponse(false, 'Section optimization tips could not be retrieved'));
    }
  };

  /**
   * Quick keyword analysis
   */
  analyzeKeywords = async (req: Request, res: Response): Promise<void> => {
    try {
      const { content, jobDescription } = req.body;

      if (!content || !jobDescription) {
        res.status(400).json(createResponse(false, 'Content and job description are required'));
        return;
      }

      const analysis = this.performKeywordAnalysis(content, jobDescription);

      res.json(createResponse(true, 'Keyword analysis completed successfully', analysis));

    } catch (error) {
      logger.error('Keyword analysis failed:', error);
      res.status(500).json(createResponse(false, 'Keyword analysis could not be completed'));
    }
  };

  /**
   * Job description'dan keyword suggestions çıkar
   */
  private extractKeywordSuggestions(jobDescription: string, targetPosition: string) {
    const commonWords = new Set([
      'and', 'or', 'but', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of',
      'is', 'are', 'was', 'were', 'will', 'be', 'have', 'has', 'had', 'can', 'should', 'would'
    ]);

    const words = jobDescription
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));

    // Word frequency analysis
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const topKeywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, freq]) => ({ keyword: word, frequency: freq }));

    // Categorize keywords
    const categorized = {
      technical: topKeywords.filter(({ keyword }) => this.isTechnicalKeyword(keyword)),
      soft: topKeywords.filter(({ keyword }) => this.isSoftSkill(keyword)),
      industry: topKeywords.filter(({ keyword }) => this.isIndustryTerm(keyword, targetPosition)),
      general: topKeywords.filter(({ keyword }) => 
        !this.isTechnicalKeyword(keyword) && 
        !this.isSoftSkill(keyword) && 
        !this.isIndustryTerm(keyword, targetPosition)
      )
    };

    return {
      topKeywords: topKeywords.slice(0, 15),
      categorized,
      recommendations: {
        mustHave: topKeywords.slice(0, 5).map(k => k.keyword),
        shouldHave: topKeywords.slice(5, 10).map(k => k.keyword),
        niceToHave: topKeywords.slice(10, 15).map(k => k.keyword)
      }
    };
  }

  /**
   * Section-specific optimization tips
   */
  private getSectionSpecificTips(section: string) {
    const tips = {
      professionalSummary: {
        title: 'Professional Summary Optimization',
        tips: [
          'Include exact job title from posting in first sentence',
          'Mention 3-5 most important keywords from job description',
          'Keep between 3-4 sentences (100-300 words)',
          'Include years of experience if relevant',
          'Highlight your unique value proposition',
          'Use action verbs and quantifiable achievements'
        ],
        examples: [
          'Senior Software Engineer with 5+ years of experience in React, Node.js, and AWS...',
          'Digital Marketing Specialist skilled in SEO, social media campaigns, and analytics...'
        ]
      },
      workExperience: {
        title: 'Work Experience Optimization',
        tips: [
          'Use bullet points for achievements (3-5 per role)',
          'Start each bullet with action verbs',
          'Include quantifiable results (numbers, percentages)',
          'Incorporate relevant keywords naturally',
          'Focus on accomplishments, not just duties',
          'List experience in reverse chronological order'
        ],
        examples: [
          '• Increased website traffic by 150% through SEO optimization and content strategy',
          '• Led cross-functional team of 8 developers to deliver project 2 weeks ahead of schedule'
        ]
      },
      skills: {
        title: 'Skills Section Optimization',
        tips: [
          'Separate technical and soft skills',
          'Include exact technologies mentioned in job posting',
          'Group similar skills together (e.g., Programming Languages, Frameworks)',
          'Be specific (React.js instead of just JavaScript)',
          'Include proficiency levels if relevant',
          'Keep skills relevant to the target position'
        ],
        examples: [
          'Programming Languages: JavaScript, TypeScript, Python',
          'Frameworks: React.js, Node.js, Express.js, Django'
        ]
      },
      education: {
        title: 'Education Section Optimization',
        tips: [
          'Include degree, field of study, and institution',
          'Add graduation year if recent (within 10 years)',
          'Include GPA if 3.5 or higher',
          'List relevant coursework for entry-level positions',
          'Include honors, awards, or academic achievements',
          'Keep it concise but informative'
        ]
      },
      certifications: {
        title: 'Certifications Optimization',
        tips: [
          'List most relevant certifications first',
          'Include certification name and issuing organization',
          'Add issue and expiration dates',
          'Include credential IDs if verifiable online',
          'Focus on industry-recognized certifications',
          'Update expired certifications or remove them'
        ]
      },
      projects: {
        title: 'Projects Section Optimization',
        tips: [
          'Choose projects most relevant to target role',
          'Include project name, description, and technologies used',
          'Highlight your specific contributions',
          'Include links to live projects or repositories',
          'Quantify project impact where possible',
          'Keep descriptions concise but informative'
        ]
      }
    };

    return tips[section as keyof typeof tips] || { title: 'Section not found', tips: [] };
  }

  /**
   * Keyword analysis gerçekleştir
   */
  private performKeywordAnalysis(content: string, jobDescription: string) {
    const jobKeywords = this.extractJobKeywords(jobDescription);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    const foundKeywords = jobKeywords.filter(keyword =>
      contentWords.some(word => word.includes(keyword.toLowerCase()))
    );
    
    const missingKeywords = jobKeywords.filter(keyword =>
      !foundKeywords.includes(keyword)
    );
    
    const keywordDensity = foundKeywords.length / jobKeywords.length;
    
    let score = 0;
    if (keywordDensity >= 0.7) score = 90;
    else if (keywordDensity >= 0.5) score = 75;
    else if (keywordDensity >= 0.3) score = 60;
    else score = 40;

    return {
      score,
      keywordDensity: Math.round(keywordDensity * 100),
      totalJobKeywords: jobKeywords.length,
      foundKeywords: foundKeywords.slice(0, 10),
      missingKeywords: missingKeywords.slice(0, 10),
      recommendations: this.generateKeywordRecommendations(keywordDensity, missingKeywords)
    };
  }

  /**
   * Job description'dan keywords çıkar
   */
  private extractJobKeywords(jobDescription: string): string[] {
    const commonWords = new Set([
      'and', 'or', 'but', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of'
    ]);

    const words = jobDescription
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));

    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Technical keyword kontrolü
   */
  private isTechnicalKeyword(keyword: string): boolean {
    const techTerms = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'express',
      'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'docker', 'kubernetes', 'git'
    ];
    return techTerms.includes(keyword.toLowerCase());
  }

  /**
   * Soft skill kontrolü
   */
  private isSoftSkill(keyword: string): boolean {
    const softSkills = [
      'leadership', 'communication', 'teamwork', 'management', 'analytical', 'creative',
      'problem', 'solving', 'organized', 'detail', 'time', 'project'
    ];
    return softSkills.some(skill => keyword.toLowerCase().includes(skill));
  }

  /**
   * Industry term kontrolü
   */
  private isIndustryTerm(keyword: string, targetPosition: string): boolean {
    const position = targetPosition.toLowerCase();
    
    if (position.includes('developer') || position.includes('engineer')) {
      return ['development', 'engineering', 'software', 'application', 'system'].includes(keyword);
    }
    
    if (position.includes('marketing')) {
      return ['marketing', 'campaign', 'digital', 'social', 'brand', 'analytics'].includes(keyword);
    }
    
    if (position.includes('manager')) {
      return ['management', 'strategy', 'planning', 'budget', 'team'].includes(keyword);
    }
    
    return false;
  }

  /**
   * Keyword recommendations oluştur
   */
  private generateKeywordRecommendations(density: number, missingKeywords: string[]) {
    const recommendations = [];
    
    if (density < 0.3) {
      recommendations.push('Your content has low keyword alignment. Consider rewriting sections to include more relevant terms.');
      recommendations.push(`Add these high-priority keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
    } else if (density < 0.5) {
      recommendations.push('Good keyword coverage, but there\'s room for improvement.');
      recommendations.push(`Consider adding: ${missingKeywords.slice(0, 3).join(', ')}`);
    } else if (density < 0.7) {
      recommendations.push('Strong keyword alignment. Minor optimizations can push it to excellent.');
      recommendations.push(`Optional additions: ${missingKeywords.slice(0, 2).join(', ')}`);
    } else {
      recommendations.push('Excellent keyword optimization! Your content is well-aligned with the job requirements.');
    }
    
    return recommendations;
  }
}