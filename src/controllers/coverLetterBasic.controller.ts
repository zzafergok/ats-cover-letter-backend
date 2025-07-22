import { Request, Response } from 'express';
import { z } from 'zod';

import { PdfService } from '../services/pdf.service';
import { CoverLetterBasicService } from '../services/coverLetterBasic.service';

import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';
import { createCoverLetterSchema, updateCoverLetterSchema } from '../schemas';

export class CoverLetterBasicController {
  private coverLetterService = CoverLetterBasicService.getInstance();
  private pdfService = PdfService.getInstance();

  public createCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const validatedData = createCoverLetterSchema.parse(req.body);

      const coverLetter = await this.coverLetterService.createCoverLetter(
        req.user!.userId,
        req.user!.role,
        validatedData
      );

      res.status(201).json({
        success: true,
        message:
          SERVICE_MESSAGES.RESPONSE.COVER_LETTER_CREATION_STARTED.message,
        data: coverLetter,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: SERVICE_MESSAGES.RESPONSE.INVALID_DATA.message,
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.COVER_LETTER.GENERATION_FAILED,
          error as Error
        )
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : formatMessage(SERVICE_MESSAGES.COVER_LETTER.GENERATION_FAILED);
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  public getCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      const coverLetter = await this.coverLetterService.getCoverLetter(
        req.user!.userId,
        id
      );

      if (!coverLetter) {
        res.status(404).json({
          success: false,
          message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_NOT_FOUND.message,
        });
        return;
      }

      res.json({
        success: true,
        data: coverLetter,
      });
    } catch (error) {
      logger.error(
        SERVICE_MESSAGES.LOGGER.COVER_LETTER_GET_ERROR.message,
        error
      );
      res.status(500).json({
        success: false,
        message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_INFO_ERROR.message,
      });
    }
  };

  public updateCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { updatedContent } = updateCoverLetterSchema.parse(req.body);

      const updatedCoverLetter =
        await this.coverLetterService.updateCoverLetter(
          req.user!.userId,
          id,
          updatedContent
        );

      res.json({
        success: true,
        message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_UPDATE_SUCCESS.message,
        data: updatedCoverLetter,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: SERVICE_MESSAGES.RESPONSE.INVALID_DATA.message,
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error(
        SERVICE_MESSAGES.LOGGER.COVER_LETTER_UPDATE_ERROR.message,
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : SERVICE_MESSAGES.RESPONSE.COVER_LETTER_UPDATE_ERROR.message;
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  public getUserCoverLetters = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const result = await this.coverLetterService.getUserCoverLetters(
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
        SERVICE_MESSAGES.LOGGER.COVER_LETTER_LIST_ERROR.message,
        error
      );
      res.status(500).json({
        success: false,
        message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_LIST_ERROR.message,
      });
    }
  };

  public deleteCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      await this.coverLetterService.deleteCoverLetter(req.user!.userId, id);

      res.json({
        success: true,
        message: SERVICE_MESSAGES.COVER_LETTER.DELETE_SUCCESS.message,
      });
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error)
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : formatMessage(SERVICE_MESSAGES.GENERAL.FAILED);
      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  public downloadPdf = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const coverLetter = await this.coverLetterService.getCoverLetter(
        req.user!.userId,
        id
      );

      if (!coverLetter) {
        res.status(404).json({
          success: false,
          message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_NOT_FOUND.message,
        });
        return;
      }

      if (
        coverLetter.generationStatus !== 'COMPLETED' ||
        !coverLetter.generatedContent
      ) {
        res.status(400).json({
          success: false,
          message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_NOT_READY.message,
        });
        return;
      }

      // PDF oluştur
      const pdfBuffer =
        await this.pdfService.generateCoverLetterPdfWithCustomFormat(
          coverLetter.generatedContent,
          coverLetter.positionTitle,
          coverLetter.companyName
        );

      // PDF dosya adı oluştur
      const sanitizedCompany = coverLetter.companyName
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const sanitizedPosition = coverLetter.positionTitle
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_');
      const fileName = `${sanitizedCompany}_${sanitizedPosition}_Cover_Letter.pdf`;

      // HTTP headers ayarla
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      logger.error(SERVICE_MESSAGES.LOGGER.PDF_DOWNLOAD_ERROR.message, error);
      res.status(500).json({
        success: false,
        message: SERVICE_MESSAGES.RESPONSE.PDF_GENERATION_ERROR.message,
      });
    }
  };
}
