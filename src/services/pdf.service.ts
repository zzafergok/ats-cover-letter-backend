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

export class PdfService {
  private static instance: PdfService;
  private static cachedFonts: { [key: string]: Buffer } = {};

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
        path.join(__dirname, '..', '..', 'src', 'assets', 'fonts', `${fontName}.ttf`),
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
        logger.warn(`Font not found in any of these paths: ${possiblePaths.join(', ')}`);
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
        throw new Error(`Required font file missing: ${font}.ttf. Please ensure fonts are installed.`);
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
        Producer: 'PDFKit with Turkish Support'
      }
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
      logger.warn('Text encoding issue detected, using fallback', { originalText: text });
      return sanitized;
    }
  }

  /**
   * Sayfa sonu kontrolü ve yeni sayfa ekleme
   */
  private checkPageBreak(doc: InstanceType<typeof PDFDocument>, currentY: number, requiredHeight: number): number {
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
      const title = language === 'TURKISH' 
        ? `${this.sanitizeText(companyName)} - ${this.sanitizeText(positionTitle)} Pozisyonu İçin Başvuru Mektubu`
        : `Cover Letter for ${this.sanitizeText(positionTitle)} Position at ${this.sanitizeText(companyName)}`;
      
      doc.text(title, 50, yPosition, { width: 500, align: 'center' });
      yPosition += 40;

      // Tarih
      doc.font('Roboto').fontSize(10);
      const currentDate = TurkeyTime.formatDateLong();
      doc.text(this.sanitizeText(currentDate), 450, yPosition, { align: 'right' });
      yPosition += 30;

      // İçerik
      doc.font('Roboto').fontSize(11);
      const sanitizedContent = this.sanitizeText(content);
      const paragraphs = sanitizedContent.split('\n').filter(p => p.trim().length > 0);

      paragraphs.forEach((paragraph, index) => {
        const paragraphHeight = doc.heightOfString(paragraph, { width: 500 });
        yPosition = this.checkPageBreak(doc, yPosition, paragraphHeight + 15);

        doc.text(paragraph.trim(), 50, yPosition, {
          width: 500,
          align: 'justify',
          lineGap: 2
        });

        yPosition += paragraphHeight + (index < paragraphs.length - 1 ? 15 : 10);
      });

      // Kapanış
      yPosition = this.checkPageBreak(doc, yPosition, 40);
      doc.text('Saygılarımla,', 50, yPosition);

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
    language: 'TURKISH' | 'ENGLISH' = 'TURKISH'
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
      const paragraphs = sanitizedContent.split('\n').filter(p => p.trim().length > 0);

      paragraphs.forEach((paragraph, index) => {
        const paragraphHeight = doc.heightOfString(paragraph, { width: 500 });
        
        // Son 3 paragraf için özel kontrol (son paragraf + "Best regards," + "Name")
        const isOneOfLastThree = index >= paragraphs.length - 3;
        
        if (isOneOfLastThree) {
          // İlk kez son 3 paragraftan birine geldiğimizde, hepsinin yüksekliğini hesapla
          if (index === paragraphs.length - 3) {
            let totalClosingHeight = 0;
            for (let i = index; i < paragraphs.length; i++) {
              totalClosingHeight += doc.heightOfString(paragraphs[i], { width: 500 }) + 15;
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
          lineGap: 2
        });

        yPosition += paragraphHeight + (index < paragraphs.length - 1 ? 15 : 10);
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
    const { content, positionTitle, companyName, language = 'TURKISH', cvType = 'ATS_OPTIMIZED' } = data;
    
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
      const title = language === 'TURKISH' 
        ? `${this.sanitizeText(companyName)} - ${this.sanitizeText(positionTitle)} Pozisyonu İçin CV`
        : `CV for ${this.sanitizeText(positionTitle)} Position at ${this.sanitizeText(companyName)}`;
      
      doc.text(title, 50, yPosition, { width: 500, align: 'center' });
      yPosition += 30;

      // CV Tipi
      doc.font('Roboto').fontSize(10);
      const typeText = language === 'TURKISH' 
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
      const sections = sanitizedContent.split('\n\n').filter(section => section.trim().length > 0);

      sections.forEach((section) => {
        const lines = section.split('\n').filter(line => line.trim().length > 0);
        
        lines.forEach((line) => {
          // Başlık kontrolü (# ile başlayan veya büyük harfle başlayan satırlar)
          const isHeader = line.match(/^#+\s/) || line.match(/^[A-ZÜÖÇĞIŞ][A-ZÜÖÇĞIŞ\s]+$/);
          
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
}