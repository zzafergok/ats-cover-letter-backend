import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import logger from '../config/logger';

export class FontLoader {
  private static cachedFonts: { [key: string]: Buffer } = {};

  /**
   * Font yükleme - PDF Service'ten alınan font loading sistemi
   */
  private static async loadFont(fontName: string): Promise<Buffer> {
    if (!FontLoader.cachedFonts[fontName]) {
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

      FontLoader.cachedFonts[fontName] = fs.readFileSync(fontPath);
      logger.info(`Font loaded and cached: ${fontName} from ${fontPath}`);
    }

    return FontLoader.cachedFonts[fontName];
  }

  /**
   * Türkçe destekleyen PDF document oluştur
   */
  static async createPDFDocument(options?: any): Promise<InstanceType<typeof PDFDocument>> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'ATS Optimized Resume',
        Author: 'ATS Cover Letter System',
        Subject: 'Professional Resume with Turkish Support',
        Creator: 'PDFKit with Turkish Support',
        Producer: 'PDFKit with Turkish Support',
      },
      ...options
    });

    try {
      // Noto Sans fonts - Google'ın en zarif ve kapsamlı Türkçe destekli fontu
      const notoSansRegular = await FontLoader.loadFont('NotoSans-Regular');
      const notoSansBold = await FontLoader.loadFont('NotoSans-Bold');
      const notoSansItalic = await FontLoader.loadFont('NotoSans-Italic');

      doc.registerFont('NotoSans', notoSansRegular);
      doc.registerFont('NotoSans-Bold', notoSansBold);
      doc.registerFont('NotoSans-Italic', notoSansItalic);

      // Varsayılan fontu ayarla
      doc.font('NotoSans');

      logger.info('PDF document created with Noto Sans fonts for Turkish support');
    } catch (error) {
      logger.error('Noto Sans font loading failed, using fallback fonts', error);
      // Fallback olarak Roboto fontlarını dene
      try {
        const robotoRegular = await FontLoader.loadFont('Roboto-Regular');
        const robotoBold = await FontLoader.loadFont('Roboto-Bold');
        doc.registerFont('NotoSans', robotoRegular);
        doc.registerFont('NotoSans-Bold', robotoBold);
        doc.font('NotoSans');
        logger.info('Using Roboto fonts as fallback');
      } catch (fallbackError) {
        logger.error('All font loading failed, using system fonts', fallbackError);
        doc.font('Helvetica');
      }
    }

    return doc;
  }

  /**
   * Font cache'ini temizle (testing için)
   */
  static clearFontCache(): void {
    FontLoader.cachedFonts = {};
  }
}