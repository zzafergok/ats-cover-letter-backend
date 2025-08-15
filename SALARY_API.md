# Maaş Hesaplama API Dokümantasyonu

## Genel Bakış

Bu API, Türkiye'deki çalışanlar için brüt-net maaş hesaplama sistemidir. 2025 yılı vergi dilimleri, SGK oranları ve damga vergisi hesaplamalarını içerir.

## API Endpoints

### 1. Genel Maaş Hesaplama

**POST** `/api/salary/calculate`

**NOT:** Bu servis, brüt veya net maaş verilerek diğer tüm hesaplamaları yapan ana servistir. Hem brüt→net hem net→brüt dönüşümlerini destekler.

**Request Body:**
```json
{
  "grossSalary": 50000,    // Brüt maaş tutarı (TL) - isteğe bağlı
  "netSalary": 40000,      // Net maaş tutarı (TL) - isteğe bağlı
  "year": 2025,            // Hesaplama yapılacak yıl (vergi dilimleri için)
  "month": 6,              // Hesaplama yapılacak ay (kümülatif gelir vergisi için)
  "isMarried": true,       // Medeni durum (asgari geçim indirimi için)
  "dependentCount": 2,     // Bakmakla yükümlü kişi sayısı (asgari geçim indirimi için)
  "isDisabled": false      // Engellilik durumu (vergi indirimi için)
}
```

### 2. Brüt'ten Net'e Hesaplama

**POST** `/api/salary/gross-to-net`

**NOT:** Bu servis, sadece brüt maaş tutarından hareketle net maaş ve tüm kesintileri hesaplar. En yaygın kullanım senaryosudur.

**Request Body:**
```json
{
  "grossSalary": 26005.5,     // Brüt maaş tutarı (TL) - zorunlu
  "year": 2025,               // Hesaplama yılı - isteğe bağlı (varsayılan: mevcut yıl)
  "month": 1,                 // Hesaplama ayı - isteğe bağlı (varsayılan: mevcut ay)
  "isMarried": false,         // Medeni durum - isteğe bağlı (varsayılan: false)
  "dependentCount": 0,        // Bakmakla yükümlü sayısı - isteğe bağlı (varsayılan: 0)
  "isDisabled": false,        // Engellilik durumu - isteğe bağlı (varsayılan: false)
  "disabilityDegree": 1       // Engellilik derecesi (1,2,3) - isteğe bağlı
}
```

### 3. Net'ten Brüt'e Hesaplama

**POST** `/api/salary/net-to-gross`

**NOT:** Bu servis, hedef net maaş tutarından geriye doğru hesaplayarak gerekli brüt maaş tutarını bulur. İteratif hesaplama yöntemi kullanır.

**Request Body:**
```json
{
  "netSalary": 40000,         // Hedef net maaş tutarı (TL) - zorunlu
  "year": 2025,               // Hesaplama yılı - isteğe bağlı (varsayılan: mevcut yıl)
  "month": 12,                // Hesaplama ayı - isteğe bağlı (varsayılan: mevcut ay)
  "maxIterations": 50,        // Maksimum iterasyon sayısı - isteğe bağlı (varsayılan: 50)
  "precision": 0.01,          // Hesaplama hassasiyeti (TL) - isteğe bağlı (varsayılan: 0.01)
  "isMarried": false,         // Medeni durum - isteğe bağlı (varsayılan: false)
  "dependentCount": 0,        // Bakmakla yükümlü sayısı - isteğe bağlı (varsayılan: 0)
  "isDisabled": false,        // Engellilik durumu - isteğe bağlı (varsayılan: false)
  "disabilityDegree": 1       // Engellilik derecesi (1,2,3) - isteğe bağlı
}
```

### 4. Maaş Limitleri

**GET** `/api/salary/limits?year=2025`

**NOT:** Bu servis, belirtilen yıl için geçerli olan minimum ve maksimum maaş tutarlarını döndürür. SGK tavanları ve asgari ücret bilgilerini içerir.

**Query Parameters:**
- `year`: Sorgulanacak yıl (isteğe bağlı, varsayılan: mevcut yıl)

### 5. Vergi Konfigürasyonu

**GET** `/api/salary/tax-configuration?year=2025`

**NOT:** Bu servis, belirtilen yıla ait tüm vergi dilimleri, SGK oranları, damga vergisi oranı ve asgari ücret bilgilerini döndürür. Hesaplama parametrelerini görmek için kullanılır.

**Query Parameters:**
- `year`: Sorgulanacak yıl (isteğe bağlı, varsayılan: mevcut yıl)

## Response Format

**Maaş Hesaplama Servisleri Response:**
```json
{
  "success": true,                    // API çağrısının başarılı olup olmadığı
  "data": {
    "grossSalary": 50000,            // Brüt maaş tutarı (TL)
    "netSalary": 37245.67,           // Net maaş tutarı (TL) - kesintiler çıkarıldıktan sonra
    "sgkEmployeeShare": 7000.0,      // SGK işçi payı kesintisi (brüt maaşın %14'ü)
    "unemploymentInsurance": 500.0,   // İşsizlik sigortası işçi payı (brüt maaşın %1'i)
    "incomeTax": 4654.33,            // Gelir vergisi kesintisi (vergi dilimlerine göre)
    "stampTax": 379.5,               // Damga vergisi kesintisi (brüt maaşın %0.759'u)
    "totalDeductions": 12533.83,     // Toplam kesinti tutarı
    "employerCost": 61375.0,         // İşverene toplam maliyet
    "employerSgkShare": 10375.0,     // SGK işveren payı (%18.75 teşvikli)
    "employerUnemploymentInsurance": 1000.0, // İşsizlik sigortası işveren payı (%2)
    "breakdown": {                   // Detaylı hesaplama bilgileri
      "taxableIncome": 42500.0,      // Vergi matrahı (brüt - SGK - işsizlik)
      "appliedTaxBracket": {         // Uygulanan vergi dilimi
        "minAmount": 0,              // Dilim alt sınırı
        "maxAmount": 158000,         // Dilim üst sınırı (2025 güncel)
        "rate": 0.15,                // Vergi oranı
        "cumulativeTax": 0           // Kümülatif vergi tutarı
      },
      "minimumWageExemption": 26005.5, // Asgari ücret istisnası tutarı
      "minimumLivingAllowance": 21600,  // Asgari geçim indirimi
      "effectiveTaxRate": 0.109       // Efektif vergi oranı
    }
  },
  "message": "Salary calculation completed successfully" // İşlem durumu mesajı
}
```

**Maaş Limitleri Response:**
```json
{
  "success": true,
  "data": {
    "minGrossSalary": 26005.5,      // Minimum brüt maaş (asgari ücret)
    "maxGrossSalary": 195041.4,     // Maksimum brüt maaş (SGK tavanı)
    "minNetSalary": 22104.67,       // Minimum net maaş
    "maxNetSalary": 136529.98       // Maksimum net maaş (tahmini)
  }
}
```

**Vergi Konfigürasyonu Response:**
```json
{
  "success": true,
  "data": {
    "year": 2025,                   // Konfigürasyon yılı
    "brackets": [                   // Vergi dilimleri dizisi
      {
        "minAmount": 0,             // Dilim alt sınırı
        "maxAmount": 158000,        // Dilim üst sınırı
        "rate": 0.15,              // Vergi oranı
        "cumulativeTax": 0         // Kümülatif vergi
      }
    ],
    "sgkRates": {                  // SGK oranları
      "employeeRate": 0.14,        // İşçi payı oranı
      "employerRate": 0.2275,      // İşveren payı oranı (teşviksiz)
      "employerDiscountedRate": 0.1875, // İşveren payı oranı (teşvikli)
      "unemploymentEmployeeRate": 0.01,  // İşsizlik işçi payı
      "unemploymentEmployerRate": 0.02,  // İşsizlik işveren payı
      "lowerLimit": 26005.5,       // SGK alt limiti
      "upperLimit": 195041.4       // SGK üst limiti
    },
    "stampTaxRate": 0.00759,       // Damga vergisi oranı
    "minimumWage": {               // Asgari ücret bilgileri
      "gross": 26005.5,            // Brüt asgari ücret
      "net": 22104.67,             // Net asgari ücret
      "daily": 866.85,             // Günlük asgari ücret
      "hourly": 115.58             // Saatlik asgari ücret
    }
  }
}
```

## 2025 Vergi Bilgileri (Güncel)

### Gelir Vergisi Dilimleri

- %15: 0 - 158.000 TL
- %20: 158.000 - 330.000 TL
- %27: 330.000 - 1.200.000 TL
- %35: 1.200.000 - 4.300.000 TL
- %40: 4.300.000 TL üzeri

### SGK Oranları

- İşçi Payı: %14 + %1 (işsizlik)
- İşveren Payı: %18.75 (teşvikli) / %22.75 (teşviksiz) + %2 (işsizlik)
- Prim Tavanı: 195.041,40 TL

### Diğer Bilgiler

- Asgari Ücret: 26.005,50 TL (brüt) / 22.104,67 TL (net)
- Damga Vergisi: %0.759 (asgari ücret istisnası var)
- Asgari Geçim İndirimi: Medeni durum ve çocuk sayısına göre
- Asgari Ücret Gelir Vergisi İstisnası: Devam ediyor
- Asgari Ücret Damga Vergisi İstisnası: Yıllık 2.368,56 TL

## Test

API'yi test etmek için:

```bash
# Sunucuyu başlat
npm run dev

# API health check
curl http://localhost:3001/health

# Örnek API çağrısı - Brüt'ten Net'e
curl -X POST http://localhost:3001/api/salary/gross-to-net \
  -H "Content-Type: application/json" \
  -d '{"grossSalary": 30000, "year": 2025, "month": 6}'
```

## Hata Kodları

- `INVALID_GROSS_SALARY`: Brüt maaş pozitif olmalı
- `INVALID_NET_SALARY`: Net maaş pozitif olmalı
- `INVALID_YEAR`: Yıl 2024-2026 arasında olmalı
- `INVALID_MONTH`: Ay 1-12 arasında olmalı
- `INVALID_DEPENDENT_COUNT`: Bakmakla yükümlü sayısı negatif olamaz
- `INVALID_DISABILITY_DEGREE`: Engel derecesi 1, 2 veya 3 olmalı
