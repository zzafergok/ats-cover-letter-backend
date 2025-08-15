import { Request, Response } from 'express';
import { JobPostingAnalysisService } from '../services/jobPostingAnalysis.service';
import { CVJobMatchService } from '../services/cvJobMatch.service';
import { ATSOptimizationService } from '../services/atsOptimization.service';
import { UserProfileService } from '../services/userProfile.service';
import { DatabaseService } from '../services/database.service';
import logger from '../config/logger';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import {
  JobPostingAnalysisRequest,
  CVJobMatchRequest,
  ATSOptimizationRequest,
  ATSAnalysisResponse,
  BatchOptimizationRequest,
} from '../types/ats.types';

export class ATSController {
  private jobPostingAnalysisService: JobPostingAnalysisService;
  private cvJobMatchService: CVJobMatchService;
  private atsOptimizationService: ATSOptimizationService;
  private userProfileService: UserProfileService;
  private databaseService: DatabaseService;

  constructor() {
    this.jobPostingAnalysisService = JobPostingAnalysisService.getInstance();
    this.cvJobMatchService = CVJobMatchService.getInstance();
    this.atsOptimizationService = ATSOptimizationService.getInstance();
    this.userProfileService = UserProfileService.getInstance();
    this.databaseService = DatabaseService.getInstance();
  }

  // Job Posting Analysis
  async analyzeJobPosting(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
      }

      const request: JobPostingAnalysisRequest = req.body;

      // Validate request
      if (!request.jobPostingText && !request.jobPostingUrl) {
        res
          .status(400)
          .json(
            createErrorResponse('Either job posting text or URL is required')
          );
        return;
      }

      logger.info('Analyzing job posting', {
        userId,
        hasUrl: !!request.jobPostingUrl,
      });

      // Perform analysis
      const analysis = await this.jobPostingAnalysisService.analyzeJobPosting(
        userId,
        request
      );

      // Store in database
      await this.storeJobAnalysis(analysis);

      const response: ATSAnalysisResponse = {
        success: true,
        data: { jobAnalysis: analysis },
        message: 'Job posting analyzed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to analyze job posting', {
        error,
        userId: req.user?.userId,
      });
      res
        .status(500)
        .json(
          createErrorResponse('Failed to analyze job posting', error as Error)
        );
    }
  }

  // CV-Job Matching
  async analyzeMatch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
      }

      const request: CVJobMatchRequest = req.body;
      const { jobAnalysisId } = req.params;

      if (!jobAnalysisId) {
        res
          .status(400)
          .json(createErrorResponse('Job analysis ID is required'));
        return;
      }

      logger.info('Analyzing CV-job match', { userId, jobAnalysisId });

      // Get job analysis from database
      const jobAnalysis = await this.getJobAnalysisById(jobAnalysisId, userId);
      if (!jobAnalysis) {
        res.status(404).json(createErrorResponse('Job analysis not found'));
        return;
      }

      // Perform match analysis
      const matchAnalysis = await this.cvJobMatchService.analyzeMatch(
        userId,
        jobAnalysis,
        { ...request, jobAnalysisId }
      );

      // Store in database
      await this.storeMatchAnalysis(matchAnalysis);

      const response: ATSAnalysisResponse = {
        success: true,
        data: { matchAnalysis },
        message: 'CV-job match analysis completed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to analyze CV-job match', {
        error,
        userId: req.user?.userId,
      });
      res
        .status(500)
        .json(
          createErrorResponse('Failed to analyze CV-job match', error as Error)
        );
    }
  }

  // ATS Optimization
  async optimizeCV(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
      }

      const request: ATSOptimizationRequest = req.body;
      const { matchAnalysisId } = req.params;

      if (!matchAnalysisId) {
        res
          .status(400)
          .json(createErrorResponse('Match analysis ID is required'));
        return;
      }

      logger.info('Optimizing CV for ATS', {
        userId,
        matchAnalysisId,
        level: request.optimizationLevel,
      });

      // Get match analysis and job analysis from database
      const matchAnalysis = await this.getMatchAnalysisById(
        matchAnalysisId,
        userId
      );
      if (!matchAnalysis) {
        res.status(404).json(createErrorResponse('Match analysis not found'));
        return;
      }

      const jobAnalysis = await this.getJobAnalysisById(
        matchAnalysis.jobAnalysisId,
        userId
      );
      if (!jobAnalysis) {
        res.status(404).json(createErrorResponse('Job analysis not found'));
        return;
      }

      // Perform optimization
      const optimization = await this.atsOptimizationService.optimizeCV(
        userId,
        matchAnalysis,
        jobAnalysis,
        { ...request, matchAnalysisId }
      );

      // Store in database
      await this.storeOptimization(optimization);

      const response: ATSAnalysisResponse = {
        success: true,
        data: { optimization },
        message: 'CV optimized successfully for ATS',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to optimize CV', {
        error,
        userId: req.user?.userId,
      });
      res
        .status(500)
        .json(createErrorResponse('Failed to optimize CV', error as Error));
    }
  }

  // Complete ATS Analysis Pipeline
  async completeAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
      }

      const {
        jobPostingAnalysis,
        optimizationLevel = 'ADVANCED',
        targetSections,
      } = req.body;

      logger.info('Starting complete ATS analysis pipeline', {
        userId,
        optimizationLevel,
      });

      // Step 1: Analyze job posting
      const jobAnalysis =
        await this.jobPostingAnalysisService.analyzeJobPosting(
          userId,
          jobPostingAnalysis
        );
      await this.storeJobAnalysis(jobAnalysis);

      // Step 2: Analyze CV-job match
      const matchAnalysis = await this.cvJobMatchService.analyzeMatch(
        userId,
        jobAnalysis,
        { jobAnalysisId: jobAnalysis.id, useUserProfile: true }
      );
      await this.storeMatchAnalysis(matchAnalysis);

      // Step 3: Optimize CV
      const optimization = await this.atsOptimizationService.optimizeCV(
        userId,
        matchAnalysis,
        jobAnalysis,
        {
          matchAnalysisId: matchAnalysis.id,
          optimizationLevel: optimizationLevel || 'ADVANCED',
          targetSections,
        }
      );
      await this.storeOptimization(optimization);

      const response: ATSAnalysisResponse = {
        success: true,
        data: {
          jobAnalysis,
          matchAnalysis,
          optimization,
        },
        message:
          'Complete ATS analysis and optimization completed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to complete ATS analysis', {
        error,
        userId: req.user?.userId,
      });
      res
        .status(500)
        .json(
          createErrorResponse('Failed to complete ATS analysis', error as Error)
        );
    }
  }

  // Get Analysis Results
  async getJobAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { analysisId } = req.params;

      if (!userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
      }

      const analysis = await this.getJobAnalysisById(analysisId, userId);
      if (!analysis) {
        res.status(404).json(createErrorResponse('Job analysis not found'));
        return;
      }

      res
        .status(200)
        .json(
          createSuccessResponse(analysis, 'Job analysis retrieved successfully')
        );
    } catch (error) {
      logger.error('Failed to get job analysis', {
        error,
        userId: req.user?.userId,
      });
      res
        .status(500)
        .json(
          createErrorResponse('Failed to get job analysis', error as Error)
        );
    }
  }

  async getMatchAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { matchId } = req.params;

      if (!userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
      }

      const matchAnalysis = await this.getMatchAnalysisById(matchId, userId);
      if (!matchAnalysis) {
        res.status(404).json(createErrorResponse('Match analysis not found'));
        return;
      }

      res
        .status(200)
        .json(
          createSuccessResponse(
            matchAnalysis,
            'Match analysis retrieved successfully'
          )
        );
    } catch (error) {
      logger.error('Failed to get match analysis', {
        error,
        userId: req.user?.userId,
      });
      res
        .status(500)
        .json(
          createErrorResponse('Failed to get match analysis', error as Error)
        );
    }
  }

  async getOptimization(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { optimizationId } = req.params;

      if (!userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
      }

      const optimization = await this.getOptimizationById(
        optimizationId,
        userId
      );
      if (!optimization) {
        res.status(404).json(createErrorResponse('Optimization not found'));
        return;
      }

      res
        .status(200)
        .json(
          createSuccessResponse(
            optimization,
            'Optimization retrieved successfully'
          )
        );
    } catch (error) {
      logger.error('Failed to get optimization', {
        error,
        userId: req.user?.userId,
      });
      res
        .status(500)
        .json(
          createErrorResponse('Failed to get optimization', error as Error)
        );
    }
  }

  // List User's Analyses
  async getUserAnalyses(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
      }

      const { page = 1, limit = 10, type } = req.query;

      logger.info('Getting user analyses', { userId, page, limit, type });

      const analyses = await this.getUserAnalysesPaginated(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        type as string
      );

      res
        .status(200)
        .json(
          createSuccessResponse(
            analyses,
            'User analyses retrieved successfully'
          )
        );
    } catch (error) {
      logger.error('Failed to get user analyses', {
        error,
        userId: req.user?.userId,
      });
      res
        .status(500)
        .json(
          createErrorResponse('Failed to get user analyses', error as Error)
        );
    }
  }

  // Apply Optimization to User Profile
  async applyOptimization(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { optimizationId } = req.params;

      if (!userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
      }

      logger.info('Applying optimization to user profile', {
        userId,
        optimizationId,
      });

      const optimization = await this.getOptimizationById(
        optimizationId,
        userId
      );
      if (!optimization) {
        res.status(404).json(createErrorResponse('Optimization not found'));
        return;
      }

      // Update user profile with optimized CV data
      await this.userProfileService.updateUserProfileFromCVTemplate(
        userId,
        optimization.optimizedCV
      );

      res
        .status(200)
        .json(
          createSuccessResponse(
            { applied: true },
            'Optimization applied to user profile successfully'
          )
        );
    } catch (error) {
      logger.error('Failed to apply optimization', {
        error,
        userId: req.user?.userId,
      });
      res
        .status(500)
        .json(
          createErrorResponse('Failed to apply optimization', error as Error)
        );
    }
  }

  // Batch Optimization (Future Enhancement)
  async batchOptimize(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(createErrorResponse('Authentication required'));
        return;
      }

      const request: BatchOptimizationRequest = req.body;

      // This would be implemented for processing multiple job postings at once
      res
        .status(501)
        .json(createErrorResponse('Batch optimization not yet implemented'));
    } catch (error) {
      logger.error('Failed to batch optimize', {
        error,
        userId: req.user?.userId,
      });
      res
        .status(500)
        .json(createErrorResponse('Failed to batch optimize', error as Error));
    }
  }

  // Private helper methods
  private async storeJobAnalysis(analysis: any): Promise<void> {
    try {
      // Database connection would be handled here
      // const db = await this.databaseService.getConnection();

      // In a real implementation, you would store the analysis in the database
      // For now, we'll just log it
      logger.info('Job analysis would be stored in database', {
        analysisId: analysis.id,
        userId: analysis.userId,
      });

      // Example database store operation:
      // await db.jobPostingAnalysis.create({
      //   data: {
      //     id: analysis.id,
      //     userId: analysis.userId,
      //     jobPostingText: analysis.jobPostingText,
      //     companyName: analysis.companyName,
      //     positionTitle: analysis.positionTitle,
      //     requiredSkills: analysis.requiredSkills,
      //     // ... other fields
      //   }
      // });
    } catch (error) {
      logger.error('Failed to store job analysis', {
        error,
        analysisId: analysis.id,
      });
      throw error;
    }
  }

  private async storeMatchAnalysis(matchAnalysis: any): Promise<void> {
    try {
      logger.info('Match analysis would be stored in database', {
        matchId: matchAnalysis.id,
        userId: matchAnalysis.userId,
        score: matchAnalysis.overallScore,
      });
    } catch (error) {
      logger.error('Failed to store match analysis', {
        error,
        matchId: matchAnalysis.id,
      });
      throw error;
    }
  }

  private async storeOptimization(optimization: any): Promise<void> {
    try {
      logger.info('Optimization would be stored in database', {
        optimizationId: optimization.id,
        userId: optimization.userId,
        improvement: optimization.improvementPercentage,
      });
    } catch (error) {
      logger.error('Failed to store optimization', {
        error,
        optimizationId: optimization.id,
      });
      throw error;
    }
  }

  private async getJobAnalysisById(
    analysisId: string,
    userId: string
  ): Promise<any> {
    try {
      // In a real implementation, fetch from database
      logger.info('Job analysis would be fetched from database', {
        analysisId,
        userId,
      });

      // For now, return null to indicate not found
      return null;
    } catch (error) {
      logger.error('Failed to get job analysis by ID', {
        error,
        analysisId,
        userId,
      });
      throw error;
    }
  }

  private async getMatchAnalysisById(
    matchId: string,
    userId: string
  ): Promise<any> {
    try {
      logger.info('Match analysis would be fetched from database', {
        matchId,
        userId,
      });
      return null;
    } catch (error) {
      logger.error('Failed to get match analysis by ID', {
        error,
        matchId,
        userId,
      });
      throw error;
    }
  }

  private async getOptimizationById(
    optimizationId: string,
    userId: string
  ): Promise<any> {
    try {
      logger.info('Optimization would be fetched from database', {
        optimizationId,
        userId,
      });
      return null;
    } catch (error) {
      logger.error('Failed to get optimization by ID', {
        error,
        optimizationId,
        userId,
      });
      throw error;
    }
  }

  private async getUserAnalysesPaginated(
    userId: string,
    page: number,
    limit: number,
    type?: string
  ): Promise<any> {
    try {
      logger.info('User analyses would be fetched from database', {
        userId,
        page,
        limit,
        type,
      });

      // Return empty result for now
      return {
        analyses: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get user analyses', { error, userId });
      throw error;
    }
  }
}
