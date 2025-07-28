# DOCX Template PDF System

## Genel Bakış

Bu sistem, DOCX formatındaki CV template'lerini alıp, CV verilerini yerleştirerek PDF formatında CV'ler oluşturur. **Orijinal DOCX tasarımını koruyarak** PDF'e dönüştürür. Sistem **admin template analizi** ve **mevcut ATS-CV servisi entegrasyonu** ile çalışır.

## 🚀 Sistem Akışı

### 1️⃣ **Admin Tarafı**

- Admin DOCX template yükler
- Sistem template'i analiz eder
- Hangi dinamik alanların gerekli olduğunu tespit eder
- Frontend'e önerileri sunar

### 2️⃣ **User Tarafı**

- Kullanıcı mevcut `/api/ats-cv/generate` endpoint'ini kullanır
- DOCX template seçebilir (opsiyonel)
- AI optimizasyonu devam eder
- PDF oluşturulur

## Sistem Özellikleri

✅ **DOCX Template'lerini PDF'e dönüştürür**  
✅ **CV verilerini template'lere yerleştirir**  
✅ **Orijinal formatı korur**  
✅ **Akıllı template analizi** - İçeriği otomatik analiz eder  
✅ **Dinamik alan tespiti** - Hangi verilere ihtiyaç var belirler  
✅ **ATS-CV entegrasyonu** - Mevcut sistem ile çalışır  
✅ **AI optimizasyonu** - Claude ile optimize edilmiş CV'ler  
✅ **Fallback sistemi** - DOCX başarısızsa ATS service devreye girer  
✅ **Template yükleme:** Yeni DOCX template'leri yükleme  
✅ **Template önizleme:** Örnek veri ile template'i görüntüleme

## API Endpoints

### 🔥 **YENİ: Admin Template Analizi**

```http
POST /api/docx-template-pdf/admin/upload-analyze/{templateId}
```

**Admin için:** DOCX template yükler ve analiz eder. Hangi dinamik alanların gerekli olduğunu tespit eder.

**Response:**
```json
{
  "success": true,
  "data": {
    "templateId": "professional",
    "analysis": {
      "existingPlaceholders": ["{{firstName}}", "{{email}}"],
      "recommendedFields": [
        "personalInfo.firstName",
        "personalInfo.email", 
        "workExperience",
        "education"
      ],
      "templateStructure": {
        "sections": ["workExperience", "education", "skills"]
      },
      "fieldMapping": {
        "personalInfo": ["personalInfo.firstName"],
        "other": ["workExperience"]
      }
    }
  }
}
```

### 🎯 **ANA ENDPOINT: ATS-CV Generate (Güncellenmiş)**

```http
POST /api/ats-cv/generate
```

**User için:** CV oluşturur. Artık DOCX template desteği var!

**Request Body (YENİ):**
```json
{
  "useDocxTemplate": true,
  "docxTemplateId": "professional",
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "configuration": {
    "useAI": true,
    "language": "TURKISH"
  }
}
```

### 1. Template Listesi

```http
GET /api/docx-template-pdf/templates
```

Mevcut template'leri listeler.

### 2. Belirli Template ile PDF Oluşturma (Direkt)

```http
POST /api/docx-template-pdf/professional
POST /api/docx-template-pdf/modern
POST /api/docx-template-pdf/academic
POST /api/docx-template-pdf/executive
```

**Request Body:**

```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+90 555 123 45 67",
    "address": {
      "city": "Istanbul",
      "country": "Turkey"
    },
    "linkedIn": "https://linkedin.com/in/johndoe",
    "portfolio": "https://portfolio.com",
    "github": "https://github.com/johndoe"
  },
  "professionalSummary": {
    "summary": "Experienced developer...",
    "targetPosition": "Senior Developer",
    "yearsOfExperience": 5,
    "keySkills": ["React", "Node.js", "TypeScript"]
  },
  "workExperience": [...],
  "education": [...],
  "skills": {...},
  "configuration": {
    "language": "ENGLISH",
    "cvType": "ATS_OPTIMIZED",
    "templateStyle": "MODERN"
  }
}
```

### 3. Esnek Template Seçimi

```http
POST /api/docx-template-pdf/generate/{templateId}
```

### 4. Çoklu Template PDF Oluşturma

```http
POST /api/docx-template-pdf/generate-multiple
```

**Request Body:**

```json
{
  "templateIds": ["professional", "modern", "academic"],
  "cvData": {
    /* CV verisi */
  }
}
```

### 5. Template Önizleme

```http
GET /api/docx-template-pdf/preview/{templateId}
```

### 6. Template Yükleme

```http
POST /api/docx-template-pdf/upload/{templateId}
```

Form-data ile DOCX dosyası yükler.

## Template Placeholder'ları

DOCX template'lerinde şu placeholder'ları kullanabilirsin:

### Kişisel Bilgiler

- `{{firstName}}` - Ad
- `{{lastName}}` - Soyad
- `{{fullName}}` - Ad Soyad
- `{{email}}` - E-posta
- `{{phone}}` - Telefon
- `{{city}}` - Şehir
- `{{country}}` - Ülke
- `{{linkedin}}` - LinkedIn profili
- `{{portfolio}}` - Portfolio URL'i
- `{{github}}` - GitHub profili

### Profesyonel Özet

- `{{targetPosition}}` - Hedef pozisyon
- `{{summary}}` - Profesyonel özet
- `{{yearsOfExperience}}` - Deneyim yılı
- `{{keySkills}}` - Anahtar beceriler (virgülle ayrılmış)

### Dinamik Bölümler

- `{{workExperience}}` - İş deneyimleri (HTML formatında)
- `{{education}}` - Eğitim bilgileri (HTML formatında)
- `{{technicalSkills}}` - Teknik beceriler (HTML formatında)
- `{{languages}}` - Diller (HTML formatında)
- `{{certifications}}` - Sertifikalar (HTML formatında)

## Template Dosya Yapısı

```
templates/
└── docx/
    ├── professional-cv.docx
    ├── modern-cv.docx
    ├── academic-cv.docx
    └── executive-cv.docx
```

## DOCX Template Hazırlama Rehberi

### 1. Microsoft Word'de Template Oluştur

- Normal Word dokümantında CV layoutunu hazırla
- Placeholder'ları `{{placeholder}}` formatında yaz
- Örnek: `İsim: {{firstName}} {{lastName}}`

### 2. Placeholder Örnekleri

```docx
{{fullName}}
{{targetPosition}}

İletişim:
E-posta: {{email}}
Telefon: {{phone}}
Konum: {{city}}, {{country}}
LinkedIn: {{linkedin}}

PROFESYONEL ÖZET
{{summary}}

Anahtar Beceriler: {{keySkills}}

İŞ DENEYİMİ
{{workExperience}}

EĞİTİM
{{education}}

TEKNİK BECERİLER
{{technicalSkills}}

DİLLER
{{languages}}

SERTİFİKALAR
{{certifications}}
```

### 3. Template Stilleri

Word'de stil isimlerini şu şekilde ayarla:

- **Title** → CV başlığı için
- **Heading 1** → Bölüm başlıkları için
- **Heading 2** → Alt başlıklar için
- **Name** → İsim için özel stil
- **Position** → Pozisyon için özel stil
- **Contact** → İletişim bilgileri için

## 🔥 Kullanım Adımları (YENİ SİSTEM)

### 1. Admin: Template Yükle ve Analiz Et

```bash
# Admin template yükler ve sistem analiz eder
curl -X POST \
  http://localhost:5000/api/docx-template-pdf/admin/upload-analyze/professional \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "template=@professional-cv.docx"

# Response: Hangi alanların gerekli olduğunu gösterir
```

### 2. User: ATS-CV Generate ile PDF Oluştur

```bash
# Mevcut ATS-CV endpoint'ini kullan (DOCX template desteği ile)
curl -X POST \
  http://localhost:5000/api/ats-cv/generate \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "useDocxTemplate": true,
    "docxTemplateId": "professional",
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "configuration": {
      "useAI": true,
      "language": "TURKISH"
    }
  }' \
  --output cv.pdf
```

### 3. Direkt Template ile PDF Oluştur (Alternatif)

```bash
curl -X POST \
  http://localhost:5000/api/docx-template-pdf/professional \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @cv-data.json \
  --output cv.pdf
```

### 3. Template Önizleme

```bash
curl -X GET \
  http://localhost:5000/api/docx-template-pdf/preview/professional \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output preview.pdf
```

## Frontend Entegrasyonu

### 🔥 Admin Panel (Template Yönetimi)

```typescript
// Admin: Template yükle ve analiz et
const uploadTemplate = async (file: File, templateId: string) => {
  const formData = new FormData();
  formData.append('template', file);
  
  const response = await fetch(`/api/docx-template-pdf/admin/upload-analyze/${templateId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    },
    body: formData
  });
  
  const result = await response.json();
  
  // Analiz sonuçlarını göster
  console.log('Template analizi:', result.data.analysis);
  console.log('Önerilen alanlar:', result.data.analysis.recommendedFields);
  
  return result;
};
```

### 🎯 User Panel (CV Oluşturma)

```typescript
// Ana ATS-CV endpoint'ini kullan (DOCX template desteği ile)
const generateCVWithTemplate = async (cvData: any, templateId?: string) => {
  const payload = {
    ...cvData,
    useDocxTemplate: !!templateId,
    docxTemplateId: templateId
  };
  
  const response = await fetch('/api/ats-cv/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(payload)
  });
  
  const pdfBlob = await response.blob();
  const url = URL.createObjectURL(pdfBlob);
  
  // PDF'i indir
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cv.pdf';
  a.click();
};

// Template listesini al
const getTemplates = async () => {
  const response = await fetch('/api/docx-template-pdf/templates');
  const data = await response.json();
  return data.data.templates;
};
```

### Alternatif: Direkt Template Service

```typescript
// Direkt template service kullan
const response = await fetch('/api/docx-template-pdf/professional', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(cvData),
});
```

## Sistem Gereksinimleri

- Node.js 18+
- Puppeteer (PDF oluşturma için)
- Mammoth.js (DOCX → HTML dönüşüm için)
- PostgreSQL (veritabanı)

## Önemli Notlar

1. **DOCX Template'leri** `templates/docx/` dizinine koyulmalı
2. **Placeholder'lar** büyük/küçük harfe duyarlı
3. **HTML içerik** güvenlik için sanitize edilir
4. **PDF boyutu** A4 formatında optimize edilir
5. **Template stilleri** PDF'te korunur

Bu sistem sayesinde DOCX template'lerinizi PDF formatında kullanabilir, CV verilerini otomatik olarak yerleştirip profesyonel CV'ler oluşturabilirsin!
