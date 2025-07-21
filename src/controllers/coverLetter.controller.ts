// src/controllers/coverLetter.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { CoverLetterService } from '../services/coverLetterService.service';
import { generatePdf, generateDocx } from '../services/documentService.service';
import { sendSuccess, sendError, sendServerError } from '../utils/response';
import { db } from '../services/database.service';
import { MinimalCoverLetterRequest } from '@/types/coverLetter.types';

const generateCoverLetterSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1, 'Ad soyad gereklidir'),
    email: z.string().email('Geçerli email gereklidir'),
    phone: z.string().min(1, 'Telefon gereklidir'),
    city: z.string().optional(),
    state: z.string().optional(),
    linkedin: z.string().optional(),
  }),
  jobInfo: z.object({
    positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
    companyName: z.string().min(1, 'Şirket adı gereklidir'),
    department: z.string().optional(),
    hiringManagerName: z.string().optional(),
    jobDescription: z.string().optional(),
    requirements: z.array(z.string()).optional(),
  }),
  experience: z.object({
    currentPosition: z.string().optional(),
    yearsOfExperience: z.number().min(0, 'Deneyim yılı 0 veya üzeri olmalı'),
    relevantSkills: z.array(z.string()).min(1, 'En az bir beceri gereklidir'),
    achievements: z.array(z.string()).min(1, 'En az bir başarı gereklidir'),
    previousCompanies: z.array(z.string()).optional(),
  }),
  coverLetterType: z.enum([
    'PROFESSIONAL',
    'CREATIVE',
    'TECHNICAL',
    'ENTRY_LEVEL',
  ]),
  tone: z.enum(['FORMAL', 'FRIENDLY', 'CONFIDENT', 'ENTHUSIASTIC']),
  additionalInfo: z
    .object({
      reasonForApplying: z.string().optional(),
      companyKnowledge: z.string().optional(),
      careerGoals: z.string().optional(),
    })
    .optional(),
});

const saveCoverLetterSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  content: z.string().min(1, 'İçerik gereklidir'),
  coverLetterType: z.enum([
    'PROFESSIONAL',
    'CREATIVE',
    'TECHNICAL',
    'ENTRY_LEVEL',
  ]),
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
});

export class CoverLetterController {
  private coverLetterService = CoverLetterService.getInstance();

  public generateMinimalCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { positionTitle, companyName, motivation } = req.body;
      const userId = req.user!.userId;

      // Basit validation
      if (!positionTitle || !companyName) {
        sendError(res, 'Pozisyon başlığı ve şirket adı gereklidir', 400);
        return;
      }

      const request: MinimalCoverLetterRequest = {
        positionTitle,
        companyName,
        motivation,
      };

      const generatedCoverLetter =
        await this.coverLetterService.generateCoverLetterFromCv(
          userId,
          request
        );

      sendSuccess(
        res,
        {
          content: generatedCoverLetter,
          positionTitle,
          companyName,
          generatedAt: new Date().toISOString(),
          method: 'cv_based',
        },
        'Cover letter CV bilgileri kullanılarak başarıyla oluşturuldu'
      );
    } catch (error) {
      console.error('Minimal cover letter oluşturma hatası:', error);
      sendServerError(res, 'Cover letter oluşturulurken hata oluştu');
    }
  };

  public generateCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const validatedData = generateCoverLetterSchema.parse(req.body);

      const generatedCoverLetter =
        await this.coverLetterService.generateCoverLetter(validatedData);

      const analysis =
        this.coverLetterService.analyzeCoverLetterStructure(
          generatedCoverLetter
        );

      sendSuccess(
        res,
        {
          content: generatedCoverLetter,
          analysis,
          metadata: {
            positionTitle: validatedData.jobInfo.positionTitle,
            companyName: validatedData.jobInfo.companyName,
            type: validatedData.coverLetterType,
            tone: validatedData.tone,
            generatedAt: new Date().toISOString(),
          },
        },
        'Cover letter başarıyla oluşturuldu'
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(
          res,
          `Veri doğrulama hatası: ${error.issues.map((i) => i.message).join(', ')}`,
          400
        );
        return;
      }

      console.error('Cover letter oluşturma hatası:', error);
      sendServerError(res, 'Cover letter oluşturulurken hata oluştu');
    }
  };

  public getTemplateByCategory = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { category } = req.params;

      if (!category) {
        sendError(res, 'Kategori gereklidir', 400);
        return;
      }

      const template =
        this.coverLetterService.generateCoverLetterTemplateByCategory(
          category.toUpperCase()
        );

      sendSuccess(
        res,
        {
          category: category.toUpperCase(),
          template,
          generatedAt: new Date().toISOString(),
        },
        'Şablon başarıyla getirildi'
      );
    } catch (error) {
      console.error('Şablon getirme hatası:', error);
      sendServerError(res, 'Şablon getirilirken hata oluştu');
    }
  };

  public saveCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const validatedData = saveCoverLetterSchema.parse(req.body);

      if (!userId) {
        sendError(res, 'Kullanıcı kimliği bulunamadı', 400);
        return;
      }

      const userCoverLetterCount = await db.coverLetter.count({
        where: { userId },
      });

      if (userCoverLetterCount >= 10) {
        sendError(res, 'Maksimum 10 cover letter kaydedebilirsiniz', 400);
        return;
      }

      const savedCoverLetter = await db.coverLetter.create({
        data: {
          userId,
          title: validatedData.title,
          content: validatedData.content,
          coverLetterType: validatedData.coverLetterType,
          positionTitle: validatedData.positionTitle,
          companyName: validatedData.companyName,
        },
      });

      sendSuccess(res, savedCoverLetter, 'Cover letter başarıyla kaydedildi');
    } catch (error) {
      if (error instanceof z.ZodError) {
        sendError(
          res,
          `Veri doğrulama hatası: ${error.issues.map((i) => i.message).join(', ')}`,
          400
        );
        return;
      }

      console.error('Cover letter kaydetme hatası:', error);
      sendServerError(res, 'Cover letter kaydedilirken hata oluştu');
    }
  };

  public getSavedCoverLetters = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      const savedCoverLetters = await db.coverLetter.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          coverLetterType: true,
          positionTitle: true,
          companyName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      sendSuccess(
        res,
        {
          coverLetters: savedCoverLetters,
          count: savedCoverLetters.length,
          limit: 10,
        },
        "Kayıtlı cover letter'lar başarıyla getirildi"
      );
    } catch (error) {
      console.error('Cover letter listesi getirme hatası:', error);
      sendServerError(res, 'Cover letter listesi getirilirken hata oluştu');
    }
  };

  public getCoverLetterById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const coverLetter = await db.coverLetter.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!coverLetter) {
        sendError(res, 'Cover letter bulunamadı', 404);
        return;
      }

      sendSuccess(res, coverLetter, 'Cover letter başarıyla getirildi');
    } catch (error) {
      console.error('Cover letter getirme hatası:', error);
      sendServerError(res, 'Cover letter getirilirken hata oluştu');
    }
  };

  public deleteCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const coverLetter = await db.coverLetter.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!coverLetter) {
        sendError(res, 'Cover letter bulunamadı', 404);
        return;
      }

      await db.coverLetter.delete({
        where: { id },
      });

      sendSuccess(res, null, 'Cover letter başarıyla silindi');
    } catch (error) {
      console.error('Cover letter silme hatası:', error);
      sendServerError(res, 'Cover letter silinirken hata oluştu');
    }
  };

  public downloadCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { format } = req.query;
      const userId = req.user?.userId;

      const coverLetter = await db.coverLetter.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!coverLetter) {
        sendError(res, 'Cover letter bulunamadı', 404);
        return;
      }

      let buffer: Buffer;
      let contentType: string;
      let filename: string;

      if (format === 'pdf') {
        buffer = await generatePdf(coverLetter.content);
        contentType = 'application/pdf';
        filename = `${coverLetter.title}.pdf`;
      } else if (format === 'docx') {
        buffer = await generateDocx(coverLetter.content);
        contentType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${coverLetter.title}.docx`;
      } else {
        sendError(res, 'Geçersiz format. Sadece pdf ve docx desteklenir', 400);
        return;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`
      );
      res.send(buffer);
    } catch (error) {
      console.error('Cover letter indirme hatası:', error);
      sendServerError(res, 'Cover letter indirilirken hata oluştu');
    }
  };

  public analyzeCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        sendError(res, 'Cover letter içeriği gereklidir', 400);
        return;
      }

      const analysis =
        this.coverLetterService.analyzeCoverLetterStructure(content);

      const suggestions = [];
      if (analysis.wordCount < 250) {
        suggestions.push('Cover letter çok kısa. En az 250 kelime olmalı.');
      }
      if (analysis.wordCount > 400) {
        suggestions.push('Cover letter çok uzun. Maksimum 400 kelime olmalı.');
      }
      if (!analysis.hasPersonalization) {
        suggestions.push(
          'Şirket ve pozisyon hakkında daha spesifik bilgiler ekleyin.'
        );
      }
      if (!analysis.hasQuantifiableAchievements) {
        suggestions.push('Sayısal başarılar ve somut örnekler ekleyin.');
      }
      if (!analysis.hasCompanyResearch) {
        suggestions.push(
          'Şirket araştırması yapıp değerler hakkında bilgi ekleyin.'
        );
      }
      if (!analysis.hasCallToAction) {
        suggestions.push('Görüşme talebi ile son paragrafı güçlendirin.');
      }

      sendSuccess(
        res,
        {
          analysis,
          suggestions,
          score: this.calculateCoverLetterScore(analysis),
        },
        'Cover letter analizi tamamlandı'
      );
    } catch (error) {
      console.error('Cover letter analiz hatası:', error);
      sendServerError(res, 'Cover letter analiz edilirken hata oluştu');
    }
  };

  private calculateCoverLetterScore(analysis: any): number {
    let score = 0;

    // Kelime sayısı (25 puan)
    if (analysis.wordCount >= 250 && analysis.wordCount <= 400) score += 25;
    else if (analysis.wordCount >= 200 && analysis.wordCount <= 450)
      score += 15;
    else score += 5;

    // Paragraf sayısı (15 puan)
    if (analysis.paragraphCount >= 3 && analysis.paragraphCount <= 5)
      score += 15;
    else if (analysis.paragraphCount >= 2 && analysis.paragraphCount <= 6)
      score += 10;
    else score += 5;

    // Kişiselleştirme (20 puan)
    if (analysis.hasPersonalization) score += 20;

    // Ölçülebilir başarılar (20 puan)
    if (analysis.hasQuantifiableAchievements) score += 20;

    // Şirket araştırması (10 puan)
    if (analysis.hasCompanyResearch) score += 10;

    // Eylem çağrısı (10 puan)
    if (analysis.hasCallToAction) score += 10;

    return Math.min(score, 100);
  }
}
