import { z } from 'zod';
import express from 'express';

import { authenticateToken } from '../middleware/auth';

import { PdfService } from '../services/pdf.service';
import { CoverLetterBasicService } from '../services/coverLetterBasic.service';

import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';

// Import validation schemas
import { createCoverLetterSchema, updateCoverLetterSchema } from '../schemas';

const router = express.Router();
const coverLetterService = CoverLetterBasicService.getInstance();
const pdfService = PdfService.getInstance();

// Cover letter oluştur
router.post('/', authenticateToken, async (req, res) => {
  try {
    const validatedData = createCoverLetterSchema.parse(req.body);

    const coverLetter = await coverLetterService.createCoverLetter(
      req.user!.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_CREATION_STARTED.message,
      data: coverLetter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: SERVICE_MESSAGES.RESPONSE.INVALID_DATA.message,
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
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
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

// Cover letter durumunu ve içeriğini getir
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const coverLetter = await coverLetterService.getCoverLetter(
      req.user!.userId,
      id
    );

    if (!coverLetter) {
      return res.status(404).json({
        success: false,
        message: 'Cover letter bulunamadı',
      });
    }

    return res.json({
      success: true,
      data: coverLetter,
    });
  } catch (error) {
    logger.error(SERVICE_MESSAGES.LOGGER.COVER_LETTER_GET_ERROR.message, error);
    return res.status(500).json({
      success: false,
      message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_INFO_ERROR.message,
    });
  }
});

// Cover letter güncelle
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { updatedContent } = updateCoverLetterSchema.parse(req.body);

    const updatedCoverLetter = await coverLetterService.updateCoverLetter(
      req.user!.userId,
      id,
      updatedContent
    );

    return res.json({
      success: true,
      message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_UPDATE_SUCCESS.message,
      data: updatedCoverLetter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: SERVICE_MESSAGES.RESPONSE.INVALID_DATA.message,
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    logger.error(SERVICE_MESSAGES.LOGGER.COVER_LETTER_UPDATE_ERROR.message, error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : SERVICE_MESSAGES.RESPONSE.COVER_LETTER_UPDATE_ERROR.message;
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

// Kullanıcının tüm cover letter'larını listele
router.get('/', authenticateToken, async (req, res) => {
  try {
    const coverLetters = await coverLetterService.getUserCoverLetters(
      req.user!.userId
    );

    return res.json({
      success: true,
      data: coverLetters,
    });
  } catch (error) {
    logger.error(SERVICE_MESSAGES.LOGGER.COVER_LETTER_LIST_ERROR.message, error);
    return res.status(500).json({
      success: false,
      message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_LIST_ERROR.message,
    });
  }
});

// Cover letter sil
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await coverLetterService.deleteCoverLetter(req.user!.userId, id);

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
});

// PDF olarak indir
router.get('/:id/download/pdf', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const coverLetter = await coverLetterService.getCoverLetter(
      req.user!.userId,
      id
    );

    if (!coverLetter) {
      return res.status(404).json({
        success: false,
        message: 'Cover letter bulunamadı',
      });
    }

    if (
      coverLetter.generationStatus !== 'COMPLETED' ||
      !coverLetter.generatedContent
    ) {
      return res.status(400).json({
        success: false,
        message: SERVICE_MESSAGES.RESPONSE.COVER_LETTER_NOT_READY.message,
      });
    }

    // PDF oluştur
    const pdfBuffer = await pdfService.generateCoverLetterPdfWithCustomFormat(
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
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    logger.error(SERVICE_MESSAGES.LOGGER.PDF_DOWNLOAD_ERROR.message, error);
    return res.status(500).json({
      success: false,
      message: SERVICE_MESSAGES.RESPONSE.PDF_GENERATION_ERROR.message,
    });
  }
});

export default router;
