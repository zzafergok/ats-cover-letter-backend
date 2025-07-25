import { ATSCVData, ATSValidationResult } from '../types/cv.types';
import { ATSValidationService } from './ats-validation.service';
import logger from '../config/logger';

export interface OptimizationSuggestion {
  section: string;
  field: string;
  currentValue: string;
  suggestedValue: string;
  reason: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'KEYWORDS' | 'CONTENT' | 'FORMAT' | 'STRUCTURE';
}

export interface CVOptimizationResult {
  originalScore: number;
  optimizedCV: ATSCVData;
  estimatedScore: number;
  improvements: OptimizationSuggestion[];
  keywordEnhancements: {
    addedKeywords: string[];
    enhancedSections: string[];
    keywordDensityImprovement: number;
  };
}

export class CVOptimizationService {
  private static instance: CVOptimizationService;
  private validationService: ATSValidationService;

  private constructor() {
    this.validationService = ATSValidationService.getInstance();
  }

  public static getInstance(): CVOptimizationService {
    if (!CVOptimizationService.instance) {
      CVOptimizationService.instance = new CVOptimizationService();
    }
    return CVOptimizationService.instance;
  }

  /**
   * CV'yi job description'a göre optimize et
   */
  async optimizeCV(
    cvData: ATSCVData,
    jobDescription: string
  ): Promise<CVOptimizationResult> {
    try {
      logger.info('Starting CV optimization', {
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        targetPosition: cvData.professionalSummary.targetPosition
      });

      // 1. Original validation score'unu al
      const originalValidation = await this.validationService.validateCV(cvData, jobDescription);
      
      // 2. CV'yi optimize et
      const optimizedCV = await this.performOptimization(cvData, jobDescription, originalValidation);
      
      // 3. Optimization sonrası score'u hesapla
      const optimizedValidation = await this.validationService.validateCV(optimizedCV, jobDescription);
      
      // 4. Improvement suggestions'ları oluştur
      const improvements = this.generateImprovementSuggestions(cvData, optimizedCV, originalValidation);
      
      // 5. Keyword enhancements'ları analiz et
      const keywordEnhancements = this.analyzeKeywordEnhancements(
        cvData,
        optimizedCV,
        jobDescription
      );

      const result: CVOptimizationResult = {
        originalScore: originalValidation.score,
        optimizedCV,
        estimatedScore: optimizedValidation.score,
        improvements,
        keywordEnhancements
      };

      logger.info('CV optimization completed', {
        originalScore: originalValidation.score,
        optimizedScore: optimizedValidation.score,
        improvement: optimizedValidation.score - originalValidation.score,
        improvementsCount: improvements.length
      });

      return result;

    } catch (error) {
      logger.error('CV optimization failed:', error);
      throw new Error('CV optimization could not be completed');
    }
  }

  /**
   * CV optimization'ı gerçekleştir
   */
  private async performOptimization(
    cvData: ATSCVData,
    jobDescription: string,
    validation: ATSValidationResult
  ): Promise<ATSCVData> {
    const optimizedCV = JSON.parse(JSON.stringify(cvData)) as ATSCVData;
    
    // 1. Keywords'leri extract et
    const jobKeywords = this.extractJobKeywords(jobDescription);
    const missingKeywords = validation.keywords.missing;
    
    // 2. Professional Summary'yi optimize et
    optimizedCV.professionalSummary = this.optimizeProfessionalSummary(
      optimizedCV.professionalSummary,
      jobKeywords,
      jobDescription
    );
    
    // 3. Work Experience'ı optimize et
    optimizedCV.workExperience = this.optimizeWorkExperience(
      optimizedCV.workExperience,
      jobKeywords,
      missingKeywords
    );
    
    // 4. Skills'i optimize et
    optimizedCV.skills = this.optimizeSkills(
      optimizedCV.skills,
      jobKeywords,
      jobDescription
    );
    
    // 5. Configuration'ı ATS için optimize et
    optimizedCV.configuration = this.optimizeConfiguration(optimizedCV.configuration);
    
    return optimizedCV;
  }

  /**
   * Professional Summary'yi optimize et
   */
  private optimizeProfessionalSummary(
    summary: ATSCVData['professionalSummary'],
    jobKeywords: string[],
    jobDescription: string
  ): ATSCVData['professionalSummary'] {
    const optimized = { ...summary };
    
    // Job title'ı extract et
    const jobTitle = this.extractJobTitle(jobDescription);
    if (jobTitle && !optimized.summary.toLowerCase().includes(jobTitle.toLowerCase())) {
      optimized.targetPosition = jobTitle;
    }
    
    // Summary'ye eksik keywords ekle
    const summaryWords = optimized.summary.toLowerCase().split(' ');
    const missingKeywords = jobKeywords.filter(keyword => 
      !summaryWords.some(word => word.includes(keyword.toLowerCase()))
    ).slice(0, 3); // İlk 3 eksik keyword
    
    if (missingKeywords.length > 0) {
      // Summary'nin sonuna natural şekilde keyword'leri ekle
      const keywordPhrase = this.createNaturalKeywordPhrase(missingKeywords);
      optimized.summary += ` ${keywordPhrase}`;
    }
    
    // Key skills'i güncelle
    const newKeySkills = [...new Set([...optimized.keySkills, ...jobKeywords.slice(0, 5)])];
    optimized.keySkills = newKeySkills.slice(0, 15); // Max 15 skills
    
    return optimized;
  }

  /**
   * Work Experience'ı optimize et
   */
  private optimizeWorkExperience(
    workExp: ATSCVData['workExperience'],
    jobKeywords: string[],
    missingKeywords: string[]
  ): ATSCVData['workExperience'] {
    return workExp.map(exp => {
      const optimizedExp = { ...exp };
      
      // Achievements'lara eksik keywords ekle
      const expText = exp.achievements.join(' ').toLowerCase();
      const applicableKeywords = missingKeywords.filter(keyword => 
        !expText.includes(keyword.toLowerCase())
      ).slice(0, 2); // Her experience için max 2 keyword
      
      if (applicableKeywords.length > 0) {
        // En son achievement'a keyword'leri natural şekilde ekle
        const lastAchievement = optimizedExp.achievements[optimizedExp.achievements.length - 1];
        const enhancedAchievement = this.enhanceAchievementWithKeywords(
          lastAchievement,
          applicableKeywords
        );
        optimizedExp.achievements[optimizedExp.achievements.length - 1] = enhancedAchievement;
      }
      
      // Technologies'e eksik tech keywords ekle
      const techKeywords = jobKeywords.filter(keyword => 
        this.isTechnicalKeyword(keyword)
      );
      
      if (optimizedExp.technologies) {
        const newTechnologies = [...new Set([...optimizedExp.technologies, ...techKeywords])];
        optimizedExp.technologies = newTechnologies.slice(0, 10); // Max 10 technologies
      } else {
        optimizedExp.technologies = techKeywords.slice(0, 5);
      }
      
      return optimizedExp;
    });
  }

  /**
   * Skills'i optimize et
   */
  private optimizeSkills(
    skills: ATSCVData['skills'],
    jobKeywords: string[],
    jobDescription: string
  ): ATSCVData['skills'] {
    const optimized = { ...skills };
    
    // Technical skills'e job keywords ekle
    const techKeywords = jobKeywords.filter(keyword => this.isTechnicalKeyword(keyword));
    
    // Programming languages kategori
    const programmingCategory = optimized.technical.find(cat => 
      cat.category.toLowerCase().includes('programming') || 
      cat.category.toLowerCase().includes('language')
    );
    
    if (programmingCategory) {
      const newLanguages = techKeywords
        .filter(keyword => this.isProgrammingLanguage(keyword))
        .map(lang => ({ name: this.capitalizeKeyword(lang), proficiencyLevel: 'Intermediate' as const }));
      
      programmingCategory.items = [
        ...programmingCategory.items,
        ...newLanguages.filter(newLang => 
          !programmingCategory.items.some(existing => 
            existing.name.toLowerCase() === newLang.name.toLowerCase()
          )
        )
      ];
    }
    
    // Frameworks & Tools kategori
    let frameworksCategory = optimized.technical.find(cat =>
      cat.category.toLowerCase().includes('framework') ||
      cat.category.toLowerCase().includes('tool')
    );
    
    if (!frameworksCategory) {
      frameworksCategory = {
        category: 'Frameworks & Tools',
        items: []
      };
      optimized.technical.push(frameworksCategory);
    }
    
    const frameworkKeywords = techKeywords
      .filter(keyword => this.isFrameworkOrTool(keyword))
      .map(framework => ({ 
        name: this.capitalizeKeyword(framework), 
        proficiencyLevel: 'Advanced' as const 
      }));
    
    frameworksCategory.items = [
      ...frameworksCategory.items,
      ...frameworkKeywords.filter(newFramework =>
        !frameworksCategory!.items.some(existing =>
          existing.name.toLowerCase() === newFramework.name.toLowerCase()
        )
      )
    ];
    
    // Soft skills'e job description'dan soft skills ekle
    const jobSoftSkills = this.extractSoftSkillsFromJob(jobDescription);
    optimized.soft = [...new Set([...optimized.soft, ...jobSoftSkills])];
    
    return optimized;
  }

  /**
   * Configuration'ı optimize et
   */
  private optimizeConfiguration(
    config: ATSCVData['configuration']
  ): ATSCVData['configuration'] {
    return {
      ...config,
      cvType: 'ATS_OPTIMIZED',
      includePhoto: false,
      templateStyle: config.templateStyle === 'MODERN' ? 'PROFESSIONAL' : config.templateStyle
    };
  }

  /**
   * Job description'dan keywords çıkar
   */
  private extractJobKeywords(jobDescription: string): string[] {
    const commonWords = new Set([
      'and', 'or', 'but', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of',
      'is', 'are', 'was', 'were', 'will', 'be', 'have', 'has', 'had', 'can', 'should', 'would',
      'could', 'may', 'must', 'shall', 'we', 'you', 'they', 'this', 'that', 'these', 'those'
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

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([word]) => word);
  }

  /**
   * Job title'ı extract et
   */
  private extractJobTitle(jobDescription: string): string | null {
    const titlePatterns = [
      /job title[:\s]+([^\n.]+)/i,
      /position[:\s]+([^\n.]+)/i,
      /role[:\s]+([^\n.]+)/i,
      /seeking[:\s]+([^\n.]+)/i,
      /hiring[:\s]+([^\n.]+)/i,
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
   * Natural keyword phrase oluştur
   */
  private createNaturalKeywordPhrase(keywords: string[]): string {
    if (keywords.length === 1) {
      return `Experienced in ${keywords[0]}.`;
    } else if (keywords.length === 2) {
      return `Skilled in ${keywords[0]} and ${keywords[1]}.`;
    } else {
      const lastKeyword = keywords.pop();
      return `Proficient in ${keywords.join(', ')}, and ${lastKeyword}.`;
    }
  }

  /**
   * Achievement'ı keywords ile enhance et
   */
  private enhanceAchievementWithKeywords(achievement: string, keywords: string[]): string {
    // Achievement'ın sonuna keywords'leri natural şekilde ekle
    const keywordPhrase = keywords.join(' and ');
    return `${achievement} using ${keywordPhrase}`;
  }

  /**
   * Technical keyword kontrolü
   */
  private isTechnicalKeyword(keyword: string): boolean {
    const techPatterns = [
      // Programming languages
      /^(javascript|typescript|python|java|react|angular|vue|node|php|ruby|go|rust|swift|kotlin)$/i,
      // Frameworks & Tools
      /^(express|spring|django|laravel|react|angular|vue|webpack|docker|kubernetes|git)$/i,
      // Databases
      /^(mysql|postgresql|mongodb|redis|elasticsearch|oracle|sqlite)$/i,
      // Cloud & DevOps
      /^(aws|azure|gcp|docker|kubernetes|jenkins|terraform|ansible)$/i,
      // Other tech terms
      /^(api|rest|graphql|microservices|agile|scrum|ci\/cd|devops|frontend|backend|fullstack)$/i
    ];
    
    return techPatterns.some(pattern => pattern.test(keyword));
  }

  /**
   * Programming language kontrolü
   */
  private isProgrammingLanguage(keyword: string): boolean {
    const languages = [
      'javascript', 'typescript', 'python', 'java', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
      'c++', 'c#', 'scala', 'perl', 'r', 'matlab', 'sql'
    ];
    return languages.includes(keyword.toLowerCase());
  }

  /**
   * Framework veya tool kontrolü
   */
  private isFrameworkOrTool(keyword: string): boolean {
    const frameworks = [
      'react', 'angular', 'vue', 'express', 'spring', 'django', 'laravel', 'flask',
      'docker', 'kubernetes', 'git', 'webpack', 'jenkins', 'terraform', 'ansible'
    ];
    return frameworks.includes(keyword.toLowerCase());
  }

  /**
   * Job description'dan soft skills çıkar
   */
  private extractSoftSkillsFromJob(jobDescription: string): string[] {
    const softSkillPatterns = [
      /leadership/i, /management/i, /communication/i, /teamwork/i, /collaboration/i,
      /problem.solving/i, /analytical/i, /creative/i, /innovative/i, /adaptable/i,
      /organized/i, /detail.oriented/i, /time.management/i, /project.management/i,
      /presentation/i, /interpersonal/i, /customer.service/i, /negotiation/i
    ];

    const foundSkills: string[] = [];
    const lowerDescription = jobDescription.toLowerCase();

    softSkillPatterns.forEach(pattern => {
      const match = lowerDescription.match(pattern);
      if (match) {
        const skill = match[0]
          .replace(/\./g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        foundSkills.push(skill);
      }
    });

    return [...new Set(foundSkills)];
  }

  /**
   * Keyword'ü capitalize et
   */
  private capitalizeKeyword(keyword: string): string {
    // Special cases
    const specialCases: { [key: string]: string } = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'nodejs': 'Node.js',
      'reactjs': 'React.js',
      'vuejs': 'Vue.js',
      'angularjs': 'Angular.js',
      'mongodb': 'MongoDB',
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'api': 'API',
      'rest': 'REST',
      'graphql': 'GraphQL',
      'aws': 'AWS',
      'azure': 'Azure',
      'gcp': 'GCP'
    };

    return specialCases[keyword.toLowerCase()] || 
           keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();
  }

  /**
   * Improvement suggestions oluştur
   */
  private generateImprovementSuggestions(
    originalCV: ATSCVData,
    optimizedCV: ATSCVData,
    validation: ATSValidationResult
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Professional Summary changes
    if (originalCV.professionalSummary.summary !== optimizedCV.professionalSummary.summary) {
      suggestions.push({
        section: 'Professional Summary',
        field: 'summary',
        currentValue: originalCV.professionalSummary.summary,
        suggestedValue: optimizedCV.professionalSummary.summary,
        reason: 'Enhanced with relevant keywords to improve ATS matching',
        impact: 'HIGH',
        category: 'KEYWORDS'
      });
    }

    // Key Skills changes
    const addedSkills = optimizedCV.professionalSummary.keySkills.filter(
      skill => !originalCV.professionalSummary.keySkills.includes(skill)
    );
    
    if (addedSkills.length > 0) {
      suggestions.push({
        section: 'Professional Summary',
        field: 'keySkills',
        currentValue: originalCV.professionalSummary.keySkills.join(', '),
        suggestedValue: optimizedCV.professionalSummary.keySkills.join(', '),
        reason: `Added ${addedSkills.length} relevant keywords: ${addedSkills.join(', ')}`,
        impact: 'HIGH',
        category: 'KEYWORDS'
      });
    }

    // Technical Skills changes
    originalCV.skills.technical.forEach((originalCategory, index) => {
      const optimizedCategory = optimizedCV.skills.technical[index];
      if (optimizedCategory && originalCategory.items.length !== optimizedCategory.items.length) {
        const addedItems = optimizedCategory.items.filter(
          item => !originalCategory.items.some(orig => orig.name === item.name)
        );
        
        if (addedItems.length > 0) {
          suggestions.push({
            section: 'Skills',
            field: originalCategory.category,
            currentValue: originalCategory.items.map(i => i.name).join(', '),
            suggestedValue: optimizedCategory.items.map(i => i.name).join(', '),
            reason: `Added ${addedItems.length} technical skills based on job requirements`,
            impact: 'MEDIUM',
            category: 'KEYWORDS'
          });
        }
      }
    });

    // Configuration changes
    if (originalCV.configuration.cvType !== optimizedCV.configuration.cvType) {
      suggestions.push({
        section: 'Configuration',
        field: 'cvType',
        currentValue: originalCV.configuration.cvType,
        suggestedValue: optimizedCV.configuration.cvType,
        reason: 'Changed to ATS_OPTIMIZED for better compatibility',
        impact: 'HIGH',
        category: 'FORMAT'
      });
    }

    return suggestions;
  }

  /**
   * Keyword enhancements'ları analiz et
   */
  private analyzeKeywordEnhancements(
    originalCV: ATSCVData,
    optimizedCV: ATSCVData,
    jobDescription: string
  ): CVOptimizationResult['keywordEnhancements'] {
    const jobKeywords = this.extractJobKeywords(jobDescription);
    
    // Original CV'deki keywords
    const originalText = this.extractAllCVText(originalCV);
    const originalKeywords = this.findKeywordsInText(originalText, jobKeywords);
    
    // Optimized CV'deki keywords
    const optimizedText = this.extractAllCVText(optimizedCV);
    const optimizedKeywords = this.findKeywordsInText(optimizedText, jobKeywords);
    
    // Added keywords
    const addedKeywords = optimizedKeywords.filter(keyword => 
      !originalKeywords.includes(keyword)
    );
    
    // Enhanced sections
    const enhancedSections = [];
    if (originalCV.professionalSummary.summary !== optimizedCV.professionalSummary.summary) {
      enhancedSections.push('Professional Summary');
    }
    if (originalCV.professionalSummary.keySkills.length !== optimizedCV.professionalSummary.keySkills.length) {
      enhancedSections.push('Key Skills');
    }
    if (originalCV.skills.technical.length !== optimizedCV.skills.technical.length ||
        originalCV.skills.technical.some((cat, i) => 
          cat.items.length !== optimizedCV.skills.technical[i]?.items.length
        )) {
      enhancedSections.push('Technical Skills');
    }

    const originalDensity = originalKeywords.length / jobKeywords.length;
    const optimizedDensity = optimizedKeywords.length / jobKeywords.length;
    
    return {
      addedKeywords,
      enhancedSections,
      keywordDensityImprovement: optimizedDensity - originalDensity
    };
  }

  /**
   * CV'den tüm text'i çıkar
   */
  private extractAllCVText(cvData: ATSCVData): string {
    const textParts: string[] = [];
    
    textParts.push(cvData.professionalSummary.summary);
    textParts.push(...cvData.professionalSummary.keySkills);
    
    cvData.workExperience.forEach(exp => {
      textParts.push(...exp.achievements);
      if (exp.technologies) {
        textParts.push(...exp.technologies);
      }
    });
    
    cvData.skills.technical.forEach(category => {
      textParts.push(...category.items.map(item => item.name));
    });
    
    textParts.push(...cvData.skills.soft);
    
    return textParts.join(' ').toLowerCase();
  }

  /**
   * Text'te keywords bul
   */
  private findKeywordsInText(text: string, keywords: string[]): string[] {
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }
}