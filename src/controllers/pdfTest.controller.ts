import { Request, Response } from 'express';
import { PdfService } from '../services/pdf.service';
import logger from '../config/logger';

export class PdfTestController {
  private pdfService = PdfService.getInstance();

  public testTurkishCharacters = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      logger.info('Turkish character test PDF generation started');
      
      const pdfBuffer = await this.pdfService.generateTurkishCharacterTest();

      // HTTP headers ayarla
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="turkish-character-test.pdf"'
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
      
      logger.info('Turkish character test PDF sent successfully', {
        pdfSize: pdfBuffer.length
      });
    } catch (error) {
      logger.error('Turkish character test PDF generation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Test PDF oluşturulamadı',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}