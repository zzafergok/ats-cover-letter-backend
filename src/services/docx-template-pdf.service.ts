import { ATSCVData } from '../types/cv.types';
import logger from '../config/logger';
import * as path from 'path';
import * as fs from 'fs/promises';
import mammoth from 'mammoth';
import puppeteer from 'puppeteer';
import { ClaudeATSOptimizerService, ATSOptimizationRequest, ATSOptimizedContent } from './claude-ats-optimizer.service';

interface TemplateMapping {
  id: string;
  name: string;
  docxPath: string;
  description: string;
  category?: string;
  language?: string;
  targetRoles?: string[];
}

export class DocxTemplatePdfService {
  private static instance: DocxTemplatePdfService;
  private templatesDir: string;
  private availableTemplates: TemplateMapping[];
  private claudeOptimizer: ClaudeATSOptimizerService;

  private constructor() {
    this.templatesDir = path.join(process.cwd(), 'templates', 'docx');
    this.availableTemplates = [];
    this.claudeOptimizer = ClaudeATSOptimizerService.getInstance();
    this.initializeTemplates();
  }

  static getInstance(): DocxTemplatePdfService {
    if (!DocxTemplatePdfService.instance) {
      DocxTemplatePdfService.instance = new DocxTemplatePdfService();
    }
    return DocxTemplatePdfService.instance;
  }

  private async initializeTemplates() {
    try {
      // Templates dizinini oluştur
      await fs.mkdir(this.templatesDir, { recursive: true });
      
      // Varsayılan template'leri tanımla (Microsoft ATS-Optimized Templates)
      this.availableTemplates = [
        {
          id: 'professional',
          name: 'Professional CV Template',
          docxPath: path.join(this.templatesDir, 'professional-cv.docx'),
          description: 'Clean and professional CV template for corporate positions'
        },
        {
          id: 'modern',
          name: 'Modern CV Template', 
          docxPath: path.join(this.templatesDir, 'modern-cv.docx'),
          description: 'Modern design CV template for tech and creative roles'
        },
        {
          id: 'academic',
          name: 'Academic CV Template',
          docxPath: path.join(this.templatesDir, 'academic-cv.docx'),
          description: 'Academic CV template for researchers and educators'
        },
        {
          id: 'executive',
          name: 'Executive CV Template',
          docxPath: path.join(this.templatesDir, 'executive-cv.docx'),
          description: 'Executive level CV template for senior positions'
        },
        {
          id: 'classic',
          name: 'Classic CV Template',
          docxPath: path.join(this.templatesDir, 'classic-cv.docx'),
          description: 'Classic and traditional CV template design'
        },
        // Microsoft ATS-Optimized Templates
        {
          id: 'office-manager',
          name: 'Office Manager CV Template',
          docxPath: path.join(this.templatesDir, 'office-manager-cv.docx'),
          description: 'ATS-optimized template for office management and administrative roles (Style 1)',
          category: 'microsoft-ats',
          targetRoles: ['Office Manager', 'Administrative Assistant', 'Operations Manager']
        },
        {
          id: 'office-manager-alt',
          name: 'Office Manager Alternative CV Template',
          docxPath: path.join(this.templatesDir, 'office-manager-alt-cv.docx'),
          description: 'Alternative ATS-optimized template for office management roles (Style 2)',
          category: 'microsoft-ats',
          targetRoles: ['Office Manager', 'Administrative Coordinator', 'Executive Assistant']
        },
        {
          id: 'turkish-general',
          name: 'Turkish General CV Template',
          docxPath: path.join(this.templatesDir, 'turkish-general-cv.docx'),
          description: 'Turkish language ATS-optimized CV template for general positions',
          category: 'microsoft-ats',
          language: 'turkish',
          targetRoles: ['General Positions', 'Entry Level', 'Mid-Level']
        },
        {
          id: 'accountant',
          name: 'Accountant CV Template',
          docxPath: path.join(this.templatesDir, 'accountant-cv.docx'),
          description: 'ATS-optimized template for accounting and finance professionals',
          category: 'microsoft-ats',
          targetRoles: ['Accountant', 'Financial Analyst', 'Bookkeeper', 'Finance Manager']
        },
        {
          id: 'hr-manager',
          name: 'HR Manager CV Template',
          docxPath: path.join(this.templatesDir, 'hr-manager-cv.docx'),
          description: 'ATS-optimized template for human resources and management roles',
          category: 'microsoft-ats',
          targetRoles: ['HR Manager', 'HR Specialist', 'Recruiter', 'People Operations']
        }
      ];

      logger.info('DOCX Template PDF Service initialized', {
        templatesDir: this.templatesDir,
        availableTemplates: this.availableTemplates.length
      });
    } catch (error) {
      logger.error('Failed to initialize DOCX templates:', error);
    }
  }

  /**
   * Mevcut template'leri listele
   */
  async getAvailableTemplates(): Promise<TemplateMapping[]> {
    const existingTemplates = [];
    
    for (const template of this.availableTemplates) {
      try {
        await fs.access(template.docxPath);
        existingTemplates.push(template);
      } catch (error) {
        logger.warn(`Template not found: ${template.docxPath}`);
      }
    }
    
    return existingTemplates;
  }

  /**
   * Generate ATS-optimized PDF from DOCX template using Claude API
   */
  async generateATSOptimizedPdfFromDocxTemplate(
    templateId: string,
    cvData: ATSCVData,
    jobDescription?: string,
    targetCompany?: string
  ): Promise<Buffer> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting ATS-optimized DOCX template to PDF conversion', {
        templateId,
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        hasJobDescription: !!jobDescription,
        hasTargetCompany: !!targetCompany,
        language: cvData.configuration.language
      });

      // Step 1: Optimize CV content using Claude API
      const optimizationRequest: ATSOptimizationRequest = {
        cvData,
        jobDescription,
        targetCompany,
        templateId,
        language: cvData.configuration.language
      };

      const optimizedContent = await this.claudeOptimizer.optimizeForATS(optimizationRequest);
      
      // Step 2: Convert optimized content back to ATSCVData format
      const optimizedCVData = this.convertOptimizedContentToATSCVData(optimizedContent, cvData);
      
      // Step 3: Generate PDF using the optimized data
      const pdfBuffer = await this.generatePdfFromDocxTemplate(templateId, optimizedCVData);
      
      const processingTime = Date.now() - startTime;
      
      logger.info('ATS-optimized DOCX template to PDF conversion completed', {
        templateId,
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        pdfSize: pdfBuffer.length,
        processingTimeMs: processingTime,
        language: cvData.configuration.language
      });

      return pdfBuffer;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('ATS-optimized DOCX template to PDF conversion failed:', {
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        processingTimeMs: processingTime
      });
      
      throw new Error(`ATS-optimized template PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * DOCX template'i PDF olarak CV oluştur (Enhanced with best practice error handling)
   */
  async generatePdfFromDocxTemplate(
    templateId: string,
    cvData: ATSCVData
  ): Promise<Buffer> {
    const startTime = Date.now();
    
    try {
      // Input validation
      if (!templateId || typeof templateId !== 'string') {
        throw new Error('Template ID is required and must be a string');
      }
      
      if (!cvData || typeof cvData !== 'object') {
        throw new Error('CV data is required and must be an object');
      }

      // Validate required CV data fields
      this.validateCVData(cvData);

      const template = this.availableTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}. Available templates: ${this.availableTemplates.map(t => t.id).join(', ')}`);
      }

      // DOCX dosyasının varlığını kontrol et
      try {
        await fs.access(template.docxPath);
      } catch (accessError) {
        throw new Error(`Template file not accessible: ${template.docxPath}`);
      }

      logger.info('Starting DOCX template to PDF conversion', {
        templateId,
        templatePath: template.docxPath,
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        language: cvData.configuration.language
      });

      // DOCX'i HTML'e çevir with enhanced error handling
      let docxBuffer: Buffer;
      let result: any;
      
      try {
        docxBuffer = await fs.readFile(template.docxPath);
        if (docxBuffer.length === 0) {
          throw new Error('Template file is empty');
        }
        
        result = await mammoth.convertToHtml({
          buffer: docxBuffer
        }, {
          styleMap: this.getStyleMap(),
          includeDefaultStyleMap: true,
          convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: '' }))
        });

        // Check for conversion warnings
        if (result.messages && result.messages.length > 0) {
          logger.warn('DOCX conversion warnings:', {
            templateId,
            warnings: result.messages.map((msg: any) => msg.message)
          });
        }

      } catch (conversionError) {
        logger.error('DOCX to HTML conversion failed:', conversionError);
        throw new Error(`Failed to convert DOCX template: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
      }

      // HTML'e CV verilerini uygula with error handling
      let processedHtml: string;
      try {
        processedHtml = this.applyDataToHtml(result.value, cvData);
        
        // Validate that critical placeholders were replaced
        const remainingPlaceholders = (processedHtml.match(/\{\{[^}]+\}\}/g) || []);
        if (remainingPlaceholders.length > 0) {
          logger.warn('Some placeholders were not replaced:', {
            templateId,
            remainingPlaceholders: remainingPlaceholders.slice(0, 5) // Log first 5 only
          });
        }
        
      } catch (replacementError) {
        logger.error('Data replacement failed:', replacementError);
        throw new Error(`Failed to apply CV data to template: ${replacementError instanceof Error ? replacementError.message : 'Unknown error'}`);
      }

      // Formatlanmış HTML oluştur
      let formattedHtml: string;
      try {
        formattedHtml = this.formatHtmlForPdf(processedHtml, templateId);
      } catch (formatError) {
        logger.error('HTML formatting failed:', formatError);
        throw new Error(`Failed to format HTML for PDF: ${formatError instanceof Error ? formatError.message : 'Unknown error'}`);
      }

      // PDF oluştur with timeout and error handling
      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await this.convertHtmlToPdf(formattedHtml);
        
        // Validate PDF buffer
        if (!pdfBuffer || pdfBuffer.length === 0) {
          throw new Error('Generated PDF is empty');
        }
        
        if (pdfBuffer.length < 1000) { // PDF should be at least 1KB for a valid CV
          throw new Error('Generated PDF is suspiciously small');
        }
        
      } catch (pdfError) {
        logger.error('PDF generation failed:', pdfError);
        throw new Error(`Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
      }

      const processingTime = Date.now() - startTime;
      
      logger.info('DOCX template to PDF conversion completed successfully', {
        templateId,
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        pdfSize: pdfBuffer.length,
        processingTimeMs: processingTime,
        language: cvData.configuration.language
      });

      return pdfBuffer;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('DOCX template to PDF conversion failed:', {
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        processingTimeMs: processingTime,
        applicantName: cvData?.personalInfo ? `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}` : 'Unknown'
      });
      
      // Throw with more context
      throw new Error(`Template PDF generation failed for ${templateId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate CV data to ensure required fields are present
   */
  private validateCVData(cvData: ATSCVData): void {
    if (!cvData.personalInfo) {
      throw new Error('Personal information is required');
    }
    
    if (!cvData.personalInfo.firstName || !cvData.personalInfo.lastName) {
      throw new Error('First name and last name are required');
    }
    
    if (!cvData.personalInfo.email) {
      throw new Error('Email is required');
    }
    
    if (!cvData.professionalSummary) {
      throw new Error('Professional summary is required');
    }
    
    if (!cvData.workExperience || cvData.workExperience.length === 0) {
      throw new Error('At least one work experience entry is required');
    }
    
    if (!cvData.education || cvData.education.length === 0) {
      throw new Error('At least one education entry is required');
    }
    
    if (!cvData.configuration) {
      throw new Error('Configuration is required');
    }
    
    logger.debug('CV data validation passed', {
      hasPersonalInfo: !!cvData.personalInfo,
      workExperienceCount: cvData.workExperience?.length || 0,
      educationCount: cvData.education?.length || 0,
      hasSkills: !!cvData.skills,
      language: cvData.configuration?.language
    });
  }

  /**
   * HTML'e CV verilerini uygula (Advanced format-preserving replacement)
   */
  private applyDataToHtml(html: string, cvData: ATSCVData): string {
    let processedHtml = html;

    try {
      // Safe replacement helper with validation and formatting
      const safeReplace = (template: string, placeholder: string, value: string | null | undefined, defaultValue = ''): string => {
        const safeValue = (value || defaultValue).toString().trim();
        // Escape HTML to prevent formatting issues
        const escapedValue = safeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return template.replace(new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'), escapedValue);
      };

      // Personal Information - Safe replacements with validation
      processedHtml = safeReplace(processedHtml, 'firstName', cvData.personalInfo.firstName);
      processedHtml = safeReplace(processedHtml, 'lastName', cvData.personalInfo.lastName);
      processedHtml = safeReplace(processedHtml, 'fullName', `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`);
      processedHtml = safeReplace(processedHtml, 'email', cvData.personalInfo.email);
      processedHtml = safeReplace(processedHtml, 'phone', cvData.personalInfo.phone);
      processedHtml = safeReplace(processedHtml, 'city', cvData.personalInfo.address.city);
      processedHtml = safeReplace(processedHtml, 'country', cvData.personalInfo.address.country);
      processedHtml = safeReplace(processedHtml, 'address', `${cvData.personalInfo.address.city}, ${cvData.personalInfo.address.country}`);
      processedHtml = safeReplace(processedHtml, 'linkedin', cvData.personalInfo.linkedIn);
      processedHtml = safeReplace(processedHtml, 'portfolio', cvData.personalInfo.portfolio);
      processedHtml = safeReplace(processedHtml, 'github', cvData.personalInfo.github);

      // Professional Summary - With careful formatting
      processedHtml = safeReplace(processedHtml, 'targetPosition', cvData.professionalSummary.targetPosition);
      processedHtml = safeReplace(processedHtml, 'position', cvData.professionalSummary.targetPosition);
      processedHtml = safeReplace(processedHtml, 'summary', cvData.professionalSummary.summary);
      processedHtml = safeReplace(processedHtml, 'yearsOfExperience', cvData.professionalSummary.yearsOfExperience.toString());
      processedHtml = safeReplace(processedHtml, 'experience', `${cvData.professionalSummary.yearsOfExperience} years`);
      processedHtml = safeReplace(processedHtml, 'keySkills', cvData.professionalSummary.keySkills.join(', '));

      // Complex sections with format preservation
      processedHtml = this.replaceComplexSections(processedHtml, cvData);

      // Handle intelligent placeholder detection for missing placeholders
      processedHtml = this.handleIntelligentPlaceholders(processedHtml, cvData);

      logger.info('HTML content replacement completed successfully', {
        originalLength: html.length,
        processedLength: processedHtml.length,
        placeholdersReplaced: this.countPlaceholdersReplaced(html, processedHtml)
      });

      return processedHtml;

    } catch (error) {
      logger.error('Error in applyDataToHtml:', error);
      // Return original HTML if processing fails to maintain template integrity
      return html;
    }
  }

  /**
   * Replace complex sections (work experience, education, etc.) while preserving format
   */
  private replaceComplexSections(html: string, cvData: ATSCVData): string {
    let processedHtml = html;

    // Work Experience - Format preserving
    if (processedHtml.includes('{{workExperience}}')) {
      const workExpHtml = this.generateWorkExperienceHtml(cvData.workExperience);
      processedHtml = processedHtml.replace(/\{\{workExperience\}\}/g, workExpHtml);
    }

    // Education - Format preserving
    if (processedHtml.includes('{{education}}')) {
      const educationHtml = this.generateEducationHtml(cvData.education);
      processedHtml = processedHtml.replace(/\{\{education\}\}/g, educationHtml);
    }

    // Skills - Multiple formats supported
    if (processedHtml.includes('{{skills}}') || processedHtml.includes('{{technicalSkills}}')) {
      const skillsHtml = this.generateSkillsHtml(cvData.skills);
      processedHtml = processedHtml.replace(/\{\{skills\}\}/g, skillsHtml);
      processedHtml = processedHtml.replace(/\{\{technicalSkills\}\}/g, skillsHtml);
    }

    // Languages
    if (processedHtml.includes('{{languages}}')) {
      const languagesHtml = this.generateLanguagesHtml(cvData.skills.languages);
      processedHtml = processedHtml.replace(/\{\{languages\}\}/g, languagesHtml);
    }

    // Certifications
    if (cvData.certifications && processedHtml.includes('{{certifications}}')) {
      const certsHtml = this.generateCertificationsHtml(cvData.certifications);
      processedHtml = processedHtml.replace(/\{\{certifications\}\}/g, certsHtml);
    }

    // Projects
    if (cvData.projects && processedHtml.includes('{{projects}}')) {
      const projectsHtml = this.generateProjectsHtml(cvData.projects);
      processedHtml = processedHtml.replace(/\{\{projects\}\}/g, projectsHtml);
    }

    return processedHtml;
  }

  /**
   * Handle intelligent placeholders that might not be in standard format
   */
  private handleIntelligentPlaceholders(html: string, cvData: ATSCVData): string {
    let processedHtml = html;

    // Alternative placeholder patterns that might exist in templates
    const alternativePatterns = {
      // Name variations
      name: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
      ad: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
      isim: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
      
      // Contact variations
      'e-posta': cvData.personalInfo.email,
      mail: cvData.personalInfo.email,
      telefon: cvData.personalInfo.phone,
      adres: `${cvData.personalInfo.address.city}, ${cvData.personalInfo.address.country}`,
      
      // Professional variations
      pozisyon: cvData.professionalSummary.targetPosition,
      unvan: cvData.professionalSummary.targetPosition,
      özet: cvData.professionalSummary.summary,
      deneyim: `${cvData.professionalSummary.yearsOfExperience} yıl`,
      
      // Skills variations
      yetenekler: cvData.professionalSummary.keySkills.join(', '),
      beceriler: cvData.professionalSummary.keySkills.join(', ')
    };

    // Apply alternative patterns
    Object.entries(alternativePatterns).forEach(([key, value]) => {
      if (value) {
        // Try different placeholder formats
        const patterns = [
          `{{${key}}}`,
          `{${key}}`,
          `[${key}]`,
          `<${key}>`,
          `__${key}__`,
          `%%${key}%%`
        ];
        
        patterns.forEach(pattern => {
          const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          processedHtml = processedHtml.replace(regex, value.toString());
        });
      }
    });

    return processedHtml;
  }

  /**
   * Count how many placeholders were successfully replaced
   */
  private countPlaceholdersReplaced(original: string, processed: string): number {
    const originalPlaceholders = (original.match(/\{\{[^}]+\}\}/g) || []).length;
    const remainingPlaceholders = (processed.match(/\{\{[^}]+\}\}/g) || []).length;
    return originalPlaceholders - remainingPlaceholders;
  }

  /**
   * Generate work experience HTML while preserving original format
   */
  private generateWorkExperienceHtml(workExperience: any[]): string {
    return workExperience.map(exp => {
      const endDate = exp.isCurrentRole ? 'Present' : this.formatDate(exp.endDate);
      const achievements = exp.achievements?.map((ach: string) => `<li>${ach}</li>`).join('') || '';
      const technologies = exp.technologies?.length ? `<div class="technologies">Technologies: ${exp.technologies.join(', ')}</div>` : '';
      
      return `
        <div class="work-experience-entry">
          <div class="job-header">
            <strong>${exp.position}</strong> at <strong>${exp.companyName}</strong>
          </div>
          <div class="job-details">
            ${exp.location} | ${this.formatDate(exp.startDate)} - ${endDate}
          </div>
          ${achievements ? `<ul class="achievements">${achievements}</ul>` : ''}
          ${technologies}
        </div>
      `;
    }).join('');
  }

  /**
   * Generate education HTML while preserving original format
   */
  private generateEducationHtml(education: any[]): string {
    return education.map(edu => {
      const gradDate = edu.endDate ? this.formatDate(edu.endDate) : 'Present';
      const gpa = edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : '';
      const honors = edu.honors?.length ? `<div>Honors: ${edu.honors.join(', ')}</div>` : '';
      const coursework = edu.relevantCoursework?.length ? `<div>Relevant Coursework: ${edu.relevantCoursework.join(', ')}</div>` : '';
      
      return `
        <div class="education-entry">
          <div><strong>${edu.degree} in ${edu.fieldOfStudy}</strong></div>
          <div>${edu.institution} | ${edu.location} | ${gradDate}</div>
          ${gpa}
          ${honors}
          ${coursework}
        </div>
      `;
    }).join('');
  }

  /**
   * Generate skills HTML with proper categorization
   */
  private generateSkillsHtml(skills: any): string {
    let skillsHtml = '';
    
    // Technical skills
    if (skills.technical?.length) {
      const technicalHtml = skills.technical.map((category: any) => 
        `<div class="skill-category">
          <strong>${category.category}:</strong> 
          ${category.items.map((item: any) => `${item.name} (${item.proficiencyLevel})`).join(', ')}
        </div>`
      ).join('');
      skillsHtml += technicalHtml;
    }
    
    // Soft skills
    if (skills.soft?.length) {
      skillsHtml += `<div class="skill-category"><strong>Soft Skills:</strong> ${skills.soft.join(', ')}</div>`;
    }
    
    return skillsHtml;
  }

  /**
   * Generate languages HTML
   */
  private generateLanguagesHtml(languages: any[]): string {
    return languages.map(lang => 
      `<div class="language-entry">${lang.language} (${lang.proficiency})</div>`
    ).join('');
  }

  /**
   * Generate certifications HTML
   */
  private generateCertificationsHtml(certifications: any[]): string {
    return certifications.map(cert => {
      const issueDate = this.formatDate(cert.issueDate);
      const expDate = cert.expirationDate ? ` - Expires: ${this.formatDate(cert.expirationDate)}` : '';
      const credId = cert.credentialId ? ` (ID: ${cert.credentialId})` : '';
      
      return `
        <div class="certification-entry">
          <strong>${cert.name}</strong><br>
          ${cert.issuingOrganization} | ${issueDate}${expDate}${credId}
          ${cert.verificationUrl ? `<br><a href="${cert.verificationUrl}">Verify</a>` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * Generate projects HTML
   */
  private generateProjectsHtml(projects: any[]): string {
    return projects.map(project => {
      const endDate = project.endDate ? this.formatDate(project.endDate) : 'Present';
      const technologies = project.technologies?.length ? `<div class="technologies">Technologies: ${project.technologies.join(', ')}</div>` : '';
      const achievements = project.achievements?.map((ach: string) => `<li>${ach}</li>`).join('') || '';
      const projectUrl = project.url ? `<div><a href="${project.url}">View Project</a></div>` : '';
      
      return `
        <div class="project-entry">
          <div class="project-header">
            <strong>${project.name}</strong>
          </div>
          <div class="project-details">
            ${this.formatDate(project.startDate)} - ${endDate}
          </div>
          <div class="project-description">${project.description}</div>
          ${technologies}
          ${achievements ? `<ul class="achievements">${achievements}</ul>` : ''}
          ${projectUrl}
        </div>
      `;
    }).join('');
  }


  private formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric'
    }).format(dateObj);
  }

  private getStyleMap(): string[] {
    return [
      "p[style-name='Title'] => h1.cv-title",
      "p[style-name='Heading 1'] => h2.section-header",
      "p[style-name='Heading 2'] => h3.subsection-header",
      "p[style-name='Name'] => h1.applicant-name",
      "p[style-name='Position'] => h2.target-position",
      "p[style-name='Contact'] => p.contact-info",
      "p[style-name='Summary'] => p.professional-summary",
      "p[style-name='Job Title'] => h4.job-title",
      "p[style-name='Company'] => p.company-name",
      "p[style-name='Job Details'] => p.job-details",
      "p[style-name='Achievement'] => li.achievement",
      "p[style-name='Education'] => p.education-entry",
      "p[style-name='Skill Category'] => h5.skill-category",
      "p[style-name='Skills'] => p.skills-list"
    ];
  }

  private formatHtmlForPdf(html: string, templateId: string): string {
    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CV</title>
        <style>
          ${this.getPdfStyles(templateId)}
        </style>
      </head>
      <body>
        <div class="cv-container">
          ${html}
        </div>
      </body>
      </html>
    `;
  }

  private getPdfStyles(templateId: string): string {
    const baseStyles = `
      @page {
        size: A4;
        margin: 20mm;
      }
      
      body {
        font-family: 'Times New Roman', serif;
        font-size: 11pt;
        line-height: 1.4;
        color: #000;
        margin: 0;
        padding: 0;
      }
      
      .cv-container {
        max-width: 100%;
      }
      
      h1.cv-title, h1.applicant-name {
        font-size: 18pt;
        font-weight: bold;
        text-align: center;
        margin: 0 0 10pt 0;
        color: #2c3e50;
      }
      
      h2.target-position {
        font-size: 14pt;
        text-align: center;
        margin: 0 0 15pt 0;
        color: #34495e;
      }
      
      h2.section-header {
        font-size: 14pt;
        font-weight: bold;
        margin: 20pt 0 10pt 0;
        border-bottom: 2px solid #2c3e50;
        padding-bottom: 5pt;
      }
      
      h3.subsection-header {
        font-size: 12pt;
        font-weight: bold;
        margin: 15pt 0 8pt 0;
      }
      
      .contact-info {
        text-align: center;
        margin: 5pt 0;
        font-size: 10pt;
      }
      
      .professional-summary {
        text-align: justify;
        margin: 10pt 0;
        line-height: 1.5;
      }
      
      .work-experience-entry {
        margin: 15pt 0;
        page-break-inside: avoid;
      }
      
      .job-header {
        font-weight: bold;
        margin-bottom: 5pt;
      }
      
      .job-details {
        font-size: 10pt;
        color: #666;
        margin-bottom: 8pt;
      }
      
      .achievements {
        margin: 8pt 0;
        padding-left: 20pt;
      }
      
      .achievements li {
        margin: 3pt 0;
        text-align: justify;
      }
      
      .technologies {
        font-size: 10pt;
        color: #666;
        font-style: italic;
        margin-top: 5pt;
      }
      
      .education-entry {
        margin: 10pt 0;
      }
      
      .skills-list {
        margin: 5pt 0;
      }
      
      .skill-category {
        font-weight: bold;
        margin: 10pt 0 5pt 0;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10pt 0;
      }
      
      th, td {
        border: 1px solid #ddd;
        padding: 8pt;
        text-align: left;
      }
      
      th {
        background-color: #f8f9fa;
        font-weight: bold;
      }
    `;

    // Template-specific styles
    const templateStyles = {
      professional: `
        h1.applicant-name { color: #2c3e50; }
        h2.section-header { border-bottom-color: #2c3e50; }
      `,
      modern: `
        h1.applicant-name { color: #3498db; }
        h2.section-header { border-bottom-color: #3498db; }
        body { font-family: 'Calibri', sans-serif; }
      `,
      academic: `
        h1.applicant-name { color: #8e44ad; }
        h2.section-header { border-bottom-color: #8e44ad; }
        body { font-size: 10pt; }
      `,
      executive: `
        h1.applicant-name { color: #2c3e50; }
        h2.section-header { border-bottom-color: #2c3e50; }
        body { font-size: 12pt; }
      `
    };

    return baseStyles + (templateStyles[templateId as keyof typeof templateStyles] || templateStyles.professional);
  }

  private async convertHtmlToPdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    try {
      const page = await browser.newPage();
      
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      await page.evaluateHandle('document.fonts.ready');

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        preferCSSPageSize: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Template dosyası yükle ve analiz et (ADMIN)
   */
  async uploadAndAnalyzeTemplate(templateId: string, docxBuffer: Buffer): Promise<{
    templateId: string;
    analyzedFields: string[];
    recommendedFields: string[];
    templateStructure: any;
  }> {
    const template = this.availableTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // DOCX dosyasını kaydet
    await fs.writeFile(template.docxPath, docxBuffer);

    // DOCX içeriğini analiz et
    const analysis = await this.analyzeDocxContent(docxBuffer);

    logger.info(`Template uploaded and analyzed: ${templateId}`, {
      analyzedFields: analysis.analyzedFields.length,
      recommendedFields: analysis.recommendedFields.length
    });

    return {
      templateId,
      analyzedFields: analysis.analyzedFields,
      recommendedFields: analysis.recommendedFields,
      templateStructure: analysis.templateStructure
    };
  }

  /**
   * DOCX içeriğini analiz et ve dinamik alanları tespit et
   */
  private async analyzeDocxContent(docxBuffer: Buffer): Promise<{
    analyzedFields: string[];
    recommendedFields: string[];
    templateStructure: any;
  }> {
    try {
      // DOCX'i HTML'e çevir
      const result = await mammoth.convertToHtml({
        buffer: docxBuffer
      });

      const htmlContent = result.value;
      const plainText = htmlContent.replace(/<[^>]*>/g, ' ').toLowerCase();

      // Mevcut placeholder'ları tespit et
      const existingPlaceholders = this.extractPlaceholders(htmlContent);

      // İçeriği analiz et ve dinamik alanları öner
      const recommendedFields = this.analyzeContentForFields(plainText);

      // Template yapısını analiz et 
      const templateStructure = this.analyzeTemplateStructure(htmlContent);

      return {
        analyzedFields: existingPlaceholders,
        recommendedFields,
        templateStructure
      };

    } catch (error) {
      logger.error('DOCX content analysis failed:', error);
      throw new Error('Template analizi başarısız');
    }
  }

  /**
   * HTML içeriğinden placeholder'ları çıkar
   */
  private extractPlaceholders(html: string): string[] {
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders: string[] = [];
    let match;

    while ((match = placeholderRegex.exec(html)) !== null) {
      if (!placeholders.includes(match[1])) {
        placeholders.push(match[1]);
      }
    }

    return placeholders;
  }

  /**
   * İçeriği analiz et ve hangi dinamik alanların gerekli olduğunu belirle (Advanced ATS Field Detection)
   */
  private analyzeContentForFields(text: string): string[] {
    const recommendedFields: string[] = [];

    // Advanced pattern-based field detection with comprehensive Turkish/English support
    const fieldPatterns = {
      // Personal Information Patterns
      personalInfo: {
        fullName: /(tam\s+ad|full\s+name|ad\s+soyad|name|isim|adı|candidate\s+name)/i,
        firstName: /(ad|first\s+name|given\s+name|ilk\s+ad)/i,
        lastName: /(soyad|last\s+name|surname|family\s+name|aile\s+adı)/i,
        email: /(e-?posta|email|mail|elektronik\s+posta|e-mail)/i,
        phone: /(telefon|phone|mobil|mobile|gsm|cell|cep|tel)/i,
        address: /(adres|address|konum|location|şehir|city|ülke|country|ikamet)/i,
        linkedIn: /(linkedin|linked\s+in)/i,
        github: /(github|git\s+hub)/i,
        portfolio: /(portfolio|portföy|web\s+site|website|kişisel\s+site)/i
      },
      
      // Professional Summary Patterns
      professionalSummary: {
        summary: /(özet|summary|hakkımda|about|profil|profile|kişisel\s+açıklama|personal\s+statement|career\s+objective|objective)/i,
        targetPosition: /(hedef\s+pozisyon|target\s+position|pozisyon|position|title|unvan|rol|role|aranan\s+pozisyon)/i,  
        yearsOfExperience: /(deneyim|experience|tecrübe|yıl|year|çalışma\s+süresi|work\s+experience|toplam\s+deneyim)/i,
        keySkills: /(ana\s+yetenekler|key\s+skills|temel\s+beceriler|core\s+skills|öne\s+çıkan|expertise|uzmanlık)/i
      },

      // Work Experience Patterns
      workExperience: {
        section: /(iş\s+deneyimi|work\s+experience|professional\s+experience|career\s+history|çalışma\s+geçmişi|employment)/i,
        companyName: /(şirket|company|firma|organization|kurum|workplace|employer|işveren)/i,
        position: /(pozisyon|position|rol|role|unvan|title|görev|job\s+title)/i,
        location: /(konum|location|şehir|city|yer|place|lokasyon)/i,
        startDate: /(başlangıç|start|başladığı|from|tarih|date|başlama)/i,
        endDate: /(bitiş|end|ayrıldığı|to|until|bırakma)/i,
        achievements: /(başarılar|achievements|accomplishments|kazanımlar|sonuçlar|responsibilities|sorumluluklar)/i,
        technologies: /(teknolojiler|technologies|araçlar|tools|yazılım|software|kullanılan)/i
      },

      // Education Patterns
      education: {
        section: /(eğitim|education|öğrenim|academic|akademik|qualifications|nitelikler)/i,
        institution: /(okul|school|üniversite|university|kurum|institution|college|akademi)/i,
        degree: /(derece|degree|diploma|lisans|bachelor|master|doktora|phd|yüksek\s+lisans)/i,
        fieldOfStudy: /(bölüm|field|alan|study|major|branş|department|fakülte)/i,
        gpa: /(not\s+ortalaması|gpa|grade|puan|average|ortalama)/i,
        honors: /(onur|honors|başarı|achievement|ödül|award|derece)/i
      },

      // Skills Patterns
      skills: {
        section: /(yetenekler|skills|beceriler|competencies|yetkinlikler|expertise)/i,
        technical: /(teknik\s+yetenekler|technical\s+skills|yazılım|software|programlama|programming|teknoloji)/i,
        languages: /(diller|languages|yabancı\s+dil|foreign\s+language|konuşulan\s+diller)/i,
        soft: /(kişisel\s+özellikler|soft\s+skills|sosyal\s+beceriler|interpersonal|kişilik)/i
      },

      // Projects Patterns
      projects: {
        section: /(projeler|projects|çalışmalar|works|portfolio\s+projects)/i,
        name: /(proje\s+adı|project\s+name|proje|project)/i,
        description: /(açıklama|description|detay|details|özet)/i,
        technologies: /(kullanılan\s+teknolojiler|technologies\s+used|araçlar|tools)/i,
        url: /(link|url|proje\s+linki|project\s+link|demo)/i
      },

      // Certifications Patterns
      certifications: {
        section: /(sertifikalar|certifications|belgeler|certificates|lisanslar|licenses)/i,
        name: /(sertifika\s+adı|certification\s+name|sertifika|certificate|belge)/i,
        organization: /(kurum|organization|veren\s+kuruluş|issuing\s+organization|sağlayıcı)/i,
        issueDate: /(alım\s+tarihi|issue\s+date|verilme\s+tarihi|obtained)/i,
        expirationDate: /(geçerlilik|expiration|bitiş\s+tarihi|valid\s+until|süre)/i
      }
    };

    // Check each pattern category and add relevant fields
    Object.entries(fieldPatterns).forEach(([category, patterns]) => {
      Object.entries(patterns).forEach(([field, pattern]) => {
        if (pattern.test(text)) {
          switch (category) {
            case 'personalInfo':
              if (field === 'fullName') {
                recommendedFields.push('personalInfo.firstName', 'personalInfo.lastName');
              } else if (field === 'address') {
                recommendedFields.push('personalInfo.address.city', 'personalInfo.address.country');
              } else {
                recommendedFields.push(`personalInfo.${field}`);
              }
              break;
            case 'professionalSummary':
              recommendedFields.push(`professionalSummary.${field}`);
              break;
            case 'workExperience':
              recommendedFields.push('workExperience');
              if (field !== 'section') {
                recommendedFields.push(`workExperience.${field}`);
              }
              break;
            case 'education':
              recommendedFields.push('education');
              if (field !== 'section') {
                recommendedFields.push(`education.${field}`);
              }
              break;
            case 'skills':
              if (field === 'technical') {
                recommendedFields.push('skills.technical');
              } else if (field === 'languages') {
                recommendedFields.push('skills.languages');
              } else if (field === 'soft') {
                recommendedFields.push('skills.soft');
              } else {
                recommendedFields.push('skills', 'professionalSummary.keySkills');
              }
              break;
            case 'projects':
              recommendedFields.push('projects');
              if (field !== 'section') {
                recommendedFields.push(`projects.${field}`);
              }
              break;
            case 'certifications':
              recommendedFields.push('certifications');
              if (field !== 'section') {
                recommendedFields.push(`certifications.${field}`);
              }
              break;
          }
        }
      });
    });

    // Additional context-based recommendations
    if (text.includes('cv') || text.includes('resume') || text.includes('özgeçmiş')) {
      // Standard CV fields that should always be included
      recommendedFields.push(
        'personalInfo.firstName',
        'personalInfo.lastName', 
        'personalInfo.email',
        'personalInfo.phone',
        'professionalSummary.summary',
        'professionalSummary.targetPosition'
      );
    }

    // Remove duplicates and return sorted array for consistent output
    return [...new Set(recommendedFields)].sort();
  }

  /**
   * Template yapısını analiz et
   */
  private analyzeTemplateStructure(html: string): any {
    return {
      hasHeaders: html.includes('<h1>') || html.includes('<h2>') || html.includes('<h3>'),
      hasTables: html.includes('<table>'),
      hasLists: html.includes('<ul>') || html.includes('<ol>'),
      sections: this.identifySections(html),
      formatting: {
        hasBold: html.includes('<strong>') || html.includes('<b>'),
        hasItalic: html.includes('<em>') || html.includes('<i>'),
        hasUnderline: html.includes('<u>')
      }
    };
  }

  /**
   * Template'deki bölümleri tespit et
   */
  private identifySections(html: string): string[] {
    const sections: string[] = [];
    const text = html.toLowerCase();

    if (text.includes('experience') || text.includes('deneyim')) sections.push('workExperience');
    if (text.includes('education') || text.includes('eğitim')) sections.push('education');
    if (text.includes('skill') || text.includes('beceri')) sections.push('skills');
    if (text.includes('certificate') || text.includes('sertifika')) sections.push('certifications');
    if (text.includes('project') || text.includes('proje')) sections.push('projects');
    if (text.includes('language') || text.includes('dil')) sections.push('languages');
    if (text.includes('summary') || text.includes('özet')) sections.push('summary');
    if (text.includes('contact') || text.includes('iletişim')) sections.push('contact');

    return sections;
  }

  /**
   * Template dosyası yükle (basit versiyon - geriye uyumluluk için)
   */
  async uploadTemplate(templateId: string, docxBuffer: Buffer): Promise<void> {
    const template = this.availableTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    await fs.writeFile(template.docxPath, docxBuffer);
    logger.info(`Template uploaded: ${templateId}`);
  }

  /**
   * Convert optimized content from Claude back to ATSCVData format
   */
  private convertOptimizedContentToATSCVData(optimizedContent: ATSOptimizedContent, originalData: ATSCVData): ATSCVData {
    try {
      // Helper function to parse dates
      const parseDate = (dateStr: string | null): Date | null => {
        if (!dateStr || dateStr === 'Present') return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      return {
        personalInfo: {
          firstName: optimizedContent.personalInfo.firstName,
          lastName: optimizedContent.personalInfo.lastName,
          email: optimizedContent.personalInfo.email,
          phone: optimizedContent.personalInfo.phone,
          address: {
            city: optimizedContent.personalInfo.address.split(',')[0]?.trim() || originalData.personalInfo.address.city,
            country: optimizedContent.personalInfo.address.split(',')[1]?.trim() || originalData.personalInfo.address.country
          },
          linkedIn: optimizedContent.personalInfo.linkedIn || originalData.personalInfo.linkedIn,
          portfolio: optimizedContent.personalInfo.portfolio || originalData.personalInfo.portfolio,
          github: optimizedContent.personalInfo.github || originalData.personalInfo.github
        },
        professionalSummary: {
          summary: optimizedContent.professionalSummary.summary,
          targetPosition: optimizedContent.professionalSummary.targetPosition,
          yearsOfExperience: optimizedContent.professionalSummary.yearsOfExperience,
          keySkills: optimizedContent.professionalSummary.keySkills
        },
        workExperience: optimizedContent.workExperience.map((exp, index) => ({
          id: originalData.workExperience[index]?.id || `work_${index}`,
          companyName: exp.companyName,
          position: exp.position,
          location: exp.location,
          startDate: parseDate(exp.startDate) || new Date(),
          endDate: parseDate(exp.endDate),
          isCurrentRole: exp.isCurrentRole,
          achievements: exp.achievements,
          technologies: exp.technologies || [],
          industryType: originalData.workExperience[index]?.industryType || 'Technology'
        })),
        education: optimizedContent.education.map((edu, index) => ({
          id: originalData.education[index]?.id || `edu_${index}`,
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          location: edu.location,
          startDate: parseDate(edu.startDate) || new Date(),
          endDate: parseDate(edu.endDate),
          gpa: edu.gpa,
          honors: edu.honors || [],
          relevantCoursework: edu.relevantCoursework || []
        })),
        skills: {
          technical: optimizedContent.skills.technical.map(cat => ({
            category: cat.category,
            items: cat.items.map(item => ({
              name: item.name,
              proficiencyLevel: item.proficiencyLevel as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
            }))
          })),
          languages: optimizedContent.skills.languages.map(lang => ({
            language: lang.language,
            proficiency: lang.proficiency as 'Native' | 'Fluent' | 'Advanced' | 'Intermediate' | 'Basic'
          })),
          soft: optimizedContent.skills.soft
        },
        certifications: optimizedContent.certifications?.map((cert, index) => ({
          id: originalData.certifications?.[index]?.id || `cert_${index}`,
          name: cert.name,
          issuingOrganization: cert.issuingOrganization,
          issueDate: parseDate(cert.issueDate) || new Date(),
          expirationDate: parseDate(cert.expirationDate || null),
          credentialId: cert.credentialId,
          verificationUrl: originalData.certifications?.[index]?.verificationUrl
        })) || originalData.certifications,
        projects: optimizedContent.projects?.map((proj, index) => ({
          id: originalData.projects?.[index]?.id || `proj_${index}`,
          name: proj.name,
          description: proj.description,
          technologies: proj.technologies,
          startDate: parseDate(proj.startDate) || new Date(),
          endDate: parseDate(proj.endDate),
          url: proj.url,
          achievements: proj.achievements
        })) || originalData.projects,
        configuration: originalData.configuration
      };

    } catch (error) {
      logger.error('Failed to convert optimized content to ATSCVData:', error);
      // Return original data if conversion fails
      return originalData;
    }
  }
}