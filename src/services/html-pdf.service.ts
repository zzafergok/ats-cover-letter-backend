import puppeteer from 'puppeteer';
import { ATSCVData } from '../types/cv.types';
import logger from '../config/logger';

export interface PDFGenerationOptions {
  template?: 'PROFESSIONAL' | 'MODERN' | 'EXECUTIVE';
  format?: 'A4' | 'Letter';
  margins?: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  language?: 'TURKISH' | 'ENGLISH';
  includeKeywordOptimization?: boolean;
}

export class HTMLToPDFService {
  private static instance: HTMLToPDFService;

  static getInstance(): HTMLToPDFService {
    if (!HTMLToPDFService.instance) {
      HTMLToPDFService.instance = new HTMLToPDFService();
    }
    return HTMLToPDFService.instance;
  }

  /**
   * Modern ATS CV generator using HTML-to-PDF
   */
  async generateATSCV(cvData: ATSCVData, options: PDFGenerationOptions = {}): Promise<Buffer> {
    let browser;
    
    try {
      logger.info('Starting PDF generation with Puppeteer', {
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        template: options.template || 'DEFAULT'
      });

      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--window-size=1920x1080'
        ],
        timeout: 60000
      });

      const page = await browser.newPage();
      
      // Page settings for optimal PDF generation
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Generate HTML content
      const htmlContent = this.generateATSHTML(cvData, options);
      
      logger.debug('Generated HTML content length:', htmlContent.length);
      
      // Set HTML content with extended timeout
      await page.setContent(htmlContent, { 
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 45000 
      });
      
      // Wait for fonts to load with fallback
      try {
        await page.evaluateHandle('document.fonts.ready');
      } catch (fontError) {
        logger.warn('Font loading failed, continuing with default fonts:', fontError);
      }
      
      // Generate PDF with optimized settings
      const pdfUint8Array = await page.pdf({
        format: options.format || 'A4',
        margin: options.margins || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: false,
        preferCSSPageSize: false,
        scale: 1,
        timeout: 45000
      });

      logger.info('Modern ATS CV generated successfully', {
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        template: options.template || 'DEFAULT',
        pdfSize: pdfUint8Array.length
      });

      return Buffer.from(pdfUint8Array);
    } catch (error) {
      logger.error('PDF generation failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        template: options.template
      });
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          logger.warn('Failed to close browser:', closeError);
        }
      }
    }
  }

  /**
   * Generate modern HTML structure for ATS CV
   */
  private generateATSHTML(cvData: ATSCVData, options: PDFGenerationOptions): string {
    const isTurkish = options.language === 'TURKISH' || cvData.configuration.language === 'TURKISH';
    const template = options.template || 'PROFESSIONAL';
    
    return `
<!DOCTYPE html>
<html lang="${isTurkish ? 'tr' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName} - CV</title>
    <style>
        ${this.getATSStyles(template, isTurkish)}
    </style>
</head>
<body>
    <div class="cv-container">
        ${this.generateHeader(cvData, isTurkish)}
        ${this.generateProfessionalSummary(cvData, isTurkish)}
        ${this.generateCoreCompetencies(cvData, isTurkish)}
        ${this.generateWorkExperience(cvData, isTurkish)}
        ${this.generateEducation(cvData, isTurkish)}
        ${this.generateTechnicalSkills(cvData, isTurkish)}
        ${this.generateAdditionalSections(cvData, isTurkish)}
    </div>
</body>
</html>`;
  }

  /**
   * Modern CSS styles optimized for ATS parsing
   */
  private getATSStyles(template: string, isTurkish: boolean): string {
    const baseStyles = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            size: A4;
            margin: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #333333;
            background: #ffffff;
            font-size: 11pt;
        }
        
        .cv-container {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm 15mm;
            background: white;
        }
        
        /* ATS-friendly header */
        .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #000000;
            padding-bottom: 15px;
        }
        
        .name {
            font-size: 24pt;
            font-weight: bold;
            color: #000000;
            margin-bottom: 5px;
            letter-spacing: 0.5px;
        }
        
        .target-position {
            font-size: 14pt;
            color: #333333;
            margin-bottom: 10px;
            font-weight: 500;
        }
        
        .contact-info {
            font-size: 11pt;
            color: #555555;
            margin: 3px 0;
        }
        
        .contact-info a {
            color: #000000;
            text-decoration: none;
        }
        
        /* Section headers - ATS optimized */
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            color: #000000;
            text-transform: uppercase;
            border-bottom: 1px solid #000000;
            padding-bottom: 3px;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        
        /* Professional Summary */
        .summary-text {
            text-align: justify;
            line-height: 1.6;
            margin-bottom: 10px;
        }
        
        /* Core Competencies - Keyword rich */
        .competencies {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 5px;
        }
        
        .competency-item {
            background: #f8f9fa;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 10pt;
            font-weight: 500;
            border: 1px solid #e9ecef;
        }
        
        /* Work Experience */
        .job-entry {
            margin-bottom: 18px;
            page-break-inside: avoid;
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 5px;
        }
        
        .job-title {
            font-weight: bold;
            font-size: 12pt;
            color: #000000;
        }
        
        .company-name {
            font-weight: 500;
            color: #333333;
        }
        
        .job-date {
            font-size: 10pt;
            color: #666666;
            white-space: nowrap;
        }
        
        .job-location {
            font-size: 10pt;
            color: #666666;
            font-style: italic;
            margin-bottom: 8px;
        }
        
        .achievements {
            list-style: none;
            padding-left: 0;
        }
        
        .achievement {
            position: relative;
            padding-left: 15px;
            margin-bottom: 4px;
            text-align: justify;
        }
        
        .achievement:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #000000;
            font-weight: bold;
        }
        
        .technologies {
            margin-top: 5px;
            font-size: 10pt;
            color: #555555;
            font-style: italic;
        }
        
        /* Education */
        .education-entry {
            margin-bottom: 12px;
        }
        
        .degree {
            font-weight: bold;
            font-size: 11pt;
        }
        
        .institution {
            color: #333333;
            margin-bottom: 3px;
        }
        
        .education-details {
            font-size: 10pt;
            color: #666666;
        }
        
        /* Skills - ATS keyword optimization */
        .skills-category {
            margin-bottom: 8px;
        }
        
        .skills-category-title {
            font-weight: bold;
            color: #000000;
            margin-bottom: 3px;
        }
        
        .skills-list {
            color: #333333;
        }
        
        /* Additional sections */
        .cert-item, .lang-item {
            margin-bottom: 5px;
        }
        
        /* Print optimizations */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .cv-container {
                margin: 0;
                padding: 15mm;
            }
            
            .section {
                break-inside: avoid;
            }
            
            .job-entry {
                break-inside: avoid;
            }
        }
    `;

    // Template-specific styles
    const templateStyles = {
      PROFESSIONAL: `
        .header { border-bottom-color: #000000; }
        .section-title { color: #000000; border-bottom-color: #000000; }
        .competency-item { background: #f8f9fa; border-color: #dee2e6; }
      `,
      MODERN: `
        .header { border-bottom-color: #2c3e50; }
        .section-title { color: #2c3e50; border-bottom-color: #2c3e50; }
        .competency-item { background: #ecf0f1; border-color: #bdc3c7; }
        .name { color: #2c3e50; }
      `,
      EXECUTIVE: `
        .header { border-bottom-color: #1a1a1a; }
        .section-title { color: #1a1a1a; border-bottom-color: #1a1a1a; }
        .competency-item { background: #f5f5f5; border-color: #cccccc; }
        .name { color: #1a1a1a; }
        body { font-size: 12pt; }
      `
    };

    return baseStyles + (templateStyles[template as keyof typeof templateStyles] || templateStyles.PROFESSIONAL);
  }

  /**
   * Generate header section
   */
  private generateHeader(cvData: ATSCVData, isturkish: boolean): string {
    const { personalInfo, professionalSummary } = cvData;
    
    const contactItems = [
      personalInfo.email,
      personalInfo.phone,
      `${personalInfo.address.city}, ${personalInfo.address.country}`
    ].filter(Boolean).join(' | ');

    const links = [
      personalInfo.linkedIn && `<a href="${personalInfo.linkedIn}">LinkedIn</a>`,
      personalInfo.portfolio && `<a href="${personalInfo.portfolio}">Portfolio</a>`,
      personalInfo.github && `<a href="${personalInfo.github}">GitHub</a>`
    ].filter(Boolean).join(' | ');

    return `
        <div class="header">
            <div class="name">${personalInfo.firstName} ${personalInfo.lastName}</div>
            <div class="target-position">${professionalSummary.targetPosition}</div>
            <div class="contact-info">${contactItems}</div>
            ${links ? `<div class="contact-info">${links}</div>` : ''}
        </div>
    `;
  }

  /**
   * Generate professional summary
   */
  private generateProfessionalSummary(cvData: ATSCVData, isturkish: boolean): string {
    if (!cvData.professionalSummary.summary) return '';
    
    return `
        <div class="section">
            <div class="section-title">${isturkish ? 'PROFESYONEL ÖZET' : 'PROFESSIONAL SUMMARY'}</div>
            <div class="summary-text">${cvData.professionalSummary.summary}</div>
        </div>
    `;
  }

  /**
   * Generate core competencies section
   */
  private generateCoreCompetencies(cvData: ATSCVData, isturkish: boolean): string {
    const keySkills = cvData.professionalSummary.keySkills || 
      cvData.skills.technical.flatMap(t => t.items.slice(0, 5).map(i => i.name));
    
    if (keySkills.length === 0) return '';
    
    const competencyItems = keySkills.map(skill => 
      `<span class="competency-item">${skill}</span>`
    ).join('');
    
    return `
        <div class="section">
            <div class="section-title">${isturkish ? 'TEMEL YETKİNLİKLER' : 'CORE COMPETENCIES'}</div>
            <div class="competencies">${competencyItems}</div>
        </div>
    `;
  }

  /**
   * Generate work experience section
   */
  private generateWorkExperience(cvData: ATSCVData, isturkish: boolean): string {
    if (cvData.workExperience.length === 0) return '';
    
    const experiences = cvData.workExperience.map(exp => {
      const endDate = exp.isCurrentRole ? 
        (isturkish ? 'Günümüz' : 'Present') : 
        this.formatDate(exp.endDate);
      
      const achievements = exp.achievements.map(ach => 
        `<li class="achievement">${ach}</li>`
      ).join('');
      
      const technologies = exp.technologies && exp.technologies.length > 0 ?
        `<div class="technologies">${isturkish ? 'Teknolojiler' : 'Technologies'}: ${exp.technologies.join(', ')}</div>` : '';
      
      return `
        <div class="job-entry">
            <div class="job-header">
                <div>
                    <span class="job-title">${exp.position}</span> | 
                    <span class="company-name">${exp.companyName}</span>
                </div>
                <div class="job-date">${this.formatDate(exp.startDate)} - ${endDate}</div>
            </div>
            <div class="job-location">${exp.location}</div>
            <ul class="achievements">${achievements}</ul>
            ${technologies}
        </div>
      `;
    }).join('');
    
    return `
        <div class="section">
            <div class="section-title">${isturkish ? 'İŞ DENEYİMİ' : 'PROFESSIONAL EXPERIENCE'}</div>
            ${experiences}
        </div>
    `;
  }

  /**
   * Generate education section
   */
  private generateEducation(cvData: ATSCVData, isturkish: boolean): string {
    if (cvData.education.length === 0) return '';
    
    const educations = cvData.education.map(edu => {
      const gradDate = edu.endDate ? 
        this.formatDate(edu.endDate) : 
        (isturkish ? 'Devam Ediyor' : 'Present');
      
      const gpaInfo = edu.gpa && edu.gpa >= 3.5 ? 
        `<div class="education-details">GPA: ${edu.gpa}</div>` : '';
      
      const honors = edu.honors && edu.honors.length > 0 ?
        `<div class="education-details">${isturkish ? 'Onurlar' : 'Honors'}: ${edu.honors.join(', ')}</div>` : '';
      
      return `
        <div class="education-entry">
            <div class="degree">${edu.degree} in ${edu.fieldOfStudy}</div>
            <div class="institution">${edu.institution} | ${gradDate}</div>
            ${gpaInfo}
            ${honors}
        </div>
      `;
    }).join('');
    
    return `
        <div class="section">
            <div class="section-title">${isturkish ? 'EĞİTİM' : 'EDUCATION'}</div>
            ${educations}
        </div>
    `;
  }

  /**
   * Generate technical skills section
   */
  private generateTechnicalSkills(cvData: ATSCVData, isturkish: boolean): string {
    if (cvData.skills.technical.length === 0) return '';
    
    const skillCategories = cvData.skills.technical.map(category => {
      const skillList = category.items.map(item => item.name).join(', ');
      
      return `
        <div class="skills-category">
            <div class="skills-category-title">${category.category}:</div>
            <div class="skills-list">${skillList}</div>
        </div>
      `;
    }).join('');
    
    return `
        <div class="section">
            <div class="section-title">${isturkish ? 'TEKNİK BECERİLER' : 'TECHNICAL SKILLS'}</div>
            ${skillCategories}
        </div>
    `;
  }

  /**
   * Generate additional sections (certifications, languages, etc.)
   */
  private generateAdditionalSections(cvData: ATSCVData, isturkish: boolean): string {
    let sections = '';
    
    // Certifications
    if (cvData.certifications && cvData.certifications.length > 0) {
      const certs = cvData.certifications.map(cert => 
        `<div class="cert-item">${cert.name} - ${cert.issuingOrganization} (${this.formatDate(cert.issueDate)})</div>`
      ).join('');
      
      sections += `
        <div class="section">
            <div class="section-title">${isturkish ? 'SERTİFİKALAR' : 'CERTIFICATIONS'}</div>
            ${certs}
        </div>
      `;
    }
    
    // Languages
    if (cvData.skills.languages.length > 0) {
      const languages = cvData.skills.languages.map(lang => 
        `<div class="lang-item">${lang.language} (${this.translateProficiency(lang.proficiency, isturkish)})</div>`
      ).join('');
      
      sections += `
        <div class="section">
            <div class="section-title">${isturkish ? 'DİLLER' : 'LANGUAGES'}</div>
            ${languages}
        </div>
      `;
    }
    
    // Additional Skills
    if (cvData.skills.soft.length > 0) {
      sections += `
        <div class="section">
            <div class="section-title">${isturkish ? 'DİĞER BECERİLER' : 'ADDITIONAL SKILLS'}</div>
            <div class="skills-list">${cvData.skills.soft.join(', ')}</div>
        </div>
      `;
    }
    
    return sections;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date | string | undefined | null): string {
    if (!date) return '';
    
    try {
      // Handle string dates from database
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        logger.warn('Invalid date received for formatting:', date);
        return '';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric'
      }).format(dateObj);
    } catch (error) {
      logger.error('Date formatting error:', { date, error: error instanceof Error ? error.message : 'Unknown error' });
      return '';
    }
  }

  /**
   * Translate proficiency levels
   */
  private translateProficiency(level: string, isturkish: boolean): string {
    if (!isturkish) return level;
    
    const translations: Record<string, string> = {
      'Native': 'Ana Dil',
      'Fluent': 'Akıcı',
      'Advanced': 'İleri',
      'Intermediate': 'Orta',
      'Beginner': 'Başlangıç'
    };
    
    return translations[level] || level;
  }
}