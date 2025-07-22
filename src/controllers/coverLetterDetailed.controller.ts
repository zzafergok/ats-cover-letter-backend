import { Request, Response } from 'express';
import { z } from 'zod';

import { CoverLetterDetailedService } from '../services/coverLetterDetailed.service';
import { PdfService } from '../services/pdf.service';

import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';
import { createDetailedCoverLetterSchema, updateDetailedCoverLetterSchema } from '../schemas';

export class CoverLetterDetailedController {
  private coverLetterDetailedService = CoverLetterDetailedService.getInstance();
  private pdfService = PdfService.getInstance();

  public createDetailedCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const validatedData = createDetailedCoverLetterSchema.parse(req.body);

      const coverLetter = await this.coverLetterDetailedService.createDetailedCoverLetter(
        req.user!.userId,
        req.user!.role,
        validatedData
      );

      res.status(201).json({
        success: true,
        message: 'Detaylı cover letter oluşturma başlatıldı',
        data: coverLetter,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error(
        createErrorMessage(SERVICE_MESSAGES.COVER_LETTER.GENERATION_FAILED, error as Error)
      );
      res.status(500).json({
        success: false,
        message: (error as Error).message || formatMessage(SERVICE_MESSAGES.COVER_LETTER.GENERATION_FAILED),
      });
    }
  };

  public getDetailedCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const coverLetter = await this.coverLetterDetailedService.getDetailedCoverLetter(
        req.user!.userId,
        id
      );

      if (!coverLetter) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.COVER_LETTER.NOT_FOUND),
        });
        return;
      }

      res.json({
        success: true,
        data: coverLetter,
      });
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.COVER_LETTER_DETAILED.GET_ERROR, error as Error)
      );
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.COVER_LETTER_DETAILED.GET_ERROR),
      });
    }
  };

  public updateDetailedCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { updatedContent } = updateDetailedCoverLetterSchema.parse(req.body);

      const updatedCoverLetter =
        await this.coverLetterDetailedService.updateDetailedCoverLetter(
          req.user!.userId,
          id,
          updatedContent
        );

      res.json({
        success: true,
        message: 'Detaylı cover letter başarıyla güncellendi',
        data: updatedCoverLetter,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error(
        createErrorMessage(SERVICE_MESSAGES.COVER_LETTER_DETAILED.UPDATE_ERROR, error as Error)
      );
      res.status(500).json({
        success: false,
        message: (error as Error).message || formatMessage(SERVICE_MESSAGES.COVER_LETTER_DETAILED.UPDATE_ERROR),
      });
    }
  };

  public getUserDetailedCoverLetters = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const result = await this.coverLetterDetailedService.getUserDetailedCoverLetters(
        req.user!.userId,
        req.user!.role
      );

      res.json({
        success: true,
        data: result.coverLetters,
        limitInfo: result.limitInfo,
      });
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.COVER_LETTER_DETAILED.LIST_ERROR, error as Error)
      );
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.COVER_LETTER_DETAILED.LIST_ERROR),
      });
    }
  };

  public deleteDetailedCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      await this.coverLetterDetailedService.deleteDetailedCoverLetter(
        req.user!.userId,
        id
      );

      res.json({
        success: true,
        message: 'Detaylı cover letter başarıyla silindi',
      });
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.COVER_LETTER_DETAILED.DELETE_ERROR, error as Error)
      );
      res.status(500).json({
        success: false,
        message: (error as Error).message || formatMessage(SERVICE_MESSAGES.COVER_LETTER_DETAILED.DELETE_ERROR),
      });
    }
  };

  public downloadDetailedCoverLetterPdf = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const coverLetter = await this.coverLetterDetailedService.getDetailedCoverLetter(
        req.user!.userId,
        id
      );

      if (!coverLetter) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.COVER_LETTER.NOT_FOUND),
        });
        return;
      }

      if (!coverLetter.generatedContent) {
        res.status(400).json({
          success: false,
          message: 'Cover letter henüz oluşturulmamış veya içerik boş',
        });
        return;
      }

      const pdfBuffer = await this.pdfService.generateCoverLetterPdf({
        content: coverLetter.generatedContent,
        positionTitle: coverLetter.positionTitle,
        companyName: coverLetter.companyName,
        language: coverLetter.language as 'TURKISH' | 'ENGLISH',
      });

      const fileName = `${coverLetter.companyName}_${coverLetter.positionTitle}_Cover_Letter.pdf`
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.PDF.GENERATION_ERROR, error as Error)
      );
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.PDF.GENERATION_ERROR),
      });
    }
  };
}