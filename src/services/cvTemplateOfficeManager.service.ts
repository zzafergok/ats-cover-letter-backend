/* eslint-disable prefer-const */
import PDFDocument from 'pdfkit';
import * as PDFKit from 'pdfkit';
import { PassThrough } from 'stream';

export interface CVOfficeManagerData {
  personalInfo: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    email: string;
    phone: string;
    linkedin?: string;
  };
  experience: Array<{
    startDate: string;
    endDate: string;
    jobTitle: string;
    company: string;
    description: string;
  }>;
  education: Array<{
    startDate: string;
    endDate: string;
    degree: string;
    major: string;
    university: string;
  }>;
  skills: string[];
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

  async generatePDF(data: CVOfficeManagerData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const chunks: Buffer[] = [];
        const stream = new PassThrough();

        doc.pipe(stream);

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);

        let yPosition = 50;

        // Header with name
        doc
          .fontSize(28)
          .fillColor('#000000')
          .text(data.personalInfo.firstName, 50, yPosition, { continued: true })
          .text(`\n${data.personalInfo.lastName}`, { continued: false });

        yPosition += 80;

        // Job Title
        doc
          .fontSize(14)
          .fillColor('#000000')
          .text(data.personalInfo.jobTitle.toUpperCase(), 50, yPosition);

        yPosition += 30;

        // Add separator line
        doc
          .strokeColor('#000000')
          .lineWidth(1)
          .moveTo(50, yPosition)
          .lineTo(545, yPosition)
          .stroke();

        yPosition += 20;

        // Contact information
        let contactY = yPosition;
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(data.personalInfo.email, 50, contactY);

        doc.text(
          `(${data.personalInfo.phone.slice(1, 4)}) ${data.personalInfo.phone.slice(5)}`,
          250,
          contactY
        );

        if (data.personalInfo.linkedin) {
          doc.text('LinkedIn profile', 450, contactY);
        }

        yPosition += 40;

        // Experience Section
        doc
          .fontSize(14)
          .fillColor('#000000')
          .text('EXPERIENCE', 50, yPosition, {
            underline: true,
            width: 515,
          });

        yPosition += 25;

        data.experience.forEach((exp, index) => {
          // Date range
          doc
            .fontSize(11)
            .fillColor('#000000')
            .text(`${exp.startDate} - ${exp.endDate}`, 50, yPosition);

          yPosition += 15;

          // Job title and company
          doc
            .fontSize(12)
            .fillColor('#000000')
            .text(`${exp.jobTitle}, `, 50, yPosition, { continued: true })
            .fontSize(12)
            .fillColor('#000000')
            .text(exp.company, { continued: false });

          yPosition += 20;

          // Description
          doc
            .fontSize(11)
            .fillColor('#000000')
            .text(exp.description, 50, yPosition, {
              width: 515,
              align: 'justify',
            });

          yPosition +=
            this.calculateTextHeight(doc, exp.description, { width: 515 }) + 20;

          // Check for page break
          if (yPosition > 700 && index < data.experience.length - 1) {
            doc.addPage();
            yPosition = 50;
          }
        });

        // Add separator line before education
        yPosition += 10;
        doc
          .strokeColor('#000000')
          .lineWidth(1)
          .moveTo(50, yPosition)
          .lineTo(545, yPosition)
          .stroke();

        yPosition += 20;

        // Education Section
        doc.fontSize(14).fillColor('#000000').text('EDUCATION', 50, yPosition, {
          underline: true,
          width: 515,
        });

        yPosition += 25;

        data.education.forEach((edu) => {
          // Date range
          doc
            .fontSize(11)
            .fillColor('#000000')
            .text(`${edu.startDate} - ${edu.endDate}`, 50, yPosition);

          yPosition += 15;

          // Degree and major
          doc
            .fontSize(12)
            .fillColor('#000000')
            .text(
              `${edu.degree}, ${edu.major}, ${edu.university}`,
              50,
              yPosition,
              {
                width: 515,
              }
            );

          yPosition += 25;
        });

        // Add separator line before skills
        yPosition += 10;
        doc
          .strokeColor('#000000')
          .lineWidth(1)
          .moveTo(50, yPosition)
          .lineTo(545, yPosition)
          .stroke();

        yPosition += 20;

        // Skills Section
        doc.fontSize(14).fillColor('#000000').text('SKILLS', 50, yPosition, {
          underline: true,
          width: 515,
        });

        yPosition += 25;

        // Skills in 3 columns
        const skillsPerColumn = Math.ceil(data.skills.length / 3);
        const columns = [50, 220, 390];

        for (let i = 0; i < data.skills.length; i++) {
          const columnIndex = Math.floor(i / skillsPerColumn);
          const rowIndex = i % skillsPerColumn;

          if (columnIndex < 3) {
            doc
              .fontSize(11)
              .fillColor('#000000')
              .text(
                data.skills[i],
                columns[columnIndex],
                yPosition + rowIndex * 20
              );
          }
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
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
