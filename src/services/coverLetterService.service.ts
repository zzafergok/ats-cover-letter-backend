// src/services/coverLetterService.service.ts - Düzeltilmiş versiyon
import {
  CvBasedCoverLetterData,
  MinimalCoverLetterRequest,
} from '@/types/coverLetter.types';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '../services/database.service';
import { CvAnalysisService } from './cvAnalysisService.service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CoverLetterGenerationParams {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    city?: string;
    state?: string;
    linkedin?: string;
  };
  jobInfo: {
    positionTitle: string;
    companyName: string;
    department?: string;
    hiringManagerName?: string;
    jobDescription?: string;
    requirements?: string[];
  };
  experience: {
    currentPosition?: string;
    yearsOfExperience: number;
    relevantSkills: string[];
    achievements: string[];
    previousCompanies?: string[];
  };
  coverLetterType: 'PROFESSIONAL' | 'CREATIVE' | 'TECHNICAL' | 'ENTRY_LEVEL';
  tone: 'FORMAL' | 'FRIENDLY' | 'CONFIDENT' | 'ENTHUSIASTIC';
  additionalInfo?: {
    reasonForApplying?: string;
    companyKnowledge?: string;
    careerGoals?: string;
  };
}

export class CoverLetterService {
  private static instance: CoverLetterService;
  private cvAnalysisService: CvAnalysisService;

  private constructor() {
    this.cvAnalysisService = CvAnalysisService.getInstance();
  }

  public static getInstance(): CoverLetterService {
    if (!CoverLetterService.instance) {
      CoverLetterService.instance = new CoverLetterService();
    }
    return CoverLetterService.instance;
  }

  private async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error;
        }

        if (error.status === 529 || error.message?.includes('overloaded')) {
          const delay =
            baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
          console.log(
            `Anthropic API yoğun, ${delay}ms bekleyip tekrar denenecek...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }
    throw new Error('Maksimum deneme sayısına ulaşıldı');
  }

  private handleApiError(error: any): never {
    if (error.status === 401 || error.message?.includes('authentication')) {
      throw new Error('Anthropic API anahtarı geçersiz veya eksik');
    }

    if (error.status === 529 || error.message?.includes('overloaded')) {
      throw new Error(
        'Anthropic servisi şu anda yoğun, lütfen birkaç dakika sonra tekrar deneyin'
      );
    }

    throw new Error('Cover letter oluşturulurken bir hata oluştu');
  }

  private getIndustrySpecificKeywords(positionTitle: string): string[] {
    const keywords: { [key: string]: string[] } = {
      'software developer': [
        'yazılım geliştirme',
        'programlama',
        'kod kalitesi',
        'problem çözme',
        'teknoloji',
      ],
      marketing: [
        'pazarlama stratejisi',
        'müşteri analizi',
        'kampanya yönetimi',
        'dijital pazarlama',
      ],
      sales: [
        'satış hedefleri',
        'müşteri ilişkileri',
        'gelir artışı',
        'pazarlama stratejisi',
      ],
      'project manager': [
        'proje yönetimi',
        'takım koordinasyonu',
        'süreç iyileştirme',
        'risk yönetimi',
      ],
      'data analyst': [
        'veri analizi',
        'raporlama',
        'istatistiksel analiz',
        'veri görselleştirme',
      ],
      'human resources': [
        'insan kaynakları',
        'işe alım',
        'personel yönetimi',
        'organizasyon',
      ],
    };

    const position = positionTitle.toLowerCase();
    for (const [key, values] of Object.entries(keywords)) {
      if (position.includes(key)) {
        return values;
      }
    }
    return ['profesyonel gelişim', 'takım çalışması', 'sonuç odaklılık'];
  }

  public async generateCoverLetter(
    params: CoverLetterGenerationParams
  ): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API anahtarı yapılandırılmamış');
    }

    const industryKeywords = this.getIndustrySpecificKeywords(
      params.jobInfo.positionTitle
    );

    const prompt = `
Sen profesyonel bir cover letter yazma uzmanısın. Aşağıdaki bilgileri kullanarak Türkçe bir cover letter oluştur.

KİŞİSEL BİLGİLER:
- Ad Soyad: ${params.personalInfo.fullName}
- Email: ${params.personalInfo.email}
- Telefon: ${params.personalInfo.phone}
- Şehir: ${params.personalInfo.city || 'Belirtilmemiş'}
${params.personalInfo.linkedin ? `- LinkedIn: ${params.personalInfo.linkedin}` : ''}

İŞ BİLGİLERİ:
- Pozisyon: ${params.jobInfo.positionTitle}
- Şirket: ${params.jobInfo.companyName}
${params.jobInfo.hiringManagerName ? `- İşe Alım Sorumlusu: ${params.jobInfo.hiringManagerName}` : ''}
${params.jobInfo.jobDescription ? `- İş Tanımı: ${params.jobInfo.jobDescription}` : ''}

DENEYİM BİLGİLERİ:
- Deneyim Yılı: ${params.experience.yearsOfExperience}
${params.experience.currentPosition ? `- Mevcut Pozisyon: ${params.experience.currentPosition}` : ''}
- İlgili Beceriler: ${params.experience.relevantSkills.join(', ')}
- Başarılar: ${params.experience.achievements.join(', ')}

COVER LETTER TİPİ: ${params.coverLetterType}
TON: ${params.tone}

SEKTÖR ANAHTAR KELİMELERİ: ${industryKeywords.join(', ')}

${params.additionalInfo?.reasonForApplying ? `Başvuru Nedeni: ${params.additionalInfo.reasonForApplying}` : ''}
${params.additionalInfo?.companyKnowledge ? `Şirket Hakkında Bilgi: ${params.additionalInfo.companyKnowledge}` : ''}

KURALLAR:
1. Cover letter 3-4 paragraf olmalı
2. İlk paragraf: Başvuru nedeni ve pozisyona ilgi
3. İkinci paragraf: İlgili deneyim ve başarılar
4. Üçüncü paragraf: Şirkete katkı ve gelecek planları
5. Son paragraf: Nezaket ifadeleri ve görüşme talebi
6. Anahtar kelimeleri doğal bir şekilde kullan
7. Ölçülebilir başarıları vurgula
8. Şirket ve pozisyona özgü detaylar ekle
9. Profesyonel ama samimi bir ton kullan
10. 250-400 kelime arası olmalı

Format:
[Ad Soyad]
[İletişim Bilgileri]
[Tarih]

[Şirket Adı]
${params.jobInfo.hiringManagerName ? `Sayın ${params.jobInfo.hiringManagerName},` : 'Sayın İşe Alım Sorumlusu,'}

[Cover Letter İçeriği]

Saygılarımla,
[Ad Soyad]
    `;

    try {
      return await this.retryWithExponentialBackoff(async () => {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        return response.content[0].type === 'text'
          ? response.content[0].text
          : '';
      });
    } catch (error: any) {
      console.error('Cover Letter oluşturma hatası:', error);
      this.handleApiError(error);
    }
  }

  public generateCoverLetterTemplateByCategory(category: string): string {
    const templates: { [key: string]: string } = {
      SOFTWARE_DEVELOPER: `
Sayın İşe Alım Sorumlusu,

[Şirket Adı]'nda [Pozisyon] pozisyonu için başvuruda bulunmak istiyorum. [X] yıllık yazılım geliştirme deneyimim ve [teknoloji/framework] konusundaki uzmanlığımla ekibinize değer katacağıma inanıyorum.

Mevcut pozisyonumda [mevcut şirket]'te [spesifik başarı]. [Kullandığınız teknolojiler] konusundaki deneyimim ve [proje türü] projelerinde aldığım sonuçlar, bu pozisyon için ideal bir aday olmamı sağlıyor.

[Şirket Adı]'nın [şirket hakkında bilgi] konusundaki vizyonu beni çok etkiliyor. Teknik bilgim ve problem çözme yeteneğimle takımınıza katkı sağlamak için sabırsızlanıyorum.

Görüşme fırsatı için teşekkür eder, en kısa sürede sizinle iletişime geçmeyi umuyorum.

Saygılarımla,
[Ad Soyad]
      `,
      MARKETING_SPECIALIST: `
Sayın İşe Alım Sorumlusu,

[Şirket Adı] bünyesindeki [Pozisyon] pozisyonu için başvurumla birlikte sizleri selamlıyorum. [X] yıllık pazarlama deneyimim ve dijital pazarlama stratejilerindeki başarılarımla markanızın büyümesine katkı sağlamak istiyorum.

Kariyer boyunca [spesifik başarı - örn: %30 satış artışı]. Özellikle [pazarlama kanalı] ve [analiz araçları] konusundaki deneyimim, [Şirket Adı]'nın pazarlama hedeflerine ulaşmasında etkili olacaktır.

[Şirket Adı]'nın [sektördeki konumu/yaklaşımı] beni oldukça etkiledi. Yaratıcı kampanyalar ve veri odaklı yaklaşımlarla müşteri deneyimini iyileştirmeyi hedefliyorum.

Katkılarımı paylaşmak için bir görüşme fırsatı rica ediyor, değerlendirmeniz için teşekkür ediyorum.

Saygılarımla,
[Ad Soyad]
      `,
      PROJECT_MANAGER: `
Sayın İşe Alım Sorumlusu,

[Şirket Adı]'ndaki [Pozisyon] fırsatı için başvuruda bulunuyorum. [X] yıllık proje yönetimi deneyimim ve takım liderliği becerileriyle organizasyonunuzun stratejik hedeflerine ulaşmasına destek olmak istiyorum.

Profesyonel kariyerimde [spesifik proje başarısı - örn: zamanında teslim, bütçe optimizasyonu]. [Proje yönetimi metodolojisi] ve [araçlar] kullanarak ekip performansını %[X] artırdım.

[Şirket Adı]'nın [proje yaklaşımı/inovasyon] konusundaki liderliği beni çok heyecanlandırıyor. Analitik yaklaşımım ve iletişim becerilerimle projelerinizin başarıyla tamamlanmasını sağlayabilirim.

Deneyimlerimi detaylandırmak için bir görüşme imkanı umut ediyor, değerlendirmeniz için minnettarlığımı sunuyorum.

Saygılarımla,
[Ad Soyad]
      `,
    };

    return templates[category] || templates['SOFTWARE_DEVELOPER'];
  }

  public analyzeCoverLetterStructure(coverLetter: string): {
    wordCount: number;
    paragraphCount: number;
    hasPersonalization: boolean;
    hasQuantifiableAchievements: boolean;
    hasCompanyResearch: boolean;
    hasCallToAction: boolean;
    keywordDensity: number;
  } {
    const words = coverLetter.split(/\s+/).length;
    const paragraphs = coverLetter.split('\n\n').filter((p) => p.trim()).length;

    const personalizationKeywords = [
      'şirket',
      'organizasyon',
      'ekip',
      'pozisyon',
    ];
    const achievementKeywords = [
      '%',
      'artış',
      'iyileştirme',
      'başarı',
      'proje',
    ];
    const researchKeywords = [
      'misyon',
      'vizyon',
      'değer',
      'kültür',
      'inovasyon',
    ];
    const actionKeywords = ['görüşme', 'iletişim', 'fırsat', 'görüşmek'];

    const hasPersonalization = personalizationKeywords.some((keyword) =>
      coverLetter.toLowerCase().includes(keyword)
    );

    const hasQuantifiableAchievements = achievementKeywords.some((keyword) =>
      coverLetter.toLowerCase().includes(keyword)
    );

    const hasCompanyResearch = researchKeywords.some((keyword) =>
      coverLetter.toLowerCase().includes(keyword)
    );

    const hasCallToAction = actionKeywords.some((keyword) =>
      coverLetter.toLowerCase().includes(keyword)
    );

    const keywordCount = [
      ...personalizationKeywords,
      ...achievementKeywords,
    ].reduce((count, keyword) => {
      const matches = coverLetter.toLowerCase().match(new RegExp(keyword, 'g'));
      return count + (matches ? matches.length : 0);
    }, 0);

    return {
      wordCount: words,
      paragraphCount: paragraphs,
      hasPersonalization,
      hasQuantifiableAchievements,
      hasCompanyResearch,
      hasCallToAction,
      keywordDensity: (keywordCount / words) * 100,
    };
  }

  public async generateCoverLetterFromCv(
    userId: string,
    request: MinimalCoverLetterRequest
  ): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API anahtarı yapılandırılmamış');
    }

    const latestCv = await this.getLatestUserCv(userId);
    if (!latestCv) {
      throw new Error("Kullanıcının yüklenmiş CV'si bulunamadı");
    }

    const cvProfile = this.cvAnalysisService.extractProfessionalProfile(
      latestCv.extractedData
    );

    const industryKeywords = this.getIndustrySpecificKeywords(
      request.positionTitle
    );

    const prompt = this.buildCvBasedPrompt(
      cvProfile,
      request,
      industryKeywords
    );

    try {
      return await this.retryWithExponentialBackoff(async () => {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        return response.content[0].type === 'text'
          ? response.content[0].text
          : '';
      });
    } catch (error: any) {
      console.error('CV tabanlı cover letter oluşturma hatası:', error);
      this.handleApiError(error);
    }
  }

  private async getLatestUserCv(userId: string): Promise<any> {
    const cvUpload = await db.cvUpload.findFirst({
      where: {
        userId,
        processingStatus: 'COMPLETED',
      },
      orderBy: {
        uploadDate: 'desc',
      },
      select: {
        extractedData: true,
      },
    });

    return cvUpload;
  }

  private buildCvBasedPrompt(
    cvProfile: CvBasedCoverLetterData,
    request: MinimalCoverLetterRequest,
    industryKeywords: string[]
  ): string {
    return `
Sen profesyonel bir cover letter yazma uzmanısın. Kullanıcının CV'sinden çıkarılan bilgiler ve hedef pozisyon bilgileriyle Türkçe bir cover letter oluştur.

KİŞİSEL BİLGİLER (CV'den otomatik çıkarıldı):
- Ad Soyad: ${cvProfile.personalInfo.fullName}
- Email: ${cvProfile.personalInfo.email}
- Telefon: ${cvProfile.personalInfo.phone}
- Şehir: ${cvProfile.personalInfo.city || 'Belirtilmemiş'}
${cvProfile.personalInfo.linkedin ? `- LinkedIn: ${cvProfile.personalInfo.linkedin}` : ''}

PROFESYONEL PROFİL (CV'den otomatik çıkarıldı):
- Deneyim Yılı: ${cvProfile.professionalProfile.experienceYears}
- Mevcut/Son Pozisyon: ${cvProfile.professionalProfile.currentPosition || 'Belirtilmemiş'}
- Temel Beceriler: ${cvProfile.professionalProfile.keySkills.join(', ')}
- Başarılar: ${cvProfile.professionalProfile.achievements.join(' | ')}

HEDEF POZİSYON BİLGİLERİ:
- Pozisyon: ${request.positionTitle}
- Şirket: ${request.companyName}
${request.motivation ? `- Özel Motivasyon: ${request.motivation}` : ''}

SEKTÖR ANAHTAR KELİMELERİ: ${industryKeywords.join(', ')}

KURALLAR:
1. Cover letter 3-4 paragraf olmalı
2. İlk paragraf: Pozisyona başvuru ve kısa tanıtım
3. İkinci paragraf: CV'den çıkarılan deneyim ve becerileri vurgula
4. Üçüncü paragraf: Şirkete katkı potansiyeli ve başarı örnekleri
5. Son paragraf: Görüşme talebi ve nezaket
6. CV'den çıkarılan bilgileri doğal bir şekilde entegre et
7. Anahtar kelimeleri organik olarak yerleştir
8. 280-350 kelime arası olmalı
9. Profesyonel ama samimi ton kullan

Format:
${cvProfile.personalInfo.fullName}
${cvProfile.personalInfo.email} | ${cvProfile.personalInfo.phone}
${new Date().toLocaleDateString('tr-TR')}

${request.companyName}
Sayın İşe Alım Sorumlusu,

[Cover Letter İçeriği]

Saygılarımla,
${cvProfile.personalInfo.fullName}
    `;
  }
}
