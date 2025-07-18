// src/routes/cv.ts

import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import multer from 'multer';
import express from 'express';
import { PrismaClient } from '@prisma/client';

import { authenticateToken } from '../middleware/auth';
import { generateCvWithClaude } from '../services/claudeService.service';
import { FileCompressionService } from '../services/fileCompression.service';
import {
  extractCvContent,
  convertToMarkdown,
  cleanAndNormalizeText,
  extractContactInformation,
  extractSections,
  extractKeywords,
  generateDocumentMetadata,
} from '../services/cvService.service';

const router = express.Router();
const prisma = new PrismaClient();

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
    console.log('File filter:', file);
    const allowedTypes = /\.(pdf|doc|docx)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece PDF, DOC ve DOCX dosyaları kabul edilir'));
    }
  },
});

router.post(
  '/upload',
  authenticateToken,
  upload.single('cvFile'),
  async (req, res) => {
    try {
      console.log('Request headers:', req.headers);
      console.log('Request file:', req.file);
      console.log('Request body:', req.body);
      console.log('Files uploaded:', req.files);

      if (!req.file) {
        console.log('No file received in request');
        return res.status(400).json({
          success: false,
          message: 'CV dosyası yüklenmedi',
          debug: {
            headers: req.headers,
            hasFile: !!req.file,
            fileSize: req.file?.size || 0,
          },
        });
      }

      console.log('File details:', {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      });

      // Dosya boyutu kontrolü
      if (req.file.size === 0) {
        console.log('File size is zero');
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Yüklenen dosya boş',
        });
      }

      // Dosya tipi kontrolü
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Desteklenmeyen dosya tipi',
        });
      }

      const extractedText = await extractCvContent(req.file.path);

      // Metin içeriği kontrolü
      if (!extractedText || extractedText.trim().length < 10) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message:
            'CV dosyasından metin çıkarılamadı veya dosya içeriği yetersiz',
        });
      }

      const cleanedText = cleanAndNormalizeText(extractedText);
      const markdownContent = await convertToMarkdown(cleanedText);
      const contactInfo = extractContactInformation(cleanedText);
      const sections = extractSections(cleanedText);
      const keywords = extractKeywords(cleanedText);
      const metadata = generateDocumentMetadata(req.file.path, cleanedText);

      const cvUpload = await prisma.cvUpload.create({
        data: {
          userId: req.user!.userId,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          filePath: req.file.path,
          markdownContent,
          extractedData: {
            originalText: extractedText,
            cleanedText,
            contactInfo,
            sections,
            keywords,
            metadata,
            uploadTime: new Date().toISOString(),
          },
        },
      });

      return res.json({
        success: true,
        message: 'CV başarıyla yüklendi ve işlendi',
        data: {
          id: cvUpload.id,
          originalName: cvUpload.originalName,
          markdownContent: cvUpload.markdownContent,
          extractedData: cvUpload.extractedData,
          uploadDate: cvUpload.uploadDate,
        },
      });
    } catch (error) {
      console.error('CV yükleme hatası:', error);

      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Dosya silme hatası:', unlinkError);
        }
      }

      return res.status(500).json({
        success: false,
        message: 'CV işlenirken hata oluştu',
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

    res.json({
      success: true,
      data: uploadsWithInfo,
      uploadLimit: {
        current: cvUploads.length,
        maximum: 5,
        remaining: 5 - cvUploads.length,
      },
    });
  } catch (error) {
    console.error('CV listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'CV listesi alınırken hata oluştu',
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
        message: 'CV bulunamadı',
      });
    }

    await prisma.cvUpload.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'CV başarıyla silindi',
    });
  } catch (error) {
    console.error('CV silme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'CV silinirken hata oluştu',
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
        message: "CV yükleme ID'si gereklidir",
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
        message: 'CV verisi bulunamadı',
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
      message: 'CV başarıyla oluşturuldu',
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
        message: 'Geçersiz veri',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    console.error('CV oluşturma hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'CV oluşturulurken hata oluştu',
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
        message: 'Maksimum 5 CV kaydedebilirsiniz',
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
      message: 'CV başarıyla kaydedildi',
      data: savedCv,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    console.error('CV kaydetme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'CV kaydedilirken hata oluştu',
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
    console.error("Kayıtlı CV'ler getirme hatası:", error);
    res.status(500).json({
      success: false,
      message: "Kayıtlı CV'ler alınırken hata oluştu",
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
        message: 'CV bulunamadı',
      });
    }

    await prisma.savedCv.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'CV başarıyla silindi',
    });
  } catch (error) {
    console.error('CV silme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'CV silinirken hata oluştu',
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
        message: 'CV bulunamadı',
      });
    }

    if (!cvUpload.fileData) {
      return res.status(404).json({
        success: false,
        message: 'PDF dosyası veritabanında bulunamadı',
      });
    }

    const compressionService = FileCompressionService.getInstance();
    const decompressedBuffer = await compressionService.decompressFile(
      Buffer.from(cvUpload.fileData)
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${cvUpload.originalName}"`
    );
    return res.send(decompressedBuffer);
  } catch (error) {
    console.error('CV indirme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'CV indirilirken hata oluştu',
    });
  }
});

export default router;
