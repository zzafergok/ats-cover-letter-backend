import { ATSCVData, ATSValidationResult, ATSIssue } from '../types/cv.types';
import logger from '../config/logger';

export class ATSValidationService {
  private static instance: ATSValidationService;

  private constructor() {}

  public static getInstance(): ATSValidationService {
    if (!ATSValidationService.instance) {
      ATSValidationService.instance = new ATSValidationService();
    }
    return ATSValidationService.instance;
  }

  /**
   * CV'yi ATS uyumluluğu açısından değerlendir
   */
  async validateCV(
    cvData: ATSCVData,
    jobDescription?: string
  ): Promise<ATSValidationResult> {
    try {
      logger.info('Starting ATS validation', {
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        hasJobDescription: !!jobDescription,
      });

      const issues: ATSIssue[] = [];
      const recommendations: string[] = [];
      let totalScore = 0;

      // 1. Format ve Layout Kontrolleri (25 puan)
      const formatResults = this.validateFormat(cvData);
      totalScore += formatResults.score;
      issues.push(...formatResults.issues);
      recommendations.push(...formatResults.recommendations);

      // 2. İçerik Yapısı Kontrolleri (25 puan)
      const structureResults = this.validateStructure(cvData);
      totalScore += structureResults.score;
      issues.push(...structureResults.issues);
      recommendations.push(...structureResults.recommendations);

      // 3. Contact Bilgileri Kontrolleri (15 puan)
      const contactResults = this.validateContactInfo(cvData.personalInfo);
      totalScore += contactResults.score;
      issues.push(...contactResults.issues);
      recommendations.push(...contactResults.recommendations);

      // 4. Keyword Analizi (35 puan)
      const keywordResults = await this.validateKeywords(
        cvData,
        jobDescription
      );
      totalScore += keywordResults.score;
      issues.push(...keywordResults.issues);
      recommendations.push(...keywordResults.recommendations);

      const finalScore = Math.min(Math.max(totalScore, 0), 100);

      const result: ATSValidationResult = {
        score: finalScore,
        issues,
        recommendations: this.deduplicateRecommendations(recommendations),
        keywords: keywordResults.keywordData,
        formatChecks: {
          fontCompliant: formatResults.fontCompliant,
          layoutCompliant: formatResults.layoutCompliant,
          sectionHeadersValid: structureResults.sectionHeadersValid,
          contactInfoComplete: contactResults.contactInfoComplete,
        },
      };

      logger.info('ATS validation completed', {
        score: finalScore,
        issuesCount: issues.length,
        recommendationsCount: result.recommendations.length,
      });

      return result;
    } catch (error) {
      logger.error('ATS validation failed:', error);
      throw new Error('ATS validation could not be completed');
    }
  }

  /**
   * Format ve Layout Kontrolleri
   */
  private validateFormat(cvData: ATSCVData): {
    score: number;
    issues: ATSIssue[];
    recommendations: string[];
    fontCompliant: boolean;
    layoutCompliant: boolean;
  } {
    let score = 25; // Full score by default
    const issues: ATSIssue[] = [];
    const recommendations: string[] = [];
    let fontCompliant = true;
    let layoutCompliant = true;

    // CV Type kontrolü
    if (cvData.configuration.cvType !== 'ATS_OPTIMIZED') {
      score -= 5;
      issues.push({
        type: 'WARNING',
        category: 'FORMAT',
        message: 'CV type is not optimized for ATS',
        suggestion: 'Change CV type to ATS_OPTIMIZED for better compatibility',
      });
      recommendations.push(
        'Use ATS_OPTIMIZED CV type for maximum compatibility'
      );
    }

    // Template Style kontrolü
    if (cvData.configuration.templateStyle === 'MODERN') {
      score -= 3;
      issues.push({
        type: 'WARNING',
        category: 'FORMAT',
        message: 'MODERN template style may not be ATS-friendly',
        suggestion: 'Consider using PROFESSIONAL or MINIMAL template style',
      });
      recommendations.push(
        'Use PROFESSIONAL or MINIMAL template styles for better ATS compatibility'
      );
      layoutCompliant = false;
    }

    // Photo inclusion kontrolü - bu hiçbir zaman true olmayacak ama safety check için
    if (cvData.configuration.includePhoto !== false) {
      score -= 10;
      issues.push({
        type: 'ERROR',
        category: 'FORMAT',
        message: 'Photos are not ATS-compatible',
        suggestion: 'Remove photo from CV as ATS systems cannot process images',
      });
      recommendations.push('Never include photos in ATS-compatible CVs');
      fontCompliant = false;
    }

    return {
      score,
      issues,
      recommendations,
      fontCompliant,
      layoutCompliant,
    };
  }

  /**
   * İçerik Yapısı Kontrolleri
   */
  private validateStructure(cvData: ATSCVData): {
    score: number;
    issues: ATSIssue[];
    recommendations: string[];
    sectionHeadersValid: boolean;
  } {
    let score = 25;
    const issues: ATSIssue[] = [];
    const recommendations: string[] = [];
    let sectionHeadersValid = true;

    // Professional Summary kontrolü
    const summaryLength = cvData.professionalSummary.summary.length;
    if (summaryLength < 100) {
      score -= 5;
      issues.push({
        type: 'WARNING',
        category: 'CONTENT',
        message: 'Professional summary is too short',
        suggestion: 'Expand professional summary to at least 100 characters',
      });
      recommendations.push(
        'Write a comprehensive professional summary (100-300 words)'
      );
    } else if (summaryLength > 500) {
      score -= 3;
      issues.push({
        type: 'WARNING',
        category: 'CONTENT',
        message: 'Professional summary is too long',
        suggestion: 'Keep professional summary concise (100-300 words)',
      });
      recommendations.push('Keep professional summary concise and focused');
    }

    // Work Experience kontrolü
    if (cvData.workExperience.length === 0) {
      score -= 15;
      issues.push({
        type: 'ERROR',
        category: 'STRUCTURE',
        message: 'No work experience provided',
        suggestion: 'Add at least one work experience entry',
      });
      recommendations.push(
        'Include relevant work experience with quantified achievements'
      );
      sectionHeadersValid = false;
    } else {
      // Her work experience için achievement kontrolü
      cvData.workExperience.forEach((exp, index) => {
        if (exp.achievements.length < 2) {
          score -= 2;
          issues.push({
            type: 'WARNING',
            category: 'CONTENT',
            message: `Work experience ${index + 1} has insufficient achievements`,
            suggestion: 'Add at least 2-3 quantified achievements per role',
          });
          recommendations.push(
            'Include 2-4 quantified achievements for each role'
          );
        }

        // Achievement quality kontrolü
        const hasQuantifiedAchievements = exp.achievements.some(
          (achievement) => /\d+/.test(achievement) || /%/.test(achievement)
        );

        if (!hasQuantifiedAchievements) {
          score -= 3;
          issues.push({
            type: 'WARNING',
            category: 'CONTENT',
            message: `Work experience ${index + 1} lacks quantified achievements`,
            suggestion:
              'Include numbers, percentages, or metrics in achievements',
          });
          recommendations.push(
            'Quantify achievements with specific numbers and metrics'
          );
        }
      });
    }

    // Education kontrolü
    if (cvData.education.length === 0) {
      score -= 5;
      issues.push({
        type: 'WARNING',
        category: 'STRUCTURE',
        message: 'No education information provided',
        suggestion: 'Add educational background',
      });
      recommendations.push('Include your educational background');
    }

    // Skills kontrolü
    const totalTechnicalSkills = cvData.skills.technical.reduce(
      (total, category) => total + category.items.length,
      0
    );

    if (totalTechnicalSkills < 5) {
      score -= 3;
      issues.push({
        type: 'WARNING',
        category: 'CONTENT',
        message: 'Insufficient technical skills listed',
        suggestion: 'Add more relevant technical skills',
      });
      recommendations.push('List 5-15 relevant technical skills');
    }

    return {
      score,
      issues,
      recommendations,
      sectionHeadersValid,
    };
  }

  /**
   * Contact Bilgileri Kontrolleri
   */
  private validateContactInfo(personalInfo: ATSCVData['personalInfo']): {
    score: number;
    issues: ATSIssue[];
    recommendations: string[];
    contactInfoComplete: boolean;
  } {
    let score = 15;
    const issues: ATSIssue[] = [];
    const recommendations: string[] = [];
    let contactInfoComplete = true;

    // Required fields kontrolü
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    const missingFields = requiredFields.filter(
      (field) => !personalInfo[field as keyof typeof personalInfo]
    );

    if (missingFields.length > 0) {
      score -= missingFields.length * 3;
      contactInfoComplete = false;
      issues.push({
        type: 'ERROR',
        category: 'STRUCTURE',
        message: `Missing required contact information: ${missingFields.join(', ')}`,
        suggestion: 'Provide all required contact information',
      });
      recommendations.push(
        'Include all required contact information: name, email, phone'
      );
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (personalInfo.email && !emailRegex.test(personalInfo.email)) {
      score -= 2;
      issues.push({
        type: 'WARNING',
        category: 'FORMAT',
        message: 'Email format appears invalid',
        suggestion: 'Verify email address format',
      });
      recommendations.push('Use a professional email address');
    }

    // Phone format kontrolü
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    if (personalInfo.phone && !phoneRegex.test(personalInfo.phone)) {
      score -= 1;
      issues.push({
        type: 'WARNING',
        category: 'FORMAT',
        message: 'Phone number format may not be standard',
        suggestion: 'Use standard phone number format',
      });
    }

    // Professional online presence
    if (!personalInfo.linkedIn) {
      score -= 2;
      issues.push({
        type: 'INFO',
        category: 'CONTENT',
        message: 'LinkedIn profile not provided',
        suggestion: 'Consider adding LinkedIn profile URL',
      });
      recommendations.push(
        'Include LinkedIn profile for better professional visibility'
      );
    }

    // Address information
    if (!personalInfo.address.city || !personalInfo.address.country) {
      score -= 1;
      issues.push({
        type: 'WARNING',
        category: 'STRUCTURE',
        message: 'Incomplete address information',
        suggestion: 'Include at least city and country',
      });
      recommendations.push('Include location information (city, country)');
    }

    return {
      score,
      issues,
      recommendations,
      contactInfoComplete,
    };
  }

  /**
   * Keyword Analizi ve Matching
   */
  private async validateKeywords(
    cvData: ATSCVData,
    jobDescription?: string
  ): Promise<{
    score: number;
    issues: ATSIssue[];
    recommendations: string[];
    keywordData: {
      found: string[];
      missing: string[];
      density: number;
    };
  }> {
    let score = 35;
    const issues: ATSIssue[] = [];
    const recommendations: string[] = [];

    // CV'den tüm text'i topla
    const cvText = this.extractAllCVText(cvData);

    if (!jobDescription) {
      // Job description yoksa generic keyword kontrolü
      const genericKeywords = this.getGenericKeywords(
        cvData.professionalSummary.targetPosition
      );
      const foundKeywords = this.findKeywordsInText(cvText, genericKeywords);

      const keywordCoverage = foundKeywords.length / genericKeywords.length;

      if (keywordCoverage < 0.3) {
        score -= 15;
        issues.push({
          type: 'WARNING',
          category: 'KEYWORDS',
          message: 'Low keyword coverage for target position',
          suggestion: 'Include more relevant keywords for your target position',
        });
        recommendations.push(
          'Research job postings and include relevant industry keywords'
        );
      }

      return {
        score,
        issues,
        recommendations,
        keywordData: {
          found: foundKeywords,
          missing: genericKeywords.filter((k) => !foundKeywords.includes(k)),
          density: keywordCoverage,
        },
      };
    }

    // Job description varsa detailed matching
    const jobKeywords = this.extractJobKeywords(jobDescription);
    const foundKeywords = this.findKeywordsInText(cvText, jobKeywords);
    const missingKeywords = jobKeywords.filter(
      (k) => !foundKeywords.includes(k)
    );

    const keywordCoverage = foundKeywords.length / jobKeywords.length;

    // Keyword coverage scoring
    if (keywordCoverage >= 0.7) {
      // Excellent keyword match
      score = Math.min(score, 35);
    } else if (keywordCoverage >= 0.5) {
      // Good keyword match
      score -= 5;
      recommendations.push(
        'Consider adding more keywords from job description'
      );
    } else if (keywordCoverage >= 0.3) {
      // Fair keyword match
      score -= 15;
      issues.push({
        type: 'WARNING',
        category: 'KEYWORDS',
        message: 'Moderate keyword match with job description',
        suggestion: 'Include more relevant keywords from the job posting',
      });
      recommendations.push(
        'Tailor your CV to include 60-80% of job posting keywords'
      );
    } else {
      // Poor keyword match
      score -= 25;
      issues.push({
        type: 'ERROR',
        category: 'KEYWORDS',
        message: 'Low keyword match with job description',
        suggestion:
          'Significantly improve keyword alignment with job requirements',
      });
      recommendations.push(
        'Rewrite sections to include key terms from job description'
      );
    }

    // Title matching
    const jobTitle = this.extractJobTitle(jobDescription);
    if (jobTitle && !cvText.toLowerCase().includes(jobTitle.toLowerCase())) {
      score -= 5;
      issues.push({
        type: 'WARNING',
        category: 'KEYWORDS',
        message: 'CV does not include the exact job title',
        suggestion: 'Include the exact job title from the posting',
      });
      recommendations.push(
        'Include exact job title in your professional summary or objective'
      );
    }

    return {
      score,
      issues,
      recommendations,
      keywordData: {
        found: foundKeywords,
        missing: missingKeywords.slice(0, 10), // Top 10 missing keywords
        density: keywordCoverage,
      },
    };
  }

  /**
   * CV'den tüm text'i çıkart
   */
  private extractAllCVText(cvData: ATSCVData): string {
    const textParts: string[] = [];

    // Personal info
    textParts.push(cvData.personalInfo.firstName, cvData.personalInfo.lastName);

    // Professional summary
    textParts.push(cvData.professionalSummary.summary);
    textParts.push(cvData.professionalSummary.targetPosition);
    textParts.push(...cvData.professionalSummary.keySkills);

    // Work experience
    cvData.workExperience.forEach((exp) => {
      textParts.push(exp.companyName, exp.position);
      textParts.push(...exp.achievements);
      if (exp.technologies) {
        textParts.push(...exp.technologies);
      }
    });

    // Education
    cvData.education.forEach((edu) => {
      textParts.push(edu.institution, edu.degree, edu.fieldOfStudy);
      if (edu.honors) {
        textParts.push(...edu.honors);
      }
    });

    // Skills
    cvData.skills.technical.forEach((category) => {
      textParts.push(category.category);
      textParts.push(...category.items.map((item) => item.name));
    });

    textParts.push(...cvData.skills.soft);
    textParts.push(...cvData.skills.languages.map((lang) => lang.language));

    // Certifications
    if (cvData.certifications) {
      cvData.certifications.forEach((cert) => {
        textParts.push(cert.name, cert.issuingOrganization);
      });
    }

    // Projects
    if (cvData.projects) {
      cvData.projects.forEach((project) => {
        textParts.push(project.name, project.description);
        textParts.push(...project.technologies);
        textParts.push(...project.achievements);
      });
    }

    return textParts.join(' ').toLowerCase();
  }

  /**
   * Job description'dan keyword'leri çıkart
   */
  private extractJobKeywords(jobDescription: string): string[] {
    const commonWords = new Set([
      'and',
      'or',
      'but',
      'the',
      'a',
      'an',
      'in',
      'on',
      'at',
      'to',
      'for',
      'with',
      'by',
      'of',
      'is',
      'are',
      'was',
      'were',
      'will',
      'be',
      'have',
      'has',
      'had',
      'can',
      'should',
      'would',
      'could',
      'may',
      'must',
      'shall',
    ]);

    const words = jobDescription
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !commonWords.has(word));

    // Word frequency analysis
    const wordFreq = new Map<string, number>();
    words.forEach((word) => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Return most frequent words (likely to be important keywords)
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  /**
   * Job title'ı çıkart
   */
  private extractJobTitle(jobDescription: string): string | null {
    // Common job title patterns
    const titlePatterns = [
      /job title[:\s]+([^\n.]+)/i,
      /position[:\s]+([^\n.]+)/i,
      /role[:\s]+([^\n.]+)/i,
      /seeking[:\s]+([^\n.]+)/i,
    ];

    for (const pattern of titlePatterns) {
      const match = jobDescription.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Generic keywords for position
   */
  private getGenericKeywords(targetPosition: string): string[] {
    const lowerPosition = targetPosition.toLowerCase();

    // Tech positions
    if (
      lowerPosition.includes('developer') ||
      lowerPosition.includes('engineer')
    ) {
      return [
        'software',
        'development',
        'programming',
        'coding',
        'engineering',
        'javascript',
        'python',
        'java',
        'react',
        'node',
        'database',
        'api',
        'web',
        'mobile',
        'testing',
        'debugging',
        'git',
        'agile',
      ];
    }

    // Management positions
    if (lowerPosition.includes('manager') || lowerPosition.includes('lead')) {
      return [
        'management',
        'leadership',
        'team',
        'project',
        'planning',
        'strategy',
        'budget',
        'coordination',
        'communication',
        'analysis',
      ];
    }

    // Marketing positions
    if (lowerPosition.includes('marketing')) {
      return [
        'marketing',
        'digital',
        'social media',
        'campaign',
        'analytics',
        'seo',
        'content',
        'brand',
        'advertising',
        'lead generation',
      ];
    }

    // Default generic keywords
    return [
      'experience',
      'skills',
      'knowledge',
      'professional',
      'work',
      'project',
      'team',
      'communication',
      'problem solving',
      'analysis',
    ];
  }

  /**
   * Text'te keyword'leri bul
   */
  private findKeywordsInText(text: string, keywords: string[]): string[] {
    const lowerText = text.toLowerCase();
    return keywords.filter((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    );
  }

  /**
   * Duplicate recommendations'ları temizle
   */
  private deduplicateRecommendations(recommendations: string[]): string[] {
    return Array.from(new Set(recommendations));
  }
}
