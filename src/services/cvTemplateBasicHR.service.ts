import PDFDocument from 'pdfkit';
import * as PDFKit from 'pdfkit';
import { PassThrough } from 'stream';

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
  communication?: string;
  leadership?: string;
  references?: Array<{
    name: string;
    company: string;
    contact: string;
  }>;
}

export class CVTemplateBasicHRService {
  private static instance: CVTemplateBasicHRService;

  private constructor() {}

  public static getInstance(): CVTemplateBasicHRService {
    if (!CVTemplateBasicHRService.instance) {
      CVTemplateBasicHRService.instance = new CVTemplateBasicHRService();
    }
    return CVTemplateBasicHRService.instance;
  }

  async generatePDF(data: CVBasicHRData): Promise<Buffer> {
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

        // Header with name
        doc
          .fontSize(24)
          .fillColor('#4a5d4a')
          .text(data.personalInfo.fullName.toUpperCase(), 50, 50, {
            align: 'center',
            width: 515,
          });

        // Contact information
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(
            `${data.personalInfo.address} | ${data.personalInfo.city}, ${data.personalInfo.state} ${data.personalInfo.zipCode} | ${data.personalInfo.phone} | ${data.personalInfo.email}`,
            50,
            85,
            {
              align: 'center',
              width: 515,
            }
          );

        let yPosition = 120;

        // Objective Section
        if (data.objective) {
          doc
            .fontSize(14)
            .fillColor('#000000')
            .text('OBJECTIVE', 50, yPosition, {
              underline: true,
              width: 515,
            });

          yPosition += 25;

          doc.fontSize(11).text(data.objective, 50, yPosition, {
            width: 515,
            align: 'justify',
          });

          yPosition +=
            this.calculateTextHeight(doc, data.objective, { width: 515 }) + 25;
        }

        // Experience Section
        if (data.experience && data.experience.length > 0) {
          doc
            .fontSize(14)
            .fillColor('#000000')
            .text('EXPERIENCE', 50, yPosition, {
              underline: true,
              width: 515,
            });

          yPosition += 25;

          data.experience.forEach((exp) => {
            // Job Title and Company
            doc
              .fontSize(12)
              .fillColor('#000000')
              .text(exp.jobTitle, 50, yPosition, { continued: false });

            doc
              .fontSize(11)
              .text(`${exp.company} | ${exp.location}`, 50, yPosition + 15);

            doc
              .fontSize(10)
              .fillColor('#666666')
              .text(`${exp.startDate} – ${exp.endDate}`, 450, yPosition + 15, {
                align: 'right',
                width: 115,
              });

            yPosition += 35;

            // Job Description
            doc
              .fontSize(11)
              .fillColor('#000000')
              .text(exp.description, 50, yPosition, {
                width: 515,
                align: 'justify',
              });

            yPosition +=
              this.calculateTextHeight(doc, exp.description, { width: 515 }) +
              20;

            // Check for page break
            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }
          });
        }

        // Education Section
        if (data.education && data.education.length > 0) {
          yPosition += 10;

          doc
            .fontSize(14)
            .fillColor('#000000')
            .text('EDUCATION', 50, yPosition, {
              underline: true,
              width: 515,
            });

          yPosition += 25;

          data.education.forEach((edu) => {
            doc
              .fontSize(11)
              .fillColor('#000000')
              .text(edu.degree, 50, yPosition);

            doc
              .fontSize(11)
              .text(`${edu.university} | ${edu.location}`, 50, yPosition + 15);

            doc
              .fontSize(10)
              .fillColor('#666666')
              .text(edu.graduationDate, 450, yPosition + 15, {
                align: 'right',
                width: 115,
              });

            yPosition += 35;

            if (edu.details) {
              doc
                .fontSize(11)
                .fillColor('#000000')
                .text(edu.details, 50, yPosition, {
                  width: 515,
                  align: 'justify',
                });

              yPosition +=
                this.calculateTextHeight(doc, edu.details, { width: 515 }) + 15;
            }

            // Check for page break
            if (yPosition > 720) {
              doc.addPage();
              yPosition = 50;
            }
          });
        }

        // Communication Section
        if (data.communication) {
          yPosition += 10;

          doc
            .fontSize(14)
            .fillColor('#000000')
            .text('COMMUNICATION', 50, yPosition, {
              underline: true,
              width: 515,
            });

          yPosition += 25;

          doc.fontSize(11).text(data.communication, 50, yPosition, {
            width: 515,
            align: 'justify',
          });

          yPosition +=
            this.calculateTextHeight(doc, data.communication, { width: 515 }) +
            20;
        }

        // Leadership Section
        if (data.leadership) {
          if (yPosition > 680) {
            doc.addPage();
            yPosition = 50;
          }

          doc
            .fontSize(14)
            .fillColor('#000000')
            .text('LEADERSHIP', 50, yPosition, {
              underline: true,
              width: 515,
            });

          yPosition += 25;

          doc.fontSize(11).text(data.leadership, 50, yPosition, {
            width: 515,
            align: 'justify',
          });

          yPosition +=
            this.calculateTextHeight(doc, data.leadership, { width: 515 }) + 20;
        }

        // References Section
        if (data.references && data.references.length > 0) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          doc
            .fontSize(14)
            .fillColor('#000000')
            .text('REFERENCES', 50, yPosition, {
              underline: true,
              width: 515,
            });

          yPosition += 25;

          data.references.forEach((ref) => {
            doc.fontSize(11).fillColor('#000000').text(ref.name, 50, yPosition);

            doc
              .fontSize(11)
              .text(`${ref.company} | ${ref.contact}`, 50, yPosition + 15);

            yPosition += 40;
          });
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
