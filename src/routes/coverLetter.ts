import { z } from 'zod';
import express from 'express';
import { PrismaClient } from '@prisma/client';

import { authenticateToken } from '../middleware/auth';

import { generatePdf, generateDocx } from '../services/documentService.service';
import { generateCoverLetterWithClaude } from '../services/claudeService';

const router = express.Router();
const prisma = new PrismaClient();

const createCoverLetterSchema = z.object({
  category: z.enum([
    'SOFTWARE_DEVELOPER',
    'MARKETING_SPECIALIST',
    'SALES_REPRESENTATIVE',
    'PROJECT_MANAGER',
    'DATA_ANALYST',
    'UI_UX_DESIGNER',
    'BUSINESS_ANALYST',
    'CUSTOMER_SERVICE',
    'HR_SPECIALIST',
    'FINANCE_SPECIALIST',
    'CONTENT_WRITER',
    'DIGITAL_MARKETING',
    'PRODUCT_MANAGER',
    'QUALITY_ASSURANCE',
    'GRAPHIC_DESIGNER',
    'ADMINISTRATIVE_ASSISTANT',
    'CONSULTANT',
    'ENGINEER',
    'TEACHER',
    'HEALTHCARE',
    'LEGAL',
    'GENERAL',
  ]),
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  contactPerson: z.string().optional(),
  jobDescription: z.string().optional(),
  additionalRequirements: z.string().optional(),
});

const saveCoverLetterSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  content: z.string().min(1, 'İçerik gereklidir'),
  category: z.enum([
    'SOFTWARE_DEVELOPER',
    'MARKETING_SPECIALIST',
    'SALES_REPRESENTATIVE',
    'PROJECT_MANAGER',
    'DATA_ANALYST',
    'UI_UX_DESIGNER',
    'BUSINESS_ANALYST',
    'CUSTOMER_SERVICE',
    'HR_SPECIALIST',
    'FINANCE_SPECIALIST',
    'CONTENT_WRITER',
    'DIGITAL_MARKETING',
    'PRODUCT_MANAGER',
    'QUALITY_ASSURANCE',
    'GRAPHIC_DESIGNER',
    'ADMINISTRATIVE_ASSISTANT',
    'CONSULTANT',
    'ENGINEER',
    'TEACHER',
    'HEALTHCARE',
    'LEGAL',
    'GENERAL',
  ]),
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  contactPerson: z.string().optional(),
});

router.get('/categories', (req, res) => {
  const categories = [
    { key: 'SOFTWARE_DEVELOPER', label: 'Yazılım Geliştirici' },
    { key: 'MARKETING_SPECIALIST', label: 'Pazarlama Uzmanı' },
    { key: 'SALES_REPRESENTATIVE', label: 'Satış Temsilcisi' },
    { key: 'PROJECT_MANAGER', label: 'Proje Yöneticisi' },
    { key: 'DATA_ANALYST', label: 'Veri Analisti' },
    { key: 'UI_UX_DESIGNER', label: 'UI/UX Tasarımcı' },
    { key: 'BUSINESS_ANALYST', label: 'İş Analisti' },
    { key: 'CUSTOMER_SERVICE', label: 'Müşteri Hizmetleri' },
    { key: 'HR_SPECIALIST', label: 'İnsan Kaynakları Uzmanı' },
    { key: 'FINANCE_SPECIALIST', label: 'Finans Uzmanı' },
    { key: 'CONTENT_WRITER', label: 'İçerik Yazarı' },
    { key: 'DIGITAL_MARKETING', label: 'Dijital Pazarlama' },
    { key: 'PRODUCT_MANAGER', label: 'Ürün Yöneticisi' },
    { key: 'QUALITY_ASSURANCE', label: 'Kalite Güvence' },
    { key: 'GRAPHIC_DESIGNER', label: 'Grafik Tasarımcı' },
    { key: 'ADMINISTRATIVE_ASSISTANT', label: 'İdari Asistan' },
    { key: 'CONSULTANT', label: 'Danışman' },
    { key: 'ENGINEER', label: 'Mühendis' },
    { key: 'TEACHER', label: 'Öğretmen' },
    { key: 'HEALTHCARE', label: 'Sağlık' },
    { key: 'LEGAL', label: 'Hukuk' },
    { key: 'GENERAL', label: 'Genel' },
  ];

  res.json({
    success: true,
    data: categories,
  });
});

router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const {
      category,
      positionTitle,
      companyName,
      contactPerson,
      jobDescription,
      additionalRequirements,
    } = createCoverLetterSchema.parse(req.body);
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
        userId: req.user.userId,
      },
    });

    if (!cvUpload) {
      return res.status(404).json({
        success: false,
        message: 'CV verisi bulunamadı',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    const generatedCoverLetter = await generateCoverLetterWithClaude({
      originalCvContent: cvUpload.markdownContent!,
      category,
      positionTitle,
      companyName,
      contactPerson,
      jobDescription,
      additionalRequirements,
      applicantName: `${user.firstName} ${user.lastName}`,
      applicantEmail: user.email,
    });

    return res.json({
      success: true,
      message: 'Ön yazı başarıyla oluşturuldu',
      data: {
        content: generatedCoverLetter,
        category,
        positionTitle,
        companyName,
        contactPerson,
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

    console.error('Ön yazı oluşturma hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Ön yazı oluşturulurken hata oluştu',
    });
  }
});

router.post('/save', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      positionTitle,
      companyName,
      contactPerson,
    } = saveCoverLetterSchema.parse(req.body);

    const userCoverLetterCount = await prisma.coverLetter.count({
      where: { userId: req.user.userId },
    });

    if (userCoverLetterCount >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maksimum 5 ön yazı kaydedebilirsiniz',
      });
    }

    const savedCoverLetter = await prisma.coverLetter.create({
      data: {
        userId: req.user.userId,
        title,
        content,
        category,
        positionTitle,
        companyName,
        contactPerson,
        applicationDate: new Date(),
      },
    });

    return res.json({
      success: true,
      message: 'Ön yazı başarıyla kaydedildi',
      data: savedCoverLetter,
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

    console.error('Ön yazı kaydetme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Ön yazı kaydedilirken hata oluştu',
    });
  }
});

router.get('/saved', authenticateToken, async (req, res) => {
  try {
    const savedCoverLetters = await prisma.coverLetter.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: savedCoverLetters,
    });
  } catch (error) {
    console.error('Kayıtlı ön yazılar getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kayıtlı ön yazılar alınırken hata oluştu',
    });
  }
});

router.delete('/saved/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const savedCoverLetter = await prisma.coverLetter.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!savedCoverLetter) {
      return res.status(404).json({
        success: false,
        message: 'Ön yazı bulunamadı',
      });
    }

    await prisma.coverLetter.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Ön yazı başarıyla silindi',
    });
    return;
  } catch (error) {
    console.error('Ön yazı silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ön yazı silinirken hata oluştu',
    });
    return;
  }
});

router.post('/download/:format', authenticateToken, async (req, res) => {
  try {
    const { format } = req.params;
    const { content, fileName } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Ön yazı içeriği gereklidir',
      });
    }

    const safeFileName = fileName || 'on-yazi';

    if (format === 'pdf') {
      const pdfBuffer = await generatePdf(content);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFileName}.pdf"`
      );
      res.send(pdfBuffer);
      return;
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
      res.send(docxBuffer);
      return;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Desteklenen formatlar: pdf, docx',
      });
    }
  } catch (error) {
    console.error('Ön yazı indirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ön yazı indirilirken hata oluştu',
    });
    return;
  }
});

export default router;
