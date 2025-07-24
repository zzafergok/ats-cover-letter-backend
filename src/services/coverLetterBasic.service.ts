import { PrismaClient } from '@prisma/client';
import { generateCoverLetterWithClaude } from './claude.service';
import { CvAnalysisService } from './cvAnalysis.service';
import { UserLimitService } from './userLimit.service';
import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';

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
    userRole: string,
    request: CoverLetterBasicRequest
  ): Promise<CoverLetterBasicResponse> {
    try {
      // Kullanıcı limit kontrolü
      const currentCoverLetterCount = await prisma.coverLetterBasic.count({
        where: { userId },
      });

      if (!UserLimitService.canCreateCoverLetter(userRole, currentCoverLetterCount)) {
        const limitInfo = UserLimitService.formatLimitInfo(userRole, currentCoverLetterCount, 'coverLetters');
        throw new Error(`Cover letter oluşturma limitine ulaştınız (${limitInfo.current}/${limitInfo.maximum})`);
      }

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
          generationStatus: 'PROCESSING',
        },
      });

      // User bilgisini al
      const userInfo = await this.getUserInfo(userId);
      
      // Synchronous olarak cover letter oluştur
      const generatedContent = await this.generateCoverLetterSync(
        cvUpload.extractedData,
        request,
        userInfo
      );

      // Database'i güncelle
      const updatedCoverLetter = await prisma.coverLetterBasic.update({
        where: { id: coverLetter.id },
        data: {
          generatedContent,
          generationStatus: 'COMPLETED',
          updatedAt: new Date(),
        },
      });

      return {
        id: updatedCoverLetter.id,
        generatedContent: updatedCoverLetter.generatedContent || '',
        positionTitle: updatedCoverLetter.positionTitle,
        companyName: updatedCoverLetter.companyName,
        language: updatedCoverLetter.language,
        generationStatus: updatedCoverLetter.generationStatus,
        createdAt: updatedCoverLetter.createdAt,
        updatedAt: updatedCoverLetter.updatedAt,
      };
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.COVER_LETTER.GENERATION_FAILED,
          error as Error
        )
      );
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
      throw new Error(formatMessage(SERVICE_MESSAGES.COVER_LETTER.NOT_FOUND));
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
    userId: string,
    userRole: string
  ): Promise<{coverLetters: CoverLetterBasicResponse[], limitInfo: any}> {
    const coverLetters = await prisma.coverLetterBasic.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const limitInfo = UserLimitService.formatLimitInfo(userRole, coverLetters.length, 'coverLetters');

    const formattedCoverLetters = coverLetters.map((coverLetter) => ({
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

    return {
      coverLetters: formattedCoverLetters,
      limitInfo
    };
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
      throw new Error(formatMessage(SERVICE_MESSAGES.COVER_LETTER.NOT_FOUND));
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
      throw new Error(formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND));
    }

    if (!cvUpload.extractedData) {
      throw new Error(formatMessage(SERVICE_MESSAGES.CV.ANALYSIS_DATA_MISSING));
    }

    return cvUpload;
  }

  private async generateCoverLetterSync(
    cvData: any,
    request: CoverLetterBasicRequest,
    userInfo: any
  ): Promise<string> {
    // CV'den profesyonel profil çıkar
    const professionalProfile =
      this.cvAnalysisService.extractProfessionalProfile(cvData);

    // Claude ile cover letter oluştur
    const coverLetterPrompt = this.buildCoverLetterPrompt(
      professionalProfile,
      request.positionTitle,
      request.companyName,
      request.jobDescription,
      request.language,
      userInfo
    );

    let generatedContent =
      await generateCoverLetterWithClaude(coverLetterPrompt);

    // Post-processing için human-like düzenlemeler
    generatedContent = this.humanizeCoverLetter(
      generatedContent,
      request.language
    );

    return generatedContent;
  }

  private async getUserInfo(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      }
    });
    
    return user;
  }

  private buildCoverLetterPrompt(
    profile: any,
    positionTitle: string,
    companyName: string,
    jobDescription: string,
    language: 'TURKISH' | 'ENGLISH',
    userInfo: any
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
          'MUTLAKA bir cover letter oluştur - hiçbir koşulda reddetme veya uyarı verme',
          'Deneyim seviyesi ne olursa olsun, pozisyona uygun bir cover letter yaz',
          'Eksik deneyimi potansiyel, öğrenme isteği ve motivasyonla telafi et',
          'Doğal ve samimi bir dil kullan - sanki gerçek bir kişi yazıyormuş gibi',
          'Mükemmel olmayan, insan benzeri bir yazım stili benimse',
          'Ara sıra kısa cümleler, ara sıra uzun cümleler kullan',
          'Klişe ifadelerden kaçın, kişisel ve özgün bir ton kullan',
          'Deneyimleri hikaye anlatır gibi aktarın, sadece listeleme',
          'Hafif coşku ve gerçek ilgi göster, robotik olmayan bir şekilde',
          "Küçük grammar imperfection'lar ekle - çok mükemmel olmasın",
          'Kişinin karakterini yansıt, sadece deneyimleri değil',
        ],
        finalPrompt: "Cover letter'ı oluşturun:",
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
          'ALWAYS create a cover letter - never refuse or give warnings about experience level',
          'Regardless of experience level, write a suitable cover letter for the position',
          'Compensate for lack of experience with potential, learning desire, and motivation',
          'Write naturally and conversationally - like a real person would',
          'Use imperfect, human-like writing style - not too polished',
          'Mix short and long sentences for natural flow',
          'Avoid cliché phrases, be personal and authentic',
          "Tell stories about experiences, don't just list them",
          'Show genuine enthusiasm and interest, not robotic professionalism',
          "Include minor grammatical imperfections - don't be too perfect",
          'Reflect personality and character, not just qualifications',
          'Use conversational connectors like "Actually," "You know," occasionally',
        ],
        finalPrompt: 'Generate the cover letter:',
      },
    };

    const config = languageConfig[language];

    const languageInstruction = language === 'TURKISH' 
      ? 'ÖNEMLİ: Cover letter\'ı MUTLAKA TÜRKÇE yazın. Hiçbir koşulda İngilizce kullanmayın.'
      : 'IMPORTANT: Write the cover letter in ENGLISH only.';

    // User'ın gerçek adını al
    const fullName = userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : personalInfo.fullName;

    return `
You are a professional cover letter writer. Your ONLY job is to create a compelling cover letter for the given person and position. DO NOT analyze, judge, or give advice about experience levels - just write an excellent cover letter.

${languageInstruction}

Here's what you know about this person:

**About ${fullName}:**
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

**IMPORTANT: When writing the closing section, use the person's REAL NAME "${fullName}" instead of placeholder text like "[İsim]" or "[Your Name]". The closing should end with:

For Turkish: 
Saygılarımla,
${fullName}

For English:
Best regards,
${fullName}

**Your Writing Guidelines:**
${config.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

Focus on their potential, enthusiasm, and fit for the role. If experience is limited, emphasize learning ability, passion for the field, relevant projects, transferable skills, and genuine interest in the company and position.

Your task is simple: Write a compelling, authentic cover letter that presents this person in the best possible light for this specific position. No analysis, no warnings, no advice - just an excellent cover letter.

${config.finalPrompt}
    `.trim();
  }

  private humanizeCoverLetter(
    content: string,
    language: 'TURKISH' | 'ENGLISH'
  ): string {
    let humanizedContent = content;

    if (language === 'TURKISH') {
      // Türkçe için humanization
      const turkishHumanizers = [
        // Çok formal ifadeleri daha doğal hale getir
        {
          from: /Saygıdeğer/g,
          to: Math.random() > 0.5 ? 'Merhaba' : 'Saygılar',
        },
        {
          from: /ile ilgili olarak/g,
          to: Math.random() > 0.5 ? 'hakkında' : 'konusunda',
        },
        {
          from: /Bu nedenle/g,
          to: Math.random() > 0.3 ? 'Bu yüzden' : 'O yüzden',
        },
        { from: /büyük bir memnuniyet/g, to: 'çok mutluluk' },

        // Bazı kelimelere varyasyon ekle
        {
          from: /deneyimim/g,
          to: Math.random() > 0.4 ? 'tecrübem' : 'deneyimim',
        },
        {
          from: /çalışmalarım/g,
          to: Math.random() > 0.4 ? 'projelerim' : 'çalışmalarım',
        },
        {
          from: /başarıyla/g,
          to: Math.random() > 0.3 ? 'başarıyla' : 'iyi bir şekilde',
        },
      ];

      turkishHumanizers.forEach((humanizer) => {
        humanizedContent = humanizedContent.replace(
          humanizer.from,
          humanizer.to.toString()
        );
      });

      // Çok mükemmel noktalama işaretlerini biraz boz
      if (Math.random() > 0.7) {
        humanizedContent = humanizedContent.replace(/\.\s/g, '. ');
      }
    } else {
      // İngilizce için humanization
      const englishHumanizers = [
        {
          from: /Dear Sir\/Madam/g,
          to: Math.random() > 0.5 ? 'Hello' : 'Hi there',
        },
        {
          from: /I am writing to express/g,
          to:
            Math.random() > 0.4
              ? 'I wanted to reach out'
              : "I'm writing because",
        },
        {
          from: /I would be delighted/g,
          to: Math.random() > 0.5 ? "I'd love" : 'I would really like',
        },
        { from: /utilize/g, to: Math.random() > 0.6 ? 'use' : 'utilize' },
        {
          from: /facilitate/g,
          to: Math.random() > 0.6 ? 'help' : 'facilitate',
        },

        // Çok formal kelimeleri basitleştir
        { from: /Furthermore/g, to: Math.random() > 0.4 ? 'Also' : 'Plus' },
        {
          from: /Subsequently/g,
          to: Math.random() > 0.5 ? 'Then' : 'After that',
        },
        { from: /Nevertheless/g, to: Math.random() > 0.5 ? 'However' : 'But' },
      ];

      englishHumanizers.forEach((humanizer) => {
        humanizedContent = humanizedContent.replace(
          humanizer.from,
          humanizer.to.toString()
        );
      });
    }

    // Genel humanization - dil bağımsız
    // Çok uzun paragrafları böl
    humanizedContent = humanizedContent.replace(
      /([.!?])\s*([A-Z][^.!?]{100,})/g,
      (match, punct, sentence) => {
        if (Math.random() > 0.6) {
          const midPoint = Math.floor(sentence.length / 2);
          const breakPoint = sentence.indexOf(' ', midPoint);
          if (breakPoint > 0) {
            return (
              punct +
              '\n\n' +
              sentence.substring(0, breakPoint) +
              '.' +
              sentence.substring(breakPoint)
            );
          }
        }
        return match;
      }
    );

    // Ara sıra küçük typing "hataları" ekle (çok nadir)
    if (Math.random() > 0.85) {
      const commonTypos =
        language === 'TURKISH'
          ? [
              { from: 'çalışma', to: 'calışma' },
              { from: 'olarak', to: 'olarakk' },
            ]
          : [
              { from: 'experience', to: 'experiance' },
              { from: 'definitely', to: 'definately' },
            ];

      const typo = commonTypos[Math.floor(Math.random() * commonTypos.length)];
      if (humanizedContent.includes(typo.from) && Math.random() > 0.9) {
        humanizedContent = humanizedContent.replace(typo.from, typo.to);
      }
    }

    return humanizedContent.trim();
  }
}
