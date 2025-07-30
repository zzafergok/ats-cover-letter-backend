import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import logger from '../config/logger';
import { FontLoader } from '../utils/fontLoader';
import { DateFormatter } from '../utils/dateFormatter';

export interface CVMinimalistTurkishData {
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

export class CVTemplateMinimalistTurkishService {
  private static instance: CVTemplateMinimalistTurkishService;

  private constructor() {}

  public static getInstance(): CVTemplateMinimalistTurkishService {
    if (!CVTemplateMinimalistTurkishService.instance) {
      CVTemplateMinimalistTurkishService.instance = new CVTemplateMinimalistTurkishService();
    }
    return CVTemplateMinimalistTurkishService.instance;
  }

  private sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    return text.trim();
  }

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

  async generatePDF(data: CVMinimalistTurkishData): Promise<Buffer> {
    // Set default version if not specified
    if (!data.version) {
      data.version = 'global';
    }
    
    // Set default language based on version
    if (!data.language) {
      data.language = data.version === 'turkey' ? 'turkish' : 'english';
    }
    
    try {
      const doc = await FontLoader.createPDFDocument({
        size: 'A4',
        margin: 50,
      });
      
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
          const blackColor = '#000000';
          const headers = this.getSectionHeaders(data.language!);

          let yPosition = 50;

          // Header with name - minimalist style
          doc
            .fontSize(18)
            .fillColor(blackColor)
            .font('NotoSans-Bold')
            .text(this.sanitizeText(data.personalInfo.fullName).toUpperCase(), 50, yPosition);

          yPosition += 30;

          // Contact information - clean single line format
          const contactInfo = [
            this.sanitizeText(data.personalInfo.address),
            `${this.sanitizeText(data.personalInfo.city)}, ${this.sanitizeText(data.personalInfo.state)} ${this.sanitizeText(data.personalInfo.zipCode)}`,
            this.sanitizeText(data.personalInfo.phone),
            this.sanitizeText(data.personalInfo.email)
          ].filter(Boolean).join(' – ');

          doc
            .fontSize(10)
            .fillColor(blackColor)
            .font('NotoSans')
            .text(contactInfo, 50, yPosition, {
              width: 515
            });

          yPosition += 35;

          // Objective Section
          if (data.objective) {
            this.addSectionHeader(doc, headers.objective, yPosition);
            yPosition += 20;

            const objective = this.sanitizeText(data.objective);
            doc
              .fontSize(10)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(objective, 50, yPosition, {
                width: 515,
                align: 'justify',
                lineGap: 2,
              });

            yPosition += this.calculateTextHeight(doc, objective, { 
              width: 515, 
              lineGap: 2 
            }) + 20;
          }

          // Experience Section
          if (data.experience && data.experience.length > 0) {
            this.addSectionHeader(doc, headers.experience, yPosition);
            yPosition += 20;

            data.experience.forEach((exp) => {
              // Job Title - clean and simple
              const jobTitle = this.sanitizeText(exp.jobTitle);
              doc
                .fontSize(11)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(jobTitle, 50, yPosition);

              yPosition += 15;

              // Company and Location
              const companyLocation = `${this.sanitizeText(exp.company)}, ${this.sanitizeText(exp.location)}`;
              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(companyLocation, 50, yPosition);

              yPosition += 15;

              // Date Range
              const startDate = DateFormatter.formatDate(this.sanitizeText(exp.startDate));
              const endDate = DateFormatter.formatDate(this.sanitizeText(exp.endDate));
              const dateRange = `${startDate} – ${endDate}`;
              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(dateRange, 50, yPosition);

              yPosition += 15;

              // Job Description
              const description = this.sanitizeText(exp.description);
              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(description, 50, yPosition, {
                  width: 515,
                  align: 'justify',
                  lineGap: 2,
                });

              yPosition += this.calculateTextHeight(doc, description, { 
                width: 515, 
                lineGap: 2 
              }) + 20;

              // Check for page break
              if (yPosition > 720) {
                doc.addPage();
                yPosition = 50;
              }
            });
          }

          // Education Section
          if (data.education && data.education.length > 0) {
            this.addSectionHeader(doc, headers.education, yPosition);
            yPosition += 20;

            data.education.forEach((edu) => {
              // Degree
              const degree = this.sanitizeText(edu.degree);
              doc
                .fontSize(11)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(degree, 50, yPosition);

              yPosition += 15;

              // University and Location
              const universityLocation = `${this.sanitizeText(edu.university)}, ${this.sanitizeText(edu.location)}`;
              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(universityLocation, 50, yPosition);

              yPosition += 15;

              // Graduation Date
              const graduationDate = DateFormatter.formatGraduationDate(this.sanitizeText(edu.graduationDate));
              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(graduationDate, 50, yPosition);

              yPosition += 15;

              if (edu.details) {
                const details = this.sanitizeText(edu.details);
                doc
                  .fontSize(10)
                  .fillColor(blackColor)
                  .font('NotoSans')
                  .text(details, 50, yPosition, {
                    width: 515,
                    align: 'justify',
                    lineGap: 2,
                  });

                yPosition += this.calculateTextHeight(doc, details, { 
                  width: 515, 
                  lineGap: 2 
                }) + 15;
              }

              yPosition += 10;

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
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              yPosition = 50;
            }
            
            this.addSectionHeader(doc, headers.technicalSkills, yPosition);
            yPosition += 20;

            const skills = data.technicalSkills;
            
            if (skills.frontend && skills.frontend.length > 0) {
              doc.fontSize(10).fillColor(blackColor).font('NotoSans-Bold').text('Frontend:', 50, yPosition);
              const frontendText = skills.frontend.join(', ');
              doc.font('NotoSans').text(frontendText, 120, yPosition, { width: 395 });
              yPosition += 15;
            }
            
            if (skills.backend && skills.backend.length > 0) {
              doc.fontSize(10).fillColor(blackColor).font('NotoSans-Bold').text('Backend:', 50, yPosition);
              const backendText = skills.backend.join(', ');
              doc.font('NotoSans').text(backendText, 120, yPosition, { width: 395 });
              yPosition += 15;
            }
            
            if (skills.database && skills.database.length > 0) {
              doc.fontSize(10).fillColor(blackColor).font('NotoSans-Bold').text('Database:', 50, yPosition);
              const databaseText = skills.database.join(', ');
              doc.font('NotoSans').text(databaseText, 120, yPosition, { width: 395 });
              yPosition += 15;
            }
            
            if (skills.tools && skills.tools.length > 0) {
              doc.fontSize(10).fillColor(blackColor).font('NotoSans-Bold').text('Tools:', 50, yPosition);
              const toolsText = skills.tools.join(', ');
              doc.font('NotoSans').text(toolsText, 120, yPosition, { width: 395 });
              yPosition += 15;
            }

            yPosition += 15;
          }

          // Communication Section - Global version only
          if (data.version !== 'turkey' && data.communication) {
            // Check if section fits on current page
            const sectionMinHeight = 60;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              yPosition = 50;
            }
            
            this.addSectionHeader(doc, headers.communication, yPosition);
            yPosition += 20;

            const communication = this.sanitizeText(data.communication);
            doc
              .fontSize(10)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(communication, 50, yPosition, {
                width: 515,
                align: 'justify',
                lineGap: 2,
              });

            yPosition += this.calculateTextHeight(doc, communication, { 
              width: 515, 
              lineGap: 2 
            }) + 20;
          }

          // Projects Section - Turkey version
          if (data.version === 'turkey' && data.projects && data.projects.length > 0) {
            // Check if section fits on current page
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              yPosition = 50;
            }
            
            this.addSectionHeader(doc, headers.projects, yPosition);
            yPosition += 20;

            data.projects.forEach((project) => {
              // Project name
              const projectName = this.sanitizeText(project.name);
              doc
                .fontSize(11)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(projectName, 50, yPosition);

              yPosition += 15;

              // Technologies
              const technologies = this.sanitizeText(project.technologies);
              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(technologies, 50, yPosition);

              yPosition += 15;

              // Project description
              const description = this.sanitizeText(project.description);
              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(description, 50, yPosition, {
                  width: 515,
                  align: 'justify',
                  lineGap: 2,
                });

              yPosition += this.calculateTextHeight(doc, description, { 
                width: 515, 
                lineGap: 2 
              }) + 20;

              // Check for page break
              if (yPosition > 720) {
                doc.addPage();
                yPosition = 50;
              }
            });
          }

          // Leadership Section - Global version only
          if (data.version !== 'turkey' && data.leadership) {
            // Check if section fits on current page
            const sectionMinHeight = 60;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              yPosition = 50;
            }

            this.addSectionHeader(doc, headers.leadership, yPosition);
            yPosition += 20;

            const leadership = this.sanitizeText(data.leadership);
            doc
              .fontSize(10)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(leadership, 50, yPosition, {
                width: 515,
                align: 'justify',
                lineGap: 2,
              });

            yPosition += this.calculateTextHeight(doc, leadership, { 
              width: 515, 
              lineGap: 2 
            }) + 20;
          }

          // Certificates Section - Turkey version
          if (data.version === 'turkey' && data.certificates && data.certificates.length > 0) {
            // Check if section fits on current page
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              yPosition = 50;
            }
            
            this.addSectionHeader(doc, headers.certificates, yPosition);
            yPosition += 20;

            data.certificates.forEach((cert) => {
              // Certificate name
              const certName = this.sanitizeText(cert.name);
              doc
                .fontSize(11)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(certName, 50, yPosition);

              yPosition += 15;

              // Issuer and Date
              const issuerDate = `${this.sanitizeText(cert.issuer)} – ${DateFormatter.formatDate(this.sanitizeText(cert.date))}`;
              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(issuerDate, 50, yPosition);

              yPosition += 25;
            });

            yPosition += 5;
          }

          // Languages Section - Turkey version
          if (data.version === 'turkey' && data.languages && data.languages.length > 0) {
            // Check if section fits on current page
            const sectionMinHeight = 60;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              yPosition = 50;
            }
            
            this.addSectionHeader(doc, headers.languages, yPosition);
            yPosition += 20;

            data.languages.forEach((lang) => {
              // Language and level
              const languageLevel = `${this.sanitizeText(lang.language)} – ${this.sanitizeText(lang.level)}`;
              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(languageLevel, 50, yPosition);

              yPosition += 18;
            });

            yPosition += 10;
          }

          // References Section
          if (data.references && data.references.length > 0) {
            // Check if section fits on current page
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              yPosition = 50;
            }

            this.addSectionHeader(doc, headers.references, yPosition);
            yPosition += 20;

            data.references.forEach((ref) => {
              // Reference name
              const name = this.sanitizeText(ref.name);
              doc
                .fontSize(11)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(name, 50, yPosition);

              yPosition += 15;

              // Company and contact
              const companyContact = `${this.sanitizeText(ref.company)} – ${this.sanitizeText(ref.contact)}`;
              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(companyContact, 50, yPosition);

              yPosition += 25;
            });
          }

          doc.end();
        } catch (error) {
          logger.error('PDF generation error in minimalist turkish template:', error);
          reject(new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
    } catch (error) {
      logger.error('PDF document creation failed:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private addSectionHeader(doc: InstanceType<typeof PDFDocument>, title: string, yPosition: number): void {
    // Simple underlined section title - minimalist style
    doc
      .fontSize(12)
      .fillColor('#000000')
      .font('NotoSans-Bold')
      .text(title, 50, yPosition, { 
        underline: true,
        width: 515
      });
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