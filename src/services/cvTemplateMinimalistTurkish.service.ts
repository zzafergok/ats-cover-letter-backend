import PDFDocument from 'pdfkit';
import * as PDFKit from 'pdfkit';
import { PassThrough } from 'stream';

export interface CVMinimalistTurkishData {
  personalInfo: {
    fullName: string;
    address: string;
    city: string;
    zipCode: string;
    phone: string;
    email: string;
  };
  objective: string;
  experience: Array<{
    jobTitle: string;
    company: string;
    city: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    university: string;
    city: string;
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

export class CVTemplateMinimalistTurkishService {
  private static instance: CVTemplateMinimalistTurkishService;

  private constructor() {}

  public static getInstance(): CVTemplateMinimalistTurkishService {
    if (!CVTemplateMinimalistTurkishService.instance) {
      CVTemplateMinimalistTurkishService.instance = new CVTemplateMinimalistTurkishService();
    }
    return CVTemplateMinimalistTurkishService.instance;
  }

  async generatePDF(data: CVMinimalistTurkishData): Promise<Buffer> {
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
        doc.fontSize(18)
           .fillColor('#000000')
           .text(data.personalInfo.fullName.toUpperCase(), 50, yPosition);

        yPosition += 25;

        // Contact information
        doc.fontSize(10)
           .fillColor('#000000')
           .text(
             `${data.personalInfo.address}, ${data.personalInfo.city}, ${data.personalInfo.zipCode} – ${data.personalInfo.phone} – ${data.personalInfo.email}`,
             50, yPosition, {
               width: 515
             }
           );

        yPosition += 35;

        // Objective Section (Hedef)
        if (data.objective) {
          doc.fontSize(12)
             .fillColor('#000000')
             .text('Hedef', 50, yPosition, { 
               underline: true,
               width: 515
             });

          yPosition += 20;

          doc.fontSize(10)
             .text(data.objective, 50, yPosition, {
               width: 515,
               align: 'justify'
             });

          yPosition += this.calculateTextHeight(doc, data.objective, { width: 515 }) + 20;
        }

        // Experience Section (Deneyim)
        doc.fontSize(12)
           .fillColor('#000000')
           .text('Deneyim', 50, yPosition, { 
             underline: true,
             width: 515
           });

        yPosition += 20;

        data.experience.forEach((exp, index) => {
          // Job Title
          doc.fontSize(11)
             .fillColor('#000000')
             .text(`[${exp.jobTitle}]`, 50, yPosition);

          yPosition += 15;

          // Company and Location
          doc.fontSize(10)
             .fillColor('#000000')
             .text(`[${exp.company}], [${exp.city}]`, 50, yPosition);

          yPosition += 15;

          // Date Range
          doc.fontSize(10)
             .fillColor('#000000')
             .text(`[${exp.startDate}] – [${exp.endDate}]`, 50, yPosition);

          yPosition += 15;

          // Description
          doc.fontSize(10)
             .fillColor('#000000')
             .text(`[${exp.description}]`, 50, yPosition, {
               width: 515,
               align: 'justify'
             });

          yPosition += this.calculateTextHeight(doc, exp.description, { width: 515 }) + 20;

          // Check for page break
          if (yPosition > 720 && index < data.experience.length - 1) {
            doc.addPage();
            yPosition = 50;
          }
        });

        // Education Section (Eğitim)
        if (yPosition > 650) {
          doc.addPage();
          yPosition = 50;
        }

        doc.fontSize(12)
           .fillColor('#000000')
           .text('Eğitim', 50, yPosition, { 
             underline: true,
             width: 515
           });

        yPosition += 20;

        data.education.forEach((edu) => {
          // Degree
          doc.fontSize(10)
             .fillColor('#000000')
             .text(`[${edu.degree}]`, 50, yPosition);

          yPosition += 15;

          // University and Location
          doc.fontSize(10)
             .fillColor('#000000')
             .text(`[${edu.university}], [${edu.city}]`, 50, yPosition);

          yPosition += 15;

          // Graduation Date
          doc.fontSize(10)
             .fillColor('#000000')
             .text(`[${edu.graduationDate}]`, 50, yPosition);

          yPosition += 15;

          if (edu.details) {
            doc.fontSize(10)
               .fillColor('#000000')
               .text(`[${edu.details}]`, 50, yPosition, {
                 width: 515,
                 align: 'justify'
               });

            yPosition += this.calculateTextHeight(doc, edu.details, { width: 515 }) + 15;
          }

          yPosition += 10;
        });

        // Communication Section (İletişim)
        if (data.communication) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(12)
             .fillColor('#000000')
             .text('İletişim', 50, yPosition, { 
               underline: true,
               width: 515
             });

          yPosition += 20;

          doc.fontSize(10)
             .text(`[${data.communication}]`, 50, yPosition, {
               width: 515,
               align: 'justify'
             });

          yPosition += this.calculateTextHeight(doc, data.communication, { width: 515 }) + 20;
        }

        // Leadership Section (Liderlik)
        if (data.leadership) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(12)
             .fillColor('#000000')
             .text('Liderlik', 50, yPosition, { 
               underline: true,
               width: 515
             });

          yPosition += 20;

          doc.fontSize(10)
             .text(`[${data.leadership}]`, 50, yPosition, {
               width: 515,
               align: 'justify'
             });

          yPosition += this.calculateTextHeight(doc, data.leadership, { width: 515 }) + 20;
        }

        // References Section (Referanslar)
        if (data.references && data.references.length > 0) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          doc.fontSize(12)
             .fillColor('#000000')
             .text('Referanslar', 50, yPosition, { 
               underline: true,
               width: 515
             });

          yPosition += 20;

          data.references.forEach((ref) => {
            doc.fontSize(10)
               .fillColor('#000000')
               .text(`[${ref.name}], [${ref.company}]`, 50, yPosition);

            yPosition += 15;

            doc.fontSize(10)
               .fillColor('#000000')
               .text(`[${ref.contact}]`, 50, yPosition);

            yPosition += 25;
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private calculateTextHeight(doc: PDFKit.PDFDocument, text: string, options: any): number {
    const height = doc.heightOfString(text, options);
    return height;
  }
}