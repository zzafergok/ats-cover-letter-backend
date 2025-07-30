import PDFDocument from 'pdfkit';
import * as PDFKit from 'pdfkit';
import { PassThrough } from 'stream';
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
    linkedin?: string;
  };
  professionalSummary: string;
  education: Array<{
    degree: string;
    minor?: string;
    university: string;
    graduationDate: string;
    gpa?: string;
    achievements?: string[];
    relevantCoursework?: string;
  }>;
  experience: Array<{
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
  }>;
  skills: {
    technical: string[];
    soft?: string[];
    languages?: string[];
  };
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

  async generatePDF(data: CVStylishAccountingData): Promise<Buffer> {
    try {
      const doc = await FontLoader.createPDFDocument({
        size: 'A4',
        margin: 50,
      });
      
      return new Promise((resolve, reject) => {
        try {

        const chunks: Buffer[] = [];
        const stream = new PassThrough();

        doc.pipe(stream);

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);

        let yPosition = 50;

        // Header with name and green accent
        doc
          .fontSize(28)
          .fillColor('#2d5a2d')
          .text(data.personalInfo.fullName.toUpperCase(), 50, yPosition);

        yPosition += 45;

        // Contact information
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(
            `${data.personalInfo.address}, ${data.personalInfo.city}, ${data.personalInfo.state} ${data.personalInfo.zipCode} | ${data.personalInfo.phone} | ${data.personalInfo.email}${data.personalInfo.linkedin ? ' | ' + data.personalInfo.linkedin : ''}`,
            50,
            yPosition,
            {
              width: 515,
              align: 'center',
            }
          );

        yPosition += 35;

        // Professional Summary
        if (data.professionalSummary) {
          doc
            .fontSize(11)
            .fillColor('#000000')
            .text(data.professionalSummary, 50, yPosition, {
              width: 515,
              align: 'justify',
            });

          yPosition +=
            this.calculateTextHeight(doc, data.professionalSummary, {
              width: 515,
            }) + 30;
        }

        // Green separator line
        doc
          .strokeColor('#2d5a2d')
          .lineWidth(2)
          .moveTo(50, yPosition)
          .lineTo(545, yPosition)
          .stroke();

        yPosition += 25;

        // Education Section
        doc.fontSize(16).fillColor('#2d5a2d').text('EDUCATION', 50, yPosition);

        yPosition += 25;

        data.education.forEach((edu) => {
          // Degree and university
          let degreeText = edu.degree;
          if (edu.minor) {
            degreeText += `, ${edu.minor}`;
          }
          degreeText += ` | ${edu.university}`;

          doc.fontSize(12).fillColor('#000000').text(degreeText, 50, yPosition);

          // Graduation date
          doc
            .fontSize(11)
            .fillColor('#666666')
            .text(`Degree obtained ${DateFormatter.formatGraduationDate(edu.graduationDate)}`, 50, yPosition + 15);

          yPosition += 35;

          // GPA and achievements
          if (edu.gpa || edu.achievements) {
            if (edu.gpa) {
              doc
                .fontSize(11)
                .fillColor('#000000')
                .text(`• GPA: ${edu.gpa}`, 70, yPosition);
              yPosition += 15;
            }

            if (edu.achievements) {
              edu.achievements.forEach((achievement) => {
                doc
                  .fontSize(11)
                  .fillColor('#000000')
                  .text(`• ${achievement}`, 70, yPosition, { width: 465 });
                yPosition +=
                  this.calculateTextHeight(doc, achievement, { width: 465 }) +
                  3;
              });
            }

            yPosition += 10;
          }

          if (edu.relevantCoursework) {
            doc
              .fontSize(11)
              .fillColor('#000000')
              .text(`• ${edu.relevantCoursework}`, 70, yPosition, {
                width: 465,
              });
            yPosition +=
              this.calculateTextHeight(doc, edu.relevantCoursework, {
                width: 465,
              }) + 15;
          }
        });

        // Green separator line
        yPosition += 10;
        doc
          .strokeColor('#2d5a2d')
          .lineWidth(2)
          .moveTo(50, yPosition)
          .lineTo(545, yPosition)
          .stroke();

        yPosition += 25;

        // Experience Section
        doc.fontSize(16).fillColor('#2d5a2d').text('EXPERIENCE', 50, yPosition);

        yPosition += 25;

        data.experience.forEach((exp, index) => {
          // Job title and company
          doc
            .fontSize(12)
            .fillColor('#000000')
            .text(
              `${exp.jobTitle} | ${exp.company} | ${exp.location}`,
              50,
              yPosition
            );

          // Date range
          doc
            .fontSize(11)
            .fillColor('#666666')
            .text(DateFormatter.formatDateRange(exp.startDate, exp.endDate), 50, yPosition + 15);

          yPosition += 35;

          // Responsibilities
          exp.responsibilities.forEach((responsibility) => {
            doc
              .fontSize(11)
              .fillColor('#000000')
              .text(`• ${responsibility}`, 70, yPosition, { width: 465 });
            yPosition +=
              this.calculateTextHeight(doc, responsibility, { width: 465 }) + 5;
          });

          yPosition += 15;

          // Check for page break
          if (yPosition > 700 && index < data.experience.length - 1) {
            doc.addPage();
            yPosition = 50;
          }
        });

        // Green separator line
        if (yPosition > 650) {
          doc.addPage();
          yPosition = 50;
        }

        yPosition += 10;
        doc
          .strokeColor('#2d5a2d')
          .lineWidth(2)
          .moveTo(50, yPosition)
          .lineTo(545, yPosition)
          .stroke();

        yPosition += 25;

        // Skills Section
        doc.fontSize(16).fillColor('#2d5a2d').text('SKILLS', 50, yPosition);

        yPosition += 25;

        // Technical Skills
        if (data.skills.technical.length > 0) {
          const skillsPerColumn = Math.ceil(data.skills.technical.length / 2);
          const columns = [70, 320];

          for (let i = 0; i < data.skills.technical.length; i++) {
            const columnIndex = Math.floor(i / skillsPerColumn);
            const rowIndex = i % skillsPerColumn;

            if (columnIndex < 2) {
              doc
                .fontSize(11)
                .fillColor('#000000')
                .text(
                  `• ${data.skills.technical[i]}`,
                  columns[columnIndex],
                  yPosition + rowIndex * 18
                );
            }
          }

          yPosition += skillsPerColumn * 18 + 20;
        }

        // Soft Skills
        if (data.skills.soft && data.skills.soft.length > 0) {
          const skillsPerColumn = Math.ceil(data.skills.soft.length / 2);
          const columns = [70, 320];

          for (let i = 0; i < data.skills.soft.length; i++) {
            const columnIndex = Math.floor(i / skillsPerColumn);
            const rowIndex = i % skillsPerColumn;

            if (columnIndex < 2) {
              doc
                .fontSize(11)
                .fillColor('#000000')
                .text(
                  `• ${data.skills.soft[i]}`,
                  columns[columnIndex],
                  yPosition + rowIndex * 18
                );
            }
          }

          yPosition += skillsPerColumn * 18 + 20;
        }

        // Languages
        if (data.skills.languages && data.skills.languages.length > 0) {
          data.skills.languages.forEach((language) => {
            doc
              .fontSize(11)
              .fillColor('#000000')
              .text(`• ${language}`, 70, yPosition);
            yPosition += 18;
          });
        }

        doc.end();
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateTextHeight(
    doc: PDFKit.PDFDocument,
    text: string,
    options: any
  ): number {
    const height = doc.heightOfString(text, options);
    return height;
  }
}
