import { ClaudeService } from './claude.wrapper.service';
import { UserProfileService } from './userProfile.service';
import logger from '../config/logger';
import {
  CVJobMatchRequest,
  CVJobMatchResult,
  SkillsMatchAnalysis,
  ExperienceMatchAnalysis,
  EducationMatchAnalysis,
  KeywordMatchAnalysis,
  JobPostingAnalysisResult,
  WeakArea,
  StrengthArea,
  OptimizationRecommendation,
  PartialSkillMatch,
  ExperienceAreaMatch,
  RelevantExperience,
  UserEducationSummary,
  PresentKeyword,
} from '../types/ats.types';
import { CVTemplateData } from '../types/cvTemplate.types';

export class CVJobMatchService {
  private static instance: CVJobMatchService;
  private claudeService: ClaudeService;
  private userProfileService: UserProfileService;

  constructor() {
    this.claudeService = ClaudeService.getInstance();
    this.userProfileService = UserProfileService.getInstance();
  }

  public static getInstance(): CVJobMatchService {
    if (!CVJobMatchService.instance) {
      CVJobMatchService.instance = new CVJobMatchService();
    }
    return CVJobMatchService.instance;
  }

  async analyzeMatch(
    userId: string,
    jobAnalysis: JobPostingAnalysisResult,
    request: CVJobMatchRequest
  ): Promise<CVJobMatchResult> {
    try {
      logger.info('Starting CV-Job match analysis', {
        userId,
        jobAnalysisId: request.jobAnalysisId,
      });

      // Get CV data - either from request or user profile
      let cvData: CVTemplateData;
      if (request.cvData) {
        cvData = request.cvData;
      } else {
        cvData =
          await this.userProfileService.getUserProfileAsCVTemplate(userId);
      }

      // Perform detailed analysis
      const skillsMatch = await this.analyzeSkillsMatch(cvData, jobAnalysis);
      const experienceMatch = await this.analyzeExperienceMatch(
        cvData,
        jobAnalysis
      );
      const educationMatch = await this.analyzeEducationMatch(
        cvData,
        jobAnalysis
      );
      const keywordMatch = await this.analyzeKeywordMatch(cvData, jobAnalysis);

      // Calculate overall score
      const overallScore = this.calculateOverallScore(
        skillsMatch,
        experienceMatch,
        educationMatch,
        keywordMatch
      );

      // Identify gaps and strengths
      const { missingSkills, missingKeywords, weakAreas, strengthAreas } =
        await this.identifyGapsAndStrengths(
          cvData,
          jobAnalysis,
          skillsMatch,
          experienceMatch,
          educationMatch,
          keywordMatch
        );

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        cvData,
        jobAnalysis,
        missingSkills,
        missingKeywords,
        weakAreas
      );

      const matchResult: CVJobMatchResult = {
        id: this.generateId(),
        userId,
        jobAnalysisId: request.jobAnalysisId,
        overallScore,
        skillsMatch,
        experienceMatch,
        educationMatch,
        keywordMatch,
        missingSkills,
        missingKeywords,
        weakAreas,
        strengthAreas,
        recommendations,
        matchStatus: 'COMPLETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      logger.info('CV-Job match analysis completed', {
        userId,
        matchId: matchResult.id,
        overallScore: matchResult.overallScore,
        skillsScore: skillsMatch.score,
        keywordScore: keywordMatch.score,
      });

      return matchResult;
    } catch (error) {
      logger.error('Failed to analyze CV-Job match', { userId, error });
      throw error;
    }
  }

  private async analyzeSkillsMatch(
    cvData: CVTemplateData,
    jobAnalysis: JobPostingAnalysisResult
  ): Promise<SkillsMatchAnalysis> {
    const requiredSkills = jobAnalysis.requiredSkills || [];
    const preferredSkills = jobAnalysis.preferredSkills || [];
    const allJobSkills = [...requiredSkills, ...preferredSkills];

    // Extract all user skills
    const userSkills = [
      ...(cvData.skills || []),
      ...(cvData.technicalSkills?.frontend || []),
      ...(cvData.technicalSkills?.backend || []),
      ...(cvData.technicalSkills?.database || []),
      ...(cvData.technicalSkills?.tools || []),
    ];

    // Find exact matches
    const exactMatches = allJobSkills.filter((jobSkill) =>
      userSkills.some((userSkill) => this.isSkillMatch(jobSkill, userSkill))
    );

    // Find partial matches using semantic similarity
    const partialMatches: PartialSkillMatch[] =
      await this.findPartialSkillMatches(
        allJobSkills.filter((skill) => !exactMatches.includes(skill)),
        userSkills
      );

    // Find missing skills
    const missing = allJobSkills.filter(
      (jobSkill) =>
        !exactMatches.includes(jobSkill) &&
        !partialMatches.some((pm) => pm.jobSkill === jobSkill)
    );

    // Find extra skills user has
    const extra = userSkills.filter(
      (userSkill) =>
        !allJobSkills.some((jobSkill) => this.isSkillMatch(jobSkill, userSkill))
    );

    const totalRequired = requiredSkills.length;
    const matched =
      exactMatches.filter((skill) => requiredSkills.includes(skill)).length +
      partialMatches.filter((pm) => requiredSkills.includes(pm.jobSkill))
        .length;

    const score =
      totalRequired > 0 ? Math.round((matched / totalRequired) * 100) : 100;

    return {
      score,
      totalRequired,
      matched,
      missing,
      partial: partialMatches,
      extra,
    };
  }

  private async analyzeExperienceMatch(
    cvData: CVTemplateData,
    jobAnalysis: JobPostingAnalysisResult
  ): Promise<ExperienceMatchAnalysis> {
    const requiredExperience = jobAnalysis.requiredExperience || [];
    const userExperiences = cvData.experience || [];

    // Calculate total years of experience
    const totalYearsUser = this.calculateTotalExperience(userExperiences);
    const totalYearsRequired = requiredExperience.reduce(
      (sum, req) => sum + req.minimumYears,
      0
    );

    // Analyze by skill area
    const byArea: ExperienceAreaMatch[] = requiredExperience.map((req) => {
      const relevantExperiences = userExperiences.filter((exp) =>
        this.isExperienceRelevant(exp, req.skillArea)
      );

      const userYears = this.calculateRelevantExperience(
        relevantExperiences,
        req.skillArea
      );
      const score = Math.min(
        100,
        Math.round((userYears / req.minimumYears) * 100)
      );

      return {
        area: req.skillArea,
        required: req.minimumYears,
        userHas: userYears,
        score,
        isMatched: userYears >= req.minimumYears,
      };
    });

    // Find relevant experiences for the job
    const relevantExperiences: RelevantExperience[] = userExperiences.map(
      (exp) => ({
        company: exp.company,
        position: exp.jobTitle,
        relevanceScore: this.calculateExperienceRelevance(exp, jobAnalysis),
        matchingSkills: this.extractMatchingSkills(exp, jobAnalysis),
        startDate: exp.startDate,
        endDate: exp.endDate,
      })
    );

    const overallScore =
      byArea.length > 0
        ? Math.round(
            byArea.reduce((sum, area) => sum + area.score, 0) / byArea.length
          )
        : Math.min(
            100,
            Math.round((totalYearsUser / Math.max(1, totalYearsRequired)) * 100)
          );

    return {
      score: overallScore,
      totalYearsRequired,
      totalYearsUser,
      byArea,
      relevantExperiences: relevantExperiences.filter(
        (exp) => exp.relevanceScore > 0.3
      ),
    };
  }

  private async analyzeEducationMatch(
    cvData: CVTemplateData,
    jobAnalysis: JobPostingAnalysisResult
  ): Promise<EducationMatchAnalysis> {
    const educationRequirements = jobAnalysis.educationRequirements || [];
    const userEducation = cvData.education || [];

    // Convert user education to summary format
    const userEducationSummary: UserEducationSummary[] = userEducation.map(
      (edu) => ({
        level: this.mapEducationLevel(edu.degree),
        field: edu.field,
        institution: edu.university,
        relevanceScore: this.calculateEducationRelevance(edu, jobAnalysis),
      })
    );

    let hasRequiredLevel = false;
    let hasRequiredField = false;

    if (educationRequirements.length > 0) {
      // Check if user meets education requirements
      hasRequiredLevel = educationRequirements.some(
        (req) =>
          req.isRequired &&
          userEducationSummary.some((userEdu) =>
            this.isEducationLevelSufficient(userEdu.level, req.level)
          )
      );

      hasRequiredField = educationRequirements.some(
        (req) =>
          req.field &&
          userEducationSummary.some((userEdu) =>
            this.isFieldMatch(userEdu.field, req.field!)
          )
      );
    } else {
      // If no requirements specified, assume basic requirement met
      hasRequiredLevel = userEducation.length > 0;
      hasRequiredField = true;
    }

    // Find additional certifications
    const additionalCertifications = (cvData.certificates || []).map(
      (cert) => cert.name
    );

    let score = 0;
    if (educationRequirements.length === 0) {
      score = userEducation.length > 0 ? 100 : 70; // Some score even if no education
    } else {
      score = 0;
      if (hasRequiredLevel) score += 60;
      if (hasRequiredField) score += 30;
      if (additionalCertifications.length > 0) score += 10;
      score = Math.min(100, score);
    }

    return {
      score,
      hasRequiredLevel,
      hasRequiredField,
      userEducation: userEducationSummary,
      additionalCertifications,
    };
  }

  private async analyzeKeywordMatch(
    cvData: CVTemplateData,
    jobAnalysis: JobPostingAnalysisResult
  ): Promise<KeywordMatchAnalysis> {
    const jobKeywords = jobAnalysis.keywords || [];
    const atsKeywords = jobAnalysis.atsKeywords || [];
    const allKeywords = [
      ...jobKeywords.map((kw) => kw.keyword),
      ...atsKeywords,
    ];

    // Extract text from CV for keyword analysis
    const cvText = this.extractTextFromCV(cvData);

    // Find present keywords
    const presentKeywords: PresentKeyword[] = [];
    let matchedCount = 0;

    allKeywords.forEach((keyword) => {
      const frequency = this.countKeywordFrequency(cvText, keyword);
      if (frequency > 0) {
        presentKeywords.push({
          keyword,
          frequency,
          locations: this.findKeywordLocations(cvData, keyword),
        });
        matchedCount++;
      }
    });

    // Categorize missing keywords by priority
    const missingKeywords = allKeywords.filter(
      (keyword) =>
        !presentKeywords.some(
          (pk) => pk.keyword.toLowerCase() === keyword.toLowerCase()
        )
    );

    const missingHighPriority = jobKeywords
      .filter(
        (kw) => kw.importance === 'HIGH' && missingKeywords.includes(kw.keyword)
      )
      .map((kw) => kw.keyword);

    const missingMediumPriority = jobKeywords
      .filter(
        (kw) =>
          kw.importance === 'MEDIUM' && missingKeywords.includes(kw.keyword)
      )
      .map((kw) => kw.keyword);

    const score =
      allKeywords.length > 0
        ? Math.round((matchedCount / allKeywords.length) * 100)
        : 100;

    return {
      score,
      totalKeywords: allKeywords.length,
      matchedKeywords: matchedCount,
      missingHighPriority,
      missingMediumPriority,
      presentKeywords,
    };
  }

  private calculateOverallScore(
    skillsMatch: SkillsMatchAnalysis,
    experienceMatch: ExperienceMatchAnalysis,
    educationMatch: EducationMatchAnalysis,
    keywordMatch: KeywordMatchAnalysis
  ): number {
    // Weighted average - skills and keywords are most important for ATS
    const weights = {
      skills: 0.35,
      experience: 0.25,
      education: 0.15,
      keywords: 0.25,
    };

    const weightedScore =
      skillsMatch.score * weights.skills +
      experienceMatch.score * weights.experience +
      educationMatch.score * weights.education +
      keywordMatch.score * weights.keywords;

    return Math.round(weightedScore);
  }

  private async identifyGapsAndStrengths(
    cvData: CVTemplateData,
    jobAnalysis: JobPostingAnalysisResult,
    skillsMatch: SkillsMatchAnalysis,
    experienceMatch: ExperienceMatchAnalysis,
    educationMatch: EducationMatchAnalysis,
    keywordMatch: KeywordMatchAnalysis
  ): Promise<{
    missingSkills: string[];
    missingKeywords: string[];
    weakAreas: WeakArea[];
    strengthAreas: StrengthArea[];
  }> {
    const missingSkills = skillsMatch.missing;
    const missingKeywords = [
      ...keywordMatch.missingHighPriority,
      ...keywordMatch.missingMediumPriority,
    ];

    const weakAreas: WeakArea[] = [];
    const strengthAreas: StrengthArea[] = [];

    // Identify weak areas
    if (skillsMatch.score < 70) {
      weakAreas.push({
        area: 'Technical Skills',
        score: skillsMatch.score,
        description: `Missing ${missingSkills.length} required skills`,
        impact:
          missingSkills.length > 5
            ? 'HIGH'
            : missingSkills.length > 2
              ? 'MEDIUM'
              : 'LOW',
        suggestions: [
          'Add missing technical skills to your CV',
          'Include relevant projects that demonstrate these skills',
          'Consider taking courses to acquire missing skills',
        ],
      });
    }

    if (keywordMatch.score < 60) {
      weakAreas.push({
        area: 'ATS Keywords',
        score: keywordMatch.score,
        description: `Missing ${missingKeywords.length} important keywords`,
        impact: keywordMatch.missingHighPriority.length > 3 ? 'HIGH' : 'MEDIUM',
        suggestions: [
          'Naturally incorporate missing keywords into your experience descriptions',
          'Update your professional summary to include relevant terms',
          'Review job posting for industry-specific terminology',
        ],
      });
    }

    if (experienceMatch.score < 60) {
      weakAreas.push({
        area: 'Relevant Experience',
        score: experienceMatch.score,
        description: 'Experience may not fully align with job requirements',
        impact: 'MEDIUM',
        suggestions: [
          'Emphasize transferable skills from your experience',
          'Quantify achievements with specific metrics',
          'Highlight projects that demonstrate relevant skills',
        ],
      });
    }

    // Identify strength areas
    if (skillsMatch.score >= 80) {
      strengthAreas.push({
        area: 'Technical Skills',
        score: skillsMatch.score,
        description: 'Strong technical skill alignment',
        advantages: [
          'Excellent match with required technical skills',
          'Additional skills that add value to the role',
          'Strong foundation for immediate contribution',
        ],
      });
    }

    if (experienceMatch.score >= 80) {
      strengthAreas.push({
        area: 'Professional Experience',
        score: experienceMatch.score,
        description: 'Highly relevant professional background',
        advantages: [
          'Extensive experience in relevant areas',
          'Strong track record of achievements',
          'Leadership and project management experience',
        ],
      });
    }

    if (keywordMatch.score >= 80) {
      strengthAreas.push({
        area: 'ATS Optimization',
        score: keywordMatch.score,
        description: 'Excellent keyword optimization',
        advantages: [
          'High likelihood of passing ATS screening',
          'Strong alignment with job posting language',
          'Comprehensive coverage of industry terminology',
        ],
      });
    }

    return { missingSkills, missingKeywords, weakAreas, strengthAreas };
  }

  private async generateRecommendations(
    cvData: CVTemplateData,
    jobAnalysis: JobPostingAnalysisResult,
    missingSkills: string[],
    missingKeywords: string[],
    weakAreas: WeakArea[]
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Skill gap recommendations
    if (missingSkills.length > 0) {
      const topMissingSkills = missingSkills.slice(0, 5);
      recommendations.push({
        id: this.generateId(),
        type: 'SKILL_GAP',
        priority: 'HIGH',
        title: 'Add Missing Technical Skills',
        description: `Include ${topMissingSkills.join(', ')} in your skills section`,
        actionItems: [
          'Review your past projects for use of these technologies',
          'Add skills to the technical skills section',
          'Include specific examples in experience descriptions',
          'Consider online courses to strengthen weak areas',
        ],
        estimatedImpact: 15,
        difficulty: 'EASY',
        timeToImplement: '30 minutes',
      });
    }

    // Keyword optimization recommendations
    if (missingKeywords.length > 0) {
      recommendations.push({
        id: this.generateId(),
        type: 'KEYWORD_MISSING',
        priority: 'HIGH',
        title: 'Improve ATS Keyword Optimization',
        description: `Naturally incorporate ${missingKeywords.slice(0, 3).join(', ')} and other key terms`,
        actionItems: [
          'Add keywords to professional summary',
          'Include terms in experience descriptions',
          'Use exact phrases from job posting',
          'Maintain natural language flow',
        ],
        estimatedImpact: 20,
        difficulty: 'MEDIUM',
        timeToImplement: '1-2 hours',
      });
    }

    // Content enhancement recommendations
    const emptyDescriptions =
      cvData.experience?.filter(
        (exp) => !exp.description || exp.description.trim().length < 50
      ) || [];
    if (emptyDescriptions.length > 0) {
      recommendations.push({
        id: this.generateId(),
        type: 'CONTENT_ENHANCEMENT',
        priority: 'MEDIUM',
        title: 'Enhance Experience Descriptions',
        description: `Add detailed descriptions for ${emptyDescriptions.length} work experiences`,
        actionItems: [
          'Include specific achievements and metrics',
          'Use action verbs to start bullet points',
          'Quantify results where possible (%, $, numbers)',
          'Align descriptions with job requirements',
        ],
        estimatedImpact: 25,
        difficulty: 'MEDIUM',
        timeToImplement: '2-3 hours',
      });
    }

    // Professional summary optimization
    if (!cvData.objective || cvData.objective.length < 100) {
      recommendations.push({
        id: this.generateId(),
        type: 'CONTENT_ENHANCEMENT',
        priority: 'MEDIUM',
        title: 'Optimize Professional Summary',
        description:
          'Create a compelling professional summary that matches the job requirements',
        actionItems: [
          'Include years of experience in relevant field',
          'Mention key skills and technologies',
          'Highlight major achievements',
          'Tailor to specific job posting',
        ],
        estimatedImpact: 15,
        difficulty: 'MEDIUM',
        timeToImplement: '45 minutes',
      });
    }

    return recommendations;
  }

  // Helper methods
  private isSkillMatch(jobSkill: string, userSkill: string): boolean {
    const normalizeSkill = (skill: string) =>
      skill
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '');
    return normalizeSkill(jobSkill) === normalizeSkill(userSkill);
  }

  private async findPartialSkillMatches(
    jobSkills: string[],
    userSkills: string[]
  ): Promise<PartialSkillMatch[]> {
    // Simple implementation - in production, you might use AI for semantic matching
    const partialMatches: PartialSkillMatch[] = [];

    jobSkills.forEach((jobSkill) => {
      userSkills.forEach((userSkill) => {
        const similarity = this.calculateStringSimilarity(jobSkill, userSkill);
        if (similarity > 0.6 && similarity < 1.0) {
          partialMatches.push({
            jobSkill,
            userSkill,
            similarity,
            context: 'Similar technology or framework',
          });
        }
      });
    });

    return partialMatches;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity - can be enhanced with more sophisticated algorithms
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  private calculateTotalExperience(experiences: any[]): number {
    return experiences.reduce((total, exp) => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.isCurrent ? new Date() : new Date(exp.endDate);
      const years =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + Math.max(0, years);
    }, 0);
  }

  private isExperienceRelevant(experience: any, skillArea: string): boolean {
    const searchText =
      `${experience.jobTitle} ${experience.description}`.toLowerCase();
    return searchText.includes(skillArea.toLowerCase());
  }

  private calculateRelevantExperience(
    experiences: any[],
    skillArea: string
  ): number {
    return experiences.reduce((total, exp) => {
      if (this.isExperienceRelevant(exp, skillArea)) {
        const startDate = new Date(exp.startDate);
        const endDate = exp.isCurrent ? new Date() : new Date(exp.endDate);
        const years =
          (endDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365);
        return total + Math.max(0, years);
      }
      return total;
    }, 0);
  }

  private calculateExperienceRelevance(
    experience: any,
    jobAnalysis: JobPostingAnalysisResult
  ): number {
    const requiredSkills = jobAnalysis.requiredSkills || [];
    const expText =
      `${experience.jobTitle} ${experience.description}`.toLowerCase();

    const matchingSkills = requiredSkills.filter((skill) =>
      expText.includes(skill.toLowerCase())
    );

    return requiredSkills.length > 0
      ? matchingSkills.length / requiredSkills.length
      : 0;
  }

  private extractMatchingSkills(
    experience: any,
    jobAnalysis: JobPostingAnalysisResult
  ): string[] {
    const requiredSkills = jobAnalysis.requiredSkills || [];
    const expText =
      `${experience.jobTitle} ${experience.description}`.toLowerCase();

    return requiredSkills.filter((skill) =>
      expText.includes(skill.toLowerCase())
    );
  }

  private mapEducationLevel(degree?: string): string {
    if (!degree) return 'UNKNOWN';

    const lowerDegree = degree.toLowerCase();
    if (lowerDegree.includes('phd') || lowerDegree.includes('doctorate'))
      return 'PHD';
    if (
      lowerDegree.includes('master') ||
      lowerDegree.includes('msc') ||
      lowerDegree.includes('mba')
    )
      return 'MASTER';
    if (
      lowerDegree.includes('bachelor') ||
      lowerDegree.includes('bsc') ||
      lowerDegree.includes('ba')
    )
      return 'BACHELOR';
    if (lowerDegree.includes('associate')) return 'ASSOCIATE';

    return 'BACHELOR'; // Default assumption
  }

  private calculateEducationRelevance(
    education: any,
    jobAnalysis: JobPostingAnalysisResult
  ): number {
    const jobField =
      jobAnalysis.educationRequirements?.[0]?.field?.toLowerCase();
    if (!jobField) return 0.5; // Neutral if no specific field required

    const userField = education.field.toLowerCase();
    return this.calculateStringSimilarity(jobField, userField);
  }

  private isEducationLevelSufficient(
    userLevel: string,
    requiredLevel: string
  ): boolean {
    const levels = ['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'PHD'];
    const userIndex = levels.indexOf(userLevel);
    const requiredIndex = levels.indexOf(requiredLevel);

    return userIndex >= requiredIndex;
  }

  private isFieldMatch(userField: string, requiredField: string): boolean {
    return this.calculateStringSimilarity(userField, requiredField) > 0.6;
  }

  private extractTextFromCV(cvData: CVTemplateData): string {
    const textParts = [
      cvData.objective,
      ...(cvData.experience || []).map(
        (exp) => `${exp.jobTitle} ${exp.description}`
      ),
      ...(cvData.education || []).map((edu) => `${edu.degree} ${edu.field}`),
      ...(cvData.skills || []),
      ...(cvData.technicalSkills?.frontend || []),
      ...(cvData.technicalSkills?.backend || []),
      ...(cvData.technicalSkills?.database || []),
      ...(cvData.technicalSkills?.tools || []),
    ];

    return textParts.filter(Boolean).join(' ');
  }

  private countKeywordFrequency(text: string, keyword: string): number {
    const regex = new RegExp(
      keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'gi'
    );
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  private findKeywordLocations(
    cvData: CVTemplateData,
    keyword: string
  ): string[] {
    const locations: string[] = [];
    const keywordLower = keyword.toLowerCase();

    if (cvData.objective?.toLowerCase().includes(keywordLower)) {
      locations.push('Professional Summary');
    }

    cvData.experience?.forEach((exp, index) => {
      if (
        exp.description?.toLowerCase().includes(keywordLower) ||
        exp.jobTitle?.toLowerCase().includes(keywordLower)
      ) {
        locations.push(`Experience ${index + 1}`);
      }
    });

    if (
      cvData.skills?.some((skill) => skill.toLowerCase().includes(keywordLower))
    ) {
      locations.push('Skills');
    }

    return locations;
  }

  private generateId(): string {
    return (
      'cv_match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    );
  }
}
