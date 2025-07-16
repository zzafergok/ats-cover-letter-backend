import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CvGenerationParams {
  originalCvContent: string;
  positionTitle: string;
  companyName: string;
  cvType: 'ATS_OPTIMIZED' | 'CREATIVE' | 'TECHNICAL';
  jobDescription?: string;
  additionalRequirements?: string;
  targetKeywords?: string[];
}

interface CoverLetterGenerationParams {
  originalCvContent: string;
  category: string;
  positionTitle: string;
  companyName: string;
  contactPerson?: string;
  jobDescription?: string;
  additionalRequirements?: string;
  applicantName: string;
  applicantEmail: string;
}

export async function generateCvWithClaude(
  params: CvGenerationParams
): Promise<string> {
  const {
    originalCvContent,
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
      - .docx formatında okunabilir olsun
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

  const prompt = `
    Sen profesyonel bir CV yazma uzmanısın. Aşağıdaki bilgileri kullanarak ${positionTitle} pozisyonu için ${companyName} şirketine başvuru yapacak bir kişi için ${cvType} tipinde CV oluştur.

    ${cvTypeInstructions[cvType]}

    Mevcut CV İçeriği:
    ${originalCvContent}

    Pozisyon: ${positionTitle}
    Şirket: ${companyName}
    ${jobDescription ? `İş Tanımı: ${jobDescription}` : ''}
    ${additionalRequirements ? `Ek Gereksinimler: ${additionalRequirements}` : ''}
    ${targetKeywords?.length ? `Hedef Anahtar Kelimeler: ${targetKeywords.join(', ')}` : ''}

    Lütfen aşağıdaki kurallara uy:
    1. Mevcut CV'deki bilgileri analiz et ve pozisyona uygun şekilde düzenle
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
    ## Projeler
    ## Sertifikalar (varsa)
  `;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    console.error('Claude API hatası:', error);
    throw new Error('CV oluşturulurken bir hata oluştu');
  }
}

export async function generateCoverLetterWithClaude(
  params: CoverLetterGenerationParams
): Promise<string> {
  const {
    originalCvContent,
    category,
    positionTitle,
    companyName,
    contactPerson,
    jobDescription,
    additionalRequirements,
    applicantName,
    applicantEmail,
  } = params;

  const categoryTemplates = {
    SOFTWARE_DEVELOPER:
      'yazılım geliştirme deneyimi, teknik beceriler ve proje başarıları',
    MARKETING_SPECIALIST:
      'pazarlama stratejileri, kampanya yönetimi ve analitik beceriler',
    SALES_REPRESENTATIVE:
      'satış deneyimi, müşteri ilişkileri ve hedef başarıları',
    PROJECT_MANAGER:
      'proje yönetimi deneyimi, takım liderliği ve süreç optimizasyonu',
    DATA_ANALYST:
      'veri analizi becerileri, istatistiksel yöntemler ve raporlama',
    UI_UX_DESIGNER: 'tasarım deneyimi, kullanıcı deneyimi ve yaratıcı projeler',
    BUSINESS_ANALYST: 'iş analizi, süreç iyileştirme ve paydaş yönetimi',
    CUSTOMER_SERVICE:
      'müşteri hizmetleri deneyimi, problem çözme ve iletişim becerileri',
    HR_SPECIALIST: 'insan kaynakları süreçleri, işe alım ve çalışan gelişimi',
    FINANCE_SPECIALIST: 'finansal analiz, bütçe yönetimi ve mali raporlama',
    CONTENT_WRITER: 'içerik yazımı, SEO ve yaratıcı yazma becerileri',
    DIGITAL_MARKETING:
      'dijital pazarlama stratejileri, sosyal medya ve online kampanyalar',
    PRODUCT_MANAGER: 'ürün yönetimi, stratejik planlama ve pazar analizi',
    QUALITY_ASSURANCE:
      'kalite güvence süreçleri, test metodolojileri ve süreç iyileştirme',
    GRAPHIC_DESIGNER: 'grafik tasarım, yaratıcı projeler ve görsel iletişim',
    ADMINISTRATIVE_ASSISTANT:
      'idari destek, organizasyon ve iletişim becerileri',
    CONSULTANT:
      'danışmanlık deneyimi, analitik düşünce ve çözüm odaklı yaklaşım',
    ENGINEER: 'mühendislik deneyimi, teknik projeler ve problem çözme',
    TEACHER: 'eğitim deneyimi, öğretim yöntemleri ve öğrenci gelişimi',
    HEALTHCARE: 'sağlık hizmetleri deneyimi, hasta bakımı ve tıbbi bilgi',
    LEGAL: 'hukuki deneyim, yasal süreçler ve mevzuat bilgisi',
    GENERAL: 'genel iş deneyimi, çok yönlü beceriler ve adaptasyon yeteneği',
  };

  const categoryFocus =
    categoryTemplates[category as keyof typeof categoryTemplates] ||
    categoryTemplates.GENERAL;

  const prompt = `
    Sen profesyonel bir ön yazı (cover letter) yazma uzmanısın. Aşağıdaki bilgileri kullanarak ${positionTitle} pozisyonu için ${companyName} şirketine başvuru yapacak bir kişi için profesyonel bir ön yazı oluştur.

    Başvuran Kişi: ${applicantName}
    Email: ${applicantEmail}
    Pozisyon: ${positionTitle}
    Şirket: ${companyName}
    ${contactPerson ? `İletişim Kişisi: ${contactPerson}` : ''}
    Kategori: ${category}
    Kategori Odak Noktası: ${categoryFocus}

    Mevcut CV İçeriği:
    ${originalCvContent}

    ${jobDescription ? `İş Tanımı: ${jobDescription}` : ''}
    ${additionalRequirements ? `Ek Gereksinimler: ${additionalRequirements}` : ''}

    Lütfen aşağıdaki kurallara uy:
    1. Mevcut CV'deki bilgileri analiz et ve en uygun deneyimleri vurgula
    2. ${categoryFocus} konularına odaklan
    3. Türkçe, profesyonel ve samimi bir ton kullan
    4. 3-4 paragraf halinde düzenle
    5. Şirkete ve pozisyona özel değer önerisi sun
    6. Sadece ön yazı içeriğini döndür, başka açıklama yapma

    Ön yazı formatı:
    ${contactPerson ? `Sayın ${contactPerson},` : 'Sayın Yetkili,'}
    
    [Giriş paragrafı - pozisyona olan ilgi ve kısa tanıtım]
    
    [İkinci paragraf - en uygun deneyimler ve başarılar]
    
    [Üçüncü paragraf - şirkete katacağı değer ve motivasyon]
    
    [Kapanış paragrafı - görüşme talebi ve teşekkür]
    
    Saygılarımla,
    ${applicantName}
    ${applicantEmail}
  `;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    console.error('Claude API hatası:', error);
    throw new Error('Ön yazı oluşturulurken bir hata oluştu');
  }
}
