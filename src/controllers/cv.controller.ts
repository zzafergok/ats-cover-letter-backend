import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

import {
  extractSections,
  extractKeywords,
  extractCvContent,
  convertToMarkdown,
  cleanAndNormalizeText,
  generateDocumentMetadata,
  extractContactInformation,
} from '../services/cvService.service';
import { generateCvWithClaude } from '../services/claude.service';
import { FileCompressionService } from '../services/fileCompression.service';

import logger from '../config/logger';
import { SERVICE_MESSAGES, formatMessage, createErrorMessage } from '../constants/messages';
import { createCvSchema, saveCvSchema } from '../schemas';

export class CvController {
  private prisma = new PrismaClient();

  // CV processing function (previously handled by queue)
  private async processCvFile(filePath: string, cvUploadId: string): Promise<void> {
    try {
      // Extract content from CV
      const extractedText = await extractCvContent(filePath);
      const markdownContent = await convertToMarkdown(extractedText);
      const cleanedText = cleanAndNormalizeText(extractedText);

      // Extract structured information
      const contactInfo = extractContactInformation(cleanedText);
      const sections = extractSections(cleanedText);
      const keywords = extractKeywords(cleanedText);
      const metadata = generateDocumentMetadata(filePath, cleanedText);

      // Prepare extracted data
      const extractedData = {
        contactInformation: contactInfo,
        sections,
        keywords,
        metadata,
        rawText: extractedText,
      };

      // Get file compression service
      const compressionService = FileCompressionService.getInstance();
      const fileBuffer = fs.readFileSync(filePath);
      const compressedBuffer = await compressionService.compressFile(fileBuffer);

      // Update CV upload record
      await this.prisma.cvUpload.update({
        where: { id: cvUploadId },
        data: {
          processingStatus: 'COMPLETED',
          extractedData,
          markdownContent,
          fileData: compressedBuffer,
          originalSize: fileBuffer.length,
          compressedSize: compressedBuffer.length,
          compressionRatio:
            ((fileBuffer.length - compressedBuffer.length) / fileBuffer.length) *
            100,
        },
      });

      // Clean up temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      logger.info(formatMessage(SERVICE_MESSAGES.CV.PROCESSING_COMPLETED), { cvUploadId });
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.CV.PROCESSING_FAILED, error as Error));

      // Update status to failed
      await this.prisma.cvUpload.update({
        where: { id: cvUploadId },
        data: { processingStatus: 'FAILED' },
      });

      throw error;
    }
  }

  public uploadCv = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        logger.warn(formatMessage(SERVICE_MESSAGES.CV.NO_FILE_UPLOADED), { userId: req.user?.userId });
        res.status(400).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.NO_FILE_UPLOADED),
        });
        return;
      }

      logger.info('File upload attempt', {
        userId: req.user!.userId,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      const cvUpload = await this.prisma.cvUpload.create({
        data: {
          userId: req.user!.userId,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          filePath: req.file.path,
          processingStatus: 'PENDING',
        },
      });

      // Process CV synchronously instead of using Redis queue
      try {
        await this.processCvFile(req.file.path, cvUpload.id);
        logger.info(formatMessage(SERVICE_MESSAGES.CV.PROCESSING_COMPLETED), {
          cvUploadId: cvUpload.id,
          userId: req.user!.userId,
        });
      } catch (processingError) {
        logger.error(createErrorMessage(SERVICE_MESSAGES.CV.PROCESSING_FAILED, processingError as Error));
        // Update status to failed
        await this.prisma.cvUpload.update({
          where: { id: cvUpload.id },
          data: { processingStatus: 'FAILED' },
        });
      }

      res.json({
        success: true,
        message: formatMessage(SERVICE_MESSAGES.CV.UPLOAD_PROCESSING),
        data: {
          id: cvUpload.id,
          status: 'PENDING',
          message: formatMessage(SERVICE_MESSAGES.CV.PROCESSING_PENDING),
        },
      });
    } catch (error: any) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.CV.UPLOAD_ERROR, error), {
        stack: error.stack,
        userId: req.user?.userId,
        file: req.file
          ? {
              name: req.file.originalname,
              size: req.file.size,
              mimetype: req.file.mimetype,
            }
          : null,
      });

      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          logger.error(createErrorMessage(SERVICE_MESSAGES.CV.FILE_DELETE_ERROR, unlinkError as Error));
        }
      }

      let errorMessage = formatMessage(SERVICE_MESSAGES.CV.UPLOAD_ERROR);
      if (error.code === 'LIMIT_FILE_SIZE') {
        errorMessage = formatMessage(SERVICE_MESSAGES.CV.FILE_SIZE_EXCEEDED);
      } else if (error.message.includes(SERVICE_MESSAGES.FILE.UNSUPPORTED_FORMAT.message)) {
        errorMessage = error.message;
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  public getCvUploads = async (req: Request, res: Response): Promise<void> => {
    try {
      const cvUploads = await this.prisma.cvUpload.findMany({
        where: { userId: req.user!.userId },
        orderBy: { uploadDate: 'desc' },
        select: {
          id: true,
          originalName: true,
          uploadDate: true,
          extractedData: true,
          originalSize: true,
          compressedSize: true,
          compressionRatio: true,
        },
      });

      const uploadsWithInfo = cvUploads.map((upload) => ({
        id: upload.id,
        originalName: upload.originalName,
        uploadDate: upload.uploadDate,
        parsedData: upload.extractedData,
        sizeInfo: {
          originalSize: upload.originalSize
            ? `${(upload.originalSize / 1024).toFixed(2)} KB`
            : null,
          compressedSize: upload.compressedSize
            ? `${(upload.compressedSize / 1024).toFixed(2)} KB`
            : null,
          compressionRatio: upload.compressionRatio
            ? `${upload.compressionRatio.toFixed(2)}%`
            : null,
        },
      }));

      res.json({
        success: true,
        data: uploadsWithInfo,
        uploadLimit: {
          current: cvUploads.length,
          maximum: 5,
          remaining: Math.max(0, 5 - cvUploads.length),
        },
      });
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.CV.LIST_ERROR, error as Error));
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.LIST_ERROR),
      });
    }
  };

  public getCvUploadStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const cvUpload = await this.prisma.cvUpload.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
        select: {
          id: true,
          processingStatus: true,
          extractedData: true,
          markdownContent: true,
        },
      });

      if (!cvUpload) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: cvUpload.id,
          status: cvUpload.processingStatus,
          ready: cvUpload.processingStatus === 'COMPLETED',
          data: cvUpload.extractedData,
        },
      });
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.CV.STATUS_CHECK_ERROR, error as Error));
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.STATUS_CHECK_ERROR),
      });
    }
  };

  public deleteCvUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const cvUpload = await this.prisma.cvUpload.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
      });

      if (!cvUpload) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
        });
        return;
      }

      await this.prisma.cvUpload.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: formatMessage(SERVICE_MESSAGES.CV.DELETE_SUCCESS),
      });
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.CV.DELETE_ERROR, error as Error));
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.DELETE_ERROR),
      });
    }
  };

  public generateCv = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        positionTitle,
        companyName,
        cvType,
        jobDescription,
        additionalRequirements,
        targetKeywords,
      } = createCvSchema.parse(req.body);
      const { cvUploadId } = req.body;

      if (!cvUploadId) {
        res.status(400).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.UPLOAD_ID_REQUIRED),
        });
        return;
      }

      const cvUpload = await this.prisma.cvUpload.findFirst({
        where: {
          id: cvUploadId,
          userId: req.user!.userId,
        },
        select: {
          extractedData: true,
        },
      });

      if (!cvUpload || !cvUpload.extractedData) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.DATA_NOT_FOUND),
        });
        return;
      }

      const generatedCv = await generateCvWithClaude({
        parsedCvData: cvUpload.extractedData,
        positionTitle,
        companyName,
        cvType,
        jobDescription,
        additionalRequirements,
        targetKeywords,
      });

      res.json({
        success: true,
        message: formatMessage(SERVICE_MESSAGES.CV.GENERATION_SUCCESS),
        data: {
          content: generatedCv,
          positionTitle,
          companyName,
          cvType,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.INVALID_DATA),
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      logger.error(createErrorMessage(SERVICE_MESSAGES.CV.GENERATION_ERROR, error as Error));
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.GENERATION_ERROR),
      });
    }
  };

  public saveCv = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, content, cvType } = saveCvSchema.parse(req.body);

      const userCvCount = await this.prisma.savedCv.count({
        where: { userId: req.user!.userId },
      });

      if (userCvCount >= 5) {
        res.status(400).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.SAVE_LIMIT_EXCEEDED),
        });
        return;
      }

      const savedCv = await this.prisma.savedCv.create({
        data: {
          userId: req.user!.userId,
          title,
          content,
          cvType,
        },
      });

      res.json({
        success: true,
        message: formatMessage(SERVICE_MESSAGES.CV.SAVE_SUCCESS),
        data: savedCv,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.INVALID_DATA),
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }

      logger.error(createErrorMessage(SERVICE_MESSAGES.CV.SAVE_ERROR, error as Error));
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.SAVE_ERROR),
      });
    }
  };

  public getSavedCvs = async (req: Request, res: Response): Promise<void> => {
    try {
      const savedCvs = await this.prisma.savedCv.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: savedCvs,
      });
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.CV.SAVED_LIST_ERROR, error as Error));
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.SAVED_LIST_ERROR),
      });
    }
  };

  public deleteSavedCv = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const savedCv = await this.prisma.savedCv.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
      });

      if (!savedCv) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
        });
        return;
      }

      await this.prisma.savedCv.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: formatMessage(SERVICE_MESSAGES.CV.DELETE_SUCCESS),
      });
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.CV.DELETE_ERROR, error as Error));
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.DELETE_ERROR),
      });
    }
  };

  public downloadCv = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const cvUpload = await this.prisma.cvUpload.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
      });

      if (!cvUpload) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
        });
        return;
      }

      if (!cvUpload.fileData) {
        res.status(404).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.FILE_NOT_IN_DATABASE),
        });
        return;
      }

      const compressionService = FileCompressionService.getInstance();
      const decompressedBuffer = await compressionService.decompressFile(
        Buffer.from(cvUpload.fileData)
      );

      const fileExtension = path.extname(cvUpload.originalName).toLowerCase();
      let contentType = 'application/octet-stream';

      if (fileExtension === '.pdf') {
        contentType = 'application/pdf';
      } else if (fileExtension === '.docx') {
        contentType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (fileExtension === '.doc') {
        contentType = 'application/msword';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${cvUpload.originalName}"`
      );
      res.send(decompressedBuffer);
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.CV.DOWNLOAD_ERROR, error as Error));
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.DOWNLOAD_ERROR),
      });
    }
  };
}