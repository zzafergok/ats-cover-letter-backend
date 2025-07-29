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
   * Başlık formatlaması - sadece ilk harf büyük, geri kalan küçük (Sentence case)
   */
  public formatTitle(
    text: string,
    language: 'TURKISH' | 'ENGLISH' = 'TURKISH'
  ): string {
    if (!text) return '';

    const sanitized = this.sanitizeText(text).toLowerCase();

    if (language === 'TURKISH') {
      // Türkçe karakterleri destekleyen sentence case - sadece ilk harf büyük
      if (sanitized.length === 0) return '';

      const firstChar = sanitized.charAt(0);
      const restOfText = sanitized.slice(1);

      // Türkçe karakter dönüşümleri - sadece ilk harf için
      const turkishUpperMap: { [key: string]: string } = {
        i: 'İ',
        ı: 'I',
        ğ: 'Ğ',
        ü: 'Ü',
        ş: 'Ş',
        ö: 'Ö',
        ç: 'Ç',
      };

      const upperFirstChar =
        turkishUpperMap[firstChar] || firstChar.toUpperCase();
      return upperFirstChar + restOfText;
    } else {
      // İngilizce için standart sentence case - sadece ilk harf büyük
      if (sanitized.length === 0) return '';
      return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
    }
  }

  /**
   * Dil tespiti - içeriğe bakarak Türkçe/İngilizce tespit eder
   */
  public detectLanguage(text: string): 'TURKISH' | 'ENGLISH' {
    if (!text) return 'TURKISH';

    // Türkçe karakterlerin varlığını kontrol et
    const turkishChars = /[çğıöşüÇĞIÖŞÜ]/;
    if (turkishChars.test(text)) {
      return 'TURKISH';
    }

    // Türkçe kelimelerin varlığını kontrol et
    const turkishWords =
      /\b(için|ile|bir|bu|şu|olan|olan|saygılarımla|mektub|başvuru|pozisyon|şirket)\b/i;
    if (turkishWords.test(text)) {
      return 'TURKISH';
    }

    // İngilizce kelimelerin varlığını kontrol et
    const englishWords =
      /\b(for|with|and|the|this|that|position|company|application|letter|regards)\b/i;
    if (englishWords.test(text)) {
      return 'ENGLISH';
    }

    // Varsayılan olarak Türkçe
    return 'TURKISH';
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

      // Dil tespiti (kullanıcı belirtmemişse otomatik tespit)
      const detectedLanguage = language || this.detectLanguage(content);

      // Başlık
      doc.font('Roboto-Bold').fontSize(16);
      const title =
        detectedLanguage === 'TURKISH'
          ? `${this.formatTitle(companyName, 'TURKISH')} - ${this.formatTitle(positionTitle, 'TURKISH')} Pozisyonu İçin Başvuru Mektubu`
          : `Cover Letter For ${this.formatTitle(positionTitle, 'ENGLISH')} Position At ${this.formatTitle(companyName, 'ENGLISH')}`;

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

      // PDF'i sonlandır
      doc.end();

      const pdfBuffer = await pdfPromise;

      logger.info(formatMessage(SERVICE_MESSAGES.PDF.GENERATION_SUCCESS), {
        positionTitle: this.formatTitle(positionTitle, detectedLanguage),
        companyName: this.formatTitle(companyName, detectedLanguage),
        language: detectedLanguage,
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

      // Dil tespiti
      const detectedLanguage = this.detectLanguage(content);

      // Şirket bilgisi (üst kısmı daha minimal)
      doc.font('Roboto-Bold').fontSize(12);
      doc.text(this.formatTitle(companyName, detectedLanguage), 50, yPosition);
      yPosition += 15;

      doc.font('Roboto').fontSize(11);
      const positionText =
        detectedLanguage === 'TURKISH'
          ? `${this.formatTitle(positionTitle, 'TURKISH')} Pozisyonu`
          : `${this.formatTitle(positionTitle, 'ENGLISH')} Position`;
      doc.text(positionText, 50, yPosition);
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
        positionTitle: this.formatTitle(positionTitle, detectedLanguage),
        companyName: this.formatTitle(companyName, detectedLanguage),
        applicantName: applicantName
          ? this.formatTitle(applicantName, detectedLanguage)
          : null,
        pdfSize: pdfBuffer.length,
        detectedLanguage,
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