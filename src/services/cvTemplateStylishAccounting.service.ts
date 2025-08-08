import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import logger from '../config/logger';
import { FontLoader } from '../utils/fontLoader';
import { DateFormatter } from '../utils/dateFormatter';

export interface CVStylishAccountingData {
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

export class CVTemplateStylishAccountingService {
  private static instance: CVTemplateStylishAccountingService;

  private constructor() {}

  public static getInstance(): CVTemplateStylishAccountingService {
    if (!CVTemplateStylishAccountingService.instance) {
      CVTemplateStylishAccountingService.instance =
        new CVTemplateStylishAccountingService();
    }
    return CVTemplateStylishAccountingService.instance;
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
        references: 'REFERENCES',
      };
    }
  }

  async generatePDF(data: CVStylishAccountingData): Promise<Buffer> {
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

          // Define colors and get section headers - Preserving Stylish Accounting green
          const greenColor = '#275e46'; // RGB(39,94,70) converted to hex - text color
          const lineColor = '#55b88d'; // RGB(85,184,141) converted to hex - line color
          const backgroundColor = '#dcf0e8'; // RGB(220,240,232) converted to hex
          const greyColor = '#666666';
          const headers = this.getSectionHeaders(data.language!);

          // Calculate text row width (4/5 of line width)
          const lineWidth = 495; // From 50 to 545 (495px)
          const textRowWidth = (lineWidth * 4) / 5; // 396px

          // Set page background color
          doc
            .rect(0, 0, 595.28, 841.89) // A4 page dimensions in points
            .fillColor(backgroundColor)
            .fill();

          let yPosition = 50;

          // Header with name - Stylish Accounting style with larger font (increased by 2pt)
          doc
            .fontSize(30)
            .fillColor(greenColor)
            .font('NotoSans-Bold')
            .text(
              this.sanitizeText(data.personalInfo.fullName).toUpperCase(),
              50,
              yPosition
            );

          yPosition += 45;

          // Contact information - pipe-separated and bold
          const contactInfoParts = [];

          if (data.personalInfo.address && data.personalInfo.city) {
            contactInfoParts.push(
              `${this.sanitizeText(data.personalInfo.address)}, ${this.sanitizeText(data.personalInfo.city)}`
            );
          }
          if (data.personalInfo.phone) {
            contactInfoParts.push(this.sanitizeText(data.personalInfo.phone));
          }
          if (data.personalInfo.email) {
            contactInfoParts.push(this.sanitizeText(data.personalInfo.email));
          }
          // Add any other personal info fields that exist
          if ((data.personalInfo as any).linkedin) {
            contactInfoParts.push(
              this.sanitizeText((data.personalInfo as any).linkedin)
            );
          }
          if ((data.personalInfo as any).website) {
            contactInfoParts.push(
              this.sanitizeText((data.personalInfo as any).website)
            );
          }
          if ((data.personalInfo as any).github) {
            contactInfoParts.push(
              this.sanitizeText((data.personalInfo as any).github)
            );
          }

          const contactInfo = contactInfoParts.filter(Boolean).join(' | ');

          doc
            .fontSize(11)
            .fillColor(greenColor)
            .font('NotoSans-Bold')
            .text(contactInfo, 50, yPosition, {
              width: textRowWidth,
              align: 'center',
            });

          yPosition += 35;

          // Green separator line - Stylish Accounting signature design
          doc
            .strokeColor(lineColor)
            .lineWidth(2)
            .moveTo(50, yPosition)
            .lineTo(545, yPosition)
            .stroke();

          // Add objective text under personal info (no header, 10-15px below)
          if (data.objective) {
            yPosition += 15; // 15px spacing

            const objective = this.sanitizeText(data.objective);
            doc
              .fontSize(11)
              .fillColor(greenColor)
              .font('NotoSans')
              .text(objective, 50, yPosition, {
                width: textRowWidth,
                align: 'justify',
                lineGap: 2,
              });

            yPosition +=
              this.calculateTextHeight(doc, objective, {
                width: textRowWidth,
                lineGap: 2,
              }) + 20;
          }

          // Green separator line - Stylish Accounting signature design
          doc
            .strokeColor(lineColor)
            .lineWidth(2)
            .moveTo(50, yPosition)
            .lineTo(545, yPosition)
            .stroke();

          yPosition += 25;

          // Experience Section
          if (data.experience && data.experience.length > 0) {
            this.addSectionHeader(
              doc,
              headers.experience,
              yPosition,
              greenColor
            );
            yPosition += 25;

            data.experience.forEach((exp) => {
              // Job Title - bold
              const jobTitle = this.sanitizeText(exp.jobTitle);
              doc
                .fontSize(12)
                .fillColor(greenColor)
                .font('NotoSans-Bold')
                .text(jobTitle, 50, yPosition);

              // Company and location - regular font
              const companyLocation = `${this.sanitizeText(exp.company)} | ${this.sanitizeText(exp.location)}`;
              doc.font('NotoSans').text(companyLocation, 50, yPosition + 15);

              // Date range - right aligned with formatted dates
              const startDate = DateFormatter.formatDate(
                this.sanitizeText(exp.startDate)
              );
              const endDate = DateFormatter.formatDate(
                this.sanitizeText(exp.endDate)
              );
              const dateRange = `${startDate} – ${endDate}`;
              const dateWidth = doc.widthOfString(dateRange);
              const dateStartX = 545 - dateWidth;

              doc
                .fontSize(11)
                .fillColor(greyColor)
                .text(dateRange, dateStartX, yPosition + 15);

              yPosition += 35;

              // Job Description
              const description = this.sanitizeText(exp.description);
              doc
                .fontSize(11)
                .fillColor(greenColor)
                .font('NotoSans')
                .text(description, 50, yPosition, {
                  width: textRowWidth,
                  align: 'justify',
                  lineGap: 2,
                });

              yPosition +=
                this.calculateTextHeight(doc, description, {
                  width: textRowWidth,
                  lineGap: 2,
                }) + 15;

              // Check for page break
              if (yPosition > 720) {
                doc.addPage();
                // Set background color for new page
                doc
                  .rect(0, 0, 595.28, 841.89)
                  .fillColor(backgroundColor)
                  .fill();
                yPosition = 50;
              }
            });

            // Green separator line after experience
            doc
              .strokeColor(lineColor)
              .lineWidth(2)
              .moveTo(50, yPosition)
              .lineTo(545, yPosition)
              .stroke();

            yPosition += 25;
          }

          // Education Section
          if (data.education && data.education.length > 0) {
            this.addSectionHeader(
              doc,
              headers.education,
              yPosition,
              greenColor
            );
            yPosition += 25;

            data.education.forEach((edu) => {
              // Degree - bold
              const degree = this.sanitizeText(edu.degree);
              doc
                .fontSize(12)
                .fillColor(greenColor)
                .font('NotoSans-Bold')
                .text(degree, 50, yPosition);

              // University and location - regular font
              const universityLocation = `${this.sanitizeText(edu.university)} | ${this.sanitizeText(edu.location)}`;
              doc.font('NotoSans').text(universityLocation, 50, yPosition + 15);

              // Graduation date - right aligned with formatted date
              const graduationDate = DateFormatter.formatGraduationDate(
                this.sanitizeText(edu.graduationDate)
              );
              const gradDateWidth = doc.widthOfString(graduationDate);
              const gradDateStartX = 545 - gradDateWidth;

              doc
                .fontSize(11)
                .fillColor(greyColor)
                .text(graduationDate, gradDateStartX, yPosition + 15);

              yPosition += 35;

              if (edu.details) {
                const details = this.sanitizeText(edu.details);
                doc
                  .fontSize(11)
                  .fillColor(greenColor)
                  .font('NotoSans')
                  .text(details, 50, yPosition, {
                    width: textRowWidth,
                    align: 'justify',
                    lineGap: 2,
                  });

                yPosition +=
                  this.calculateTextHeight(doc, details, {
                    width: textRowWidth,
                    lineGap: 2,
                  }) + 15;
              }

              // Check for page break
              if (yPosition > 720) {
                doc.addPage();
                // Set background color for new page
                doc
                  .rect(0, 0, 595.28, 841.89)
                  .fillColor(backgroundColor)
                  .fill();
                yPosition = 50;
              }
            });

            // Green separator line after education
            doc
              .strokeColor(lineColor)
              .lineWidth(2)
              .moveTo(50, yPosition)
              .lineTo(545, yPosition)
              .stroke();

            yPosition += 25;
          }

          // Technical Skills Section - Turkey version
          if (data.version === 'turkey' && data.technicalSkills) {
            // Check if section fits on current page
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              // Set background color for new page
              doc.rect(0, 0, 595.28, 841.89).fillColor(backgroundColor).fill();
              yPosition = 50;
            }

            this.addSectionHeader(
              doc,
              headers.technicalSkills,
              yPosition,
              greenColor
            );
            yPosition += 25;

            const skills = data.technicalSkills;
            const skillsArray = [];
            const columnWidth = textRowWidth / 2; // Half of text row width for each column
            const dotSize = 3;
            const dotSpacing = 16; // Changed from 4px to 16px

            if (skills.frontend && skills.frontend.length > 0) {
              skills.frontend.forEach((skill) => skillsArray.push(skill));
            }
            if (skills.backend && skills.backend.length > 0) {
              skills.backend.forEach((skill) => skillsArray.push(skill));
            }
            if (skills.database && skills.database.length > 0) {
              skills.database.forEach((skill) => skillsArray.push(skill));
            }
            if (skills.tools && skills.tools.length > 0) {
              skills.tools.forEach((skill) => skillsArray.push(skill));
            }

            // Display skills in 2 columns
            skillsArray.forEach((skill, index) => {
              const isFirstColumn = index % 2 === 0;
              const xPosition = isFirstColumn ? 50 : 50 + textRowWidth / 2; // Second column starts at middle of text area
              const currentY = yPosition + Math.floor(index / 2) * 18;

              // Draw dot
              doc
                .fillColor(lineColor)
                .circle(xPosition + dotSize, currentY + 6, dotSize)
                .fill();

              // Draw skill text
              doc
                .fontSize(11)
                .fillColor(greenColor)
                .font('NotoSans')
                .text(skill, xPosition + dotSize + dotSpacing + 3, currentY, {
                  width: columnWidth,
                });
            });

            yPosition += Math.ceil(skillsArray.length / 2) * 18;

            yPosition += 15;

            // Green separator line after technical skills
            doc
              .strokeColor(lineColor)
              .lineWidth(2)
              .moveTo(50, yPosition)
              .lineTo(545, yPosition)
              .stroke();

            yPosition += 25;
          }

          // Skills Section - Global version (using simple skills array)
          if (
            data.version !== 'turkey' &&
            (data as any).skills &&
            Array.isArray((data as any).skills)
          ) {
            // Check if section fits on current page
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              // Set background color for new page
              doc.rect(0, 0, 595.28, 841.89).fillColor(backgroundColor).fill();
              yPosition = 50;
            }

            this.addSectionHeader(doc, 'SKILLS', yPosition, greenColor);
            yPosition += 25;

            const skillsArray = (data as any).skills;
            const columnWidth = textRowWidth / 2; // Half of text row width for each column
            const dotSize = 3;
            const dotSpacing = 16; // Changed from 4px to 16px

            // Display skills in 2 columns
            skillsArray.forEach((skill: string, index: number) => {
              const isFirstColumn = index % 2 === 0;
              const xPosition = isFirstColumn ? 50 : 50 + textRowWidth / 2; // Second column starts at middle of text area
              const currentY = yPosition + Math.floor(index / 2) * 18;

              // Draw dot
              doc
                .fillColor(lineColor)
                .circle(xPosition + dotSize, currentY + 6, dotSize)
                .fill();

              // Draw skill text
              doc
                .fontSize(11)
                .fillColor(greenColor)
                .font('NotoSans')
                .text(skill, xPosition + dotSize + dotSpacing + 3, currentY, {
                  width: columnWidth,
                });
            });

            yPosition += Math.ceil(skillsArray.length / 2) * 18;

            yPosition += 15;

            // Green separator line after skills
            doc
              .strokeColor(lineColor)
              .lineWidth(2)
              .moveTo(50, yPosition)
              .lineTo(545, yPosition)
              .stroke();

            yPosition += 25;
          }

          // Communication Section - Global version only
          if (data.version !== 'turkey' && data.communication) {
            // Check if section fits on current page
            const sectionMinHeight = 60;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              // Set background color for new page
              doc.rect(0, 0, 595.28, 841.89).fillColor(backgroundColor).fill();
              yPosition = 50;
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
              .fontSize(11)
              .fillColor(greenColor)
              .font('NotoSans')
              .text(communication, 50, yPosition, {
                width: textRowWidth,
                align: 'justify',
                lineGap: 2,
              });

            yPosition +=
              this.calculateTextHeight(doc, communication, {
                width: textRowWidth,
                lineGap: 2,
              }) + 20;

            // Green separator line after communication
            doc
              .strokeColor(lineColor)
              .lineWidth(2)
              .moveTo(50, yPosition)
              .lineTo(545, yPosition)
              .stroke();

            yPosition += 25;
          }

          // Projects Section - Turkey version
          if (
            data.version === 'turkey' &&
            data.projects &&
            data.projects.length > 0
          ) {
            // Check if section fits on current page
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              // Set background color for new page
              doc.rect(0, 0, 595.28, 841.89).fillColor(backgroundColor).fill();
              yPosition = 50;
            }

            this.addSectionHeader(doc, headers.projects, yPosition, greenColor);
            yPosition += 25;

            data.projects.forEach((project) => {
              // Project name - bold
              const projectName = this.sanitizeText(project.name);
              doc
                .fontSize(11)
                .fillColor(greenColor)
                .font('NotoSans-Bold')
                .text(projectName, 50, yPosition);

              // Technologies - right aligned
              const technologies = this.sanitizeText(project.technologies);
              const techWidth = doc.widthOfString(technologies);
              const techStartX = 545 - techWidth;

              doc
                .fontSize(11)
                .fillColor(greenColor)
                .font('NotoSans')
                .text(technologies, techStartX, yPosition);

              yPosition += 20;

              // Project description
              const description = this.sanitizeText(project.description);
              doc
                .fontSize(11)
                .fillColor(greenColor)
                .font('NotoSans')
                .text(description, 50, yPosition, {
                  width: textRowWidth,
                  align: 'justify',
                  lineGap: 2,
                });

              yPosition +=
                this.calculateTextHeight(doc, description, {
                  width: textRowWidth,
                  lineGap: 2,
                }) + 15;

              // Check for page break
              if (yPosition > 720) {
                doc.addPage();
                // Set background color for new page
                doc
                  .rect(0, 0, 595.28, 841.89)
                  .fillColor(backgroundColor)
                  .fill();
                yPosition = 50;
              }
            });

            // Green separator line after projects
            doc
              .strokeColor(lineColor)
              .lineWidth(2)
              .moveTo(50, yPosition)
              .lineTo(545, yPosition)
              .stroke();

            yPosition += 25;
          }

          // Leadership Section - Global version only
          if (data.version !== 'turkey' && data.leadership) {
            // Check if section fits on current page
            const sectionMinHeight = 60;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              // Set background color for new page
              doc.rect(0, 0, 595.28, 841.89).fillColor(backgroundColor).fill();
              yPosition = 50;
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
              .fontSize(11)
              .fillColor(greenColor)
              .font('NotoSans')
              .text(leadership, 50, yPosition, {
                width: textRowWidth,
                align: 'justify',
                lineGap: 2,
              });

            yPosition +=
              this.calculateTextHeight(doc, leadership, {
                width: textRowWidth,
                lineGap: 2,
              }) + 20;

            // Green separator line after leadership
            doc
              .strokeColor(lineColor)
              .lineWidth(2)
              .moveTo(50, yPosition)
              .lineTo(545, yPosition)
              .stroke();

            yPosition += 25;
          }

          // Certificates Section - Turkey version
          if (
            data.version === 'turkey' &&
            data.certificates &&
            data.certificates.length > 0
          ) {
            // Check if section fits on current page
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              // Set background color for new page
              doc.rect(0, 0, 595.28, 841.89).fillColor(backgroundColor).fill();
              yPosition = 50;
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
                .fontSize(11)
                .fillColor(greenColor)
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
                .fillColor(greenColor)
                .text(certDate, dateStartX, yPosition + 15);

              yPosition += 35;
            });

            // Green separator line after certificates
            doc
              .strokeColor(lineColor)
              .lineWidth(2)
              .moveTo(50, yPosition)
              .lineTo(545, yPosition)
              .stroke();

            yPosition += 25;
          }

          // Languages Section - Turkey version
          if (
            data.version === 'turkey' &&
            data.languages &&
            data.languages.length > 0
          ) {
            // Check if section fits on current page
            const sectionMinHeight = 60;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              // Set background color for new page
              doc.rect(0, 0, 595.28, 841.89).fillColor(backgroundColor).fill();
              yPosition = 50;
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
                .fontSize(11)
                .fillColor(greenColor)
                .font('NotoSans-Bold')
                .text(language, 50, yPosition);

              // Level - right aligned
              const level = this.sanitizeText(lang.level);
              const levelWidth = doc.widthOfString(level);
              const levelStartX = 545 - levelWidth;

              doc
                .fontSize(11)
                .fillColor(greenColor)
                .font('NotoSans')
                .text(level, levelStartX, yPosition);

              yPosition += 22;
            });

            // Green separator line after languages
            doc
              .strokeColor(lineColor)
              .lineWidth(2)
              .moveTo(50, yPosition)
              .lineTo(545, yPosition)
              .stroke();

            yPosition += 25;
          }

          // References Section
          if (data.references && data.references.length > 0) {
            // Check if section fits on current page
            const sectionMinHeight = 80;
            if (yPosition + sectionMinHeight > 720) {
              doc.addPage();
              // Set background color for new page
              doc.rect(0, 0, 595.28, 841.89).fillColor(backgroundColor).fill();
              yPosition = 50;
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
                .fontSize(11)
                .fillColor(greenColor)
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
            'PDF generation error in stylish accounting template:',
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
    // Section title - Stylish Accounting style with larger font
    doc
      .fontSize(16)
      .fillColor(greenColor)
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
      return 20; // Return a default height
    }
  }
}
