import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import multer from 'multer';
import express from 'express';
import { PrismaClient } from '@prisma/client';

import { authenticateToken } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';

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

const router = express.Router();
const prisma = new PrismaClient();

// CV processing function (previously handled by queue)
async function processCvFile(filePath: string, cvUploadId: string) {
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
    await prisma.cvUpload.update({
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
    await prisma.cvUpload.update({
      where: { id: cvUploadId },
      data: { processingStatus: 'FAILED' },
    });

    throw error;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/temp';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    logger.info('File filter check', {
      name: file.originalname,
      mime: file.mimetype,
      size: file.size
    });

    const allowedExtensions = /\.(pdf|doc|docx)$/i;
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const hasValidExtension = allowedExtensions.test(file.originalname);
    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);

    if (hasValidExtension && hasValidMimeType) {
      cb(null, true);
    } else {
      const error = new Error(
        `${formatMessage(SERVICE_MESSAGES.FILE.UNSUPPORTED_FORMAT)}. Dosya: ${file.originalname}, MIME: ${file.mimetype}`
      );
      logger.error(createErrorMessage(SERVICE_MESSAGES.FILE.UNSUPPORTED_FORMAT, error));
      cb(error);
    }
  },
});

router.post(
  '/upload',
  authenticateToken,
  uploadLimiter,
  upload.single('cvFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        logger.warn(formatMessage(SERVICE_MESSAGES.CV.NO_FILE_UPLOADED), { userId: req.user?.userId });
        return res.status(400).json({
          success: false,
          message: formatMessage(SERVICE_MESSAGES.CV.NO_FILE_UPLOADED),
        });
      }

      logger.info('File upload attempt', {
        userId: req.user!.userId,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      const cvUpload = await prisma.cvUpload.create({
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
        await processCvFile(req.file.path, cvUpload.id);
        logger.info(formatMessage(SERVICE_MESSAGES.CV.PROCESSING_COMPLETED), {
          cvUploadId: cvUpload.id,
          userId: req.user!.userId,
        });
      } catch (processingError) {
        logger.error(createErrorMessage(SERVICE_MESSAGES.CV.PROCESSING_FAILED, processingError as Error));
        // Update status to failed
        await prisma.cvUpload.update({
          where: { id: cvUpload.id },
          data: { processingStatus: 'FAILED' },
        });
      }

      return res.json({
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

      return res.status(500).json({
        success: false,
        message: errorMessage,
      });
    }
  }
);

router.get('/uploads', authenticateToken, async (req, res) => {
  try {
    const cvUploads = await prisma.cvUpload.findMany({
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

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: formatMessage(SERVICE_MESSAGES.CV.LIST_ERROR),
    });
  }
});

router.get('/upload/status/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const cvUpload = await prisma.cvUpload.findFirst({
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
      return res.status(404).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
      });
    }

    return res.json({
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
    return res.status(500).json({
      success: false,
      message: formatMessage(SERVICE_MESSAGES.CV.STATUS_CHECK_ERROR),
    });
  }
});

router.delete('/uploads/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const cvUpload = await prisma.cvUpload.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!cvUpload) {
      return res.status(404).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
      });
    }

    await prisma.cvUpload.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: formatMessage(SERVICE_MESSAGES.CV.DELETE_SUCCESS),
    });
  } catch (error) {
    logger.error(createErrorMessage(SERVICE_MESSAGES.CV.DELETE_ERROR, error as Error));
    return res.status(500).json({
      success: false,
      message: formatMessage(SERVICE_MESSAGES.CV.DELETE_ERROR),
    });
  }
});

const createCvSchema = z.object({
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  cvType: z.enum(['ATS_OPTIMIZED', 'CREATIVE', 'TECHNICAL']),
  jobDescription: z.string().optional(),
  additionalRequirements: z.string().optional(),
  targetKeywords: z.array(z.string()).optional(),
});

const saveCvSchema = z.object({
  title: z.string().min(1, 'CV başlığı gereklidir'),
  content: z.string().min(1, 'CV içeriği gereklidir'),
  cvType: z.enum(['ATS_OPTIMIZED', 'CREATIVE', 'TECHNICAL']),
});

router.post('/generate', authenticateToken, async (req, res) => {
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
      return res.status(400).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.UPLOAD_ID_REQUIRED),
      });
    }

    const cvUpload = await prisma.cvUpload.findFirst({
      where: {
        id: cvUploadId,
        userId: req.user!.userId,
      },
      select: {
        extractedData: true,
      },
    });

    if (!cvUpload || !cvUpload.extractedData) {
      return res.status(404).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.DATA_NOT_FOUND),
      });
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

    return res.json({
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
      return res.status(400).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.INVALID_DATA),
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    logger.error(createErrorMessage(SERVICE_MESSAGES.CV.GENERATION_ERROR, error as Error));
    return res.status(500).json({
      success: false,
      message: formatMessage(SERVICE_MESSAGES.CV.GENERATION_ERROR),
    });
  }
});

router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { title, content, cvType } = saveCvSchema.parse(req.body);

    const userCvCount = await prisma.savedCv.count({
      where: { userId: req.user!.userId },
    });

    if (userCvCount >= 5) {
      return res.status(400).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.SAVE_LIMIT_EXCEEDED),
      });
    }

    const savedCv = await prisma.savedCv.create({
      data: {
        userId: req.user!.userId,
        title,
        content,
        cvType,
      },
    });

    return res.json({
      success: true,
      message: formatMessage(SERVICE_MESSAGES.CV.SAVE_SUCCESS),
      data: savedCv,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.INVALID_DATA),
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    logger.error(createErrorMessage(SERVICE_MESSAGES.CV.SAVE_ERROR, error as Error));
    return res.status(500).json({
      success: false,
      message: formatMessage(SERVICE_MESSAGES.CV.SAVE_ERROR),
    });
  }
});

router.get('/saved', authenticateToken, async (req, res) => {
  try {
    const savedCvs = await prisma.savedCv.findMany({
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
});

router.delete('/saved/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const savedCv = await prisma.savedCv.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!savedCv) {
      return res.status(404).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
      });
    }

    await prisma.savedCv.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: formatMessage(SERVICE_MESSAGES.CV.DELETE_SUCCESS),
    });
  } catch (error) {
    logger.error(createErrorMessage(SERVICE_MESSAGES.CV.DELETE_ERROR, error as Error));
    return res.status(500).json({
      success: false,
      message: formatMessage(SERVICE_MESSAGES.CV.DELETE_ERROR),
    });
  }
});

router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const cvUpload = await prisma.cvUpload.findFirst({
      where: {
        id,
        userId: req.user!.userId,
      },
    });

    if (!cvUpload) {
      return res.status(404).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND),
      });
    }

    if (!cvUpload.fileData) {
      return res.status(404).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.CV.FILE_NOT_IN_DATABASE),
      });
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
    return res.send(decompressedBuffer);
  } catch (error) {
    logger.error(createErrorMessage(SERVICE_MESSAGES.CV.DOWNLOAD_ERROR, error as Error));
    return res.status(500).json({
      success: false,
      message: formatMessage(SERVICE_MESSAGES.CV.DOWNLOAD_ERROR),
    });
  }
});

export default router;
