import { ATSCVData } from '../types/cv.types';
import { HTMLToPDFService, PDFGenerationOptions } from './html-pdf.service';
import logger from '../config/logger';

export interface ATSPDFOptions {
  template?: 'PROFESSIONAL' | 'MODERN' | 'EXECUTIVE';
  optimizeForATS?: boolean;
  includeKeywords?: boolean;
  language?: 'TURKISH' | 'ENGLISH';
}

export class ATSPDFService {
  private static instance: ATSPDFService;
  private htmlToPdfService: HTMLToPDFService;

  private constructor() {
    this.htmlToPdfService = HTMLToPDFService.getInstance();
  }

  static getInstance(): ATSPDFService {
    if (!ATSPDFService.instance) {
      ATSPDFService.instance = new ATSPDFService();
    }
    return ATSPDFService.instance;
  }

  /**
   * Generate modern ATS-optimized CV using HTML-to-PDF
   */
  async generateATSCV(
    cvData: ATSCVData,
    options: ATSPDFOptions = {}
  ): Promise<Buffer> {
    try {
      // Convert ATS options to PDF generation options
      const pdfOptions: PDFGenerationOptions = {
        template: options.template || 'PROFESSIONAL',
        format: 'A4',
        language: options.language || cvData.configuration.language,
        margins: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        includeKeywordOptimization: options.includeKeywords !== false,
      };

      // Generate PDF using modern HTML-to-PDF approach
      const pdfBuffer = await this.htmlToPdfService.generateATSCV(
        cvData,
        pdfOptions
      );

      logger.info('ATS CV generated with modern HTML-to-PDF approach', {
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        template: options.template || 'PROFESSIONAL',
        pdfSize: pdfBuffer.length,
        language: pdfOptions.language,
      });

      return pdfBuffer;
    } catch (error) {
      logger.error('Modern ATS CV generation failed:', error);
      throw new Error('ATS CV oluşturulamadı');
    }
  }

  /**
   * Generate ATS CV with template selection
   */
  async generateWithTemplate(
    cvData: ATSCVData,
    templateStyle: 'PROFESSIONAL' | 'MODERN' | 'EXECUTIVE'
  ): Promise<Buffer> {
    return this.generateATSCV(cvData, {
      template: templateStyle,
      optimizeForATS: true,
      includeKeywords: true,
    });
  }

  /**
   * Generate simple ATS CV (fallback method)
   */
  async generateSimpleATS(cvData: ATSCVData): Promise<Buffer> {
    try {
      return await this.generateATSCV(cvData, {
        template: 'PROFESSIONAL',
        optimizeForATS: true,
      });
    } catch (error) {
      logger.error('Modern HTML-to-PDF failed, falling back to legacy PDF generation:', error);
      
      // Fallback to existing PDF service if HTML-to-PDF fails
      try {
        const { PdfService } = await import('./pdf.service');
        const pdfService = PdfService.getInstance();
        
        // Create a simple test CV if the service supports it
        logger.info('Using fallback PDF generation method');
        return await pdfService.generateATSTestCV();
      } catch (fallbackError) {
        logger.error('Fallback PDF generation also failed:', fallbackError);
        throw new Error('All PDF generation methods failed. Please try again later.');
      }
    }
  }

  /**
   * Generate AI-optimized ATS CV
   */
  async generateAIOptimized(cvData: ATSCVData): Promise<Buffer> {
    try {
      // Import Claude service dynamically to avoid circular dependencies
      const { generateATSCVWithClaude } = await import('./claude.service');

      // Get AI-optimized content
      const optimizedContent = await generateATSCVWithClaude(
        cvData,
        cvData.configuration.jobDescription
      );

      // Create enhanced CV data with AI optimization
      const enhancedCVData = this.enhanceCVWithAI(cvData, optimizedContent);

      return this.generateATSCV(enhancedCVData, {
        template: 'PROFESSIONAL',
        optimizeForATS: true,
        includeKeywords: true,
      });
    } catch (error) {
      logger.error(
        'AI-optimized ATS CV generation failed, falling back to simple ATS:',
        error
      );
      // Fallback to simple ATS generation
      return this.generateSimpleATS(cvData);
    }
  }

  /**
   * Export ATS CV in multiple formats
   */
  async exportMultiFormat(
    cvData: ATSCVData,
    formats: ('PDF' | 'DOCX')[],
    options: ATSPDFOptions = {}
  ): Promise<Array<{ format: string; buffer: Buffer; filename: string }>> {
    const results = [];
    const baseFilename = `${cvData.personalInfo.firstName}_${cvData.personalInfo.lastName}_CV`;

    for (const format of formats) {
      try {
        let buffer: Buffer;
        let filename: string;

        switch (format) {
          case 'PDF': {
            buffer = await this.generateATSCV(cvData, options);
            filename = `${baseFilename}.pdf`;
            break;
          }

          case 'DOCX': {
            const { DOCXExportService } = await import('./docx-export.service');
            const docxService = DOCXExportService.getInstance();
            buffer = await docxService.generateATSCompliantDOCX(cvData);
            filename = `${baseFilename}.docx`;
            break;
          }

          default:
            continue;
        }

        results.push({
          format,
          buffer,
          filename,
        });

        logger.info(`${format} export completed`, {
          applicant: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
          fileSize: buffer.length,
        });
      } catch (error) {
        logger.error(`${format} export failed:`, error);
        // Continue with other formats even if one fails
      }
    }

    return results;
  }

  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return [
      {
        id: 'PROFESSIONAL',
        name: 'Professional',
        description: 'Clean, ATS-optimized template for traditional industries',
        features: ['ATS Optimized', 'Clean Layout', 'High Readability'],
        bestFor: [
          'Corporate',
          'Finance',
          'Consulting',
          'Traditional Industries',
        ],
      },
      {
        id: 'MODERN',
        name: 'Modern',
        description: 'Contemporary design for tech and creative roles',
        features: ['Modern Design', 'Tech-Friendly', 'Visual Appeal'],
        bestFor: ['Technology', 'Startups', 'Creative', 'Digital Marketing'],
      },
      {
        id: 'EXECUTIVE',
        name: 'Executive',
        description: 'Sophisticated layout for senior-level positions',
        features: ['Executive Style', 'Premium Look', 'Leadership Focus'],
        bestFor: [
          'C-Level',
          'Senior Management',
          'Director Roles',
          'Board Positions',
        ],
      },
    ];
  }

  /**
   * Validate CV data for ATS requirements
   */
  validateATSRequirements(cvData: ATSCVData): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check required fields
    if (!cvData.personalInfo.email) {
      issues.push('Email adresi eksik');
    }

    if (!cvData.personalInfo.phone) {
      issues.push('Telefon numarası eksik');
    }

    if (
      !cvData.professionalSummary.summary ||
      cvData.professionalSummary.summary.length < 50
    ) {
      issues.push('Profesyonel özet çok kısa veya eksik');
      recommendations.push('En az 2-3 cümlelik profesyonel özet ekleyin');
    }

    if (cvData.workExperience.length === 0) {
      issues.push('İş deneyimi eksik');
    }

    if (cvData.skills.technical.length === 0) {
      issues.push('Teknik beceriler eksik');
      recommendations.push('İş ilanıyla ilgili teknik becerileri ekleyin');
    }

    // Check ATS optimization
    const hasQuantifiableAchievements = cvData.workExperience.some((exp) =>
      exp.achievements.some((ach) => /\d+/.test(ach))
    );

    if (!hasQuantifiableAchievements) {
      recommendations.push(
        'İş başarılarınıza sayısal veriler ekleyin (%, rakam, vs.)'
      );
    }

    if (cvData.professionalSummary.keySkills.length < 5) {
      recommendations.push('Anahtar beceri sayısını artırın (en az 5-8 adet)');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Enhance CV data with AI-generated content
   */
  private enhanceCVWithAI(cvData: ATSCVData, aiContent: string): ATSCVData {
    // Extract enhanced professional summary from AI content
    const summaryMatch = aiContent.match(
      /PROFESSIONAL SUMMARY[:\n]+(.*?)(?=\n\n|\nWORK|$)/s
    );

    if (summaryMatch) {
      cvData.professionalSummary.summary = summaryMatch[1].trim();
    }

    // Extract enhanced achievements
    const achievementMatches = aiContent.match(/• (.+)/g);
    if (achievementMatches && cvData.workExperience.length > 0) {
      // Distribute enhanced achievements across work experiences
      const enhancedAchievements = achievementMatches.map((match) =>
        match.substring(2)
      );

      cvData.workExperience.forEach((exp, index) => {
        const startIndex =
          index *
          Math.floor(
            enhancedAchievements.length / cvData.workExperience.length
          );
        const endIndex =
          (index + 1) *
          Math.floor(
            enhancedAchievements.length / cvData.workExperience.length
          );

        if (enhancedAchievements.slice(startIndex, endIndex).length > 0) {
          exp.achievements = enhancedAchievements.slice(startIndex, endIndex);
        }
      });
    }

    return cvData;
  }

  /**
   * Generate test ATS CV for development
   */
  async generateTestCV(): Promise<Buffer> {
    const testData: ATSCVData = {
      personalInfo: {
        firstName: 'John',
        lastName: 'Developer',
        email: 'john.developer@email.com',
        phone: '+90 555 123 4567',
        address: {
          city: 'Istanbul',
          country: 'Turkey',
        },
        linkedIn: 'https://linkedin.com/in/john-developer',
        github: 'https://github.com/john-developer',
        portfolio: 'https://johndeveloper.dev',
      },
      professionalSummary: {
        summary:
          'Experienced Full Stack Developer with 5+ years in modern web technologies including React, Node.js, and cloud platforms. Proven track record of delivering scalable applications and leading development teams in agile environments.',
        targetPosition: 'Senior Full Stack Developer',
        yearsOfExperience: 5,
        keySkills: [
          'React',
          'Node.js',
          'TypeScript',
          'AWS',
          'MongoDB',
          'Docker',
          'Kubernetes',
          'GraphQL',
        ],
      },
      workExperience: [
        {
          id: '1',
          companyName: 'Tech Innovations Ltd.',
          position: 'Senior Full Stack Developer',
          location: 'Istanbul, Turkey',
          startDate: new Date('2022-01-01'),
          endDate: null,
          isCurrentRole: true,
          achievements: [
            'Led development of microservices architecture serving 100K+ daily active users',
            'Reduced application load time by 45% through performance optimization and caching strategies',
            'Mentored team of 4 junior developers and established code review processes',
            'Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes',
            'Designed and developed RESTful APIs handling 1M+ requests per day',
          ],
          technologies: [
            'React',
            'Node.js',
            'MongoDB',
            'AWS',
            'Docker',
            'Redis',
            'GraphQL',
          ],
        },
        {
          id: '2',
          companyName: 'Digital Solutions Inc.',
          position: 'Full Stack Developer',
          location: 'Istanbul, Turkey',
          startDate: new Date('2020-03-01'),
          endDate: new Date('2021-12-31'),
          isCurrentRole: false,
          achievements: [
            'Developed 15+ responsive web applications using React and Express.js',
            'Collaborated with UX team to improve user experience by 30%',
            'Integrated third-party APIs and payment systems for 10+ e-commerce clients',
            'Reduced bug reports by 40% through comprehensive testing implementation',
          ],
          technologies: [
            'React',
            'Express.js',
            'PostgreSQL',
            'Stripe API',
            'Jest',
          ],
        },
      ],
      education: [
        {
          id: '1',
          institution: 'Istanbul Technical University',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Engineering',
          location: 'Istanbul, Turkey',
          startDate: new Date('2016-09-01'),
          endDate: new Date('2020-06-01'),
          gpa: 3.8,
          honors: ["Dean's List", 'Software Engineering Excellence Award'],
        },
      ],
      skills: {
        technical: [
          {
            category: 'Programming Languages',
            items: [
              { name: 'JavaScript', proficiencyLevel: 'Expert' },
              { name: 'TypeScript', proficiencyLevel: 'Advanced' },
              { name: 'Python', proficiencyLevel: 'Intermediate' },
              { name: 'Java', proficiencyLevel: 'Intermediate' },
            ],
          },
          {
            category: 'Frontend Technologies',
            items: [
              { name: 'React', proficiencyLevel: 'Expert' },
              { name: 'Next.js', proficiencyLevel: 'Advanced' },
              { name: 'Vue.js', proficiencyLevel: 'Intermediate' },
              { name: 'Angular', proficiencyLevel: 'Beginner' },
            ],
          },
          {
            category: 'Backend Technologies',
            items: [
              { name: 'Node.js', proficiencyLevel: 'Expert' },
              { name: 'Express.js', proficiencyLevel: 'Advanced' },
              { name: 'NestJS', proficiencyLevel: 'Intermediate' },
              { name: 'Django', proficiencyLevel: 'Intermediate' },
            ],
          },
          {
            category: 'Cloud & DevOps',
            items: [
              { name: 'AWS', proficiencyLevel: 'Advanced' },
              { name: 'Docker', proficiencyLevel: 'Advanced' },
              { name: 'Kubernetes', proficiencyLevel: 'Intermediate' },
              { name: 'CI/CD', proficiencyLevel: 'Advanced' },
            ],
          },
        ],
        languages: [
          { language: 'Turkish', proficiency: 'Native' },
          { language: 'English', proficiency: 'Advanced' },
          { language: 'German', proficiency: 'Intermediate' },
        ],
        soft: [
          'Team Leadership',
          'Problem Solving',
          'Project Management',
          'Communication',
          'Mentoring',
        ],
      },
      certifications: [
        {
          id: '1',
          name: 'AWS Certified Solutions Architect',
          issuingOrganization: 'Amazon Web Services',
          issueDate: new Date('2023-05-01'),
          expirationDate: new Date('2026-05-01'),
        },
        {
          id: '2',
          name: 'Certified Kubernetes Administrator',
          issuingOrganization: 'Cloud Native Computing Foundation',
          issueDate: new Date('2023-03-01'),
          expirationDate: new Date('2026-03-01'),
        },
      ],
      projects: [
        {
          id: '1',
          name: 'E-Commerce Platform',
          description:
            'Full-stack e-commerce platform with React frontend, Node.js backend, and MongoDB database. Features include user authentication, payment processing, inventory management, and real-time order tracking.',
          technologies: [
            'React',
            'Node.js',
            'MongoDB',
            'Stripe',
            'AWS',
            'Docker',
          ],
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-06-01'),
          achievements: [
            'Handles 10K+ concurrent users',
            'Integrated with 5+ payment providers',
            'Mobile-responsive design with 98% lighthouse score',
          ],
        },
      ],
      configuration: {
        targetCompany: 'Microsoft',
        language: 'ENGLISH',
        cvType: 'ATS_OPTIMIZED',
        templateStyle: 'PROFESSIONAL',
        useAI: false,
      },
    };

    return this.generateATSCV(testData, {
      template: 'PROFESSIONAL',
      optimizeForATS: true,
      includeKeywords: true,
      language: 'ENGLISH',
    });
  }
}
