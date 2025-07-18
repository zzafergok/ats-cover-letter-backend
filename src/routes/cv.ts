// src/routes/cv.ts

import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import multer from 'multer';
import express from 'express';
import { PrismaClient } from '@prisma/client';

import { authenticateToken } from '../middleware/auth';
import { generateCvWithClaude } from '../services/claudeService.service';
import { generatePdf, generateDocx } from '../services/documentService.service';
import {
  extractCvContent,
  convertToMarkdown,
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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
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
    let uploadedFilePath: string | null = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'CV dosyası yüklenmedi',
        });
      }

      uploadedFilePath = req.file.path;
      const extractedText = await extractCvContent(uploadedFilePath);
      const markdownContent = await convertToMarkdown(extractedText);

      const cvUpload = await prisma.cvUpload.create({
        data: {
          userId: req.user!.userId,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          filePath: 'processed',
          markdownContent,
          extractedData: {
            fileType: path.extname(req.file.originalname).toLowerCase(),
            fileSize: req.file.size,
            processedAt: new Date().toISOString(),
          },
        },
      });

      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }

      return res.json({
        success: true,
        message: 'CV başarıyla yüklendi ve işlendi',
        data: {
          id: cvUpload.id,
          originalName: cvUpload.originalName,
          markdownContent: cvUpload.markdownContent,
          uploadDate: cvUpload.uploadDate,
        },
      });
    } catch (error) {
      console.error('CV yükleme hatası:', error);

      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        try {
          fs.unlinkSync(uploadedFilePath);
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
        markdownContent: true,
      },
    });

    res.json({
      success: true,
      data: cvUploads,
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
        message: 'CV yüklemesi bulunamadı',
      });
    }

    await prisma.cvUpload.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'CV yüklemesi başarıyla silindi',
    });
  } catch (error) {
    console.error('CV yükleme silme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'CV yüklemesi silinirken hata oluştu',
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
    });

    if (!cvUpload) {
      return res.status(404).json({
        success: false,
        message: 'CV verisi bulunamadı',
      });
    }

    const generatedCv = await generateCvWithClaude({
      originalCvContent: cvUpload.markdownContent!,
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

router.post('/download/:format', authenticateToken, async (req, res) => {
  try {
    const { format } = req.params;
    const { content, fileName } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'CV içeriği gereklidir',
      });
    }

    const safeFileName = fileName || 'cv';

    if (format === 'pdf') {
      const pdfBuffer = await generatePdf(content);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFileName}.pdf"`
      );
      return res.send(pdfBuffer);
    } else if (format === 'docx') {
      const docxBuffer = await generateDocx(content);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFileName}.docx"`
      );
      return res.send(docxBuffer);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Desteklenen formatlar: pdf, docx',
      });
    }
  } catch (error) {
    console.error('CV indirme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'CV indirilirken hata oluştu',
    });
  }
});

export default router;
