import jsPDF from 'jspdf';
import logger from '../config/logger';
import { TurkeyTime } from '../utils/timezone';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';

export class PdfService {
  private static instance: PdfService;

  public static getInstance(): PdfService {
    if (!PdfService.instance) {
      PdfService.instance = new PdfService();
    }
    return PdfService.instance;
  }

  async generateCoverLetterPdf(data: {
    content: string;
    positionTitle: string;
    companyName: string;
    language?: 'TURKISH' | 'ENGLISH';
  }): Promise<Buffer> {
    const { content, positionTitle, companyName, language = 'TURKISH' } = data;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Başlık ayarları
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');

      // Sayfa başlığı
      const title = language === 'TURKISH' 
        ? `${companyName} - ${positionTitle} Pozisyonu İçin Başvuru Mektubu`
        : `Cover Letter for ${positionTitle} Position at ${companyName}`;
      const titleLines = doc.splitTextToSize(title, 170);
      doc.text(titleLines, 20, 25);

      // Tarih
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = TurkeyTime.formatDate();
      doc.text(currentDate, 20, 40);

      // İçerik ayarları
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Cover letter içeriğini paragraf paragraf işle
      const paragraphs = content.split('\n').filter((p) => p.trim().length > 0);
      let yPosition = 55;
      const lineHeight = 6;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;

      paragraphs.forEach((paragraph) => {
        // Paragrafı satırlara böl
        const lines = doc.splitTextToSize(paragraph.trim(), maxWidth);

        // Sayfa sonu kontrolü
        if (yPosition + lines.length * lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = 25;
        }

        // Satırları yazdır
        lines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        // Paragraf arası boşluk
        yPosition += 3;
      });

      // PDF'yi buffer olarak döndür
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      logger.info(formatMessage(SERVICE_MESSAGES.PDF.GENERATION_SUCCESS), {
        positionTitle,
        companyName,
        contentLength: content.length,
        pdfSize: pdfBuffer.length,
      });

      return pdfBuffer;
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.PDF.GENERATION_FAILED,
          error as Error
        )
      );
      throw new Error(formatMessage(SERVICE_MESSAGES.PDF.GENERATION_FAILED));
    }
  }

  async generateCoverLetterPdfWithCustomFormat(
    content: string,
    positionTitle: string,
    companyName: string,
    applicantName?: string
  ): Promise<Buffer> {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Sayfa kenar boşlukları
      const leftMargin = 25;
      const topMargin = 30;
      const pageWidth = doc.internal.pageSize.width;
      const contentWidth = pageWidth - leftMargin * 2;

      let yPosition = topMargin;

      // Başvuran adı (varsa)
      if (applicantName) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(applicantName, leftMargin, yPosition);
        yPosition += 15;
      }

      // Tarih
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = TurkeyTime.formatDateLong();
      doc.text(currentDate, leftMargin, yPosition);
      yPosition += 15;

      // Şirket ve pozisyon bilgisi
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${companyName}`, leftMargin, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      doc.text(`${positionTitle} Pozisyonu`, leftMargin, yPosition);
      yPosition += 15;

      // Konu satırı
      doc.setFont('helvetica', 'bold');
      doc.text('Konu: Başvuru Mektubu', leftMargin, yPosition);
      yPosition += 15;

      // İçerik
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const paragraphs = content.split('\n').filter((p) => p.trim().length > 0);
      const lineHeight = 5.5;
      const pageHeight = doc.internal.pageSize.height;
      const bottomMargin = 25;

      paragraphs.forEach((paragraph, index) => {
        const lines = doc.splitTextToSize(paragraph.trim(), contentWidth);

        // Sayfa sonu kontrolü
        if (yPosition + lines.length * lineHeight > pageHeight - bottomMargin) {
          doc.addPage();
          yPosition = topMargin;
        }

        // Satırları yazdır
        lines.forEach((line: string) => {
          doc.text(line, leftMargin, yPosition);
          yPosition += lineHeight;
        });

        // Paragraf arası boşluk (son paragraf değilse)
        if (index < paragraphs.length - 1) {
          yPosition += 4;
        }
      });

      // Kapanış
      yPosition += 10;
      if (yPosition > pageHeight - bottomMargin - 20) {
        doc.addPage();
        yPosition = topMargin;
      }

      doc.text('Saygılarımla,', leftMargin, yPosition);
      if (applicantName) {
        yPosition += 15;
        doc.setFont('helvetica', 'bold');
        doc.text(applicantName, leftMargin, yPosition);
      }

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      logger.info(formatMessage(SERVICE_MESSAGES.PDF.CUSTOM_FORMAT_SUCCESS), {
        positionTitle,
        companyName,
        applicantName,
        pdfSize: pdfBuffer.length,
      });

      return pdfBuffer;
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.PDF.GENERATION_FAILED,
          error as Error
        )
      );
      throw new Error(formatMessage(SERVICE_MESSAGES.PDF.GENERATION_FAILED));
    }
  }

  async generateCvPdf(data: {
    content: string;
    positionTitle: string;
    companyName: string;
    language?: 'TURKISH' | 'ENGLISH';
    cvType?: string;
  }): Promise<Buffer> {
    const { content, positionTitle, companyName, language = 'TURKISH', cvType = 'ATS_OPTIMIZED' } = data;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Başlık ayarları
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');

      // Sayfa başlığı
      const title = language === 'TURKISH' 
        ? `${companyName} - ${positionTitle} Pozisyonu İçin CV`
        : `CV for ${positionTitle} Position at ${companyName}`;
      const titleLines = doc.splitTextToSize(title, 170);
      doc.text(titleLines, 20, 25);

      // CV Tipi
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const typeText = language === 'TURKISH' 
        ? `CV Tipi: ${cvType === 'ATS_OPTIMIZED' ? 'ATS Uyumlu' : cvType === 'CREATIVE' ? 'Yaratıcı' : 'Teknik'}`
        : `CV Type: ${cvType}`;
      doc.text(typeText, 20, 35);

      // Tarih
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = TurkeyTime.formatDate();
      doc.text(currentDate, 20, 45);

      // İçerik ayarları
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // CV içeriğini bölümler halinde işle
      const sections = content.split('\n\n').filter((section) => section.trim().length > 0);
      let yPosition = 60;
      const lineHeight = 6;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const maxWidth = 170;

      sections.forEach((section) => {
        const lines = section.split('\n');
        
        lines.forEach((line) => {
          // Başlık kontrolü (büyük harfle başlayan satırlar)
          if (line.match(/^[A-ZÜÖÇĞIŞ]/)) {
            // Sayfa sonu kontrolü
            if (yPosition + lineHeight * 2 > pageHeight - margin) {
              doc.addPage();
              yPosition = 25;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(line.trim(), margin, yPosition);
            yPosition += lineHeight + 2;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
          } else if (line.trim().length > 0) {
            // Normal metin satırları
            const textLines = doc.splitTextToSize(line.trim(), maxWidth);
            
            // Sayfa sonu kontrolü
            if (yPosition + textLines.length * lineHeight > pageHeight - margin) {
              doc.addPage();
              yPosition = 25;
            }

            textLines.forEach((textLine: string) => {
              doc.text(textLine, margin, yPosition);
              yPosition += lineHeight;
            });
          }
        });

        // Bölüm arası boşluk
        yPosition += 4;
      });

      // PDF'yi buffer olarak döndür
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

      logger.info('CV PDF generated successfully', {
        positionTitle,
        companyName,
        cvType,
        contentLength: content.length,
        pdfSize: pdfBuffer.length,
      });

      return pdfBuffer;
    } catch (error) {
      logger.error('CV PDF generation failed:', error);
      throw new Error('CV PDF oluşturulamadı');
    }
  }
}
