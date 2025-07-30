import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import path from 'path';
import fs from 'fs';
import logger from '../config/logger';

export interface CVBasicHRData {
  personalInfo: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
  };
  objective: string;
  experience: Array<{
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    university: string;
    location: string;
    graduationDate: string;
    details?: string;
  }>;
  // Global version fields
  communication?: string;
  leadership?: string;
  // Turkey version fields
  technicalSkills?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    tools?: string[];
  };
  projects?: Array<{
    name: string;
    description: string;
    technologies: string;
    link?: string;
  }>;
  certificates?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  languages?: Array<{
    language: string;
    level: string;
  }>;
  references?: Array<{
    name: string;
    company: string;
    contact: string;
  }>;
  // Version control
  version?: 'global' | 'turkey';
  language?: 'turkish' | 'english';
}

export class CVTemplateBasicHRService {
  private static instance: CVTemplateBasicHRService;
  private static cachedFonts: { [key: string]: Buffer } = {};

  private constructor() {}

  public static getInstance(): CVTemplateBasicHRService {
    if (!CVTemplateBasicHRService.instance) {
      CVTemplateBasicHRService.instance = new CVTemplateBasicHRService();
    }
    return CVTemplateBasicHRService.instance;
  }

  /**
   * Font yükleme - PDF Service'ten alınan font loading sistemi
   */
  private async loadFont(fontName: string): Promise<Buffer> {
    if (!CVTemplateBasicHRService.cachedFonts[fontName]) {
      const possiblePaths = [
        path.join(__dirname, '..', 'assets', 'fonts', `${fontName}.ttf`),
        path.join(__dirname, '..', '..', 'src', 'assets', 'fonts', `${fontName}.ttf`),
        path.join(process.cwd(), 'src', 'assets', 'fonts', `${fontName}.ttf`),
      ];

      let fontPath: string | null = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          fontPath = possiblePath;
          break;
        }
      }

      if (!fontPath) {
        logger.warn(`Font not found in any of these paths: ${possiblePaths.join(', ')}`);
        throw new Error(`Font file not found: ${fontName}`);
      }

      CVTemplateBasicHRService.cachedFonts[fontName] = fs.readFileSync(fontPath);
      logger.info(`Font loaded and cached: ${fontName} from ${fontPath}`);
    }

    return CVTemplateBasicHRService.cachedFonts[fontName];
  }

  /**
   * Türkçe destekleyen PDF document oluştur
   */
  private async createPDFDocument(): Promise<InstanceType<typeof PDFDocument>> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'ATS Optimized Resume',
        Author: 'ATS Cover Letter System',
        Subject: 'Professional Resume with Turkish Support',
        Creator: 'PDFKit with Turkish Support',
        Producer: 'PDFKit with Turkish Support',
      },
    });

    try {
      // Noto Sans fonts - Google'ın en zarif ve kapsamlı Türkçe destekli fontu
      const notoSansRegular = await this.loadFont('NotoSans-Regular');
      const notoSansBold = await this.loadFont('NotoSans-Bold');

      doc.registerFont('NotoSans', notoSansRegular);
      doc.registerFont('NotoSans-Bold', notoSansBold);

      // Varsayılan fontu ayarla
      doc.font('NotoSans');

      logger.info('PDF document created with Noto Sans fonts for Turkish support');
    } catch (error) {
      logger.error('Noto Sans font loading failed, using fallback fonts', error);
      // Fallback olarak Roboto fontlarını dene
      try {
        const robotoRegular = await this.loadFont('Roboto-Regular');
        const robotoBold = await this.loadFont('Roboto-Bold');
        doc.registerFont('NotoSans', robotoRegular);
        doc.registerFont('NotoSans-Bold', robotoBold);
        doc.font('NotoSans');
        logger.info('Using Roboto fonts as fallback');
      } catch (fallbackError) {
        logger.error('All font loading failed, using system fonts', fallbackError);
        doc.font('Helvetica');
      }
    }

    return doc;
  }

  /**
   * Metni güvenli şekilde temizle
   */
  private sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    return text.trim();
  }

  /**
   * Tarihi 'Ay Yıl' formatına çevir
   */
  private formatDate(dateString: string): string {
    if (!dateString || dateString.toLowerCase() === 'present' || dateString.toLowerCase() === 'current') {
      return 'Present';
    }
    
    try {
      // Farklı tarih formatlarını destekle
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Geçersiz tarih ise orijinalini döndür
      }
      
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } catch (error) {
      return dateString; // Hata durumunda orijinal string'i döndür
    }
  }

  /**
   * Dil bazında section başlıklarını getir
   */
  private getSectionHeaders(language: 'turkish' | 'english') {
    if (language === 'turkish') {
      return {
        objective: 'HEDEF',
        experience: 'DENEYİM',
        education: 'EĞİTİM',
        technicalSkills: 'TEKNİK BECERİLER',
        projects: 'PROJELER',
        certificates: 'SERTİFİKALAR',
        languages: 'DİLLER',
        communication: 'İLETİŞİM',
        leadership: 'LİDERLİK',
        references: 'REFERANSLAR'
      };
    } else {
      return {
        objective: 'OBJECTIVE',
        experience: 'EXPERIENCE',
        education: 'EDUCATION',
        technicalSkills: 'TECHNICAL SKILLS',
        projects: 'PROJECTS',
        certificates: 'CERTIFICATES',
        languages: 'LANGUAGES',
        communication: 'COMMUNICATION',
        leadership: 'LEADERSHIP',
        references: 'REFERENCES'
      };
    }
  }

  async generatePDF(data: CVBasicHRData): Promise<Buffer> {
    // Set default version if not specified
    if (!data.version) {
      data.version = 'global';
    }
    
    // Set default language based on version
    if (!data.language) {
      data.language = data.version === 'turkey' ? 'turkish' : 'english';
    }
    try {
      const doc = await this.createPDFDocument();
      
      return new Promise((resolve, reject) => {

        const chunks: Buffer[] = [];
        const stream = new PassThrough();

        doc.pipe(stream);

        try {
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', (error) => {
            logger.error('PDF generation stream error:', error);
            reject(error);
          });

        // Define colors and get section headers
        const greenColor = '#4a7c59'; // Matching template green color
        const blackColor = '#000000';
        const headers = this.getSectionHeaders(data.language!);

        let yPosition = 50;

        // Header with name - exactly like template
        doc
          .fontSize(24)
          .fillColor(greenColor)
          .font('NotoSans-Bold')
          .text(this.sanitizeText(data.personalInfo.fullName).toUpperCase(), 50, yPosition, {
            align: 'center',
            width: 495,
          });

        yPosition += 40;

        // Contact information - exactly like template format
        const contactInfo = [
          this.sanitizeText(data.personalInfo.address),
          `${this.sanitizeText(data.personalInfo.city)}, ${this.sanitizeText(data.personalInfo.state)} ${this.sanitizeText(data.personalInfo.zipCode)}`,
          this.sanitizeText(data.personalInfo.phone),
          this.sanitizeText(data.personalInfo.email)
        ].filter(Boolean).join(' | ');

        doc
          .fontSize(11)
          .fillColor(blackColor)
          .font('NotoSans')
          .text(contactInfo, 50, yPosition, {
            align: 'center',
            width: 495,
          });

        yPosition += 40;

        // Objective Section - with green underline like template
        if (data.objective) {
          this.addSectionHeader(doc, headers.objective, yPosition, greenColor);
          yPosition += 25;

          const objective = this.sanitizeText(data.objective);
          doc
            .fontSize(11)
            .fillColor(blackColor)
            .font('NotoSans')
            .text(objective, 50, yPosition, {
              width: 495,
              align: 'justify',
              lineGap: 2,
            });

          yPosition += this.calculateTextHeight(doc, objective, { 
            width: 495, 
            lineGap: 2 
          }) + 20;
        }

        // Experience Section - exactly like template
        if (data.experience && data.experience.length > 0) {
          this.addSectionHeader(doc, headers.experience, yPosition, greenColor);
          yPosition += 25;

          data.experience.forEach((exp) => {
            // Job Title - bold
            const jobTitle = this.sanitizeText(exp.jobTitle);
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .font('NotoSans-Bold')
              .text(jobTitle, 50, yPosition);

            // Company and location - regular font
            const companyLocation = `${this.sanitizeText(exp.company)} | ${this.sanitizeText(exp.location)}`;
            doc
              .font('NotoSans')
              .text(companyLocation, 50, yPosition + 15);

            // Date range - right aligned like template with formatted dates
            const startDate = this.formatDate(this.sanitizeText(exp.startDate));
            const endDate = this.formatDate(this.sanitizeText(exp.endDate));
            const dateRange = `${startDate} – ${endDate}`;
            const dateWidth = doc.widthOfString(dateRange);
            const dateStartX = 545 - dateWidth; // Position from right edge
            
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .text(dateRange, dateStartX, yPosition + 15);

            yPosition += 35;

            // Job Description
            const description = this.sanitizeText(exp.description);
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(description, 50, yPosition, {
                width: 495,
                align: 'justify',
                lineGap: 2,
              });

            yPosition += this.calculateTextHeight(doc, description, { 
              width: 495, 
              lineGap: 2 
            }) + 15;

            // Check for page break
            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }
          });
        }

        // Education Section - exactly like template
        if (data.education && data.education.length > 0) {
          this.addSectionHeader(doc, headers.education, yPosition, greenColor);
          yPosition += 25;

          data.education.forEach((edu) => {
            // Degree - bold
            const degree = this.sanitizeText(edu.degree);
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .font('NotoSans-Bold')
              .text(degree, 50, yPosition);

            // University and location - regular font
            const universityLocation = `${this.sanitizeText(edu.university)} | ${this.sanitizeText(edu.location)}`;
            doc
              .font('NotoSans')
              .text(universityLocation, 50, yPosition + 15);

            // Graduation date - right aligned with formatted date
            const graduationDate = this.formatDate(this.sanitizeText(edu.graduationDate));
            const gradDateWidth = doc.widthOfString(graduationDate);
            const gradDateStartX = 545 - gradDateWidth; // Position from right edge
            
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .text(graduationDate, gradDateStartX, yPosition + 15);

            yPosition += 35;

            if (edu.details) {
              const details = this.sanitizeText(edu.details);
              doc
                .fontSize(11)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(details, 50, yPosition, {
                  width: 495,
                  align: 'justify',
                  lineGap: 2,
                });

              yPosition += this.calculateTextHeight(doc, details, { 
                width: 495, 
                lineGap: 2 
              }) + 15;
            }

            // Check for page break
            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }
          });
        }

        // Technical Skills Section - Turkey version
        if (data.version === 'turkey' && data.technicalSkills) {
          // Check if section fits on current page
          const sectionMinHeight = 80; // Header + minimum content
          if (yPosition + sectionMinHeight > 720) {
            doc.addPage();
            yPosition = 50;
          }
          
          this.addSectionHeader(doc, headers.technicalSkills, yPosition, greenColor);
          yPosition += 25;

          const skills = data.technicalSkills;
          
          if (skills.frontend && skills.frontend.length > 0) {
            doc.fontSize(11).fillColor(blackColor).font('NotoSans-Bold').text('Frontend:', 50, yPosition);
            const frontendText = skills.frontend.join(', ');
            doc.font('NotoSans').text(frontendText, 120, yPosition, { width: 425 });
            yPosition += 18;
          }
          
          if (skills.backend && skills.backend.length > 0) {
            doc.fontSize(11).fillColor(blackColor).font('NotoSans-Bold').text('Backend:', 50, yPosition);
            const backendText = skills.backend.join(', ');
            doc.font('NotoSans').text(backendText, 120, yPosition, { width: 425 });
            yPosition += 18;
          }
          
          if (skills.database && skills.database.length > 0) {
            doc.fontSize(11).fillColor(blackColor).font('NotoSans-Bold').text('Database:', 50, yPosition);
            const databaseText = skills.database.join(', ');
            doc.font('NotoSans').text(databaseText, 120, yPosition, { width: 425 });
            yPosition += 18;
          }
          
          if (skills.tools && skills.tools.length > 0) {
            doc.fontSize(11).fillColor(blackColor).font('NotoSans-Bold').text('Tools:', 50, yPosition);
            const toolsText = skills.tools.join(', ');
            doc.font('NotoSans').text(toolsText, 120, yPosition, { width: 425 });
            yPosition += 18;
          }

          yPosition += 15;
        }

        // Communication Section - Global version only
        if (data.version !== 'turkey' && data.communication) {
          // Check if section fits on current page
          const sectionMinHeight = 60; // Header + minimum content
          if (yPosition + sectionMinHeight > 720) {
            doc.addPage();
            yPosition = 50;
          }
          
          this.addSectionHeader(doc, headers.communication, yPosition, greenColor);
          yPosition += 25;

          const communication = this.sanitizeText(data.communication);
          doc
            .fontSize(11)
            .fillColor(blackColor)
            .font('NotoSans')
            .text(communication, 50, yPosition, {
              width: 495,
              align: 'justify',
              lineGap: 2,
            });

          yPosition += this.calculateTextHeight(doc, communication, { 
            width: 495, 
            lineGap: 2 
          }) + 20;
        }

        // Projects Section - Turkey version
        if (data.version === 'turkey' && data.projects && data.projects.length > 0) {
          // Check if section fits on current page
          const sectionMinHeight = 80; // Header + minimum content
          if (yPosition + sectionMinHeight > 720) {
            doc.addPage();
            yPosition = 50;
          }
          
          this.addSectionHeader(doc, headers.projects, yPosition, greenColor);
          yPosition += 25;

          data.projects.forEach((project) => {
            // Project name - bold
            const projectName = this.sanitizeText(project.name);
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .font('NotoSans-Bold')
              .text(projectName, 50, yPosition);

            // Technologies - right aligned
            const technologies = this.sanitizeText(project.technologies);
            const techWidth = doc.widthOfString(technologies);
            const techStartX = 545 - techWidth;
            
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(technologies, techStartX, yPosition);

            yPosition += 20;

            // Project description
            const description = this.sanitizeText(project.description);
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(description, 50, yPosition, {
                width: 495,
                align: 'justify',
                lineGap: 2,
              });

            yPosition += this.calculateTextHeight(doc, description, { 
              width: 495, 
              lineGap: 2 
            }) + 15;

            // Check for page break
            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }
          });

          yPosition += 5;
        }

        // Leadership Section - Global version only
        if (data.version !== 'turkey' && data.leadership) {
          // Check if section fits on current page
          const sectionMinHeight = 60; // Header + minimum content
          if (yPosition + sectionMinHeight > 720) {
            doc.addPage();
            yPosition = 50;
          }

          this.addSectionHeader(doc, headers.leadership, yPosition, greenColor);
          yPosition += 25;

          const leadership = this.sanitizeText(data.leadership);
          doc
            .fontSize(11)
            .fillColor(blackColor)
            .font('NotoSans')
            .text(leadership, 50, yPosition, {
              width: 495,
              align: 'justify',
              lineGap: 2,
            });

          yPosition += this.calculateTextHeight(doc, leadership, { 
            width: 495, 
            lineGap: 2 
          }) + 20;
        }

        // Certificates Section - Turkey version
        if (data.version === 'turkey' && data.certificates && data.certificates.length > 0) {
          // Check if section fits on current page
          const sectionMinHeight = 80; // Header + minimum content
          if (yPosition + sectionMinHeight > 720) {
            doc.addPage();
            yPosition = 50;
          }
          
          this.addSectionHeader(doc, headers.certificates, yPosition, greenColor);
          yPosition += 25;

          data.certificates.forEach((cert) => {
            // Certificate name - bold
            const certName = this.sanitizeText(cert.name);
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .font('NotoSans-Bold')
              .text(certName, 50, yPosition);

            // Issuer - regular font
            const issuer = this.sanitizeText(cert.issuer);
            doc
              .font('NotoSans')
              .text(issuer, 50, yPosition + 15);

            // Date - right aligned
            const certDate = this.formatDate(this.sanitizeText(cert.date));
            const dateWidth = doc.widthOfString(certDate);
            const dateStartX = 545 - dateWidth;
            
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .text(certDate, dateStartX, yPosition + 15);

            yPosition += 35;
          });

          yPosition += 5;
        }

        // Languages Section - Turkey version
        if (data.version === 'turkey' && data.languages && data.languages.length > 0) {
          // Check if section fits on current page
          const sectionMinHeight = 60; // Header + minimum content
          if (yPosition + sectionMinHeight > 720) {
            doc.addPage();
            yPosition = 50;
          }
          
          this.addSectionHeader(doc, headers.languages, yPosition, greenColor);
          yPosition += 25;

          data.languages.forEach((lang) => {
            // Language name - bold
            const language = this.sanitizeText(lang.language);
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .font('NotoSans-Bold')
              .text(language, 50, yPosition);

            // Level - right aligned
            const level = this.sanitizeText(lang.level);
            const levelWidth = doc.widthOfString(level);
            const levelStartX = 545 - levelWidth;
            
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(level, levelStartX, yPosition);

            yPosition += 22;
          });

          yPosition += 10;
        }

        // References Section - exactly like template
        if (data.references && data.references.length > 0) {
          // Check if section fits on current page
          const sectionMinHeight = 80; // Header + at least one reference
          if (yPosition + sectionMinHeight > 720) {
            doc.addPage();
            yPosition = 50;
          }

          this.addSectionHeader(doc, headers.references, yPosition, greenColor);
          yPosition += 25;

          data.references.forEach((ref) => {
            // Reference name - bold
            const name = this.sanitizeText(ref.name);
            doc
              .fontSize(11)
              .fillColor(blackColor)
              .font('NotoSans-Bold')
              .text(name, 50, yPosition);

            // Company and contact - regular font
            const companyContact = `${this.sanitizeText(ref.company)} | ${this.sanitizeText(ref.contact)}`;
            doc
              .font('NotoSans')
              .text(companyContact, 50, yPosition + 15);

            yPosition += 40;
          });
        }

          doc.end();
        } catch (error) {
          logger.error('PDF generation error in basic_hr template:', error);
          reject(new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
    } catch (error) {
      logger.error('PDF document creation failed:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private addSectionHeader(doc: InstanceType<typeof PDFDocument>, title: string, yPosition: number, greenColor: string): void {
    // Section title - exactly like template
    doc
      .fontSize(11)
      .fillColor('#000000')
      .font('NotoSans-Bold')
      .text(title, 50, yPosition);

    // Calculate title width to position the line correctly
    const titleWidth = doc.widthOfString(title);
    const lineStartX = 50 + titleWidth + 10; // 10px gap after title
    const lineEndX = 545; // Right margin

    // Green underline from title end to page edge - positioned perfectly in the center of text
    const fontSize = 11;
    const lineY = yPosition + (fontSize / 2) + 1; // Perfect center alignment
    
    doc
      .strokeColor(greenColor)
      .lineWidth(1)
      .moveTo(lineStartX, lineY)
      .lineTo(lineEndX, lineY)
      .stroke();
  }

  private calculateTextHeight(
    doc: InstanceType<typeof PDFDocument>,
    text: string,
    options: any = {}
  ): number {
    try {
      if (!text || typeof text !== 'string') {
        return 0;
      }
      const height = doc.heightOfString(text, options);
      return height || 0;
    } catch (error) {
      logger.error('Error calculating text height:', error);
      return 20; // Return a default height
    }
  }
}