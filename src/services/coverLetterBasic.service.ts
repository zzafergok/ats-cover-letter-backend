import { PrismaClient } from '@prisma/client';
import { generateCoverLetterWithClaude } from './claude.service';
import { CvAnalysisService } from './cvAnalysis.service';
import logger from '../config/logger';

const prisma = new PrismaClient();

export interface CoverLetterBasicRequest {
  cvUploadId: string;
  positionTitle: string;
  companyName: string;
  jobDescription: string;
  language: 'TURKISH' | 'ENGLISH';
}

export interface CoverLetterBasicResponse {
  id: string;
  generatedContent: string;
  positionTitle: string;
  companyName: string;
  language: string;
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
          language: request.language,
          generationStatus: 'PENDING',
        },
      });

      // Arka planda cover letter oluştur
      this.generateCoverLetterAsync(
        coverLetter.id,
        cvUpload.extractedData,
        request
      );

      return {
        id: coverLetter.id,
        generatedContent: '',
        positionTitle: coverLetter.positionTitle,
        companyName: coverLetter.companyName,
        language: coverLetter.language,
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
      language: coverLetter.language,
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
      generatedContent:
        updated.updatedContent || updated.generatedContent || '',
      positionTitle: updated.positionTitle,
      companyName: updated.companyName,
      language: updated.language,
      generationStatus: updated.generationStatus,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async getUserCoverLetters(
    userId: string
  ): Promise<CoverLetterBasicResponse[]> {
    const coverLetters = await prisma.coverLetterBasic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return coverLetters.map((coverLetter) => ({
      id: coverLetter.id,
      generatedContent:
        coverLetter.updatedContent || coverLetter.generatedContent || '',
      positionTitle: coverLetter.positionTitle,
      companyName: coverLetter.companyName,
      language: coverLetter.language,
      generationStatus: coverLetter.generationStatus,
      createdAt: coverLetter.createdAt,
      updatedAt: coverLetter.updatedAt,
    }));
  }

  async deleteCoverLetter(
    userId: string,
    coverLetterId: string
  ): Promise<void> {
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
      const professionalProfile =
        this.cvAnalysisService.extractProfessionalProfile(cvData);

      // Claude ile cover letter oluştur
      const coverLetterPrompt = this.buildCoverLetterPrompt(
        professionalProfile,
        request.positionTitle,
        request.companyName,
        request.jobDescription,
        request.language
      );

      let generatedContent = await generateCoverLetterWithClaude(coverLetterPrompt);
      
      // Post-processing için human-like düzenlemeler
      generatedContent = this.humanizeCoverLetter(generatedContent, request.language);

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
    jobDescription: string,
    language: 'TURKISH' | 'ENGLISH'
  ): string {
    const { personalInfo, professionalProfile } = profile;

    const languageConfig = {
      TURKISH: {
        sectionPersonal: 'KİŞİSEL BİLGİLER:',
        sectionProfessional: 'PROFESYONEL PROFİL:',
        sectionApplication: 'BAŞVURU BİLGİLERİ:',
        sectionRequirements: 'GEREKSINIMLER:',
        fieldName: 'Ad Soyad:',
        fieldEmail: 'E-posta:',
        fieldPhone: 'Telefon:',
        fieldCity: 'Şehir:',
        fieldExperience: 'Deneyim:',
        fieldCurrentPosition: 'Mevcut Pozisyon:',
        fieldSkills: 'Ana Yetenekler:',
        fieldAchievements: 'Başarılar:',
        fieldIndustry: 'Sektör Deneyimi:',
        fieldPosition: 'Pozisyon:',
        fieldCompany: 'Şirket:',
        fieldJobDescription: 'İş Tanımı:',
        years: 'yıl',
        instructions: [
          'Doğal ve samimi bir dil kullan - sanki gerçek bir kişi yazıyormuş gibi',
          'Mükemmel olmayan, insan benzeri bir yazım stili benimse',
          'Ara sıra kısa cümleler, ara sıra uzun cümleler kullan',
          'Klişe ifadelerden kaçın, kişisel ve özgün bir ton kullan',
          'Deneyimleri hikaye anlatır gibi aktarın, sadece listeleme',
          'Hafif coşku ve gerçek ilgi göster, robotik olmayan bir şekilde',
          'Küçük grammar imperfection\'lar ekle - çok mükemmel olmasın',
          'Kişinin karakterini yansıt, sadece deneyimleri değil'
        ],
        finalPrompt: "Cover letter'ı oluşturun:"
      },
      ENGLISH: {
        sectionPersonal: 'PERSONAL INFORMATION:',
        sectionProfessional: 'PROFESSIONAL PROFILE:',
        sectionApplication: 'APPLICATION DETAILS:',
        sectionRequirements: 'REQUIREMENTS:',
        fieldName: 'Full Name:',
        fieldEmail: 'Email:',
        fieldPhone: 'Phone:',
        fieldCity: 'City:',
        fieldExperience: 'Experience:',
        fieldCurrentPosition: 'Current Position:',
        fieldSkills: 'Key Skills:',
        fieldAchievements: 'Achievements:',
        fieldIndustry: 'Industry Experience:',
        fieldPosition: 'Position:',
        fieldCompany: 'Company:',
        fieldJobDescription: 'Job Description:',
        years: 'years',
        instructions: [
          'Write naturally and conversationally - like a real person would',
          'Use imperfect, human-like writing style - not too polished',
          'Mix short and long sentences for natural flow',
          'Avoid cliché phrases, be personal and authentic',
          'Tell stories about experiences, don\'t just list them',
          'Show genuine enthusiasm and interest, not robotic professionalism',
          'Include minor grammatical imperfections - don\'t be too perfect',
          'Reflect personality and character, not just qualifications',
          'Use conversational connectors like "Actually," "You know," occasionally'
        ],
        finalPrompt: 'Generate the cover letter:'
      }
    };

    const config = languageConfig[language];

    return `
You are helping someone write a genuine, personal cover letter. This person is applying for a job and needs your help to sound authentic and human - not like AI generated text.

Here's what you know about this person:

**About ${personalInfo.fullName}:**
- Email: ${personalInfo.email}
- Phone: ${personalInfo.phone}
- Lives in: ${personalInfo.city || 'Not specified'}
- Has ${professionalProfile.experienceYears} ${config.years} of professional experience
- Currently works as: ${professionalProfile.currentPosition || 'Not specified'}
- Their key strengths: ${professionalProfile.keySkills.slice(0, 5).join(', ')}
- Some of their achievements: ${professionalProfile.achievements.slice(0, 2).join('. ')}

**The Job They're Applying For:**
- Position: ${positionTitle} at ${companyName}
- Job requirements: ${jobDescription}

**Important Guidelines:**
${config.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

Now, help this person write a cover letter that sounds like THEY wrote it themselves. Make it feel genuine, personal, and human. Add some personality quirks and make it feel conversational but still professional enough for a job application.

Write the cover letter now:
    `.trim();
  }

  private humanizeCoverLetter(content: string, language: 'TURKISH' | 'ENGLISH'): string {
    let humanizedContent = content;

    if (language === 'TURKISH') {
      // Türkçe için humanization
      const turkishHumanizers = [
        // Çok formal ifadeleri daha doğal hale getir
        { from: /Saygıdeğer/g, to: Math.random() > 0.5 ? 'Merhaba' : 'Saygılar' },
        { from: /ile ilgili olarak/g, to: Math.random() > 0.5 ? 'hakkında' : 'konusunda' },
        { from: /Bu nedenle/g, to: Math.random() > 0.3 ? 'Bu yüzden' : 'O yüzden' },
        { from: /büyük bir memnuniyet/g, to: 'çok mutluluk' },
        
        // Bazı kelimelere varyasyon ekle
        { from: /deneyimim/g, to: Math.random() > 0.4 ? 'tecrübem' : 'deneyimim' },
        { from: /çalışmalarım/g, to: Math.random() > 0.4 ? 'projelerim' : 'çalışmalarım' },
        { from: /başarıyla/g, to: Math.random() > 0.3 ? 'başarıyla' : 'iyi bir şekilde' },
      ];

      turkishHumanizers.forEach(humanizer => {
        humanizedContent = humanizedContent.replace(humanizer.from, humanizer.to.toString());
      });

      // Çok mükemmel noktalama işaretlerini biraz boz
      if (Math.random() > 0.7) {
        humanizedContent = humanizedContent.replace(/\.\s/g, '. ');
      }

    } else {
      // İngilizce için humanization
      const englishHumanizers = [
        { from: /Dear Sir\/Madam/g, to: Math.random() > 0.5 ? 'Hello' : 'Hi there' },
        { from: /I am writing to express/g, to: Math.random() > 0.4 ? 'I wanted to reach out' : 'I\'m writing because' },
        { from: /I would be delighted/g, to: Math.random() > 0.5 ? 'I\'d love' : 'I would really like' },
        { from: /utilize/g, to: Math.random() > 0.6 ? 'use' : 'utilize' },
        { from: /facilitate/g, to: Math.random() > 0.6 ? 'help' : 'facilitate' },
        
        // Çok formal kelimeleri basitleştir
        { from: /Furthermore/g, to: Math.random() > 0.4 ? 'Also' : 'Plus' },
        { from: /Subsequently/g, to: Math.random() > 0.5 ? 'Then' : 'After that' },
        { from: /Nevertheless/g, to: Math.random() > 0.5 ? 'However' : 'But' },
      ];

      englishHumanizers.forEach(humanizer => {
        humanizedContent = humanizedContent.replace(humanizer.from, humanizer.to.toString());
      });
    }

    // Genel humanization - dil bağımsız
    // Çok uzun paragrafları böl
    humanizedContent = humanizedContent.replace(/([.!?])\s*([A-Z][^.!?]{100,})/g, (match, punct, sentence) => {
      if (Math.random() > 0.6) {
        const midPoint = Math.floor(sentence.length / 2);
        const breakPoint = sentence.indexOf(' ', midPoint);
        if (breakPoint > 0) {
          return punct + '\n\n' + sentence.substring(0, breakPoint) + '.' + sentence.substring(breakPoint);
        }
      }
      return match;
    });

    // Ara sıra küçük typing "hataları" ekle (çok nadir)
    if (Math.random() > 0.85) {
      const commonTypos = language === 'TURKISH' 
        ? [{ from: 'çalışma', to: 'calışma' }, { from: 'olarak', to: 'olarakk' }]
        : [{ from: 'experience', to: 'experiance' }, { from: 'definitely', to: 'definately' }];
      
      const typo = commonTypos[Math.floor(Math.random() * commonTypos.length)];
      if (humanizedContent.includes(typo.from) && Math.random() > 0.9) {
        humanizedContent = humanizedContent.replace(typo.from, typo.to);
      }
    }

    return humanizedContent.trim();
  }
}
