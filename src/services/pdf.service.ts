import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';
import { TurkeyTime } from '../utils/timezone';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';
import { ATSCVData, ATSOptimizedCVData } from '../types/cv.types';
import { DOCXExportService } from './docx-export.service';

export class PdfService {
  private static instance: PdfService;
  private static cachedFonts: { [key: string]: Buffer } = {};
  private docxService: DOCXExportService;

  private constructor() {
    this.docxService = DOCXExportService.getInstance();
  }

  public static getInstance(): PdfService {
    if (!PdfService.instance) {
      PdfService.instance = new PdfService();
    }
    return PdfService.instance;
  }

  /**
   * Font dosyasını yükle ve önbellekte sakla
   */
  private async loadFont(fontName: string): Promise<Buffer> {
    if (!PdfService.cachedFonts[fontName]) {
      // Build zamanında src path'i değişebilir, bu yüzden birkaç alternatif deneyelim
      const possiblePaths = [
        path.join(__dirname, '..', 'assets', 'fonts', `${fontName}.ttf`),
        path.join(
          __dirname,
          '..',
          '..',
          'src',
          'assets',
          'fonts',
          `${fontName}.ttf`
        ),
        path.join(process.cwd(), 'src', 'assets', 'fonts', `${fontName}.ttf`),
      ];

      let fontPath: string | null = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          fontPath = possiblePath;
          break;
        }
      }

      if (!fontPath) {
        logger.warn(
          `Font not found in any of these paths: ${possiblePaths.join(', ')}`
        );
        throw new Error(`Font file not found: ${fontName}`);
      }

      PdfService.cachedFonts[fontName] = fs.readFileSync(fontPath);
      logger.info(`Font loaded and cached: ${fontName} from ${fontPath}`);
    }

    return PdfService.cachedFonts[fontName];
  }

  /**
   * Font güvenlik kontrolü - font dosyasının varlığını kontrol et
   */
  private async ensureFontsExist(): Promise<void> {
    const requiredFonts = ['Roboto-Regular', 'Roboto-Bold'];

    for (const font of requiredFonts) {
      try {
        await this.loadFont(font);
        logger.info(`Font verification successful: ${font}`);
      } catch (error) {
        logger.error(`Required font missing: ${font}`, error);
        throw new Error(
          `Required font file missing: ${font}.ttf. Please ensure fonts are installed.`
        );
      }
    }
  }

  /**
   * PDF dokümanını başlat ve fontları yükle
   */
  private async createDocument(): Promise<typeof PDFDocument> {
    await this.ensureFontsExist();

    const doc = new PDFDocument({
      size: 'A4',
      margin: 25,
      bufferPages: true,
      info: {
        Title: 'Cover Letter',
        Author: 'ATS Cover Letter Generator',
        Subject: 'Job Application Cover Letter',
        Keywords: 'cover letter, job application, ATS',
        Creator: 'ATS Cover Letter Backend',
        Producer: 'PDFKit with Turkish Support',
      },
    });

    try {
      // Türkçe destekleyen fontları yükle
      const robotoRegular = await this.loadFont('Roboto-Regular');
      const robotoBold = await this.loadFont('Roboto-Bold');

      doc.registerFont('Roboto', robotoRegular);
      doc.registerFont('Roboto-Bold', robotoBold);

      // Varsayılan fontu ayarla
      doc.font('Roboto');

      logger.info('PDF document created with Turkish font support');
    } catch (error) {
      logger.error('Font loading failed, using fallback fonts', error);
      // Fallback olarak sistem fontlarını kullan
      doc.font('Helvetica');
    }

    return doc;
  }

  /**
   * Metni güvenli şekilde işle ve Turkish character encoding'i kontrol et
   */
  private sanitizeText(text: string): string {
    // Null, undefined kontrolü
    if (!text) return '';

    // String'e çevir ve trim yap
    const sanitized = String(text).trim();

    // UTF-8 encoding kontrolü
    try {
      // Eğer string zaten UTF-8 değilse, Buffer üzerinden UTF-8'e çevir
      const buffer = Buffer.from(sanitized, 'utf8');
      return buffer.toString('utf8');
    } catch (error) {
      logger.warn('Text encoding issue detected, using fallback', {
        originalText: text,
      });
      return sanitized;
    }
  }

  /**
   * Sayfa sonu kontrolü ve yeni sayfa ekleme
   */
  private checkPageBreak(
    doc: InstanceType<typeof PDFDocument>,
    currentY: number,
    requiredHeight: number
  ): number {
    const pageHeight = doc.page.height;
    const bottomMargin = 50;

    if (currentY + requiredHeight > pageHeight - bottomMargin) {
      doc.addPage();
      return 50; // Top margin for new page
    }

    return currentY;
  }

  /**
   * Cover Letter PDF oluştur (Güncellenmiş Versiyon)
   */
  async generateCoverLetterPdf(data: {
    content: string;
    positionTitle: string;
    companyName: string;
    language?: 'TURKISH' | 'ENGLISH';
  }): Promise<Buffer> {
    const { content, positionTitle, companyName, language = 'TURKISH' } = data;

    try {
      const doc = await this.createDocument();

      // Content stream'i bir buffer'a yazma
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      const pdfPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });

      let yPosition = 50;

      // Başlık
      doc.font('Roboto-Bold').fontSize(16);
      const title =
        language === 'TURKISH'
          ? `${this.sanitizeText(companyName)} - ${this.sanitizeText(positionTitle)} Pozisyonu İçin Başvuru Mektubu`
          : `Cover Letter for ${this.sanitizeText(positionTitle)} Position at ${this.sanitizeText(companyName)}`;

      doc.text(title, 50, yPosition, { width: 500, align: 'center' });
      yPosition += 40;

      // Tarih
      doc.font('Roboto').fontSize(10);
      const currentDate = TurkeyTime.formatDateLong();
      doc.text(this.sanitizeText(currentDate), 450, yPosition, {
        align: 'right',
      });
      yPosition += 30;

      // İçerik
      doc.font('Roboto').fontSize(11);
      const sanitizedContent = this.sanitizeText(content);

      // Contact bilgilerini tespit et - daha güçlü pattern
      const contactSectionMatch = sanitizedContent.match(
        /((?:Saygılarımla|Best regards|Sincerely|En iyi dileklerimle|Teşekkürler)[,.]?\s*[\s\S]*?)$/
      );
      const mainContent = contactSectionMatch
        ? sanitizedContent.replace(contactSectionMatch[0], '').trim()
        : sanitizedContent;

      // Contact section'ı parse et ve düzenle
      let contactSection = '';
      if (contactSectionMatch) {
        const rawContact = contactSectionMatch[0].trim();
        const lines = rawContact
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        // İlk satır kapanış (Saygılarımla, Best regards, etc.)
        const closingLine = lines[0];

        // Kullanıcı bilgilerini bul (email, telefon, link içerenler)
        const nameLines = [];
        const contactLines = [];
        const linkLines = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (
            line.includes('@') ||
            /^\d+$/.test(line.replace(/[\s\-()]/g, ''))
          ) {
            contactLines.push(line);
          } else if (
            line.includes('http') ||
            line.includes('www.') ||
            line.includes('.com')
          ) {
            linkLines.push(line);
          } else if (
            !line.includes('Saygılarımla') &&
            !line.includes('Best regards') &&
            !line.includes('Sincerely')
          ) {
            nameLines.push(line);
          }
        }

        // Doğru formatı oluştur
        contactSection = closingLine.replace(/[,.]$/, ',');
        if (nameLines.length > 0) {
          contactSection += '\n' + nameLines.join(' ');
        }
        if (contactLines.length > 0) {
          contactSection += '\n\n' + contactLines.join('\n');
        }
        if (linkLines.length > 0) {
          // Linkleri uzunluğa göre sırala
          const sortedLinks = linkLines.sort((a, b) => a.length - b.length);
          contactSection += '\n\n' + sortedLinks.join('\n');
        }
      }

      // Ana içeriği işle
      const mainParagraphs = mainContent
        .split('\n')
        .filter((p) => p.trim().length > 0);

      // Contact section'ın toplam yüksekliğini hesapla
      let contactSectionHeight = 0;
      if (contactSection) {
        const contactLines = contactSection.split('\n');
        contactSectionHeight = 20; // Ana içerik ile contact arasında boşluk
        contactLines.forEach((line) => {
          if (line.trim().length > 0) {
            const lineHeight = doc.heightOfString(line, { width: 500 });
            contactSectionHeight += lineHeight + 3;
          } else {
            contactSectionHeight += 7;
          }
        });
      }

      mainParagraphs.forEach((paragraph, index) => {
        const paragraphHeight = doc.heightOfString(paragraph, { width: 500 });
        const isLastParagraph = index === mainParagraphs.length - 1;

        // Son paragrafsa ve contact section varsa, birlikte kontrol et
        if (isLastParagraph && contactSection) {
          const totalHeightNeeded = paragraphHeight + 15 + contactSectionHeight;
          yPosition = this.checkPageBreak(doc, yPosition, totalHeightNeeded);
        } else {
          yPosition = this.checkPageBreak(doc, yPosition, paragraphHeight + 15);
        }

        doc.text(paragraph.trim(), 50, yPosition, {
          width: 500,
          align: 'justify',
          lineGap: 2,
          continued: false,
        });

        yPosition +=
          paragraphHeight + (index < mainParagraphs.length - 1 ? 15 : 10);
      });

      // Contact section'ı özel olarak işle
      if (contactSection) {
        yPosition += 20; // Ana içerik ile contact arasında boşluk
        const contactLines = contactSection.split('\n');

        contactLines.forEach((line) => {
          if (line.trim().length > 0) {
            const lineHeight = doc.heightOfString(line, { width: 500 });
            // Contact kısmında sayfa kontrolü yapmıyoruz çünkü zaten yukarıda kontrol edildi

            doc.text(line, 50, yPosition, {
              width: 500,
              align: 'left',
              lineGap: 1,
              continued: false,
            });

            yPosition += lineHeight + 3;
          } else {
            // Boş satır için ekstra spacing
            yPosition += 7;
          }
        });
      }

      // Kapanış - artık content içinde mevcut, tekrar eklemeye gerek yok

      // PDF'i sonlandır
      doc.end();

      const pdfBuffer = await pdfPromise;

      logger.info(formatMessage(SERVICE_MESSAGES.PDF.GENERATION_SUCCESS), {
        positionTitle: this.sanitizeText(positionTitle),
        companyName: this.sanitizeText(companyName),
        language,
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

  /**
   * Custom Format Cover Letter PDF (Güncellenmiş Versiyon)
   */
  async generateCoverLetterPdfWithCustomFormat(
    content: string,
    positionTitle: string,
    companyName: string,
    applicantName?: string,
    _language: 'TURKISH' | 'ENGLISH' = 'TURKISH'
  ): Promise<Buffer> {
    try {
      const doc = await this.createDocument();

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      const pdfPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });

      let yPosition = 50;

      // Şirket bilgisi (üst kısmı daha minimal)
      doc.font('Roboto-Bold').fontSize(12);
      doc.text(this.sanitizeText(companyName), 50, yPosition);
      yPosition += 15;

      doc.font('Roboto').fontSize(11);
      doc.text(`${this.sanitizeText(positionTitle)} Pozisyonu`, 50, yPosition);
      yPosition += 30;

      // İçerik
      doc.font('Roboto').fontSize(11);
      const sanitizedContent = this.sanitizeText(content);
      const paragraphs = sanitizedContent
        .split('\n')
        .filter((p) => p.trim().length > 0);

      paragraphs.forEach((paragraph, index) => {
        const paragraphHeight = doc.heightOfString(paragraph, { width: 500 });

        // Son 3 paragraf için özel kontrol (son paragraf + "Best regards," + "Name")
        const isOneOfLastThree = index >= paragraphs.length - 3;

        if (isOneOfLastThree) {
          // İlk kez son 3 paragraftan birine geldiğimizde, hepsinin yüksekliğini hesapla
          if (index === paragraphs.length - 3) {
            let totalClosingHeight = 0;
            for (let i = index; i < paragraphs.length; i++) {
              totalClosingHeight +=
                doc.heightOfString(paragraphs[i], { width: 500 }) + 15;
            }

            // Eğer son 3 paragraf sayfa sonuna sığmayacaksa, yeni sayfaya geç
            if (yPosition + totalClosingHeight > doc.page.height - 50) {
              doc.addPage();
              yPosition = 50;
            }
          }
          // Son 3 paragrafın 2. veya 3.'sü için page break kontrolü yapma, zaten 1.'sinde yapıldı
        } else {
          // Normal paragraflar için normal page break
          yPosition = this.checkPageBreak(doc, yPosition, paragraphHeight + 15);
        }

        doc.text(paragraph.trim(), 50, yPosition, {
          width: 500,
          align: 'justify',
          lineGap: 2,
          continued: false,
        });

        yPosition +=
          paragraphHeight + (index < paragraphs.length - 1 ? 15 : 10);
      });

      doc.end();
      const pdfBuffer = await pdfPromise;

      logger.info(formatMessage(SERVICE_MESSAGES.PDF.CUSTOM_FORMAT_SUCCESS), {
        positionTitle: this.sanitizeText(positionTitle),
        companyName: this.sanitizeText(companyName),
        applicantName: applicantName ? this.sanitizeText(applicantName) : null,
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

  /**
   * CV PDF oluştur (Güncellenmiş Versiyon)
   */
  async generateCvPdf(data: {
    content: string;
    positionTitle: string;
    companyName: string;
    language?: 'TURKISH' | 'ENGLISH';
    cvType?: string;
  }): Promise<Buffer> {
    const {
      content,
      positionTitle,
      companyName,
      language = 'TURKISH',
      cvType = 'ATS_OPTIMIZED',
    } = data;

    try {
      const doc = await this.createDocument();

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      const pdfPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });

      let yPosition = 50;

      // Başlık
      doc.font('Roboto-Bold').fontSize(16);
      const title =
        language === 'TURKISH'
          ? `${this.sanitizeText(companyName)} - ${this.sanitizeText(positionTitle)} Pozisyonu İçin CV`
          : `CV for ${this.sanitizeText(positionTitle)} Position at ${this.sanitizeText(companyName)}`;

      doc.text(title, 50, yPosition, { width: 500, align: 'center' });
      yPosition += 30;

      // CV Tipi
      doc.font('Roboto').fontSize(10);
      const typeText =
        language === 'TURKISH'
          ? `CV Tipi: ${cvType === 'ATS_OPTIMIZED' ? 'ATS Uyumlu' : cvType === 'CREATIVE' ? 'Yaratıcı' : 'Teknik'}`
          : `CV Type: ${cvType}`;
      doc.text(this.sanitizeText(typeText), 50, yPosition);
      yPosition += 20;

      // Tarih
      const currentDate = TurkeyTime.formatDate();
      doc.text(this.sanitizeText(currentDate), 50, yPosition);
      yPosition += 30;

      // İçerik
      const sanitizedContent = this.sanitizeText(content);
      const sections = sanitizedContent
        .split('\n\n')
        .filter((section) => section.trim().length > 0);

      sections.forEach((section) => {
        const lines = section
          .split('\n')
          .filter((line) => line.trim().length > 0);

        lines.forEach((line) => {
          // Başlık kontrolü (# ile başlayan veya büyük harfle başlayan satırlar)
          const isHeader =
            line.match(/^#+\s/) || line.match(/^[A-ZÜÖÇĞIŞ][A-ZÜÖÇĞIŞ\s]+$/);

          if (isHeader) {
            yPosition = this.checkPageBreak(doc, yPosition, 25);
            doc.font('Roboto-Bold').fontSize(12);
            doc.text(line.replace(/^#+\s/, '').trim(), 50, yPosition);
            yPosition += 20;
          } else {
            const lineHeight = doc.heightOfString(line, { width: 500 });
            yPosition = this.checkPageBreak(doc, yPosition, lineHeight + 5);

            doc.font('Roboto').fontSize(11);
            doc.text(line.trim(), 50, yPosition, { width: 500 });
            yPosition += lineHeight + 5;
          }
        });

        yPosition += 10; // Section arası boşluk
      });

      doc.end();
      const pdfBuffer = await pdfPromise;

      logger.info('CV PDF generated successfully with Turkish support', {
        positionTitle: this.sanitizeText(positionTitle),
        companyName: this.sanitizeText(companyName),
        cvType,
        language,
        contentLength: content.length,
        pdfSize: pdfBuffer.length,
      });

      return pdfBuffer;
    } catch (error) {
      logger.error('CV PDF generation failed:', error);
      throw new Error('CV PDF oluşturulamadı');
    }
  }

  /**
   * Unified CV generation - both PDF and DOCX formats
   */
  async generateCV(cvData: ATSCVData, format: 'PDF' | 'DOCX' = 'PDF'): Promise<Buffer> {
    if (format === 'DOCX') {
      return await this.docxService.generateATSCompliantDOCX(cvData);
    }
    return await this.generateATSCompliantCV(cvData);
  }

  /**
   * ATS Uyumlu CV PDF Oluştur
   */
  async generateATSCompliantCV(cvData: ATSCVData): Promise<Buffer> {
    try {
      const doc = await this.createATSDocument();
      
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      const pdfPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });

      let yPosition = 50;

      // 1. Header - Contact Information (ATS için critical)
      yPosition = await this.renderATSHeader(doc, cvData.personalInfo, yPosition);
      
      // 2. Professional Summary (ATS için önemli, keyword dense olmalı)
      yPosition = await this.renderProfessionalSummary(doc, cvData.professionalSummary, yPosition);
      
      // 3. Work Experience (En önemli section)
      yPosition = await this.renderWorkExperience(doc, cvData.workExperience, yPosition);
      
      // 4. Education
      yPosition = await this.renderEducation(doc, cvData.education, yPosition);
      
      // 5. Skills (Technical ve Soft skills ayrı)
      yPosition = await this.renderSkills(doc, cvData.skills, yPosition);
      
      // 6. Certifications (varsa)
      if (cvData.certifications && cvData.certifications.length > 0) {
        yPosition = await this.renderCertifications(doc, cvData.certifications, yPosition);
      }
      
      // 7. Projects (varsa)
      if (cvData.projects && cvData.projects.length > 0) {
        yPosition = await this.renderProjects(doc, cvData.projects, yPosition);
      }

      doc.end();
      const pdfBuffer = await pdfPromise;

      logger.info('ATS compliant CV generated successfully', {
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        targetPosition: cvData.professionalSummary.targetPosition,
        pdfSize: pdfBuffer.length,
        language: cvData.configuration.language
      });

      return pdfBuffer;
    } catch (error) {
      logger.error('ATS CV generation failed:', error);
      throw new Error('ATS uyumlu CV oluşturulamadı');
    }
  }

  /**
   * ATS için optimize edilmiş PDF document oluştur
   */
  private async createATSDocument(): Promise<typeof PDFDocument> {
    await this.ensureFontsExist();

    // ATS uyumlu sayfa ayarları
    const doc = new PDFDocument({
      size: 'A4',
      margin: 72, // 1 inch = 72 points (ATS standardı)
      bufferPages: true,
      info: {
        Title: 'ATS Compliant Resume',
        Author: 'ATS CV Generator',
        Subject: 'Professional Resume',
        Keywords: 'resume, cv, ats, job application',
        Creator: 'ATS CV Backend',
        Producer: 'PDFKit ATS Optimized',
      },
    });

    try {
      // ATS uyumlu fontları yükle - Arial/Calibri benzeri
      const robotoRegular = await this.loadFont('Roboto-Regular');
      const robotoBold = await this.loadFont('Roboto-Bold');

      doc.registerFont('ATS-Regular', robotoRegular);
      doc.registerFont('ATS-Bold', robotoBold);

      // ATS için varsayılan font ve boyut
      doc.font('ATS-Regular');
      doc.fontSize(11); // ATS standardı 11-12pt

      logger.info('ATS compliant PDF document created');
    } catch (error) {
      logger.error('ATS font loading failed, using fallback', error);
      // Fallback - sistem fontları
      doc.font('Helvetica');
      doc.fontSize(11);
    }

    return doc;
  }

  /**
   * ATS Header - Contact Information
   */
  private async renderATSHeader(
    doc: InstanceType<typeof PDFDocument>, 
    personalInfo: ATSCVData['personalInfo'], 
    startY: number
  ): Promise<number> {
    let yPosition = startY;

    // İsim - en üstte, bold, büyük font
    doc.font('ATS-Bold').fontSize(16);
    const fullName = `${this.sanitizeText(personalInfo.firstName)} ${this.sanitizeText(personalInfo.lastName)}`;
    doc.text(fullName, 72, yPosition, { align: 'center' });
    yPosition += 25;

    // Contact bilgileri - ATS için düz metin, tek satırda
    doc.font('ATS-Regular').fontSize(11);
    
    const contactLine = [
      this.sanitizeText(personalInfo.email),
      this.sanitizeText(personalInfo.phone),
      `${personalInfo.address.city}, ${personalInfo.address.country}`
    ].join(' | ');

    doc.text(contactLine, 72, yPosition, { align: 'center' });
    yPosition += 15;

    // LinkedIn ve diğer linkler (varsa)
    const links = [];
    if (personalInfo.linkedIn) links.push(personalInfo.linkedIn);
    if (personalInfo.website) links.push(personalInfo.website);
    if (personalInfo.github) links.push(personalInfo.github);

    if (links.length > 0) {
      doc.text(links.join(' | '), 72, yPosition, { align: 'center' });
      yPosition += 15;
    }

    yPosition += 20; // Section arası boşluk
    return yPosition;
  }

  /**
   * Professional Summary - keyword heavy olmalı
   */
  private async renderProfessionalSummary(
    doc: InstanceType<typeof PDFDocument>,
    summary: ATSCVData['professionalSummary'],
    startY: number
  ): Promise<number> {
    let yPosition = this.checkPageBreak(doc, startY, 80);

    // Section Header
    doc.font('ATS-Bold').fontSize(12);
    doc.text('PROFESSIONAL SUMMARY', 72, yPosition);
    yPosition += 20;

    // Summary content
    doc.font('ATS-Regular').fontSize(11);
    const summaryText = this.sanitizeText(summary.summary);
    
    doc.text(summaryText, 72, yPosition, {
      width: 450,
      align: 'left',
      lineGap: 2
    });
    
    const summaryHeight = doc.heightOfString(summaryText, { width: 450 });
    yPosition += summaryHeight + 20;

    return yPosition;
  }

  /**
   * Work Experience - ATS için en kritik section
   */
  private async renderWorkExperience(
    doc: InstanceType<typeof PDFDocument>,
    workExp: ATSCVData['workExperience'],
    startY: number
  ): Promise<number> {
    let yPosition = this.checkPageBreak(doc, startY, 60);

    // Section Header
    doc.font('ATS-Bold').fontSize(12);
    doc.text('WORK EXPERIENCE', 72, yPosition);
    yPosition += 20;

    for (const exp of workExp) {
      // Her deneyim için minimum yükseklik kontrol et
      const estimatedHeight = 80 + (exp.achievements.length * 15);
      yPosition = this.checkPageBreak(doc, yPosition, estimatedHeight);

      // Position Title ve Company - Bold
      doc.font('ATS-Bold').fontSize(11);
      const positionLine = `${this.sanitizeText(exp.position)} | ${this.sanitizeText(exp.companyName)}`;
      doc.text(positionLine, 72, yPosition);
      yPosition += 15;

      // Date range ve Location
      doc.font('ATS-Regular').fontSize(10);
      const endDateStr = exp.isCurrentRole ? 'Present' : this.formatDate(exp.endDate!);
      const dateLine = `${this.formatDate(exp.startDate)} - ${endDateStr} | ${this.sanitizeText(exp.location)}`;
      doc.text(dateLine, 72, yPosition);
      yPosition += 15;

      // Achievements - bullet points
      doc.font('ATS-Regular').fontSize(11);
      for (const achievement of exp.achievements) {
        yPosition = this.checkPageBreak(doc, yPosition, 20);
        
        doc.text('•', 85, yPosition);
        doc.text(this.sanitizeText(achievement), 100, yPosition, {
          width: 435,
          continued: false
        });
        
        const achHeight = doc.heightOfString(achievement, { width: 435 });
        yPosition += Math.max(achHeight, 12) + 3;
      }

      // Technologies (varsa)
      if (exp.technologies && exp.technologies.length > 0) {
        yPosition += 5;
        doc.font('ATS-Regular').fontSize(10);
        doc.text(`Technologies: ${exp.technologies.join(', ')}`, 100, yPosition, {
          width: 435
        });
        yPosition += 15;
      }

      yPosition += 15; // Deneyimler arası boşluk
    }

    return yPosition;
  }

  /**
   * Education Section
   */
  private async renderEducation(
    doc: InstanceType<typeof PDFDocument>,
    education: ATSCVData['education'],
    startY: number
  ): Promise<number> {
    let yPosition = this.checkPageBreak(doc, startY, 60);

    doc.font('ATS-Bold').fontSize(12);
    doc.text('EDUCATION', 72, yPosition);
    yPosition += 20;

    for (const edu of education) {
      yPosition = this.checkPageBreak(doc, yPosition, 60);

      // Degree ve Institution
      doc.font('ATS-Bold').fontSize(11);
      doc.text(`${this.sanitizeText(edu.degree)} in ${this.sanitizeText(edu.fieldOfStudy)}`, 72, yPosition);
      yPosition += 15;

      // Institution ve Date
      doc.font('ATS-Regular').fontSize(11);
      const endDateStr = edu.endDate ? this.formatDate(edu.endDate) : 'Present';
      doc.text(`${this.sanitizeText(edu.institution)} | ${this.formatDate(edu.startDate)} - ${endDateStr}`, 72, yPosition);
      yPosition += 12;

      // GPA (3.5+ ise)
      if (edu.gpa && edu.gpa >= 3.5) {
        doc.text(`GPA: ${edu.gpa.toFixed(2)}`, 72, yPosition);
        yPosition += 12;
      }

      // Honors (varsa)
      if (edu.honors && edu.honors.length > 0) {
        doc.text(`Honors: ${edu.honors.join(', ')}`, 72, yPosition, { width: 450 });
        yPosition += 12;
      }

      yPosition += 15;
    }

    return yPosition;
  }

  /**
   * Skills Section - ATS için keyword heavy
   */
  private async renderSkills(
    doc: InstanceType<typeof PDFDocument>,
    skills: ATSCVData['skills'],
    startY: number
  ): Promise<number> {
    let yPosition = this.checkPageBreak(doc, startY, 100);

    doc.font('ATS-Bold').fontSize(12);
    doc.text('SKILLS', 72, yPosition);
    yPosition += 20;

    // Technical Skills
    for (const techCategory of skills.technical) {
      yPosition = this.checkPageBreak(doc, yPosition, 30);
      
      doc.font('ATS-Bold').fontSize(11);
      doc.text(`${techCategory.category}:`, 72, yPosition);
      yPosition += 12;

      const skillNames = techCategory.items.map(item => item.name).join(', ');
      doc.font('ATS-Regular').fontSize(11);
      doc.text(skillNames, 72, yPosition, { width: 450 });
      
      const skillsHeight = doc.heightOfString(skillNames, { width: 450 });
      yPosition += skillsHeight + 10;
    }

    // Languages
    if (skills.languages.length > 0) {
      yPosition = this.checkPageBreak(doc, yPosition, 30);
      
      doc.font('ATS-Bold').fontSize(11);
      doc.text('Languages:', 72, yPosition);
      yPosition += 12;

      const languageList = skills.languages
        .map(lang => `${lang.language} (${lang.proficiency})`)
        .join(', ');
      
      doc.font('ATS-Regular').fontSize(11);
      doc.text(languageList, 72, yPosition, { width: 450 });
      yPosition += 15;
    }

    // Soft Skills
    if (skills.soft.length > 0) {
      yPosition = this.checkPageBreak(doc, yPosition, 30);
      
      doc.font('ATS-Bold').fontSize(11);
      doc.text('Additional Skills:', 72, yPosition);
      yPosition += 12;

      doc.font('ATS-Regular').fontSize(11);
      doc.text(skills.soft.join(', '), 72, yPosition, { width: 450 });
      yPosition += 20;
    }

    return yPosition;
  }

  /**
   * Certifications Section
   */
  private async renderCertifications(
    doc: InstanceType<typeof PDFDocument>,
    certifications: NonNullable<ATSCVData['certifications']>,
    startY: number
  ): Promise<number> {
    let yPosition = this.checkPageBreak(doc, startY, 60);

    doc.font('ATS-Bold').fontSize(12);
    doc.text('CERTIFICATIONS', 72, yPosition);
    yPosition += 20;

    for (const cert of certifications) {
      yPosition = this.checkPageBreak(doc, yPosition, 40);

      doc.font('ATS-Bold').fontSize(11);
      doc.text(this.sanitizeText(cert.name), 72, yPosition);
      yPosition += 12;

      doc.font('ATS-Regular').fontSize(11);
      const certLine = `${this.sanitizeText(cert.issuingOrganization)} | ${this.formatDate(cert.issueDate)}`;
      doc.text(certLine, 72, yPosition);
      yPosition += 15;
    }

    return yPosition;
  }

  /**
   * Projects Section
   */
  private async renderProjects(
    doc: InstanceType<typeof PDFDocument>,
    projects: NonNullable<ATSCVData['projects']>,
    startY: number
  ): Promise<number> {
    let yPosition = this.checkPageBreak(doc, startY, 60);

    doc.font('ATS-Bold').fontSize(12);
    doc.text('PROJECTS', 72, yPosition);
    yPosition += 20;

    for (const project of projects) {
      yPosition = this.checkPageBreak(doc, yPosition, 60);

      doc.font('ATS-Bold').fontSize(11);
      doc.text(this.sanitizeText(project.name), 72, yPosition);
      yPosition += 15;

      doc.font('ATS-Regular').fontSize(11);
      doc.text(this.sanitizeText(project.description), 72, yPosition, { width: 450 });
      
      const descHeight = doc.heightOfString(project.description, { width: 450 });
      yPosition += descHeight + 8;

      if (project.technologies.length > 0) {
        doc.text(`Technologies: ${project.technologies.join(', ')}`, 72, yPosition, { width: 450 });
        yPosition += 15;
      }

      yPosition += 10;
    }

    return yPosition;
  }

  /**
   * Date formatting helper
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Test için Türkçe karakter testi PDF'i oluştur
   */
  async generateTurkishCharacterTest(): Promise<Buffer> {
    try {
      // Test için custom format kullanarak yeni formatı test edelim - UZUN İÇERİK
      const testContent = `Sayın İnsan Kaynakları Müdürü,

Microsoft bünyesindeki Senior Frontend Developer pozisyonu için başvuruda bulunuyorum. Şirketinizin teknoloji alanında gerçekleştirdiği yenilikçi çalışmaları takip ediyor, bu projenin bir parçası olmak için büyük heyecan duyuyorum.

Web geliştirme dünyasına olan tutkum, teknik öğrenme konusundaki yeteneğim ve modern teknolojilere duyduğum derin ilgi, bu pozisyon için ideal bir aday olduğumu düşünmeme neden oluyor. React, JavaScript, TypeScript, HTML ve CSS teknolojilerinde sürekli kendimi geliştiriyorum.

Özellikle dikkatimi çeken nokta, bu rolün sadece geliştirici olmakla kalmayıp aynı zamanda öğretmen de olmayı gerektirmesi. Karmaşık teknik konuları basit ve anlaşılır şekilde aktarabilme yeteneğim, bu pozisyonun öğretmenlik boyutu için oldukça uygun olduğunu gösteriyor.

Start-up ortamında çalışma fikri de beni heyecanlandırıyor açıkçası. Hızlı hareket etmek, sorumluluk almak, problem çözme odaklı yaklaşım sergilemek - bunların hepsi benim çalışma tarzımla örtüşüyor. AI ve eğitim teknolojilerinin kesiştiği bu alanda hem kendimi geliştirirken hem de değerli bir misyona katkıda bulunmak istiyorum.

Şirketinizin küresel lansmanına hazırlandığı bu kritik dönemde, enerjimi, öğrenme kapasitemi ve taze bakış açımı takıma katmaya hazırım. Modern web geliştirme practices konusundaki güncel bilgim ve yeni teknolojilere adaptasyon sağlama yeteneğimle, hem geliştirici hem de eğitmen rollerinde başarılı olacağıma inanıyorum.

Bu innovatif projenin bir parçası olmak, AI destekli öğrenme çözümlerinin geleceğine katkıda bulunmak için sabırsızlanıyorum. Fresh perspektifim ve coşkumun ekibinizin başarısına nasıl katkıda bulunabileceğini tartışma imkanı bulursam çok memnun olurum.

Değerlendirmeniz için teşekkür ederim.

Best regards,
Ahmet Yılmaz`;

      return await this.generateCoverLetterPdfWithCustomFormat(
        testContent,
        'Senior Frontend Developer',
        'Microsoft',
        'Ahmet Yılmaz', // Test name
        'TURKISH'
      );
    } catch (error) {
      logger.error('Turkish character test PDF generation failed:', error);
      throw new Error('Test PDF oluşturulamadı');
    }
  }

  /**
   * ATS Test CV oluştur
   */
  async generateATSTestCV(): Promise<Buffer> {
    const testData: ATSCVData = {
      personalInfo: {
        firstName: 'Ahmet',
        lastName: 'Yazılımcı',
        email: 'ahmet.yazilimci@email.com',
        phone: '+90 555 123 4567',
        address: {
          city: 'İstanbul',
          country: 'Türkiye'
        },
        linkedIn: 'https://linkedin.com/in/ahmet-yazilimci',
        github: 'https://github.com/ahmet-yazilimci'
      },
      professionalSummary: {
        summary: 'Experienced Full Stack Developer with 5+ years in modern web technologies including React, Node.js, and cloud platforms. Proven track record of delivering scalable applications and leading development teams.',
        targetPosition: 'Senior Full Stack Developer',
        yearsOfExperience: 5,
        keySkills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB', 'Docker']
      },
      workExperience: [
        {
          id: '1',
          companyName: 'Tech Solutions Inc.',
          position: 'Senior Full Stack Developer',
          location: 'İstanbul, Türkiye',
          startDate: new Date('2022-01-01'),
          endDate: undefined,
          isCurrentRole: true,
          achievements: [
            'Led development of microservices architecture serving 100K+ daily users',
            'Reduced application load time by 40% through performance optimization',
            'Mentored 3 junior developers and established code review processes',
            'Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes'
          ],
          technologies: ['React', 'Node.js', 'MongoDB', 'AWS', 'Docker', 'Redis']
        },
        {
          id: '2',
          companyName: 'Digital Agency Pro',
          position: 'Full Stack Developer',
          location: 'İstanbul, Türkiye',
          startDate: new Date('2020-03-01'),
          endDate: new Date('2021-12-31'),
          isCurrentRole: false,
          achievements: [
            'Developed 15+ responsive web applications using React and Express.js',
            'Collaborated with design team to improve user experience by 25%',
            'Integrated third-party APIs and payment systems for e-commerce clients'
          ],
          technologies: ['React', 'Express.js', 'PostgreSQL', 'Stripe API']
        }
      ],
      education: [
        {
          id: '1',
          institution: 'İstanbul Technical University',
          degree: 'Bachelor of Science',
          fieldOfStudy: 'Computer Engineering',
          location: 'İstanbul, Türkiye',
          startDate: new Date('2016-09-01'),
          endDate: new Date('2020-06-01'),
          gpa: 3.7,
          honors: ['Dean\'s List', 'Software Engineering Award']
        }
      ],
      skills: {
        technical: [
          {
            category: 'Programming Languages',
            items: [
              { name: 'JavaScript', proficiencyLevel: 'Expert' },
              { name: 'TypeScript', proficiencyLevel: 'Advanced' },
              { name: 'Python', proficiencyLevel: 'Intermediate' }
            ]
          },
          {
            category: 'Frontend Technologies',
            items: [
              { name: 'React', proficiencyLevel: 'Expert' },
              { name: 'Next.js', proficiencyLevel: 'Advanced' },
              { name: 'Vue.js', proficiencyLevel: 'Intermediate' }
            ]
          },
          {
            category: 'Backend Technologies',
            items: [
              { name: 'Node.js', proficiencyLevel: 'Expert' },
              { name: 'Express.js', proficiencyLevel: 'Advanced' },
              { name: 'NestJS', proficiencyLevel: 'Intermediate' }
            ]
          }
        ],
        languages: [
          { language: 'Turkish', proficiency: 'Native' },
          { language: 'English', proficiency: 'Advanced' }
        ],
        soft: ['Team Leadership', 'Problem Solving', 'Project Management', 'Communication']
      },
      certifications: [
        {
          id: '1',
          name: 'AWS Certified Developer Associate',
          issuingOrganization: 'Amazon Web Services',
          issueDate: new Date('2023-05-01'),
          expirationDate: new Date('2026-05-01')
        }
      ],
      projects: [
        {
          id: '1',
          name: 'E-Commerce Platform',
          description: 'Full-stack e-commerce platform with React frontend, Node.js backend, and MongoDB database. Features include user authentication, payment processing, and inventory management.',
          technologies: ['React', 'Node.js', 'MongoDB', 'Stripe', 'AWS'],
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-06-01'),
          achievements: [
            'Handles 10K+ concurrent users',
            'Integrated with 5+ payment providers',
            'Mobile-responsive design'
          ]
        }
      ],
      configuration: {
        targetJobTitle: 'Senior Full Stack Developer',
        targetCompany: 'Microsoft',
        language: 'ENGLISH',
        cvType: 'ATS_OPTIMIZED',
        includePhoto: false,
        templateStyle: 'PROFESSIONAL'
      }
    };

    return await this.generateATSCompliantCV(testData);
  }
}
