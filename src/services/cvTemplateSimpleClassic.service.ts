import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import logger from '../config/logger';
import { FontLoader } from '../utils/fontLoader';
import { DateFormatter } from '../utils/dateFormatter';

export interface CVSimpleClassicData {
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
  skills?: string[];
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

export class CVTemplateSimpleClassicService {
  private static instance: CVTemplateSimpleClassicService;

  private constructor() {}

  public static getInstance(): CVTemplateSimpleClassicService {
    if (!CVTemplateSimpleClassicService.instance) {
      CVTemplateSimpleClassicService.instance =
        new CVTemplateSimpleClassicService();
    }
    return CVTemplateSimpleClassicService.instance;
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
        references: 'REFERANSLAR',
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
        skills: 'SKILLS',
        references: 'REFERENCES',
      };
    }
  }

  async generatePDF(data: CVSimpleClassicData): Promise<Buffer> {
    // Set default version if not specified
    if (!data.version) {
      data.version = 'global';
    }

    // Set default language based on version
    if (!data.language) {
      data.language = data.version === 'turkey' ? 'turkish' : 'english';
    }

    try {
      const doc = await FontLoader.createPDFDocument();

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

          // Left and right green vertical lines
          const greenColor = '#5e7a5a';
          this.addVerticalBorders(doc, greenColor);

          // Define colors and get section headers
          const greyColor = '#666666';
          const blackColor = '#000000';
          const headers = this.getSectionHeaders(data.language!);

          let yPosition = 60;

          // Header with name - Simple Classic style
          doc
            .fontSize(30)
            .fillColor(greenColor)
            .font('NotoSans-Bold')
            .text(
              this.sanitizeText(data.personalInfo.fullName).toUpperCase(),
              75,
              yPosition
            );

          yPosition += 85;

          // Contact Information
          const contactInfo = [
            this.sanitizeText(data.personalInfo.address),
            `${this.sanitizeText(data.personalInfo.city)}, ${this.sanitizeText(data.personalInfo.state)} ${this.sanitizeText(data.personalInfo.zipCode)}`,
            this.sanitizeText(data.personalInfo.phone),
            this.sanitizeText(data.personalInfo.email),
          ].filter(Boolean);

          contactInfo.forEach((info, index) => {
            doc
              .fontSize(9)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(info, 75, yPosition + index * 15);
          });

          yPosition += contactInfo.length * 15 + 30;

          // Objective Section - if provided
          if (data.objective) {
            this.addSectionHeader(
              doc,
              headers.objective,
              yPosition,
              greenColor
            );
            yPosition += 25;

            const objective = this.sanitizeText(data.objective);
            doc
              .fontSize(9)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(objective, 100, yPosition, {
                width: 415,
                align: 'justify',
                lineGap: 2,
              });

            yPosition +=
              this.calculateTextHeight(doc, objective, {
                width: 415,
                lineGap: 2,
              }) + 30;
          }

          // Experience Section
          if (data.experience && data.experience.length > 0) {
            this.addSectionHeader(
              doc,
              headers.experience,
              yPosition,
              greenColor
            );
            yPosition += 25;

            data.experience.forEach((exp, index) => {
              // Job title and company with location
              const jobTitle = this.sanitizeText(exp.jobTitle);
              const company = this.sanitizeText(exp.company);
              const location = this.sanitizeText(exp.location);

              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(`${jobTitle}, `, 100, yPosition, { continued: true })
                .font('NotoSans')
                .text(`${company} | ${location}`, { continued: false });

              yPosition += 15;

              // Date range
              const startDate = DateFormatter.formatDate(
                this.sanitizeText(exp.startDate)
              );
              const endDate = DateFormatter.formatDate(
                this.sanitizeText(exp.endDate)
              );
              const dateRange = `${startDate} – ${endDate}`;

              doc
                .fontSize(9)
                .fillColor(greyColor)
                .font('NotoSans')
                .text(dateRange, 100, yPosition);

              yPosition += 20;

              // Description
              const description = this.sanitizeText(exp.description);
              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(description, 100, yPosition, {
                  width: 415,
                  align: 'justify',
                  lineGap: 2,
                });

              yPosition +=
                this.calculateTextHeight(doc, description, {
                  width: 415,
                  lineGap: 2,
                }) + 20;

              // Check for page break
              if (yPosition > 720 && index < data.experience.length - 1) {
                doc.addPage();
                // Green vertical borders for new page
                this.addVerticalBorders(doc, greenColor);
                yPosition = 60;
              }
            });
          }

          // Education Section
          yPosition += 10;
          if (yPosition > 650) {
            doc.addPage();
            // Green vertical borders for new page
            this.addVerticalBorders(doc, greenColor);
            yPosition = 60;
          }

          if (data.education && data.education.length > 0) {
            this.addSectionHeader(
              doc,
              headers.education,
              yPosition,
              greenColor
            );
            yPosition += 25;

            data.education.forEach((edu) => {
              // Graduation date
              const graduationDate = DateFormatter.formatGraduationDate(
                this.sanitizeText(edu.graduationDate)
              );
              doc
                .fontSize(9)
                .fillColor(greyColor)
                .font('NotoSans')
                .text(graduationDate, 100, yPosition);

              yPosition += 15;

              // Degree and university with location
              const degree = this.sanitizeText(edu.degree);
              const university = this.sanitizeText(edu.university);
              const location = this.sanitizeText(edu.location);
              const details = edu.details
                ? ` - ${this.sanitizeText(edu.details)}`
                : '';

              doc
                .fontSize(10)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(
                  `${degree}, ${university} | ${location}${details}`,
                  100,
                  yPosition,
                  {
                    width: 415,
                  }
                );

              yPosition += 25;
            });
          }

          // Skills Section - Global version only
          if (data.version !== 'turkey' && data.skills && data.skills.length > 0) {
            yPosition += 20;
            if (yPosition > 650) {
              doc.addPage();
              this.addVerticalBorders(doc, greenColor);
              yPosition = 60;
            }

            this.addSectionHeader(doc, headers.skills, yPosition, greenColor);
            yPosition += 25;

            const columnWidth = 138; // 415 / 3 ≈ 138
            const columnSpacing = 138;
            
            data.skills.forEach((skill, index) => {
              const column = index % 3;
              const row = Math.floor(index / 3);
              const xPosition = 100 + (column * columnSpacing);
              const currentYPosition = yPosition + (row * 15);

              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(skill, xPosition, currentYPosition);
            });

            const totalRows = Math.ceil(data.skills.length / 3);
            yPosition += (totalRows * 15) + 20;
          }

          // Technical Skills Section - Turkey version
          if (data.version === 'turkey' && data.technicalSkills) {
            yPosition += 20;
            if (yPosition > 650) {
              doc.addPage();
              this.addVerticalBorders(doc, greenColor);
              yPosition = 60;
            }

            this.addSectionHeader(
              doc,
              headers.technicalSkills,
              yPosition,
              greenColor
            );
            yPosition += 25;

            const skills = data.technicalSkills;

            if (skills.frontend && skills.frontend.length > 0) {
              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text('Frontend:', 100, yPosition);
              const frontendText = skills.frontend.join(', ');
              doc
                .font('NotoSans')
                .text(frontendText, 170, yPosition, { width: 345 });
              yPosition += 18;
            }

            if (skills.backend && skills.backend.length > 0) {
              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text('Backend:', 100, yPosition);
              const backendText = skills.backend.join(', ');
              doc
                .font('NotoSans')
                .text(backendText, 170, yPosition, { width: 345 });
              yPosition += 18;
            }

            if (skills.database && skills.database.length > 0) {
              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text('Database:', 100, yPosition);
              const databaseText = skills.database.join(', ');
              doc
                .font('NotoSans')
                .text(databaseText, 170, yPosition, { width: 345 });
              yPosition += 18;
            }

            if (skills.tools && skills.tools.length > 0) {
              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text('Tools:', 100, yPosition);
              const toolsText = skills.tools.join(', ');
              doc
                .font('NotoSans')
                .text(toolsText, 170, yPosition, { width: 345 });
              yPosition += 18;
            }

            yPosition += 15;
          }

          // Communication Section - Global version only
          if (data.version !== 'turkey' && data.communication) {
            yPosition += 20;
            if (yPosition > 650) {
              doc.addPage();
              this.addVerticalBorders(doc, greenColor);
              yPosition = 60;
            }

            this.addSectionHeader(
              doc,
              headers.communication,
              yPosition,
              greenColor
            );
            yPosition += 25;

            const communication = this.sanitizeText(data.communication);
            doc
              .fontSize(9)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(communication, 100, yPosition, {
                width: 415,
                align: 'justify',
                lineGap: 2,
              });

            yPosition +=
              this.calculateTextHeight(doc, communication, {
                width: 415,
                lineGap: 2,
              }) + 20;
          }

          // Projects Section - Turkey version
          if (
            data.version === 'turkey' &&
            data.projects &&
            data.projects.length > 0
          ) {
            yPosition += 20;
            if (yPosition > 650) {
              doc.addPage();
              this.addVerticalBorders(doc, greenColor);
              yPosition = 60;
            }

            this.addSectionHeader(doc, headers.projects, yPosition, greenColor);
            yPosition += 25;

            data.projects.forEach((project) => {
              // Project name - bold
              const projectName = this.sanitizeText(project.name);
              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(projectName, 100, yPosition);

              // Technologies - right aligned
              const technologies = this.sanitizeText(project.technologies);
              const techWidth = doc.widthOfString(technologies);
              const techStartX = 565 - techWidth;

              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(technologies, techStartX, yPosition);

              yPosition += 20;

              // Project description
              const description = this.sanitizeText(project.description);
              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(description, 100, yPosition, {
                  width: 415,
                  align: 'justify',
                  lineGap: 2,
                });

              yPosition +=
                this.calculateTextHeight(doc, description, {
                  width: 415,
                  lineGap: 2,
                }) + 15;

              // Check for page break
              if (yPosition > 720) {
                doc.addPage();
                this.addVerticalBorders(doc, greenColor);
                yPosition = 60;
              }
            });

            yPosition += 5;
          }

          // Leadership Section - Global version only
          if (data.version !== 'turkey' && data.leadership) {
            yPosition += 20;
            if (yPosition > 650) {
              doc.addPage();
              this.addVerticalBorders(doc, greenColor);
              yPosition = 60;
            }

            this.addSectionHeader(
              doc,
              headers.leadership,
              yPosition,
              greenColor
            );
            yPosition += 25;

            const leadership = this.sanitizeText(data.leadership);
            doc
              .fontSize(9)
              .fillColor(blackColor)
              .font('NotoSans')
              .text(leadership, 100, yPosition, {
                width: 415,
                align: 'justify',
                lineGap: 2,
              });

            yPosition +=
              this.calculateTextHeight(doc, leadership, {
                width: 415,
                lineGap: 2,
              }) + 20;
          }

          // Certificates Section - Turkey version
          if (
            data.version === 'turkey' &&
            data.certificates &&
            data.certificates.length > 0
          ) {
            yPosition += 20;
            if (yPosition > 650) {
              doc.addPage();
              this.addVerticalBorders(doc, greenColor);
              yPosition = 60;
            }

            this.addSectionHeader(
              doc,
              headers.certificates,
              yPosition,
              greenColor
            );
            yPosition += 25;

            data.certificates.forEach((cert) => {
              // Certificate name - bold
              const certName = this.sanitizeText(cert.name);
              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(certName, 100, yPosition);

              // Issuer - regular font
              const issuer = this.sanitizeText(cert.issuer);
              doc.font('NotoSans').text(issuer, 100, yPosition + 15);

              // Date - right aligned
              const certDate = DateFormatter.formatDate(
                this.sanitizeText(cert.date)
              );
              const dateWidth = doc.widthOfString(certDate);
              const dateStartX = 565 - dateWidth;

              doc
                .fontSize(9)
                .fillColor(blackColor)
                .text(certDate, dateStartX, yPosition + 15);

              yPosition += 35;
            });

            yPosition += 5;
          }

          // Languages Section - Turkey version
          if (
            data.version === 'turkey' &&
            data.languages &&
            data.languages.length > 0
          ) {
            yPosition += 20;
            if (yPosition > 650) {
              doc.addPage();
              this.addVerticalBorders(doc, greenColor);
              yPosition = 60;
            }

            this.addSectionHeader(
              doc,
              headers.languages,
              yPosition,
              greenColor
            );
            yPosition += 25;

            data.languages.forEach((lang) => {
              // Language name - bold
              const language = this.sanitizeText(lang.language);
              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(language, 100, yPosition);

              // Level - right aligned
              const level = this.sanitizeText(lang.level);
              const levelWidth = doc.widthOfString(level);
              const levelStartX = 565 - levelWidth;

              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans')
                .text(level, levelStartX, yPosition);

              yPosition += 22;
            });

            yPosition += 10;
          }

          // References Section
          if (data.references && data.references.length > 0) {
            yPosition += 20;
            if (yPosition > 650) {
              doc.addPage();
              this.addVerticalBorders(doc, greenColor);
              yPosition = 60;
            }

            this.addSectionHeader(
              doc,
              headers.references,
              yPosition,
              greenColor
            );
            yPosition += 25;

            data.references.forEach((ref) => {
              // Reference name - bold
              const name = this.sanitizeText(ref.name);
              doc
                .fontSize(9)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text(name, 100, yPosition);

              // Company and contact - regular font
              const companyContact = `${this.sanitizeText(ref.company)} | ${this.sanitizeText(ref.contact)}`;
              doc.font('NotoSans').text(companyContact, 100, yPosition + 15);

              yPosition += 40;
            });
          }

          doc.end();
        } catch (error) {
          logger.error(
            'PDF generation error in simple_classic template:',
            error
          );
          reject(
            new Error(
              `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      });
    } catch (error) {
      logger.error('PDF document creation failed:', error);
      throw new Error(
        `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private addSectionHeader(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    yPosition: number,
    greenColor: string
  ): void {
    // Section title - Simple Classic style with green color
    doc
      .fontSize(14)
      .fillColor(greenColor)
      .font('NotoSans-Bold')
      .text(title, 100, yPosition);
  }

  private addVerticalBorders(
    doc: InstanceType<typeof PDFDocument>,
    greenColor: string
  ): void {
    // Lighter green for borders
    const borderColor = '#7a9175';
    
    // Left vertical line - 0.75px width, full page height
    doc
      .strokeColor(borderColor)
      .lineWidth(0.75)
      .moveTo(30, 0)
      .lineTo(30, 842)
      .stroke();
    
    // Second left line - 1.75px width with gap, full page height
    doc
      .strokeColor(borderColor)
      .lineWidth(1.75)
      .moveTo(33.5, 0)
      .lineTo(33.5, 842)
      .stroke();
    
    // Right vertical line - 0.75px width, full page height
    doc
      .strokeColor(borderColor)
      .lineWidth(0.75)
      .moveTo(565, 0)
      .lineTo(565, 842)
      .stroke();
    
    // Second right line - 1.75px width with gap, full page height
    doc
      .strokeColor(borderColor)
      .lineWidth(1.75)
      .moveTo(561.5, 0)
      .lineTo(561.5, 842)
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
      return 20;
    }
  }
}
