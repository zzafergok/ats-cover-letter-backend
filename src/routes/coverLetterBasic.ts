import express from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { CoverLetterBasicService } from '../services/coverLetterBasic.service';
import { PdfService } from '../services/pdf.service';
import logger from '../config/logger';

const router = express.Router();
const coverLetterService = CoverLetterBasicService.getInstance();
const pdfService = PdfService.getInstance();

// Validation schemas
const createCoverLetterSchema = z.object({
  cvUploadId: z.string().min(1, 'CV upload ID gereklidir'),
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  jobDescription: z.string().min(10, 'İş tanımı en az 10 karakter olmalıdır'),
  language: z.enum(['TURKISH', 'ENGLISH'], {
    errorMap: () => ({ message: 'Dil seçeneği TURKISH veya ENGLISH olmalıdır' })
  }).default('TURKISH'),
});

const updateCoverLetterSchema = z.object({
  updatedContent: z
    .string()
    .min(50, 'Cover letter içeriği en az 50 karakter olmalıdır'),
});

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
      message: 'Cover letter oluşturma işlemi başlatıldı',
      data: coverLetter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    logger.error('Cover letter oluşturma hatası:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Cover letter oluşturulurken hata oluştu';
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
    logger.error('Cover letter getirme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Cover letter bilgileri alınırken hata oluştu',
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
      message: 'Cover letter başarıyla güncellendi',
      data: updatedCoverLetter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    logger.error('Cover letter güncelleme hatası:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Cover letter güncellenirken hata oluştu';
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
    logger.error('Cover letter listesi getirme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Cover letter listesi alınırken hata oluştu',
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
      message: 'Cover letter başarıyla silindi',
    });
  } catch (error) {
    logger.error('Cover letter silme hatası:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Cover letter silinirken hata oluştu';
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
        message: 'Cover letter henüz hazır değil veya içerik bulunamadı',
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
    logger.error('PDF indirme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'PDF oluşturulurken hata oluştu',
    });
  }
});

export default router;
