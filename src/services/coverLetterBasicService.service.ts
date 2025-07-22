import { PrismaClient } from '@prisma/client';
import { generateCoverLetterWithClaude } from './claudeService.service';
import { CvAnalysisService } from './cvAnalysisService.service';
import logger from '../config/logger';

const prisma = new PrismaClient();

export interface CoverLetterBasicRequest {
  cvUploadId: string;
  positionTitle: string;
  companyName: string;
  jobDescription: string;
}

export interface CoverLetterBasicResponse {
  id: string;
  generatedContent: string;
  positionTitle: string;
  companyName: string;
  generationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CoverLetterBasicService {
  private static instance: CoverLetterBasicService;
  private cvAnalysisService: CvAnalysisService;

  private constructor() {
    this.cvAnalysisService = CvAnalysisService.getInstance();
  }

  public static getInstance(): CoverLetterBasicService {
    if (!CoverLetterBasicService.instance) {
      CoverLetterBasicService.instance = new CoverLetterBasicService();
    }
    return CoverLetterBasicService.instance;
  }

  async createCoverLetter(
    userId: string,
    request: CoverLetterBasicRequest
  ): Promise<CoverLetterBasicResponse> {
    try {
      // CV verilerini al ve doğrula
      const cvUpload = await this.validateCvUpload(userId, request.cvUploadId);
      
      // Cover letter kaydını oluştur (başlangıçta PENDING durumda)
      const coverLetter = await prisma.coverLetterBasic.create({
        data: {
          userId,
          cvUploadId: request.cvUploadId,
          positionTitle: request.positionTitle,
          companyName: request.companyName,
          jobDescription: request.jobDescription,
          generationStatus: 'PENDING',
        },
      });

      // Arka planda cover letter oluştur
      this.generateCoverLetterAsync(coverLetter.id, cvUpload.extractedData, request);

      return {
        id: coverLetter.id,
        generatedContent: '',
        positionTitle: coverLetter.positionTitle,
        companyName: coverLetter.companyName,
        generationStatus: coverLetter.generationStatus,
        createdAt: coverLetter.createdAt,
        updatedAt: coverLetter.updatedAt,
      };
    } catch (error) {
      logger.error('Cover letter oluşturma hatası:', error);
      throw error;
    }
  }

  async getCoverLetter(
    userId: string,
    coverLetterId: string
  ): Promise<CoverLetterBasicResponse | null> {
    const coverLetter = await prisma.coverLetterBasic.findFirst({
      where: {
        id: coverLetterId,
        userId,
      },
    });

    if (!coverLetter) {
      return null;
    }

    return {
      id: coverLetter.id,
      generatedContent: coverLetter.generatedContent || '',
      positionTitle: coverLetter.positionTitle,
      companyName: coverLetter.companyName,
      generationStatus: coverLetter.generationStatus,
      createdAt: coverLetter.createdAt,
      updatedAt: coverLetter.updatedAt,
    };
  }

  async updateCoverLetter(
    userId: string,
    coverLetterId: string,
    updatedContent: string
  ): Promise<CoverLetterBasicResponse> {
    const coverLetter = await prisma.coverLetterBasic.findFirst({
      where: {
        id: coverLetterId,
        userId,
      },
    });

    if (!coverLetter) {
      throw new Error('Cover letter bulunamadı');
    }

    const updated = await prisma.coverLetterBasic.update({
      where: { id: coverLetterId },
      data: {
        updatedContent,
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      generatedContent: updated.updatedContent || updated.generatedContent || '',
      positionTitle: updated.positionTitle,
      companyName: updated.companyName,
      generationStatus: updated.generationStatus,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async getUserCoverLetters(userId: string): Promise<CoverLetterBasicResponse[]> {
    const coverLetters = await prisma.coverLetterBasic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return coverLetters.map(coverLetter => ({
      id: coverLetter.id,
      generatedContent: coverLetter.updatedContent || coverLetter.generatedContent || '',
      positionTitle: coverLetter.positionTitle,
      companyName: coverLetter.companyName,
      generationStatus: coverLetter.generationStatus,
      createdAt: coverLetter.createdAt,
      updatedAt: coverLetter.updatedAt,
    }));
  }

  async deleteCoverLetter(userId: string, coverLetterId: string): Promise<void> {
    const coverLetter = await prisma.coverLetterBasic.findFirst({
      where: {
        id: coverLetterId,
        userId,
      },
    });

    if (!coverLetter) {
      throw new Error('Cover letter bulunamadı');
    }

    await prisma.coverLetterBasic.delete({
      where: { id: coverLetterId },
    });
  }

  private async validateCvUpload(userId: string, cvUploadId: string) {
    const cvUpload = await prisma.cvUpload.findFirst({
      where: {
        id: cvUploadId,
        userId,
        processingStatus: 'COMPLETED',
      },
      select: {
        id: true,
        extractedData: true,
      },
    });

    if (!cvUpload) {
      throw new Error('CV bulunamadı veya henüz işleme tamamlanmamış');
    }

    if (!cvUpload.extractedData) {
      throw new Error('CV analiz verisi bulunamadı');
    }

    return cvUpload;
  }

  private async generateCoverLetterAsync(
    coverLetterId: string,
    cvData: any,
    request: CoverLetterBasicRequest
  ): Promise<void> {
    try {
      // CV'den profesyonel profil çıkar
      const professionalProfile = this.cvAnalysisService.extractProfessionalProfile(cvData);
      
      // Claude ile cover letter oluştur
      const coverLetterPrompt = this.buildCoverLetterPrompt(
        professionalProfile,
        request.positionTitle,
        request.companyName,
        request.jobDescription
      );

      const generatedContent = await generateCoverLetterWithClaude(coverLetterPrompt);

      // Veritabanını güncelle
      await prisma.coverLetterBasic.update({
        where: { id: coverLetterId },
        data: {
          generatedContent,
          generationStatus: 'COMPLETED',
          updatedAt: new Date(),
        },
      });

      logger.info('Cover letter başarıyla oluşturuldu', { coverLetterId });
    } catch (error) {
      logger.error('Cover letter oluşturma hatası:', { coverLetterId, error });
      
      // Hata durumunu kaydet
      await prisma.coverLetterBasic.update({
        where: { id: coverLetterId },
        data: {
          generationStatus: 'FAILED',
          updatedAt: new Date(),
        },
      });
    }
  }

  private buildCoverLetterPrompt(
    profile: any,
    positionTitle: string,
    companyName: string,
    jobDescription: string
  ): string {
    const { personalInfo, professionalProfile } = profile;

    return `
Lütfen aşağıdaki bilgileri kullanarak profesyonel bir cover letter oluşturun:

## KİŞİSEL BİLGİLER:
- Ad Soyad: ${personalInfo.fullName}
- E-posta: ${personalInfo.email}
- Telefon: ${personalInfo.phone}
- Şehir: ${personalInfo.city || ''}

## PROFESYONEL PROFİL:
- Deneyim: ${professionalProfile.experienceYears} yıl
- Mevcut Pozisyon: ${professionalProfile.currentPosition || ''}
- Ana Yetenekler: ${professionalProfile.keySkills.join(', ')}
- Başarılar: ${professionalProfile.achievements.join('. ')}
- Sektör Deneyimi: ${professionalProfile.industryExperience.join(', ')}

## BAŞVURU BİLGİLERİ:
- Pozisyon: ${positionTitle}
- Şirket: ${companyName}
- İş Tanımı: ${jobDescription}

## GEREKSINIMLER:
1. Profesyonel ve samimi bir ton kullanın
2. CV'deki deneyimleri iş ilanındaki gereksinimlerle eşleştirin
3. Somut başarılar ve deneyimler vurgulayın
4. Türkçe olarak yazın
5. 3-4 paragraf halinde düzenleyin
6. Şirket ve pozisyon özelinde kişiselleştirin

Cover letter'ı oluşturun:
    `.trim();
  }
}