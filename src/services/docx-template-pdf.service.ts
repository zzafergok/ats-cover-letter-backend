import { ATSCVData } from '../types/cv.types';
import logger from '../config/logger';
import * as path from 'path';
import * as fs from 'fs/promises';
import mammoth from 'mammoth';
import puppeteer from 'puppeteer';

interface TemplateMapping {
  id: string;
  name: string;
  docxPath: string;
  description: string;
}

export class DocxTemplatePdfService {
  private static instance: DocxTemplatePdfService;
  private templatesDir: string;
  private availableTemplates: TemplateMapping[];

  private constructor() {
    this.templatesDir = path.join(process.cwd(), 'templates', 'docx');
    this.availableTemplates = [];
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
      
      // Varsayılan template'leri tanımla
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
   * DOCX template'i PDF olarak CV oluştur
   */
  async generatePdfFromDocxTemplate(
    templateId: string,
    cvData: ATSCVData
  ): Promise<Buffer> {
    try {
      const template = this.availableTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // DOCX dosyasının varlığını kontrol et
      await fs.access(template.docxPath);

      logger.info('Starting DOCX template to PDF conversion', {
        templateId,
        templatePath: template.docxPath,
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`
      });

      // DOCX'i HTML'e çevir
      const docxBuffer = await fs.readFile(template.docxPath);
      const result = await mammoth.convertToHtml({
        buffer: docxBuffer
      }, {
        styleMap: this.getStyleMap(),
        includeDefaultStyleMap: true,
        convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: '' }))
      });

      // HTML'e CV verilerini uygula
      const processedHtml = this.applyDataToHtml(result.value, cvData);

      // Formatlanmış HTML oluştur
      const formattedHtml = this.formatHtmlForPdf(processedHtml, templateId);

      // PDF oluştur
      const pdfBuffer = await this.convertHtmlToPdf(formattedHtml);

      logger.info('DOCX template to PDF conversion completed', {
        templateId,
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        pdfSize: pdfBuffer.length
      });

      return pdfBuffer;

    } catch (error) {
      logger.error('DOCX template to PDF conversion failed:', {
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Template PDF oluşturulamadı: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * HTML'e CV verilerini uygula (placeholder replacement)
   */
  private applyDataToHtml(html: string, cvData: ATSCVData): string {
    let processedHtml = html;

    // Personal Info
    processedHtml = processedHtml.replace(/\{\{firstName\}\}/g, cvData.personalInfo.firstName);
    processedHtml = processedHtml.replace(/\{\{lastName\}\}/g, cvData.personalInfo.lastName);
    processedHtml = processedHtml.replace(/\{\{fullName\}\}/g, `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`);
    processedHtml = processedHtml.replace(/\{\{email\}\}/g, cvData.personalInfo.email);
    processedHtml = processedHtml.replace(/\{\{phone\}\}/g, cvData.personalInfo.phone);
    processedHtml = processedHtml.replace(/\{\{city\}\}/g, cvData.personalInfo.address.city);
    processedHtml = processedHtml.replace(/\{\{country\}\}/g, cvData.personalInfo.address.country);
    processedHtml = processedHtml.replace(/\{\{linkedin\}\}/g, cvData.personalInfo.linkedIn || '');
    processedHtml = processedHtml.replace(/\{\{portfolio\}\}/g, cvData.personalInfo.portfolio || '');
    processedHtml = processedHtml.replace(/\{\{github\}\}/g, cvData.personalInfo.github || '');

    // Professional Summary
    processedHtml = processedHtml.replace(/\{\{targetPosition\}\}/g, cvData.professionalSummary.targetPosition);
    processedHtml = processedHtml.replace(/\{\{summary\}\}/g, cvData.professionalSummary.summary);
    processedHtml = processedHtml.replace(/\{\{yearsOfExperience\}\}/g, cvData.professionalSummary.yearsOfExperience.toString());
    processedHtml = processedHtml.replace(/\{\{keySkills\}\}/g, cvData.professionalSummary.keySkills.join(', '));

    // Work Experience
    if (processedHtml.includes('{{workExperience}}')) {
      const workExpHtml = cvData.workExperience.map(exp => this.formatWorkExperience(exp)).join('');
      processedHtml = processedHtml.replace(/\{\{workExperience\}\}/g, workExpHtml);
    }

    // Education
    if (processedHtml.includes('{{education}}')) {
      const educationHtml = cvData.education.map(edu => this.formatEducation(edu)).join('');
      processedHtml = processedHtml.replace(/\{\{education\}\}/g, educationHtml);
    }

    // Technical Skills
    if (processedHtml.includes('{{technicalSkills}}')) {
      const skillsHtml = cvData.skills.technical.map(category => 
        `<div><strong>${category.category}:</strong> ${category.items.map(item => item.name).join(', ')}</div>`
      ).join('');
      processedHtml = processedHtml.replace(/\{\{technicalSkills\}\}/g, skillsHtml);
    }

    // Languages
    if (processedHtml.includes('{{languages}}')) {
      const languagesHtml = cvData.skills.languages.map(lang => 
        `<div>${lang.language} (${lang.proficiency})</div>`
      ).join('');
      processedHtml = processedHtml.replace(/\{\{languages\}\}/g, languagesHtml);
    }

    // Certifications
    if (cvData.certifications && processedHtml.includes('{{certifications}}')) {
      const certsHtml = cvData.certifications.map(cert => 
        `<div><strong>${cert.name}</strong> - ${cert.issuingOrganization} (${this.formatDate(cert.issueDate)})</div>`
      ).join('');
      processedHtml = processedHtml.replace(/\{\{certifications\}\}/g, certsHtml);
    }

    return processedHtml;
  }

  private formatWorkExperience(exp: any): string {
    const endDate = exp.isCurrentRole ? 'Present' : this.formatDate(exp.endDate);
    const achievements = exp.achievements.map((ach: string) => `<li>${ach}</li>`).join('');
    
    return `
      <div class="work-experience-entry">
        <div class="job-header">
          <strong>${exp.position}</strong> at <strong>${exp.companyName}</strong>
        </div>
        <div class="job-details">
          ${exp.location} | ${this.formatDate(exp.startDate)} - ${endDate}
        </div>
        <ul class="achievements">${achievements}</ul>
        ${exp.technologies ? `<div class="technologies">Technologies: ${exp.technologies.join(', ')}</div>` : ''}
      </div>
    `;
  }

  private formatEducation(edu: any): string {
    const gradDate = edu.endDate ? this.formatDate(edu.endDate) : 'Present';
    
    return `
      <div class="education-entry">
        <div><strong>${edu.degree} in ${edu.fieldOfStudy}</strong></div>
        <div>${edu.institution} | ${edu.location} | ${gradDate}</div>
        ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
        ${edu.honors ? `<div>Honors: ${edu.honors.join(', ')}</div>` : ''}
      </div>
    `;
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
   * İçeriği analiz et ve hangi dinamik alanların gerekli olduğunu belirle
   */
  private analyzeContentForFields(text: string): string[] {
    const recommendedFields: string[] = [];

    // Kişisel bilgiler tespiti
    if (text.includes('name') || text.includes('isim') || text.includes('ad')) {
      recommendedFields.push('personalInfo.firstName', 'personalInfo.lastName');
    }
    
    if (text.includes('email') || text.includes('e-posta') || text.includes('mail')) {
      recommendedFields.push('personalInfo.email');
    }

    if (text.includes('phone') || text.includes('telefon') || text.includes('mobil')) {
      recommendedFields.push('personalInfo.phone');
    }

    if (text.includes('address') || text.includes('adres') || text.includes('location')) {
      recommendedFields.push('personalInfo.address.city', 'personalInfo.address.country');
    }

    if (text.includes('linkedin') || text.includes('github') || text.includes('portfolio')) {
      recommendedFields.push('personalInfo.linkedIn', 'personalInfo.github', 'personalInfo.portfolio');
    }

    // Profesyonel bilgiler tespiti
    if (text.includes('summary') || text.includes('özet') || text.includes('hakkında')) {
      recommendedFields.push('professionalSummary.summary');
    }

    if (text.includes('position') || text.includes('pozisyon') || text.includes('title')) {
      recommendedFields.push('professionalSummary.targetPosition');
    }

    if (text.includes('experience') || text.includes('deneyim') || text.includes('tecrübe')) {
      recommendedFields.push('professionalSummary.yearsOfExperience', 'workExperience');
    }

    if (text.includes('skill') || text.includes('beceri') || text.includes('yetenek')) {
      recommendedFields.push('professionalSummary.keySkills', 'skills.technical');
    }

    // İş deneyimi tespiti
    if (text.includes('work') || text.includes('job') || text.includes('career') || 
        text.includes('iş') || text.includes('çalışma') || text.includes('kariyer')) {
      recommendedFields.push('workExperience');
    }

    // Eğitim tespiti
    if (text.includes('education') || text.includes('university') || text.includes('school') ||
        text.includes('eğitim') || text.includes('üniversite') || text.includes('okul')) {
      recommendedFields.push('education');
    }

    // Sertifika tespiti
    if (text.includes('certificate') || text.includes('certification') || 
        text.includes('sertifika') || text.includes('belge')) {
      recommendedFields.push('certifications');
    }

    // Dil tespiti
    if (text.includes('language') || text.includes('dil')) {
      recommendedFields.push('skills.languages');
    }

    // Proje tespiti
    if (text.includes('project') || text.includes('proje')) {
      recommendedFields.push('projects');
    }

    return [...new Set(recommendedFields)]; // Duplicates'i kaldır
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
}