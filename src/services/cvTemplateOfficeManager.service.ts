/* eslint-disable prefer-const */
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import logger from '../config/logger';
import { FontLoader } from '../utils/fontLoader';
import { DateFormatter } from '../utils/dateFormatter';

export interface CVOfficeManagerData {
  personalInfo: {
    fullName: string;
    firstName?: string;
    lastName?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
    linkedin?: string;
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
  skills: string[];
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

export class CVTemplateOfficeManagerService {
  private static instance: CVTemplateOfficeManagerService;

  private constructor() {}

  public static getInstance(): CVTemplateOfficeManagerService {
    if (!CVTemplateOfficeManagerService.instance) {
      CVTemplateOfficeManagerService.instance =
        new CVTemplateOfficeManagerService();
    }
    return CVTemplateOfficeManagerService.instance;
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
        skills: 'BECERİLER',
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
        references: 'REFERENCES',
        skills: 'SKILLS',
      };
    }
  }

  async generatePDF(data: CVOfficeManagerData): Promise<Buffer> {
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

          const headers = this.getSectionHeaders(data.language!);
          const blackColor = '#000000';
          let yPosition = 36;

          // Parse fullName - basic_hr logic but with firstName/lastName from data
          let firstName = '';
          let lastName = '';

          if (data.personalInfo.firstName && data.personalInfo.lastName) {
            firstName = this.sanitizeText(data.personalInfo.firstName);
            lastName = this.sanitizeText(data.personalInfo.lastName);
          } else {
            const nameParts = this.sanitizeText(
              data.personalInfo.fullName
            ).split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }

          // Header with name - ATS Office Manager style
          doc
            .fontSize(36)
            .fillColor('#000000')
            .font('NotoSans-Bold')
            .text(firstName, 36, yPosition)
            .text(lastName, 36, yPosition + 40);

          yPosition += 100;

          // Job Title
          doc
            .fontSize(14)
            .fillColor('#000000')
            .font('NotoSans')
            .text('OFFICE MANAGER', 36, yPosition);

          yPosition += 35;

          // Add separator line before personal info (full width)
          doc
            .strokeColor('#000000')
            .lineWidth(1)
            .moveTo(36, yPosition)
            .lineTo(545, yPosition)
            .stroke();

          yPosition += 15;

          // Contact information - basic_hr logic for data processing
          let contactY = yPosition;
          doc
            .fontSize(11)
            .fillColor('#000000')
            .font('NotoSans')
            .text(this.sanitizeText(data.personalInfo.email), 36, contactY);

          // Format phone like basic_hr
          const phone = this.sanitizeText(data.personalInfo.phone);
          const formattedPhone = phone.startsWith('+90')
            ? `(${phone.slice(3, 6)}) ${phone.slice(6)}`
            : phone.startsWith('+')
              ? `(${phone.slice(1, 4)}) ${phone.slice(4)}`
              : `(${phone.slice(1, 4)}) ${phone.slice(4)}`;

          doc.text(formattedPhone, 250, contactY);

          if (data.personalInfo.linkedin) {
            const linkedin = this.sanitizeText(data.personalInfo.linkedin);
            // Clean LinkedIn URL like basic_hr - remove protocol and trailing slash
            const cleanLinkedIn = linkedin
              .replace(/^https?:\/\/(www\.)?/, '')
              .replace(/\/$/, '');

            // Calculate width and position to prevent overflow - align right
            const linkedInWidth = doc.widthOfString(cleanLinkedIn);
            const linkedInX = 545 - linkedInWidth; // Right align to prevent overflow

            doc.text(cleanLinkedIn, linkedInX, contactY);
          }

          yPosition += 30;

          // Add separator line after personal info (full width)
          doc
            .strokeColor('#000000')
            .lineWidth(1)
            .moveTo(36, yPosition)
            .lineTo(545, yPosition)
            .stroke();

          yPosition += 25;

          // Objective Section - missing from current implementation
          if (data.objective) {
            // Check if section fits on current page
            const objectiveHeight = this.calculateTextHeight(
              doc,
              this.sanitizeText(data.objective),
              {
                width: 495,
                lineGap: 2,
              }
            );
            const sectionMinHeight = 50 + objectiveHeight;

            if (yPosition + sectionMinHeight > 760) {
              doc.addPage();
              yPosition = 36;
            }

            doc
              .fontSize(14)
              .fillColor('#000000')
              .font('NotoSans-Bold')
              .text(headers.objective || 'OBJECTIVE', 36, yPosition);

            yPosition += 25;

            const objective = this.sanitizeText(data.objective);
            doc
              .fontSize(11)
              .fillColor('#000000')
              .font('NotoSans')
              .text(objective, 36, yPosition, {
                width: 495,
                align: 'justify',
                lineGap: 2,
              });

            yPosition += objectiveHeight + 20;

            // Add separator line after objective
            doc
              .strokeColor('#000000')
              .lineWidth(1)
              .moveTo(36, yPosition)
              .lineTo(170, yPosition)
              .stroke();

            yPosition += 20;
          }

          // Experience Section - ATS template design with basic_hr logic
          if (data.experience && data.experience.length > 0) {
            // Check if section header fits
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 760) {
              doc.addPage();
              yPosition = 36;
            }

            doc
              .fontSize(14)
              .fillColor('#000000')
              .font('NotoSans-Bold')
              .text(headers.experience, 50, yPosition);

            yPosition += 25;

            data.experience.forEach((exp, index) => {
              // Calculate required height for this experience item
              const description = this.sanitizeText(exp.description);
              const descriptionHeight = this.calculateTextHeight(
                doc,
                description,
                {
                  width: 495,
                  lineGap: 2,
                }
              );
              const itemHeight = 50 + descriptionHeight; // Date + title + description + spacing

              // Check if entire item fits on current page - if not, move to next page
              if (yPosition + itemHeight > 760) {
                doc.addPage();
                yPosition = 36;
                // Re-add section header on new page if needed
                if (index > 0) {
                  doc
                    .fontSize(14)
                    .fillColor('#000000')
                    .font('NotoSans-Bold')
                    .text(headers.experience, 50, yPosition);
                  yPosition += 25;
                }
              }

              // Date range - basic_hr logic for processing
              const startDate = DateFormatter.formatDate(
                this.sanitizeText(exp.startDate)
              );
              const endDate =
                exp.endDate === '' ||
                exp.endDate.toLowerCase().includes('current') ||
                exp.endDate.toLowerCase().includes('present')
                  ? 'Current'
                  : DateFormatter.formatDate(this.sanitizeText(exp.endDate));

              doc
                .fontSize(11)
                .fillColor('#000000')
                .font('NotoSans')
                .text(`${startDate} - ${endDate}`, 50, yPosition);

              yPosition += 15;

              // Job title and company - ATS template style
              const jobTitle = this.sanitizeText(exp.jobTitle);
              const company = this.sanitizeText(exp.company);

              doc
                .fontSize(11)
                .fillColor('#000000')
                .font('NotoSans-Bold')
                .text(`${jobTitle}, `, 50, yPosition, { continued: true })
                .font('NotoSans')
                .text(company, { continued: false });

              yPosition += 20; // Increased spacing between title/company and description

              // Description - ATS template style with indent
              doc
                .fontSize(11)
                .fillColor('#000000')
                .font('NotoSans')
                .text(description, 60, yPosition, {
                  // Indented by 20px from left margin
                  width: 475, // Reduced width to accommodate indent
                  align: 'left',
                  lineGap: 2,
                });

              yPosition += descriptionHeight + 20;
            });

            // Add separator line after experience
            doc
              .strokeColor('#000000')
              .lineWidth(1)
              .moveTo(36, yPosition)
              .lineTo(170, yPosition)
              .stroke();

            yPosition += 20;
          }

          // Education Section - ATS template design with basic_hr logic
          if (data.education && data.education.length > 0) {
            // Check if section header fits
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 760) {
              doc.addPage();
              yPosition = 36;
            }

            doc
              .fontSize(14)
              .fillColor('#000000')
              .font('NotoSans-Bold')
              .text(headers.education, 50, yPosition);

            yPosition += 20;

            data.education.forEach((edu, index) => {
              // Calculate required height for this education item
              const degree = this.sanitizeText(edu.degree);
              const university = this.sanitizeText(edu.university);
              const details = edu.details ? this.sanitizeText(edu.details) : '';

              let itemHeight = 40; // Basic height for date + degree line
              if (details) {
                const detailsHeight = this.calculateTextHeight(doc, details, {
                  width: 495,
                  lineGap: 2,
                });
                itemHeight += detailsHeight + 15;
              }

              // Check if entire item fits on current page
              if (yPosition + itemHeight > 760) {
                doc.addPage();
                yPosition = 36;
                // Re-add section header on new page if needed
                if (index > 0) {
                  doc
                    .fontSize(14)
                    .fillColor('#000000')
                    .font('NotoSans-Bold')
                    .text(headers.education, 50, yPosition);
                  yPosition += 25;
                }
              }

              // Date - basic_hr logic for processing graduation date
              const graduationDate = DateFormatter.formatGraduationDate(
                this.sanitizeText(edu.graduationDate)
              );
              doc
                .fontSize(11)
                .fillColor('#000000')
                .font('NotoSans')
                .text(graduationDate, 50, yPosition);

              yPosition += 15;

              // Degree and university - ATS template style
              const educationLine = `${degree}, ${university}`;

              doc
                .fontSize(11)
                .fillColor('#000000')
                .font('NotoSans-Bold')
                .text(educationLine, 50, yPosition);

              yPosition += 15;

              // Details if available - basic_hr logic
              if (details) {
                doc
                  .fontSize(11)
                  .fillColor('#000000')
                  .font('NotoSans')
                  .text(details, 50, yPosition, {
                    width: 495,
                    align: 'left',
                    lineGap: 2,
                  });

                yPosition +=
                  this.calculateTextHeight(doc, details, {
                    width: 495,
                    lineGap: 2,
                  }) + 15;
              } else {
                yPosition += 10;
              }
            });

            // Add separator line after education
            doc
              .strokeColor('#000000')
              .lineWidth(1)
              .moveTo(36, yPosition)
              .lineTo(170, yPosition)
              .stroke();

            yPosition += 20;
          }

          // Skills Section - ATS template design with basic_hr page break logic (Global version)
          if (
            data.version !== 'turkey' &&
            data.skills &&
            data.skills.length > 0
          ) {
            // Calculate required height for skills section
            const skillsPerColumn = Math.ceil(data.skills.length / 3);
            const skillsSectionHeight = 50 + skillsPerColumn * 20;

            // Check if entire skills section fits on current page
            if (yPosition + skillsSectionHeight > 760) {
              doc.addPage();
              yPosition = 36;
            }

            doc
              .fontSize(14)
              .fillColor('#000000')
              .font('NotoSans-Bold')
              .text(headers.skills, 50, yPosition);

            yPosition += 25;

            // Layout skills in 3 columns like ATS template
            const columnWidth = 165;

            for (let i = 0; i < data.skills.length; i++) {
              const skill = this.sanitizeText(data.skills[i]);
              const column = Math.floor(i / skillsPerColumn);
              const row = i % skillsPerColumn;
              const xPosition = 50 + column * columnWidth;
              const skillY = yPosition + row * 20;

              doc
                .fontSize(11)
                .fillColor('#000000')
                .font('NotoSans')
                .text(skill, xPosition, skillY);
            }

            yPosition += skillsPerColumn * 20 + 20;
          }

          // Technical Skills Section - Turkey version
          if (data.version === 'turkey' && data.technicalSkills) {
            // Add separator line
            yPosition += 10;
            doc
              .strokeColor(blackColor)
              .lineWidth(1)
              .moveTo(36, yPosition)
              .lineTo(125, yPosition)
              .stroke();

            yPosition += 20;

            this.addSectionHeader(
              doc,
              headers.technicalSkills,
              yPosition,
              blackColor
            );
            yPosition += 25;

            const skills = data.technicalSkills;

            if (skills.frontend && skills.frontend.length > 0) {
              doc
                .fontSize(11)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text('Frontend:', 50, yPosition);
              const frontendText = skills.frontend.join(', ');
              doc
                .font('NotoSans')
                .text(frontendText, 120, yPosition, { width: 425 });
              yPosition += 18;
            }

            if (skills.backend && skills.backend.length > 0) {
              doc
                .fontSize(11)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text('Backend:', 50, yPosition);
              const backendText = skills.backend.join(', ');
              doc
                .font('NotoSans')
                .text(backendText, 120, yPosition, { width: 425 });
              yPosition += 18;
            }

            if (skills.database && skills.database.length > 0) {
              doc
                .fontSize(11)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text('Database:', 50, yPosition);
              const databaseText = skills.database.join(', ');
              doc
                .font('NotoSans')
                .text(databaseText, 120, yPosition, { width: 425 });
              yPosition += 18;
            }

            if (skills.tools && skills.tools.length > 0) {
              doc
                .fontSize(11)
                .fillColor(blackColor)
                .font('NotoSans-Bold')
                .text('Tools:', 50, yPosition);
              const toolsText = skills.tools.join(', ');
              doc
                .font('NotoSans')
                .text(toolsText, 120, yPosition, { width: 425 });
              yPosition += 18;
            }

            yPosition += 20;
          }

          // Communication Section - Global version only with page break logic
          if (data.version !== 'turkey' && data.communication) {
            const communication = this.sanitizeText(data.communication);
            const communicationHeight = this.calculateTextHeight(
              doc,
              communication,
              {
                width: 495,
                lineGap: 2,
              }
            );
            const sectionHeight = 50 + communicationHeight;

            // Check if entire section fits on current page
            if (yPosition + sectionHeight > 760) {
              doc.addPage();
              yPosition = 36;
            }

            doc
              .fontSize(14)
              .fillColor('#000000')
              .font('NotoSans-Bold')
              .text(headers.communication, 50, yPosition);

            yPosition += 25;

            doc
              .fontSize(11)
              .fillColor('#000000')
              .font('NotoSans')
              .text(communication, 50, yPosition, {
                width: 495,
                align: 'left',
                lineGap: 2,
              });

            yPosition += communicationHeight + 20;

            // Add separator line after communication
            doc
              .strokeColor('#000000')
              .lineWidth(1)
              .moveTo(36, yPosition)
              .lineTo(170, yPosition)
              .stroke();

            yPosition += 20;
          }

          // Projects Section - Turkey version
          if (
            data.version === 'turkey' &&
            data.projects &&
            data.projects.length > 0
          ) {
            // Add separator line
            yPosition += 10;
            doc
              .strokeColor(blackColor)
              .lineWidth(1)
              .moveTo(36, yPosition)
              .lineTo(125, yPosition)
              .stroke();

            yPosition += 20;

            this.addSectionHeader(doc, headers.projects, yPosition, blackColor);
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

              yPosition +=
                this.calculateTextHeight(doc, description, {
                  width: 495,
                  lineGap: 2,
                }) + 15;

              // Check for page break
              if (yPosition > 760) {
                doc.addPage();
                yPosition = 36;
              }
            });

            yPosition += 5;
          }

          // Leadership Section - Global version only with page break logic
          if (data.version !== 'turkey' && data.leadership) {
            const leadership = this.sanitizeText(data.leadership);
            const leadershipHeight = this.calculateTextHeight(doc, leadership, {
              width: 495,
              lineGap: 2,
            });
            const sectionHeight = 50 + leadershipHeight;

            // Check if entire section fits on current page
            if (yPosition + sectionHeight > 760) {
              doc.addPage();
              yPosition = 36;
            }

            doc
              .fontSize(14)
              .fillColor('#000000')
              .font('NotoSans-Bold')
              .text(headers.leadership, 50, yPosition);

            yPosition += 25;

            doc
              .fontSize(11)
              .fillColor('#000000')
              .font('NotoSans')
              .text(leadership, 50, yPosition, {
                width: 495,
                align: 'left',
                lineGap: 2,
              });

            yPosition += leadershipHeight + 20;

            // Add separator line after leadership
            doc
              .strokeColor('#000000')
              .lineWidth(1)
              .moveTo(36, yPosition)
              .lineTo(170, yPosition)
              .stroke();

            yPosition += 20;
          }

          // Certificates Section - Turkey version
          if (
            data.version === 'turkey' &&
            data.certificates &&
            data.certificates.length > 0
          ) {
            // Add separator line
            yPosition += 10;
            doc
              .strokeColor(blackColor)
              .lineWidth(1)
              .moveTo(36, yPosition)
              .lineTo(125, yPosition)
              .stroke();

            yPosition += 20;

            this.addSectionHeader(
              doc,
              headers.certificates,
              yPosition,
              blackColor
            );
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
              doc.font('NotoSans').text(issuer, 50, yPosition + 15);

              // Date - right aligned
              const certDate = DateFormatter.formatDate(
                this.sanitizeText(cert.date)
              );
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
          if (
            data.version === 'turkey' &&
            data.languages &&
            data.languages.length > 0
          ) {
            // Add separator line
            yPosition += 10;
            doc
              .strokeColor(blackColor)
              .lineWidth(1)
              .moveTo(36, yPosition)
              .lineTo(125, yPosition)
              .stroke();

            yPosition += 20;

            this.addSectionHeader(
              doc,
              headers.languages,
              yPosition,
              blackColor
            );
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

          // References Section with page break logic
          if (data.references && data.references.length > 0) {
            // Calculate required height for references section
            const referencesHeight = 50 + data.references.length * 40;

            // Check if entire references section fits on current page
            if (yPosition + referencesHeight > 760) {
              doc.addPage();
              yPosition = 36;
            }

            doc
              .fontSize(14)
              .fillColor('#000000')
              .font('NotoSans-Bold')
              .text(headers.references, 50, yPosition);

            yPosition += 25;

            data.references.forEach((ref, index) => {
              // Check if individual reference fits, if not move to next page
              if (yPosition + 40 > 760) {
                doc.addPage();
                yPosition = 36;
                // Re-add section header if needed
                if (index > 0) {
                  doc
                    .fontSize(14)
                    .fillColor('#000000')
                    .font('NotoSans-Bold')
                    .text(headers.references, 50, yPosition);
                  yPosition += 25;
                }
              }

              // Reference name - bold
              const name = this.sanitizeText(ref.name);
              doc
                .fontSize(11)
                .fillColor('#000000')
                .font('NotoSans-Bold')
                .text(name, 50, yPosition);

              // Company and contact - regular font
              const companyContact = `${this.sanitizeText(ref.company)} | ${this.sanitizeText(ref.contact)}`;
              doc.font('NotoSans').text(companyContact, 50, yPosition + 15);

              yPosition += 40;
            });
          }

          doc.end();
        } catch (error) {
          logger.error(
            'PDF generation error in office_manager template:',
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
    blackColor: string
  ): void {
    // Section title - office manager style
    doc
      .fontSize(14)
      .fillColor(blackColor)
      .font('NotoSans-Bold')
      .text(title, 50, yPosition);
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
