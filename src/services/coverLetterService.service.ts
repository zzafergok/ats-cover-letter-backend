// src/services/coverLetterService.service.ts
import Anthropic from '@anthropic-ai/sdk';

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

  public static getInstance(): CoverLetterService {
    if (!CoverLetterService.instance) {
      CoverLetterService.instance = new CoverLetterService();
    }
    return CoverLetterService.instance;
  }

  private getCoverLetterTemplates() {
    return {
      PROFESSIONAL: {
        structure: 'Klasik iş dünyası formatı',
        tone: 'Formal ve profesyonel',
        focus: 'Deneyim ve nitelikler',
      },
      CREATIVE: {
        structure: 'Yaratıcı ve özgün yaklaşım',
        tone: 'Dinamik ve etkileyici',
        focus: 'Yaratıcılık ve yenilikçilik',
      },
      TECHNICAL: {
        structure: 'Teknik yetkinlik odaklı',
        tone: 'Detaylı ve analitik',
        focus: 'Teknik beceriler ve projeler',
      },
      ENTRY_LEVEL: {
        structure: 'Yeni mezun dostu format',
        tone: 'Öğrenmeye açık ve istekli',
        focus: 'Potansiyel ve motivasyon',
      },
    };
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
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
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
    } catch (error) {
      console.error('Cover Letter oluşturma hatası:', error);
      throw new Error('Cover letter oluşturulurken bir hata oluştu');
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
}
