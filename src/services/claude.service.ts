import Anthropic from '@anthropic-ai/sdk';

import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CvGenerationParams {
  parsedCvData: any;
  positionTitle: string;
  companyName: string;
  cvType: 'ATS_OPTIMIZED' | 'CREATIVE' | 'TECHNICAL';
  jobDescription?: string;
  additionalRequirements?: string;
  targetKeywords?: string[];
}

export async function generateCvWithClaude(
  params: CvGenerationParams
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(formatMessage(SERVICE_MESSAGES.AI.API_KEY_MISSING));
  }

  const {
    parsedCvData,
    positionTitle,
    companyName,
    cvType,
    jobDescription,
    additionalRequirements,
    targetKeywords,
  } = params;

  const cvTypeInstructions = {
    ATS_OPTIMIZED: `
      ATS (Applicant Tracking System) uyumlu CV oluştur. Özellikler:
      - Basit, temiz format kullan
      - Anahtar kelimeleri doğal bir şekilde yerleştir
      - Standart bölüm başlıkları kullan (Deneyim, Eğitim, Beceriler)
      - Ölçülebilir başarıları vurgula
      - Tablolar, grafikler kullanma
    `,
    CREATIVE: `
      Yaratıcı ve göze çarpan CV oluştur. Özellikler:
      - Kişiliği yansıtan format
      - Başarıları hikaye tarzında anlat
      - Projeler ve yaratıcı çalışmalar vurgula
      - İnovasyonu ve yaratıcılığı öne çıkar
    `,
    TECHNICAL: `
      Teknik pozisyonlar için detaylı CV oluştur. Özellikler:
      - Teknik becerileri kategorize et
      - Proje detaylarını ve kullanılan teknolojileri belirt
      - Sertifikalar ve teknik eğitimleri vurgula
      - Ölçülebilir teknik başarılar ekle
    `,
  };

  const structuredCvData = `
    Kişisel Bilgiler:
    - Ad Soyad: ${parsedCvData.personalInfo.fullName || 'Belirtilmemiş'}
    - Email: ${parsedCvData.personalInfo.email || 'Belirtilmemiş'}
    - Telefon: ${parsedCvData.personalInfo.phone || 'Belirtilmemiş'}
    - LinkedIn: ${parsedCvData.personalInfo.linkedin || 'Belirtilmemiş'}
    - GitHub: ${parsedCvData.personalInfo.github || 'Belirtilmemiş'}

    Profesyonel Özet:
    ${parsedCvData.summary || 'Belirtilmemiş'}

    Deneyimler:
    ${parsedCvData.experience
      .map(
        (exp: any) => `
    - Pozisyon: ${exp.title || 'Belirtilmemiş'}
    - Şirket: ${exp.company || 'Belirtilmemiş'}
    - Süre: ${exp.duration || 'Belirtilmemiş'}
    - Açıklama: ${exp.description || 'Belirtilmemiş'}
    `
      )
      .join('\n')}

    Eğitim:
    ${parsedCvData.education
      .map(
        (edu: any) => `
    - Derece: ${edu.degree || 'Belirtilmemiş'}
    - Kurum: ${edu.institution || 'Belirtilmemiş'}
    - Yıl: ${edu.year || 'Belirtilmemiş'}
    `
      )
      .join('\n')}

    Beceriler:
    ${parsedCvData.skills.join(', ')}

    Diller:
    ${parsedCvData.languages.map((lang: any) => `${lang.language} (${lang.level || 'Seviye belirtilmemiş'})`).join(', ')}

    Sertifikalar:
    ${parsedCvData.certifications.join(', ')}
  `;

  const prompt = `
    Sen profesyonel bir CV yazma uzmanısın. Aşağıdaki bilgileri kullanarak ${positionTitle} pozisyonu için ${companyName} şirketine başvuru yapacak bir kişi için ${cvType} tipinde CV oluştur.

    ${cvTypeInstructions[cvType]}

    Mevcut CV Verisi:
    ${structuredCvData}

    Pozisyon: ${positionTitle}
    Şirket: ${companyName}
    ${jobDescription ? `İş Tanımı: ${jobDescription}` : ''}
    ${additionalRequirements ? `Ek Gereksinimler: ${additionalRequirements}` : ''}
    ${targetKeywords?.length ? `Hedef Anahtar Kelimeler: ${targetKeywords.join(', ')}` : ''}

    Lütfen aşağıdaki kurallara uy:
    1. Verilen CV datasındaki bilgileri analiz et ve pozisyona uygun şekilde düzenle
    2. İş tanımındaki anahtar kelimeleri doğal bir şekilde yerleştir
    3. Türkçe bir CV oluştur
    4. Deneyimleri ölçülebilir başarılarla destekle
    5. CV'yi markdown formatında oluştur
    6. Sadece CV içeriğini döndür, başka açıklama yapma

    CV formatı:
    # [Ad Soyad]
    ## İletişim Bilgileri
    ## Profesyonel Özet
    ## Deneyim
    ## Eğitim
    ## Beceriler
    ## Diller
    ## Sertifikalar (varsa)
  `;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error: any) {
    logger.error(
      createErrorMessage(SERVICE_MESSAGES.AI.API_ERROR, error as Error)
    );

    if (error.status === 401 || error.message?.includes('authentication')) {
      throw new Error(formatMessage(SERVICE_MESSAGES.AI.API_KEY_INVALID));
    }

    if (error.status === 529 || error.message?.includes('overloaded')) {
      throw new Error(
        'Anthropic servisi şu anda yoğun, lütfen birkaç dakika sonra tekrar deneyin'
      );
    }

    throw new Error(formatMessage(SERVICE_MESSAGES.AI.CV_ANALYSIS_FAILED));
  }
}

export async function generateATSCVWithClaude(
  cvData: any,
  jobDescription?: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(formatMessage(SERVICE_MESSAGES.AI.API_KEY_MISSING));
  }

  const languageInstruction = cvData.configuration.language === 'TURKISH'
    ? 'CV\'yi MUTLAKA TÜRKÇE olarak oluştur.'
    : 'Create the CV in ENGLISH only.';

  const jobKeywords = jobDescription 
    ? extractKeywordsFromJobDescription(jobDescription)
    : [];

  const prompt = `
Sen profesyonel bir ATS (Applicant Tracking System) uzmanı ve CV optimizasyon uzmanısın. Görevin, otomatik tarama sistemlerini geçecek ve insan kaynakları uzmanlarını etkileyecek yüksek düzeyde optimize edilmiş, ATS uyumlu bir CV oluşturmak.

${languageInstruction}

**KRİTİK ATS OPTİMİZASYON GEREKSİNİMLERİ:**
- Standart bölüm başlıkları kullan (DENEYIM, EĞİTİM, BECERİLER, vb.)
- İlgili anahtar kelimeleri doğal bir şekilde yerleştir: ${jobKeywords.join(', ')}
- Eylem fiilleri kullan ve başarıları sayılar/yüzdelerle destekle
- Özel karakterler olmadan temiz, basit formatlamayı koru
- Deneyimler için ters kronolojik sıra takip et
- "${cvData.professionalSummary.targetPosition}" pozisyon unvanını stratejik olarak kullan

**Aday Bilgileri:**

**Kişisel Detaylar:**
İsim: ${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}
E-posta: ${cvData.personalInfo.email}
Telefon: ${cvData.personalInfo.phone}
Konum: ${cvData.personalInfo.address.city}, ${cvData.personalInfo.address.country}
${cvData.personalInfo.linkedIn ? `LinkedIn: ${cvData.personalInfo.linkedIn}` : ''}
${cvData.personalInfo.github ? `GitHub: ${cvData.personalInfo.github}` : ''}
${cvData.personalInfo.portfolio ? `Portfolio: ${cvData.personalInfo.portfolio}` : ''}

**Profesyonel Özet:**
${cvData.professionalSummary.summary}
Hedef Pozisyon: ${cvData.professionalSummary.targetPosition}
Deneyim Yılları: ${cvData.professionalSummary.yearsOfExperience}
Anahtar Beceriler: ${cvData.professionalSummary.keySkills.join(', ')}

**İş Deneyimi:**
${cvData.workExperience.map((exp: any) => `
• ${exp.position} - ${exp.companyName} (${exp.location})
  Dönem: ${exp.startDate.getFullYear()}-${exp.endDate ? exp.endDate.getFullYear() : 'Devam Ediyor'}
  Mevcut Rol: ${exp.isCurrentRole ? 'Evet' : 'Hayır'}
  Başarılar: ${exp.achievements.join(' | ')}
  ${exp.technologies ? `Teknolojiler: ${exp.technologies.join(', ')}` : ''}
`).join('\n')}

**Eğitim:**
${cvData.education.map((edu: any) => `
• ${edu.degree} - ${edu.fieldOfStudy}
  Kurum: ${edu.institution} (${edu.location})
  Dönem: ${edu.startDate.getFullYear()}-${edu.endDate ? edu.endDate.getFullYear() : 'Devam Ediyor'}
  ${edu.gpa ? `GNO: ${edu.gpa}/4.0` : ''}
  ${edu.honors ? `Onurlar: ${edu.honors.join(', ')}` : ''}
`).join('\n')}

**Beceriler:**
Teknik Beceriler: ${cvData.skills.technical.map((tech: any) => 
  `${tech.category}: ${tech.items.map((item: any) => `${item.name} (${item.proficiencyLevel})`).join(', ')}`
).join(' | ')}
Diller: ${cvData.skills.languages.map((lang: any) => `${lang.language} (${lang.proficiency})`).join(', ')}
Kişisel Beceriler: ${cvData.skills.soft.join(', ')}

${cvData.certifications && cvData.certifications.length > 0 ? `
**Sertifikalar:**
${cvData.certifications.map((cert: any) => `
• ${cert.name} - ${cert.issuingOrganization}
  Veriliş Tarihi: ${cert.issueDate.getFullYear()}
  ${cert.expirationDate ? `Son Geçerlilik: ${cert.expirationDate.getFullYear()}` : ''}
`).join('\n')}
` : ''}

${cvData.projects && cvData.projects.length > 0 ? `
**Projeler:**
${cvData.projects.map((project: any) => `
• ${project.name}
  Açıklama: ${project.description}
  Teknolojiler: ${project.technologies.join(', ')}
  Başarılar: ${project.achievements.join(' | ')}
  ${project.url ? `URL: ${project.url}` : ''}
`).join('\n')}
` : ''}

${jobDescription ? `
**Hedef İş Tanımı:**
${jobDescription}

**Talimatlar:** CV'yi özellikle bu iş ilanı için optimize et. İlgili anahtar kelimeleri kullan ve eşleşen nitelikleri vurgula.
` : ''}

**Görevin:**
Şu kriterleri karşılayan kapsamlı, ATS-optimize edilmiş bir CV oluştur:

1. **Anahtar Kelime Optimizasyonu:** İş tanımından anahtar kelimeleri doğal şekilde dahil et
2. **Nicelleştirilmiş Başarılar:** Mümkün olduğunda sayılar, yüzdeler ve metrikler kullan
3. **ATS-Uyumlu Format:** Standart başlıklar ve temiz yapı
4. **Konumsal Uyum:** Hedef pozisyonla ilgili deneyimleri ve becerileri vurgula
5. **Profesyonel Dil:** Sektöre uygun terminoloji kullan

**CV Formatı (Markdown):**
- Başlık olarak tam isim
- Net iletişim bilgileri bölümü
- Güçlü profesyonel özet (3-4 cümle)
- Detaylı iş deneyimi (ters kronolojik)
- Eğitim bilgileri
- Kategorize edilmiş beceriler
- İsteğe bağlı sertifikalar ve projeler

Sadece CV içeriğini markdown formatında döndür, ek açıklama yapma.
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error: any) {
    logger.error(
      createErrorMessage(SERVICE_MESSAGES.AI.API_ERROR, error as Error)
    );

    if (error.status === 401 || error.message?.includes('authentication')) {
      throw new Error(formatMessage(SERVICE_MESSAGES.AI.API_KEY_INVALID));
    }

    if (error.status === 529 || error.message?.includes('overloaded')) {
      throw new Error(
        'Anthropic servisi şu anda yoğun, lütfen birkaç dakika sonra tekrar deneyin'
      );
    }

    throw new Error('ATS CV oluşturma başarısız oldu');
  }
}

// Yardımcı fonksiyon: İş tanımından anahtar kelimeler çıkar
function extractKeywordsFromJobDescription(jobDescription: string): string[] {
  const commonWords = new Set([
    'and', 'or', 'but', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of',
    'is', 'are', 'was', 'were', 'will', 'be', 'have', 'has', 'had', 'can', 'should', 'would',
    'could', 'may', 'must', 'shall', 'we', 'you', 'they', 'this', 'that', 'these', 'those',
    've', 'de', 'da', 'ile', 'için', 'bir', 'bu', 'şu', 'o', 'ki', 'mi', 'mu', 'mı', 'mü'
  ]);

  const words = jobDescription
    .toLowerCase()
    .replace(/[^\w\sğüşıöç]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));

  // Kelime frekans analizi
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // En sık kullanılan kelimeleri döndür
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

export async function generateCoverLetterWithClaude(
  prompt: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(formatMessage(SERVICE_MESSAGES.AI.API_KEY_MISSING));
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error: any) {
    logger.error(
      createErrorMessage(SERVICE_MESSAGES.AI.API_ERROR, error as Error)
    );

    if (error.status === 401 || error.message?.includes('authentication')) {
      throw new Error(formatMessage(SERVICE_MESSAGES.AI.API_KEY_INVALID));
    }

    if (error.status === 529 || error.message?.includes('overloaded')) {
      throw new Error(
        'Anthropic servisi şu anda yoğun, lütfen birkaç dakika sonra tekrar deneyin'
      );
    }

    throw new Error(
      formatMessage(SERVICE_MESSAGES.AI.COVER_LETTER_GENERATION_FAILED)
    );
  }
}
