import { ClaudeService } from './claude.wrapper.service';
import logger from '../config/logger';
import {
  JobPostingAnalysisRequest,
  JobPostingAnalysisResult,
  SalaryRange,
} from '../types/ats.types';

export class JobPostingAnalysisService {
  private static instance: JobPostingAnalysisService;
  private claudeService: ClaudeService;

  constructor() {
    this.claudeService = ClaudeService.getInstance();
  }

  public static getInstance(): JobPostingAnalysisService {
    if (!JobPostingAnalysisService.instance) {
      JobPostingAnalysisService.instance = new JobPostingAnalysisService();
    }
    return JobPostingAnalysisService.instance;
  }

  async analyzeJobPosting(
    userId: string,
    request: JobPostingAnalysisRequest
  ): Promise<JobPostingAnalysisResult> {
    try {
      logger.info('Starting job posting analysis', { userId, request });

      // Extract text from URL if provided
      let jobPostingText = request.jobPostingText || '';
      if (request.jobPostingUrl && !jobPostingText) {
        jobPostingText = await this.extractTextFromUrl(request.jobPostingUrl);
      }

      if (!jobPostingText.trim()) {
        throw new Error('No job posting text found to analyze');
      }

      // Use Claude to analyze the job posting
      const analysisPrompt = this.buildAnalysisPrompt(jobPostingText);
      const claudeResponse =
        await this.claudeService.generateContent(analysisPrompt);

      // Parse Claude's response
      const parsedAnalysis = this.parseClaudeResponse(claudeResponse);

      // Create the analysis result
      const analysisResult: JobPostingAnalysisResult = {
        id: this.generateId(),
        userId,
        jobPostingUrl: request.jobPostingUrl,
        jobPostingText,
        companyName:
          request.companyName ||
          parsedAnalysis.companyName ||
          'Unknown Company',
        positionTitle:
          request.positionTitle ||
          parsedAnalysis.positionTitle ||
          'Unknown Position',
        requiredSkills: parsedAnalysis.requiredSkills || [],
        preferredSkills: parsedAnalysis.preferredSkills || [],
        requiredExperience: parsedAnalysis.requiredExperience || [],
        educationRequirements: parsedAnalysis.educationRequirements || [],
        keywords: parsedAnalysis.keywords || [],
        location: parsedAnalysis.location,
        workMode: parsedAnalysis.workMode,
        employmentType: parsedAnalysis.employmentType,
        salaryRange: parsedAnalysis.salaryRange,
        atsKeywords: parsedAnalysis.atsKeywords || [],
        industryType: parsedAnalysis.industryType,
        seniorityLevel: parsedAnalysis.seniorityLevel,
        analysisStatus: 'COMPLETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      logger.info('Job posting analysis completed successfully', {
        userId,
        analysisId: analysisResult.id,
        skillsFound: analysisResult.requiredSkills.length,
        keywordsFound: analysisResult.keywords.length,
      });

      return analysisResult;
    } catch (error) {
      logger.error('Failed to analyze job posting', { userId, error });
      throw error;
    }
  }

  private async extractTextFromUrl(url: string): Promise<string> {
    try {
      // Basic URL validation
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol');
      }

      // For now, we'll return an error asking user to paste text manually
      // In a production environment, you might want to use a web scraping service
      throw new Error(
        'URL extraction not implemented. Please paste the job posting text manually.'
      );

      // Future implementation could use puppeteer or similar:
      // const response = await fetch(url);
      // const html = await response.text();
      // return this.extractTextFromHtml(html);
    } catch (error) {
      logger.error('Failed to extract text from URL', { url, error });
      throw new Error(
        'Could not extract text from URL. Please copy and paste the job posting text instead.'
      );
    }
  }

  private buildAnalysisPrompt(jobPostingText: string): string {
    return `
Please analyze the following job posting and extract key information for ATS optimization. 
Return your response as a JSON object with the exact structure specified below.

Job Posting Text:
"""
${jobPostingText}
"""

Please analyze and return a JSON object with this exact structure:
{
  "companyName": "string",
  "positionTitle": "string",
  "requiredSkills": ["skill1", "skill2", ...],
  "preferredSkills": ["skill1", "skill2", ...],
  "requiredExperience": [
    {
      "skillArea": "string",
      "minimumYears": number,
      "maximumYears": number,
      "isRequired": boolean,
      "description": "string"
    }
  ],
  "educationRequirements": [
    {
      "level": "HIGH_SCHOOL|ASSOCIATE|BACHELOR|MASTER|PHD",
      "field": "string",
      "isRequired": boolean,
      "alternatives": ["alternative1", "alternative2"]
    }
  ],
  "keywords": [
    {
      "keyword": "string",
      "category": "TECHNICAL|SOFT_SKILL|INDUSTRY|TOOL|FRAMEWORK|CERTIFICATION|OTHER",
      "importance": "HIGH|MEDIUM|LOW",
      "frequency": number,
      "context": "string"
    }
  ],
  "location": "string",
  "workMode": "ONSITE|REMOTE|HYBRID",
  "employmentType": "FULL_TIME|PART_TIME|CONTRACT|FREELANCE|INTERNSHIP",
  "salaryRange": {
    "minimum": number,
    "maximum": number,
    "currency": "string",
    "period": "HOURLY|MONTHLY|YEARLY"
  },
  "atsKeywords": ["keyword1", "keyword2", ...],
  "industryType": "string",
  "seniorityLevel": "ENTRY|JUNIOR|MID|SENIOR|LEAD|EXECUTIVE"
}

Guidelines:
1. Extract all technical skills, soft skills, and tools mentioned
2. Identify keywords that are likely important for ATS systems
3. Determine experience requirements by skill area
4. Classify keywords by importance based on frequency and context
5. Identify the seniority level from job title and requirements
6. Extract salary information if mentioned
7. If information is not available, omit the field or use null
8. Be thorough in keyword extraction - ATS systems rely heavily on keyword matching
9. Pay special attention to industry-specific terms and certifications

Return only the JSON object, no additional text or explanation.
`;
  }

  private parseClaudeResponse(response: string): any {
    try {
      // Clean the response - remove any markdown formatting
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.substring(7);
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.substring(3);
      }
      if (cleanResponse.endsWith('```')) {
        cleanResponse = cleanResponse.substring(0, cleanResponse.length - 3);
      }

      const parsed = JSON.parse(cleanResponse);

      // Validate and sanitize the parsed response
      return this.validateAndSanitizeAnalysis(parsed);
    } catch (error) {
      logger.error('Failed to parse Claude response', { response, error });

      // Fallback parsing - extract what we can
      return this.fallbackParseResponse(response);
    }
  }

  private validateAndSanitizeAnalysis(parsed: any): any {
    const sanitized = {
      companyName:
        typeof parsed.companyName === 'string' ? parsed.companyName : null,
      positionTitle:
        typeof parsed.positionTitle === 'string' ? parsed.positionTitle : null,
      requiredSkills: Array.isArray(parsed.requiredSkills)
        ? parsed.requiredSkills.filter((s: any) => typeof s === 'string')
        : [],
      preferredSkills: Array.isArray(parsed.preferredSkills)
        ? parsed.preferredSkills.filter((s: any) => typeof s === 'string')
        : [],
      requiredExperience: Array.isArray(parsed.requiredExperience)
        ? parsed.requiredExperience
        : [],
      educationRequirements: Array.isArray(parsed.educationRequirements)
        ? parsed.educationRequirements
        : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      location: typeof parsed.location === 'string' ? parsed.location : null,
      workMode: this.validateWorkMode(parsed.workMode),
      employmentType: this.validateEmploymentType(parsed.employmentType),
      salaryRange: this.validateSalaryRange(parsed.salaryRange),
      atsKeywords: Array.isArray(parsed.atsKeywords)
        ? parsed.atsKeywords.filter((k: any) => typeof k === 'string')
        : [],
      industryType:
        typeof parsed.industryType === 'string' ? parsed.industryType : null,
      seniorityLevel: this.validateSeniorityLevel(parsed.seniorityLevel),
    };

    return sanitized;
  }

  private validateWorkMode(
    workMode: any
  ): 'ONSITE' | 'REMOTE' | 'HYBRID' | undefined {
    const validModes = ['ONSITE', 'REMOTE', 'HYBRID'];
    return validModes.includes(workMode) ? workMode : undefined;
  }

  private validateEmploymentType(
    employmentType: any
  ):
    | 'FULL_TIME'
    | 'PART_TIME'
    | 'CONTRACT'
    | 'FREELANCE'
    | 'INTERNSHIP'
    | undefined {
    const validTypes = [
      'FULL_TIME',
      'PART_TIME',
      'CONTRACT',
      'FREELANCE',
      'INTERNSHIP',
    ];
    return validTypes.includes(employmentType) ? employmentType : undefined;
  }

  private validateSeniorityLevel(
    seniorityLevel: any
  ): 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE' | undefined {
    const validLevels = [
      'ENTRY',
      'JUNIOR',
      'MID',
      'SENIOR',
      'LEAD',
      'EXECUTIVE',
    ];
    return validLevels.includes(seniorityLevel) ? seniorityLevel : undefined;
  }

  private validateSalaryRange(salaryRange: any): SalaryRange | undefined {
    if (!salaryRange || typeof salaryRange !== 'object') return undefined;

    const validPeriods = ['HOURLY', 'MONTHLY', 'YEARLY'];
    if (!validPeriods.includes(salaryRange.period)) return undefined;

    return {
      minimum:
        typeof salaryRange.minimum === 'number'
          ? salaryRange.minimum
          : undefined,
      maximum:
        typeof salaryRange.maximum === 'number'
          ? salaryRange.maximum
          : undefined,
      currency:
        typeof salaryRange.currency === 'string' ? salaryRange.currency : 'TRY',
      period: salaryRange.period,
    };
  }

  private fallbackParseResponse(response: string): any {
    // Basic fallback parsing - extract what we can from text
    logger.warn('Using fallback parsing for Claude response');

    return {
      companyName: null,
      positionTitle: null,
      requiredSkills: this.extractSkillsFromText(response),
      preferredSkills: [],
      requiredExperience: [],
      educationRequirements: [],
      keywords: [],
      atsKeywords: [],
      industryType: null,
      seniorityLevel: null,
    };
  }

  private extractSkillsFromText(text: string): string[] {
    // Simple keyword extraction as fallback
    const commonSkills = [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'Python',
      'Java',
      'SQL',
      'AWS',
      'Docker',
      'Kubernetes',
      'Git',
      'HTML',
      'CSS',
      'MongoDB',
      'PostgreSQL',
      'Express',
      'Angular',
      'Vue.js',
      'REST API',
      'GraphQL',
      'Microservices',
    ];

    const foundSkills: string[] = [];
    const lowerText = text.toLowerCase();

    commonSkills.forEach((skill) => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return foundSkills;
  }

  private generateId(): string {
    return (
      'job_analysis_' +
      Date.now() +
      '_' +
      Math.random().toString(36).substr(2, 9)
    );
  }

  // Utility method to get analysis by ID (would typically involve database lookup)
  async getAnalysisById(
    analysisId: string
  ): Promise<JobPostingAnalysisResult | null> {
    // This would typically query the database
    // For now, we'll return null as a placeholder
    logger.info('Getting analysis by ID', { analysisId });
    return null;
  }

  // Method to re-analyze a job posting with updated parameters
  async reanalyzeJobPosting(
    analysisId: string,
    userId: string,
    updates: Partial<JobPostingAnalysisRequest>
  ): Promise<JobPostingAnalysisResult> {
    try {
      // Get existing analysis (would come from database)
      const existingAnalysis = await this.getAnalysisById(analysisId);
      if (!existingAnalysis) {
        throw new Error('Analysis not found');
      }

      // Merge updates with existing data
      const updatedRequest: JobPostingAnalysisRequest = {
        jobPostingText:
          updates.jobPostingText || existingAnalysis.jobPostingText,
        jobPostingUrl: updates.jobPostingUrl || existingAnalysis.jobPostingUrl,
        companyName: updates.companyName || existingAnalysis.companyName,
        positionTitle: updates.positionTitle || existingAnalysis.positionTitle,
      };

      // Re-run analysis
      return await this.analyzeJobPosting(userId, updatedRequest);
    } catch (error) {
      logger.error('Failed to re-analyze job posting', {
        analysisId,
        userId,
        error,
      });
      throw error;
    }
  }
}
