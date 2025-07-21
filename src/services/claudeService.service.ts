// src/services/claudeService.service.ts
import Anthropic from '@anthropic-ai/sdk';

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
    throw new Error('Anthropic API anahtarı yapılandırılmamış');
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
    console.error('Claude API hatası:', error);

    if (error.status === 401 || error.message?.includes('authentication')) {
      throw new Error('Anthropic API anahtarı geçersiz veya eksik');
    }

    if (error.status === 529 || error.message?.includes('overloaded')) {
      throw new Error(
        'Anthropic servisi şu anda yoğun, lütfen birkaç dakika sonra tekrar deneyin'
      );
    }

    throw new Error('CV oluşturulurken bir hata oluştu');
  }
}
