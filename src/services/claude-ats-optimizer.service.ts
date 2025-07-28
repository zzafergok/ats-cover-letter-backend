import { ATSCVData } from '../types/cv.types';
import logger from '../config/logger';
import Anthropic from '@anthropic-ai/sdk';

export interface ATSOptimizationRequest {
  cvData: ATSCVData;
  jobDescription?: string;
  targetCompany?: string;
  templateId: string;
  language: 'TURKISH' | 'ENGLISH';
}

export interface ATSOptimizedContent {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    linkedIn?: string;
    portfolio?: string;
    github?: string;
  };
  professionalSummary: {
    summary: string;
    targetPosition: string;
    yearsOfExperience: number;
    keySkills: string[];
  };
  workExperience: Array<{
    companyName: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string | null;
    isCurrentRole: boolean;
    achievements: string[];
    technologies?: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    location: string;
    startDate: string;
    endDate: string | null;
    gpa?: number;
    honors?: string[];
    relevantCoursework?: string[];
  }>;
  skills: {
    technical: Array<{
      category: string;
      items: Array<{
        name: string;
        proficiencyLevel: string;
      }>;
    }>;
    languages: Array<{
      language: string;
      proficiency: string;
    }>;
    soft: string[];
  };
  certifications?: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expirationDate?: string;
    credentialId?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    startDate: string;
    endDate: string | null;
    url?: string;
    achievements: string[];
  }>;
}

export class ClaudeATSOptimizerService {
  private static instance: ClaudeATSOptimizerService;
  private anthropic: Anthropic;

  private constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  public static getInstance(): ClaudeATSOptimizerService {
    if (!ClaudeATSOptimizerService.instance) {
      ClaudeATSOptimizerService.instance = new ClaudeATSOptimizerService();
    }
    return ClaudeATSOptimizerService.instance;
  }

  /**
   * Optimize CV content using Claude API for ATS compatibility and job matching
   */
  async optimizeForATS(request: ATSOptimizationRequest): Promise<ATSOptimizedContent> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting ATS optimization with Claude API', {
        templateId: request.templateId,
        language: request.language,
        hasJobDescription: !!request.jobDescription,
        applicantName: `${request.cvData.personalInfo.firstName} ${request.cvData.personalInfo.lastName}`
      });

      const optimizationPrompt = this.buildOptimizationPrompt(request);
      
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: optimizationPrompt
          }
        ]
      });

      const optimizedContent = this.parseClaudeResponse(response);
      
      const processingTime = Date.now() - startTime;
      
      logger.info('ATS optimization completed successfully', {
        templateId: request.templateId,
        language: request.language,
        processingTimeMs: processingTime,
        applicantName: `${request.cvData.personalInfo.firstName} ${request.cvData.personalInfo.lastName}`,
        responseTokens: response.usage?.output_tokens || 0
      });

      return optimizedContent;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('ATS optimization failed:', {
        templateId: request.templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        processingTimeMs: processingTime
      });
      
      throw new Error(`ATS optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build comprehensive optimization prompt for Claude
   */
  private buildOptimizationPrompt(request: ATSOptimizationRequest): string {
    const { cvData, jobDescription, targetCompany, templateId, language } = request;
    
    const isEnglish = language === 'ENGLISH';

    return `You are an expert ATS (Applicant Tracking System) CV optimization specialist. Your task is to optimize the provided CV data to be highly ATS-compatible while matching it to the specific job requirements.

**LANGUAGE**: ${language} - ${isEnglish ? 'Generate all content in English' : 'Generate all content in Turkish'}

**TEMPLATE**: ${templateId} - Optimize for this specific template style and target audience

**JOB INFORMATION**:
${jobDescription ? `Job Description: ${jobDescription}` : 'No specific job description provided - optimize for general ATS compatibility'}
${targetCompany ? `Target Company: ${targetCompany}` : ''}

**ORIGINAL CV DATA**:
${JSON.stringify(cvData, null, 2)}

**OPTIMIZATION REQUIREMENTS**:

1. **ATS Compatibility**: 
   - Use standard section headers (EXPERIENCE, EDUCATION, SKILLS, etc.)
   - Include relevant keywords from job description naturally
   - Use simple, clean formatting without special characters
   - Ensure proper date formats and contact information

2. **Content Enhancement**:
   - Rewrite professional summary to match target position
   - Optimize work experience descriptions with quantifiable achievements
   - Highlight relevant skills and technologies
   - Improve language to be more impactful and professional

3. **Job Matching**:
   - Prioritize experiences and skills that match job requirements
   - Add relevant keywords naturally throughout the content
   - Emphasize achievements that align with target role
   - Tailor the professional summary for the specific position

4. **Language-Specific Requirements**:
${isEnglish ? `
   - Use American English spelling and terminology
   - Follow US CV standards and conventions
   - Use action verbs like "Led", "Developed", "Implemented", "Achieved"
   - Include quantifiable metrics (percentages, numbers, dollar amounts)
` : `
   - Use proper Turkish grammar and professional terminology
   - Follow Turkish CV standards and conventions
   - Use Turkish action verbs like "Yönetti", "Geliştirdi", "Uyguladı", "Başardı"
   - Include quantifiable metrics (percentages, numbers, amounts in Turkish format)
`}

5. **Template-Specific Optimization**:
${this.getTemplateSpecificInstructions(templateId, isEnglish)}

**OUTPUT FORMAT**: Return ONLY a valid JSON object with the optimized content following this exact structure:

{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string", 
    "email": "string",
    "phone": "string",
    "address": "string (city, country format)",
    "linkedIn": "string (optional)",
    "portfolio": "string (optional)",
    "github": "string (optional)"
  },
  "professionalSummary": {
    "summary": "string (3-4 sentences, ATS-optimized)",
    "targetPosition": "string (exact job title match if provided)",
    "yearsOfExperience": number,
    "keySkills": ["array of 5-8 relevant skills"]
  },
  "workExperience": [
    {
      "companyName": "string",
      "position": "string", 
      "location": "string",
      "startDate": "string (MMM YYYY format)",
      "endDate": "string | null",
      "isCurrentRole": boolean,
      "achievements": ["array of 3-5 quantified achievements"],
      "technologies": ["array of relevant technologies (optional)"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string", 
      "location": "string",
      "startDate": "string (MMM YYYY format)",
      "endDate": "string | null",
      "gpa": number (optional),
      "honors": ["array (optional)"],
      "relevantCoursework": ["array (optional)"]
    }
  ],
  "skills": {
    "technical": [
      {
        "category": "string",
        "items": [
          {"name": "string", "proficiencyLevel": "Beginner|Intermediate|Advanced|Expert"}
        ]
      }
    ],
    "languages": [
      {"language": "string", "proficiency": "Native|Fluent|Advanced|Intermediate|Basic"}
    ],
    "soft": ["array of soft skills"]
  },
  "certifications": [
    {
      "name": "string",
      "issuingOrganization": "string",
      "issueDate": "string (MMM YYYY format)",
      "expirationDate": "string (optional)",
      "credentialId": "string (optional)"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string (optimized description)",
      "technologies": ["array"],
      "startDate": "string (MMM YYYY format)",
      "endDate": "string | null",
      "url": "string (optional)",
      "achievements": ["array of quantified results"]
    }
  ]
}

**CRITICAL**: 
- Return ONLY the JSON object, no explanations or additional text
- Ensure all dates are in the correct format
- All achievements must be quantified with metrics where possible
- Include job-relevant keywords naturally throughout the content
- Maintain professional tone appropriate for ${language} language`;
  }

  /**
   * Get template-specific optimization instructions
   */
  private getTemplateSpecificInstructions(templateId: string, isEnglish: boolean): string {
    const templateInstructions: Record<string, { en: string; tr: string }> = {
      'office-manager': {
        en: 'Focus on administrative efficiency, team coordination, office operations, vendor management, and process improvement. Highlight multitasking abilities and organizational skills.',
        tr: 'İdari verimlilik, takım koordinasyonu, ofis operasyonları, tedarikçi yönetimi ve süreç iyileştirme konularına odaklanın. Çoklu görev yeteneği ve organizasyon becerilerini öne çıkarın.'
      },
      'office-manager-alt': {
        en: 'Emphasize leadership in administrative functions, budget management, staff supervision, and strategic planning. Show measurable improvements in office efficiency.',
        tr: 'İdari fonksiyonlarda liderlik, bütçe yönetimi, personel denetimi ve stratejik planlamayı vurgulayın. Ofis verimliliğindeki ölçülebilir iyileştirmeleri gösterin.'
      },
      'turkish-general': {
        en: 'Adapt content for Turkish job market standards. Include military service if applicable. Emphasize education credentials and professional development.',
        tr: 'İçeriği Türk iş piyasası standartlarına uyarlayın. Varsa askerlik durumunu belirtin. Eğitim belgelerinde ve mesleki gelişimde vurgulayın.'
      },
      'accountant': {
        en: 'Highlight financial analysis, GAAP compliance, tax preparation, audit experience, and ERP systems. Include CPA or relevant certifications prominently.',
        tr: 'Finansal analiz, muhasebe standartları uyumu, vergi hazırlığı, denetim deneyimi ve ERP sistemlerini vurgulayın. SMMM veya ilgili sertifikaları öne çıkarın.'
      },
      'hr-manager': {
        en: 'Focus on talent acquisition, employee relations, performance management, compliance, and HR analytics. Show impact on employee retention and satisfaction.',
        tr: 'Yetenek kazanımı, çalışan ilişkileri, performans yönetimi, uyumluluk ve İK analitiğine odaklanın. Çalışan elde tutma ve memnuniyetindeki etkiyi gösterin.'
      }
    };

    const template = templateInstructions[templateId];
    if (template) {
      return isEnglish ? template.en : template.tr;
    }

    return isEnglish 
      ? 'Optimize for general professional requirements with emphasis on quantifiable achievements and relevant keywords.'
      : 'Genel profesyonel gereksinimler için optimize edin, ölçülebilir başarılar ve ilgili anahtar kelimeleri vurgulayın.';
  }

  /**
   * Parse Claude's response and validate the structure
   */
  private parseClaudeResponse(response: any): ATSOptimizedContent {
    try {
      const content = response.content[0]?.text;
      if (!content) {
        throw new Error('Empty response from Claude API');
      }

      // Extract JSON from the response (in case there's additional text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Claude response');
      }

      const parsedContent = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      this.validateOptimizedContent(parsedContent);
      
      return parsedContent as ATSOptimizedContent;
      
    } catch (error) {
      logger.error('Failed to parse Claude response:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responsePreview: response.content?.[0]?.text?.substring(0, 500) || 'No content'
      });
      
      throw new Error(`Failed to parse optimization results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate the structure of optimized content
   */
  private validateOptimizedContent(content: any): void {
    const requiredFields = [
      'personalInfo',
      'professionalSummary', 
      'workExperience',
      'education',
      'skills'
    ];

    for (const field of requiredFields) {
      if (!content[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate personal info
    if (!content.personalInfo.firstName || !content.personalInfo.lastName || !content.personalInfo.email) {
      throw new Error('Missing required personal information fields');
    }

    // Validate arrays
    if (!Array.isArray(content.workExperience) || content.workExperience.length === 0) {
      throw new Error('Work experience must be a non-empty array');
    }

    if (!Array.isArray(content.education) || content.education.length === 0) {
      throw new Error('Education must be a non-empty array');
    }

    logger.debug('Optimized content validation passed', {
      workExperienceCount: content.workExperience.length,
      educationCount: content.education.length,
      hasSkills: !!content.skills,
      hasCertifications: !!content.certifications,
      hasProjects: !!content.projects
    });
  }
}