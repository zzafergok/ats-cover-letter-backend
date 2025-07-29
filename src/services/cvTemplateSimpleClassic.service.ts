import PDFDocument from 'pdfkit';
import * as PDFKit from 'pdfkit';
import { PassThrough } from 'stream';

export interface CVSimpleClassicData {
  personalInfo: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    website?: string;
  };
  experience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
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

  async generatePDF(data: CVSimpleClassicData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 0,
        });

        const chunks: Buffer[] = [];
        const stream = new PassThrough();

        doc.pipe(stream);

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);

        // Green border frame
        doc.strokeColor('#4a7c59').lineWidth(8).rect(15, 15, 565, 812).stroke();

        let yPosition = 60;

        // Header with name
        doc
          .fontSize(32)
          .fillColor('#4a7c59')
          .text(data.personalInfo.firstName, 50, yPosition, { continued: true })
          .text(`\n${data.personalInfo.lastName}`, { continued: false });

        yPosition += 85;

        // Job Title
        doc
          .fontSize(14)
          .fillColor('#666666')
          .text(data.personalInfo.jobTitle, 50, yPosition);

        yPosition += 25;

        // Contact Information Box
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(
            `(${data.personalInfo.phone.slice(1, 4)}) ${data.personalInfo.phone.slice(5)}`,
            50,
            yPosition
          );

        doc.text(data.personalInfo.email, 50, yPosition + 15);

        doc.text(
          `${data.personalInfo.address} ${data.personalInfo.city}, ${data.personalInfo.state} ${data.personalInfo.zipCode}`,
          50,
          yPosition + 30
        );

        if (data.personalInfo.website) {
          doc.text(data.personalInfo.website, 50, yPosition + 45);
          yPosition += 60;
        } else {
          yPosition += 45;
        }

        yPosition += 30;

        // Experience Section
        doc.fontSize(16).fillColor('#4a7c59').text('Experience', 50, yPosition);

        yPosition += 25;

        data.experience.forEach((exp, index) => {
          // Job title and company
          doc
            .fontSize(12)
            .fillColor('#000000')
            .text(`${exp.jobTitle}, `, 50, yPosition, { continued: true })
            .text(exp.company, { continued: false });

          yPosition += 15;

          // Date range
          doc
            .fontSize(11)
            .fillColor('#666666')
            .text(`${exp.startDate} - ${exp.endDate}`, 50, yPosition);

          yPosition += 20;

          // Description
          doc
            .fontSize(11)
            .fillColor('#000000')
            .text(exp.description, 50, yPosition, {
              width: 480,
              align: 'justify',
            });

          yPosition +=
            this.calculateTextHeight(doc, exp.description, { width: 480 }) + 20;

          // Check for page break
          if (yPosition > 720 && index < data.experience.length - 1) {
            doc.addPage();
            // Green border for new page
            doc
              .strokeColor('#4a7c59')
              .lineWidth(8)
              .rect(15, 15, 565, 812)
              .stroke();
            yPosition = 60;
          }
        });

        // Education Section
        yPosition += 10;
        if (yPosition > 650) {
          doc.addPage();
          // Green border for new page
          doc
            .strokeColor('#4a7c59')
            .lineWidth(8)
            .rect(15, 15, 565, 812)
            .stroke();
          yPosition = 60;
        }

        doc.fontSize(16).fillColor('#4a7c59').text('Education', 50, yPosition);

        yPosition += 25;

        data.education.forEach((edu) => {
          // Date range
          doc
            .fontSize(11)
            .fillColor('#666666')
            .text(`${edu.startDate} - ${edu.endDate}`, 50, yPosition);

          yPosition += 15;

          // Degree and university
          doc
            .fontSize(12)
            .fillColor('#000000')
            .text(
              `${edu.degree}, ${edu.major}, ${edu.university}`,
              50,
              yPosition,
              {
                width: 480,
              }
            );

          yPosition += 25;
        });

        // Skills Section
        yPosition += 20;
        if (yPosition > 650) {
          doc.addPage();
          // Green border for new page
          doc
            .strokeColor('#4a7c59')
            .lineWidth(8)
            .rect(15, 15, 565, 812)
            .stroke();
          yPosition = 60;
        }

        doc.fontSize(16).fillColor('#4a7c59').text('Skills', 50, yPosition);

        yPosition += 25;

        // Skills in 3 columns
        const skillsPerColumn = Math.ceil(data.skills.length / 3);
        const columns = [50, 200, 350];

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
                yPosition + rowIndex * 18
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
