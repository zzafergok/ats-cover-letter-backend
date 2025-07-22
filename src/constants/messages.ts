/**
 * Merkezi Mesaj Yönetim Sistemi
 * Tüm servis mesajları ve hata kodları burada merkezi olarak yönetilir
 */

export interface ServiceMessage {
  code: string;
  message: string;
  status: 'success' | 'error' | 'warning' | 'info';
}

export const SERVICE_MESSAGES = {
  // Database Messages (DB_xxx)
  DATABASE: {
    CONNECTION_SUCCESS: {
      code: 'DB_001',
      message: 'Veritabanı bağlantısı başarıyla kuruldu',
      status: 'success' as const,
    },
    CONNECTION_FAILED: {
      code: 'DB_002',
      message: 'Veritabanı bağlantısı başarısız',
      status: 'error' as const,
    },
    CONNECTION_CLOSED: {
      code: 'DB_003',
      message: 'Veritabanı bağlantısı başarıyla kapatıldı',
      status: 'success' as const,
    },
    CLIENT_CREATION_FAILED: {
      code: 'DB_004',
      message: 'Veritabanı istemci başlatma başarısız',
      status: 'error' as const,
    },
    HEALTH_CHECK_FAILED: {
      code: 'DB_005',
      message: 'Veritabanı sağlık kontrolü başarısız',
      status: 'error' as const,
    },
    TOKEN_CLEANUP_SUCCESS: {
      code: 'DB_006',
      message: 'Süresi dolmuş tokenlar temizlendi',
      status: 'success' as const,
    },
    TOKEN_CLEANUP_FAILED: {
      code: 'DB_007',
      message: 'Token temizleme işlemi başarısız',
      status: 'error' as const,
    },
    USER_CLEANUP_SUCCESS: {
      code: 'DB_008',
      message: 'Doğrulanmamış kullanıcılar temizlendi',
      status: 'success' as const,
    },
    USER_CLEANUP_FAILED: {
      code: 'DB_009',
      message: 'Doğrulanmamış kullanıcı temizleme başarısız',
      status: 'error' as const,
    },
    PASSWORD_RESET_CLEANUP_SUCCESS: {
      code: 'DB_010',
      message: 'Süresi dolmuş şifre sıfırlama tokenları temizlendi',
      status: 'success' as const,
    },
    PASSWORD_RESET_CLEANUP_FAILED: {
      code: 'DB_011',
      message: 'Şifre sıfırlama token temizleme başarısız',
      status: 'error' as const,
    },
  },

  // Authentication & JWT Messages (AUTH_xxx, JWT_xxx)
  AUTH: {
    TOKEN_GENERATION_FAILED: {
      code: 'AUTH_001',
      message: 'Token oluşturulamadı',
      status: 'error' as const,
    },
    TOKEN_VERIFICATION_FAILED: {
      code: 'AUTH_002',
      message: 'Token doğrulanamadı',
      status: 'error' as const,
    },
    PASSWORD_RESET_TOKEN_GENERATION_FAILED: {
      code: 'AUTH_003',
      message: 'Şifre sıfırlama token oluşturma hatası',
      status: 'error' as const,
    },
    PASSWORD_RESET_TOKEN_EXPIRED: {
      code: 'AUTH_004',
      message: 'Şifre sıfırlama süresi dolmuş',
      status: 'error' as const,
    },
    PASSWORD_RESET_TOKEN_INVALID: {
      code: 'AUTH_005',
      message: 'Şifre sıfırlama token geçersiz',
      status: 'error' as const,
    },
    EMAIL_VERIFICATION_TOKEN_GENERATION_FAILED: {
      code: 'AUTH_006',
      message: 'Email doğrulama token oluşturma hatası',
      status: 'error' as const,
    },
    EMAIL_VERIFICATION_TOKEN_EXPIRED: {
      code: 'AUTH_007',
      message: 'Email doğrulama süresi dolmuş',
      status: 'error' as const,
    },
    EMAIL_VERIFICATION_TOKEN_INVALID: {
      code: 'AUTH_008',
      message: 'Email doğrulama token geçersiz',
      status: 'error' as const,
    },
  },

  // Email Messages (EMAIL_xxx)
  EMAIL: {
    VERIFICATION_SENT: {
      code: 'EMAIL_001',
      message: 'Email doğrulama başarıyla gönderildi',
      status: 'success' as const,
    },
    VERIFICATION_SEND_FAILED: {
      code: 'EMAIL_002',
      message: 'Email doğrulama gönderilemedi',
      status: 'error' as const,
    },
    PASSWORD_RESET_SENT: {
      code: 'EMAIL_003',
      message: 'Şifre sıfırlama emaili başarıyla gönderildi',
      status: 'success' as const,
    },
    PASSWORD_RESET_SEND_FAILED: {
      code: 'EMAIL_004',
      message: 'Şifre sıfırlama emaili gönderilemedi',
      status: 'error' as const,
    },
    CONTACT_MESSAGE_SENT: {
      code: 'EMAIL_005',
      message: 'İletişim mesajı başarıyla gönderildi',
      status: 'success' as const,
    },
    CONTACT_MESSAGE_SEND_FAILED: {
      code: 'EMAIL_006',
      message: 'İletişim mesajı gönderilemedi',
      status: 'error' as const,
    },
  },

  // Contact Messages (CONTACT_xxx)
  CONTACT: {
    DAILY_LIMIT_EXCEEDED: {
      code: 'CONTACT_001',
      message: 'Günlük mesaj gönderme limitine ulaştınız (3/3)',
      status: 'error' as const,
    },
    MESSAGE_SENT: {
      code: 'CONTACT_002',
      message: 'Mesajınız başarıyla gönderildi',
      status: 'success' as const,
    },
  },

  // File Processing Messages (FILE_xxx)
  FILE: {
    NOT_FOUND: {
      code: 'FILE_001',
      message: 'Dosya bulunamadı',
      status: 'error' as const,
    },
    EMPTY_FILE: {
      code: 'FILE_002',
      message: 'Dosya boş',
      status: 'error' as const,
    },
    UNSUPPORTED_FORMAT: {
      code: 'FILE_003',
      message: 'Desteklenmeyen dosya formatı',
      status: 'error' as const,
    },
    PDF_EXTRACTION_FAILED: {
      code: 'FILE_004',
      message: 'PDF dosyasından metin çıkarılamadı',
      status: 'error' as const,
    },
    WORD_EXTRACTION_FAILED: {
      code: 'FILE_005',
      message: 'Word dosyasından metin çıkarılamadı',
      status: 'error' as const,
    },
    TEXT_FILE_EMPTY: {
      code: 'FILE_006',
      message: 'Metin dosyası boş',
      status: 'error' as const,
    },
    READING_FAILED: {
      code: 'FILE_007',
      message: 'Dosya içeriği okunamadı',
      status: 'error' as const,
    },
    COMPRESSION_FAILED: {
      code: 'FILE_008',
      message: 'Dosya sıkıştırılamadı',
      status: 'error' as const,
    },
    DECOMPRESSION_FAILED: {
      code: 'FILE_009',
      message: 'Sıkıştırılmış dosya açılamadı',
      status: 'error' as const,
    },
  },

  // Cover Letter Messages (COVER_xxx)
  COVER_LETTER: {
    GENERATION_SUCCESS: {
      code: 'COVER_001',
      message: 'Cover letter başarıyla oluşturuldu',
      status: 'success' as const,
    },
    GENERATION_FAILED: {
      code: 'COVER_002',
      message: 'Cover letter oluşturma hatası',
      status: 'error' as const,
    },
    NOT_FOUND: {
      code: 'COVER_003',
      message: 'Cover letter bulunamadı',
      status: 'error' as const,
    },
    UPDATE_SUCCESS: {
      code: 'COVER_004',
      message: 'Cover letter başarıyla güncellendi',
      status: 'success' as const,
    },
    DELETE_SUCCESS: {
      code: 'COVER_005',
      message: 'Cover letter başarıyla silindi',
      status: 'success' as const,
    },
  },

  // CV Messages (CV_xxx)
  CV: {
    UPLOAD_SUCCESS: {
      code: 'CV_001',
      message: 'CV başarıyla yüklendi',
      status: 'success' as const,
    },
    PROCESSING_STARTED: {
      code: 'CV_002',
      message: 'CV işleme başlatıldı',
      status: 'info' as const,
    },
    PROCESSING_COMPLETED: {
      code: 'CV_003',
      message: 'CV işleme tamamlandı',
      status: 'success' as const,
    },
    PROCESSING_FAILED: {
      code: 'CV_004',
      message: 'CV işleme başarısız',
      status: 'error' as const,
    },
    NOT_FOUND: {
      code: 'CV_005',
      message: 'CV bulunamadı',
      status: 'error' as const,
    },
    ANALYSIS_DATA_MISSING: {
      code: 'CV_006',
      message: 'CV analiz verisi bulunamadı',
      status: 'error' as const,
    },
    NO_FILE_UPLOADED: {
      code: 'CV_007',
      message: 'CV dosyası yüklenmedi',
      status: 'error' as const,
    },
    UPLOAD_PROCESSING: {
      code: 'CV_008',
      message: 'CV yüklendi ve işleme alındı',
      status: 'success' as const,
    },
    PROCESSING_PENDING: {
      code: 'CV_009',
      message: 'CV işleniyor, lütfen bekleyin...',
      status: 'info' as const,
    },
    UPLOAD_ERROR: {
      code: 'CV_010',
      message: 'CV yüklenirken hata oluştu',
      status: 'error' as const,
    },
    FILE_SIZE_EXCEEDED: {
      code: 'CV_011',
      message: 'Dosya boyutu çok büyük (maksimum 10MB)',
      status: 'error' as const,
    },
    LIST_ERROR: {
      code: 'CV_012',
      message: 'CV listesi alınırken hata oluştu',
      status: 'error' as const,
    },
    STATUS_CHECK_ERROR: {
      code: 'CV_013',
      message: 'Durum kontrolünde hata oluştu',
      status: 'error' as const,
    },
    DELETE_SUCCESS: {
      code: 'CV_014',
      message: 'CV başarıyla silindi',
      status: 'success' as const,
    },
    DELETE_ERROR: {
      code: 'CV_015',
      message: 'CV silinirken hata oluştu',
      status: 'error' as const,
    },
    UPLOAD_ID_REQUIRED: {
      code: 'CV_016',
      message: "CV yükleme ID'si gereklidir",
      status: 'error' as const,
    },
    DATA_NOT_FOUND: {
      code: 'CV_017',
      message: 'CV verisi bulunamadı',
      status: 'error' as const,
    },
    GENERATION_SUCCESS: {
      code: 'CV_018',
      message: 'CV başarıyla oluşturuldu',
      status: 'success' as const,
    },
    GENERATION_ERROR: {
      code: 'CV_019',
      message: 'CV oluşturulurken hata oluştu',
      status: 'error' as const,
    },
    SAVE_SUCCESS: {
      code: 'CV_020',
      message: 'CV başarıyla kaydedildi',
      status: 'success' as const,
    },
    SAVE_ERROR: {
      code: 'CV_021',
      message: 'CV kaydedilirken hata oluştu',
      status: 'error' as const,
    },
    SAVE_LIMIT_EXCEEDED: {
      code: 'CV_022',
      message: 'Maksimum 5 CV kaydedebilirsiniz',
      status: 'error' as const,
    },
    SAVED_LIST_ERROR: {
      code: 'CV_023',
      message: "Kayıtlı CV'ler alınırken hata oluştu",
      status: 'error' as const,
    },
    FILE_NOT_IN_DATABASE: {
      code: 'CV_024',
      message: 'CV dosyası veritabanında bulunamadı',
      status: 'error' as const,
    },
    DOWNLOAD_ERROR: {
      code: 'CV_025',
      message: 'CV indirilirken hata oluştu',
      status: 'error' as const,
    },
    INVALID_DATA: {
      code: 'CV_026',
      message: 'Geçersiz veri',
      status: 'error' as const,
    },
    FILE_DELETE_ERROR: {
      code: 'CV_027',
      message: 'Dosya silme hatası',
      status: 'error' as const,
    },
  },

  // PDF Generation Messages (PDF_xxx)
  PDF: {
    GENERATION_SUCCESS: {
      code: 'PDF_001',
      message: 'PDF başarıyla oluşturuldu',
      status: 'success' as const,
    },
    GENERATION_FAILED: {
      code: 'PDF_002',
      message: 'PDF oluşturulurken bir hata oluştu',
      status: 'error' as const,
    },
    CUSTOM_FORMAT_SUCCESS: {
      code: 'PDF_003',
      message: 'Özelleştirilmiş cover letter PDF başarıyla oluşturuldu',
      status: 'success' as const,
    },
  },

  // Claude AI Messages (AI_xxx)
  AI: {
    API_KEY_MISSING: {
      code: 'AI_001',
      message: 'Anthropic API anahtarı yapılandırılmamış',
      status: 'error' as const,
    },
    API_KEY_INVALID: {
      code: 'AI_002',
      message: 'Anthropic API anahtarı geçersiz veya eksik',
      status: 'error' as const,
    },
    CV_ANALYSIS_FAILED: {
      code: 'AI_003',
      message: 'CV analizi yapılırken bir hata oluştu',
      status: 'error' as const,
    },
    COVER_LETTER_GENERATION_FAILED: {
      code: 'AI_004',
      message: 'Cover letter oluşturulurken bir hata oluştu',
      status: 'error' as const,
    },
    API_ERROR: {
      code: 'AI_005',
      message: 'Claude API hatası',
      status: 'error' as const,
    },
  },

  // Cache Messages (CACHE_xxx)
  CACHE: {
    GET_ERROR: {
      code: 'CACHE_001',
      message: 'Cache okuma hatası',
      status: 'error' as const,
    },
    SET_ERROR: {
      code: 'CACHE_002',
      message: 'Cache yazma hatası',
      status: 'error' as const,
    },
    DELETE_ERROR: {
      code: 'CACHE_003',
      message: 'Cache silme hatası',
      status: 'error' as const,
    },
    FLUSH_ERROR: {
      code: 'CACHE_004',
      message: 'Cache temizleme hatası',
      status: 'error' as const,
    },
    EXISTS_ERROR: {
      code: 'CACHE_005',
      message: 'Cache kontrol hatası',
      status: 'error' as const,
    },
  },

  // Session Messages (SESSION_xxx)
  SESSION: {
    CREATION_ERROR: {
      code: 'SESSION_001',
      message: 'Session oluşturma hatası',
      status: 'error' as const,
    },
    GET_ERROR: {
      code: 'SESSION_002',
      message: 'Session getirme hatası',
      status: 'error' as const,
    },
    DELETE_ERROR: {
      code: 'SESSION_003',
      message: 'Session silme hatası',
      status: 'error' as const,
    },
    DELETE_ALL_ERROR: {
      code: 'SESSION_004',
      message: 'Tüm session silme hatası',
      status: 'error' as const,
    },
    EXTEND_ERROR: {
      code: 'SESSION_005',
      message: 'Session uzatma hatası',
      status: 'error' as const,
    },
  },

  // Queue Messages (QUEUE_xxx)
  QUEUE: {
    EMAIL_JOB_PROCESSING: {
      code: 'QUEUE_001',
      message: 'Email job işleniyor',
      status: 'info' as const,
    },
    EMAIL_JOB_COMPLETED: {
      code: 'QUEUE_002',
      message: 'Email job tamamlandı',
      status: 'success' as const,
    },
    EMAIL_JOB_FAILED: {
      code: 'QUEUE_003',
      message: 'Email job işleme hatası',
      status: 'error' as const,
    },
    MAX_RETRIES_REACHED: {
      code: 'QUEUE_004',
      message: 'Email job maksimum deneme sayısına ulaştı',
      status: 'error' as const,
    },
    UNKNOWN_EMAIL_TYPE: {
      code: 'QUEUE_005',
      message: 'Bilinmeyen email tipi',
      status: 'error' as const,
    },
  },

  // Validation Messages (VALID_xxx)
  VALIDATION: {
    INPUT_VALIDATION_ERROR: {
      code: 'VALID_001',
      message: 'Giriş doğrulama hatası',
      status: 'error' as const,
    },
    UNEXPECTED_VALIDATION_ERROR: {
      code: 'VALID_002',
      message: 'Beklenmeyen doğrulama hatası',
      status: 'error' as const,
    },
    PARAMS_VALIDATION_ERROR: {
      code: 'VALID_003',
      message: 'Parametre doğrulama hatası',
      status: 'error' as const,
    },
    UNEXPECTED_PARAMS_VALIDATION_ERROR: {
      code: 'VALID_004',
      message: 'Beklenmeyen parametre doğrulama hatası',
      status: 'error' as const,
    },
  },

  // CORS Messages (CORS_xxx)
  CORS: {
    ORIGIN_NOT_ALLOWED: {
      code: 'CORS_001',
      message: 'CORS: Origin not allowed',
      status: 'error' as const,
    },
  },

  // Rate Limiting Messages (RATE_xxx)
  RATE_LIMIT: {
    GENERAL_EXCEEDED: {
      code: 'RATE_001',
      message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
      status: 'error' as const,
    },
    AUTH_EXCEEDED: {
      code: 'RATE_002',
      message: 'Çok fazla giriş denemesi, lütfen daha sonra tekrar deneyin',
      status: 'error' as const,
    },
    UPLOAD_EXCEEDED: {
      code: 'RATE_003',
      message: 'Saatlik yükleme limitine ulaştınız',
      status: 'error' as const,
    },
    API_EXCEEDED: {
      code: 'RATE_004',
      message: 'API rate limit aşıldı',
      status: 'error' as const,
    },
  },

  // Schema Validation Messages (SCHEMA_xxx)
  SCHEMA: {
    EMAIL_REQUIRED: {
      code: 'SCHEMA_001',
      message: 'Geçerli bir email adresi giriniz',
      status: 'error' as const,
    },
    PASSWORD_REQUIRED: {
      code: 'SCHEMA_002',
      message: 'Şifre gereklidir',
      status: 'error' as const,
    },
    PASSWORD_MIN_LENGTH: {
      code: 'SCHEMA_003',
      message: 'Şifre en az 8 karakter olmalıdır',
      status: 'error' as const,
    },
    PASSWORD_MAX_LENGTH: {
      code: 'SCHEMA_004',
      message: 'Şifre en fazla 100 karakter olabilir',
      status: 'error' as const,
    },
    PASSWORD_PATTERN: {
      code: 'SCHEMA_005',
      message:
        'Şifre en az bir harf, bir rakam içermeli ve sadece izin verilen özel karakterleri kullanmalıdır',
      status: 'error' as const,
    },
    NAME_MIN_LENGTH: {
      code: 'SCHEMA_006',
      message: 'Ad en az 2 karakter olmalıdır',
      status: 'error' as const,
    },
    NAME_MAX_LENGTH: {
      code: 'SCHEMA_007',
      message: 'Ad en fazla 50 karakter olabilir',
      status: 'error' as const,
    },
    REFRESH_TOKEN_REQUIRED: {
      code: 'SCHEMA_008',
      message: 'Refresh token gereklidir',
      status: 'error' as const,
    },
    RESET_TOKEN_REQUIRED: {
      code: 'SCHEMA_009',
      message: 'Şifre sıfırlama token gereklidir',
      status: 'error' as const,
    },
    NEW_PASSWORD_MIN_LENGTH: {
      code: 'SCHEMA_010',
      message: 'Yeni şifre en az 8 karakter olmalıdır',
      status: 'error' as const,
    },
    NEW_PASSWORD_MAX_LENGTH: {
      code: 'SCHEMA_011',
      message: 'Yeni şifre en fazla 100 karakter olabilir',
      status: 'error' as const,
    },
    NEW_PASSWORD_PATTERN: {
      code: 'SCHEMA_012',
      message: 'Yeni şifre en az bir harf ve bir rakam içermelidir',
      status: 'error' as const,
    },
    CONFIRM_PASSWORD_REQUIRED: {
      code: 'SCHEMA_013',
      message: 'Şifre tekrarı gereklidir',
      status: 'error' as const,
    },
    PASSWORD_MISMATCH: {
      code: 'SCHEMA_014',
      message: 'Yeni şifre ve şifre tekrarı eşleşmiyor',
      status: 'error' as const,
    },
    PASSWORD_SAME_AS_CURRENT: {
      code: 'SCHEMA_015',
      message: 'Yeni şifre mevcut şifreden farklı olmalıdır',
      status: 'error' as const,
    },
    CURRENT_PASSWORD_REQUIRED: {
      code: 'SCHEMA_016',
      message: 'Mevcut şifre gereklidir',
      status: 'error' as const,
    },
    EMAIL_VERIFICATION_TOKEN_REQUIRED: {
      code: 'SCHEMA_017',
      message: 'Email doğrulama token gereklidir',
      status: 'error' as const,
    },
    USER_PROFILE_NAME_MIN: {
      code: 'SCHEMA_018',
      message: 'Ad soyad en az 2 karakter olmalıdır',
      status: 'error' as const,
    },
    USER_PROFILE_NAME_MAX: {
      code: 'SCHEMA_019',
      message: 'Ad soyad en fazla 50 karakter olabilir',
      status: 'error' as const,
    },
    USER_PROFILE_EMAIL_MAX: {
      code: 'SCHEMA_020',
      message: 'Email adresi en fazla 255 karakter olabilir',
      status: 'error' as const,
    },
    CONTACT_NAME_MIN: {
      code: 'SCHEMA_021',
      message: 'Ad soyad en az 2 karakter olmalıdır',
      status: 'error' as const,
    },
    CONTACT_NAME_MAX: {
      code: 'SCHEMA_022',
      message: 'Ad soyad en fazla 100 karakter olabilir',
      status: 'error' as const,
    },
    CONTACT_EMAIL_MAX: {
      code: 'SCHEMA_023',
      message: 'Email adresi çok uzun',
      status: 'error' as const,
    },
    CONTACT_SUBJECT_MIN: {
      code: 'SCHEMA_024',
      message: 'Konu en az 3 karakter olmalıdır',
      status: 'error' as const,
    },
    CONTACT_SUBJECT_MAX: {
      code: 'SCHEMA_025',
      message: 'Konu en fazla 200 karakter olabilir',
      status: 'error' as const,
    },
    CONTACT_MESSAGE_MIN: {
      code: 'SCHEMA_026',
      message: 'Mesaj en az 10 karakter olmalıdır',
      status: 'error' as const,
    },
    CONTACT_MESSAGE_MAX: {
      code: 'SCHEMA_027',
      message: 'Mesaj en fazla 2000 karakter olabilir',
      status: 'error' as const,
    },
    // Cover Letter Schema Messages
    FULL_NAME_REQUIRED: {
      code: 'SCHEMA_028',
      message: 'Ad soyad gereklidir',
      status: 'error' as const,
    },
    VALID_EMAIL_REQUIRED: {
      code: 'SCHEMA_029',
      message: 'Geçerli email gereklidir',
      status: 'error' as const,
    },
    PHONE_REQUIRED: {
      code: 'SCHEMA_030',
      message: 'Telefon gereklidir',
      status: 'error' as const,
    },
    POSITION_TITLE_REQUIRED: {
      code: 'SCHEMA_031',
      message: 'Pozisyon başlığı gereklidir',
      status: 'error' as const,
    },
    COMPANY_NAME_REQUIRED: {
      code: 'SCHEMA_032',
      message: 'Şirket adı gereklidir',
      status: 'error' as const,
    },
    YEARS_EXPERIENCE_MIN: {
      code: 'SCHEMA_033',
      message: 'Deneyim yılı 0 veya üzeri olmalı',
      status: 'error' as const,
    },
    SKILLS_REQUIRED: {
      code: 'SCHEMA_034',
      message: 'En az bir beceri gereklidir',
      status: 'error' as const,
    },
    ACHIEVEMENTS_REQUIRED: {
      code: 'SCHEMA_035',
      message: 'En az bir başarı gereklidir',
      status: 'error' as const,
    },
    TITLE_REQUIRED: {
      code: 'SCHEMA_036',
      message: 'Başlık gereklidir',
      status: 'error' as const,
    },
    CONTENT_REQUIRED: {
      code: 'SCHEMA_037',
      message: 'İçerik gereklidir',
      status: 'error' as const,
    },
    COVER_LETTER_CONTENT_REQUIRED: {
      code: 'SCHEMA_038',
      message: 'Cover letter içeriği gereklidir',
      status: 'error' as const,
    },
    CV_UPLOAD_ID_REQUIRED: {
      code: 'SCHEMA_039',
      message: 'CV upload ID gereklidir',
      status: 'error' as const,
    },
    JOB_DESCRIPTION_MIN: {
      code: 'SCHEMA_040',
      message: 'İş tanımı en az 10 karakter olmalıdır',
      status: 'error' as const,
    },
    LANGUAGE_OPTION_ERROR: {
      code: 'SCHEMA_041',
      message: 'Dil seçeneği TURKISH veya ENGLISH olmalıdır',
      status: 'error' as const,
    },
    COVER_LETTER_MIN_LENGTH: {
      code: 'SCHEMA_042',
      message: 'Cover letter içeriği en az 50 karakter olmalıdır',
      status: 'error' as const,
    },
    CV_TITLE_REQUIRED: {
      code: 'SCHEMA_043',
      message: 'CV başlığı gereklidir',
      status: 'error' as const,
    },
    CV_CONTENT_REQUIRED: {
      code: 'SCHEMA_044',
      message: 'CV içeriği gereklidir',
      status: 'error' as const,
    },
  },

  // Application Messages (APP_xxx)
  APP: {
    API_RUNNING: {
      code: 'APP_001',
      message: 'API is running',
      status: 'success' as const,
    },
    HEALTH_CHECK_FAILED: {
      code: 'APP_002',
      message: 'Health check failed',
      status: 'error' as const,
    },
    ENDPOINT_NOT_FOUND: {
      code: 'APP_003',
      message: 'Endpoint not found',
      status: 'error' as const,
    },
  },

  // Response Messages (RESPONSE_xxx)
  RESPONSE: {
    COVER_LETTER_CREATION_STARTED: {
      code: 'RESPONSE_001',
      message: 'Cover letter oluşturma işlemi başlatıldı',
      status: 'success' as const,
    },
    INVALID_DATA: {
      code: 'RESPONSE_002',
      message: 'Geçersiz veri',
      status: 'error' as const,
    },
    COVER_LETTER_NOT_FOUND: {
      code: 'RESPONSE_003',
      message: 'Cover letter bulunamadı',
      status: 'error' as const,
    },
    COVER_LETTER_INFO_ERROR: {
      code: 'RESPONSE_004',
      message: 'Cover letter bilgileri alınırken hata oluştu',
      status: 'error' as const,
    },
    COVER_LETTER_UPDATE_SUCCESS: {
      code: 'RESPONSE_005',
      message: 'Cover letter başarıyla güncellendi',
      status: 'success' as const,
    },
    COVER_LETTER_UPDATE_ERROR: {
      code: 'RESPONSE_006',
      message: 'Cover letter güncellenirken hata oluştu',
      status: 'error' as const,
    },
    COVER_LETTER_LIST_ERROR: {
      code: 'RESPONSE_007',
      message: 'Cover letter listesi alınırken hata oluştu',
      status: 'error' as const,
    },
    COVER_LETTER_NOT_READY: {
      code: 'RESPONSE_008',
      message: 'Cover letter henüz hazır değil veya içerik bulunamadı',
      status: 'error' as const,
    },
    PDF_GENERATION_ERROR: {
      code: 'RESPONSE_009',
      message: 'PDF oluşturulurken hata oluştu',
      status: 'error' as const,
    },
  },

  // Error Messages (ERR_xxx)
  ERROR: {
    DATA_CONFLICT: {
      code: 'ERR_001',
      message: 'Veri çakışması - Bu kayıt zaten mevcut (Unique constraint)',
      status: 'error' as const,
    },
    RELATIONSHIP_ERROR: {
      code: 'ERR_002',
      message:
        'İlişki hatası - Bağlantılı kayıt bulunamadı (Foreign key constraint)',
      status: 'error' as const,
    },
    RECORD_NOT_FOUND: {
      code: 'ERR_003',
      message: 'Kayıt bulunamadı - İşlem yapılacak veri mevcut değil',
      status: 'error' as const,
    },
    DATABASE_CONNECTION_ERROR: {
      code: 'ERR_004',
      message: 'Veritabanı bağlantı hatası - Lütfen daha sonra tekrar deneyin',
      status: 'error' as const,
    },
    TIMEOUT_ERROR: {
      code: 'ERR_005',
      message: 'İşlem zaman aşımı - Veritabanı yanıt vermiyor',
      status: 'error' as const,
    },
    SERVER_ERROR: {
      code: 'ERR_006',
      message: 'Sunucu hatası',
      status: 'error' as const,
    },
    JWT_TOKEN_INVALID: {
      code: 'ERR_007',
      message: 'Token formatı geçersiz - Yeniden giriş yapın',
      status: 'error' as const,
    },
    JWT_TOKEN_EXPIRED: {
      code: 'ERR_008',
      message: 'Token süresi dolmuş - Yeniden giriş yapın',
      status: 'error' as const,
    },
    VALIDATION_ERROR: {
      code: 'ERR_009',
      message: 'Giriş verisi doğrulama hatası - Geçersiz format',
      status: 'error' as const,
    },
    ZOD_VALIDATION_DEFAULT: {
      code: 'ERR_010',
      message: 'Doğrulama hatası',
      status: 'error' as const,
    },
    ZOD_VALIDATION_FAILED: {
      code: 'ERR_011',
      message: 'Veri doğrulama başarısız',
      status: 'error' as const,
    },
    FILE_SIZE_LIMIT: {
      code: 'ERR_012',
      message: 'Dosya boyutu hatası - Maksimum dosya boyutu aşıldı',
      status: 'error' as const,
    },
    FILE_COUNT_LIMIT: {
      code: 'ERR_013',
      message: 'Dosya sayısı hatası - Çok fazla dosya yüklendi',
      status: 'error' as const,
    },
    JSON_PARSE_ERROR: {
      code: 'ERR_014',
      message: 'JSON parse hatası - Geçersiz JSON formatı',
      status: 'error' as const,
    },
    RATE_LIMIT_EXCEEDED: {
      code: 'ERR_015',
      message: 'Çok fazla istek - Lütfen daha sonra tekrar deneyin',
      status: 'error' as const,
    },
    CONNECTION_POOL_EXHAUSTED: {
      code: 'ERR_016',
      message: 'Bağlantı havuzu dolu - Sistem yoğun, daha sonra deneyin',
      status: 'error' as const,
    },
    MEMORY_ERROR: {
      code: 'ERR_017',
      message: 'Bellek yetersiz - İşlem çok büyük',
      status: 'error' as const,
    },
    UNEXPECTED_ERROR: {
      code: 'ERR_018',
      message: 'Beklenmeyen sistem hatası - Teknik ekip bilgilendirildi',
      status: 'error' as const,
    },
    EMAIL_VERIFICATION_CONFLICT: {
      code: 'ERR_019',
      message: 'Email doğrulama çakışması - Token çakışması tespit edildi',
      status: 'error' as const,
    },
    EMAIL_SERVICE_ERROR: {
      code: 'ERR_020',
      message:
        'Email gönderme hatası - Mail servisi geçici olarak kullanılamıyor',
      status: 'error' as const,
    },
    EMAIL_TOKEN_ERROR: {
      code: 'ERR_021',
      message: 'Email doğrulama token hatası - Token işlenemedi',
      status: 'error' as const,
    },
  },

  // Authentication Messages (AUTH_xxx) - Extended
  AUTH_EXT: {
    REGISTER_STARTED: {
      code: 'AUTH_101',
      message: '[REGISTER] İşlem başlatıldı',
      status: 'info' as const,
    },
    REGISTER_FORMAT_ERROR: {
      code: 'AUTH_102',
      message: '[REGISTER] Email veya password format hatası',
      status: 'info' as const,
    },
    REGISTER_VALIDATION_PASSED: {
      code: 'AUTH_103',
      message: '[REGISTER] Email ve password format validation geçti',
      status: 'info' as const,
    },
    REGISTER_DUPLICATE_EMAIL: {
      code: 'AUTH_104',
      message: '[REGISTER] Duplicate email tespit edildi',
      status: 'info' as const,
    },
    REGISTER_EMAIL_UNIQUE: {
      code: 'AUTH_105',
      message: '[REGISTER] Email uniqueness validation geçti',
      status: 'info' as const,
    },
    REGISTER_ROLE_CONFLICT: {
      code: 'AUTH_106',
      message: '[REGISTER] Rol çakışması tespit edildi',
      status: 'info' as const,
    },
    REGISTER_ROLE_VALIDATED: {
      code: 'AUTH_107',
      message: '[REGISTER] Role validation geçti',
      status: 'info' as const,
    },
    REGISTER_PASSWORD_HASHED: {
      code: 'AUTH_108',
      message: '[REGISTER] Password hashing tamamlandı',
      status: 'info' as const,
    },
    REGISTER_TOKEN_CREATED: {
      code: 'AUTH_109',
      message: '[REGISTER] Email verification token oluşturuldu',
      status: 'info' as const,
    },
    REGISTER_USER_CREATED: {
      code: 'AUTH_110',
      message: '[REGISTER] User veritabanında oluşturuldu',
      status: 'info' as const,
    },
    REGISTER_TOKEN_UPDATED: {
      code: 'AUTH_111',
      message: '[REGISTER] Token güncelleme tamamlandı',
      status: 'info' as const,
    },
    REGISTER_EMAIL_SENT: {
      code: 'AUTH_112',
      message: '[REGISTER] Email doğrulama başarıyla gönderildi',
      status: 'info' as const,
    },
    REGISTER_EMAIL_ERROR: {
      code: 'AUTH_113',
      message: '[REGISTER] Email gönderim hatası',
      status: 'error' as const,
    },
    REGISTER_ROLLBACK: {
      code: 'AUTH_114',
      message: '[REGISTER] User kaydı email hatası nedeniyle geri alındı',
      status: 'info' as const,
    },
    REGISTER_CRITICAL_ERROR: {
      code: 'AUTH_115',
      message: '[REGISTER] Kritik hata',
      status: 'error' as const,
    },
    INVALID_TOKEN_ATTEMPT: {
      code: 'AUTH_116',
      message: 'Invalid token attempt',
      status: 'warning' as const,
    },
    // Email Verification Messages
    EMAIL_VERIFICATION_STARTED: {
      code: 'AUTH_117',
      message: 'Token doğrulama başlatıldı',
      status: 'info' as const,
    },
    EMAIL_VERIFICATION_TOKEN_DECODED: {
      code: 'AUTH_118',
      message: 'Token decode edildi',
      status: 'info' as const,
    },
    EMAIL_VERIFICATION_USER_QUERY: {
      code: 'AUTH_119',
      message: 'Kullanıcı sorgusu tamamlandı',
      status: 'info' as const,
    },
    EMAIL_VERIFICATION_PROCESS_STARTING: {
      code: 'AUTH_120',
      message: 'Email doğrulama işlemi başlatılıyor',
      status: 'info' as const,
    },
    EMAIL_VERIFICATION_TOKEN_GENERATION: {
      code: 'AUTH_121',
      message: 'Token generation başlatılıyor',
      status: 'info' as const,
    },
    EMAIL_VERIFICATION_SUCCESS: {
      code: 'AUTH_122',
      message: 'Email doğrulama başarıyla tamamlandı',
      status: 'success' as const,
    },
    EMAIL_VERIFICATION_ERROR_DETAIL: {
      code: 'AUTH_123',
      message: 'Email doğrulama hatası detayı',
      status: 'error' as const,
    },
    EMAIL_RESEND_ERROR: {
      code: 'AUTH_124',
      message: 'Email doğrulama yeniden gönderme hatası',
      status: 'error' as const,
    },
    // Login Messages
    LOGIN_STARTED: {
      code: 'AUTH_125',
      message: 'Login işlemi başlatıldı',
      status: 'info' as const,
    },
    // Token Messages
    TOKEN_REFRESH_ERROR: {
      code: 'AUTH_126',
      message: 'Token yenileme hatası',
      status: 'error' as const,
    },
    // Logout Messages
    LOGOUT_ERROR: {
      code: 'AUTH_127',
      message: 'Logout hatası',
      status: 'error' as const,
    },
    LOGOUT_ALL_ERROR: {
      code: 'AUTH_128',
      message: 'Logout all hatası',
      status: 'error' as const,
    },
    // Password Reset Messages
    PASSWORD_RESET_ERROR: {
      code: 'AUTH_129',
      message: 'Şifre sıfırlama hatası',
      status: 'error' as const,
    },
    PASSWORD_RESET_TOKEN_RECEIVED: {
      code: 'AUTH_130',
      message: 'Reset token received',
      status: 'info' as const,
    },
    PASSWORD_RESET_JWT_VERIFIED: {
      code: 'AUTH_131',
      message: 'JWT verification successful for user',
      status: 'info' as const,
    },
    PASSWORD_RESET_JWT_FAILED: {
      code: 'AUTH_132',
      message: 'JWT verification failed',
      status: 'error' as const,
    },
    PASSWORD_RESET_TOKEN_EXPIRED_MSG: {
      code: 'AUTH_133',
      message: 'AUTH_036: Şifre sıfırlama süresi dolmuş',
      status: 'error' as const,
    },
    PASSWORD_RESET_TOKEN_INVALID_MSG: {
      code: 'AUTH_134',
      message: 'AUTH_035: Geçersiz şifre sıfırlama token',
      status: 'error' as const,
    },
    PASSWORD_RESET_USER_NOT_FOUND: {
      code: 'AUTH_135',
      message: 'User not found for ID',
      status: 'error' as const,
    },
    PASSWORD_RESET_SUCCESS_LOG: {
      code: 'AUTH_136',
      message: 'Password reset successful for user',
      status: 'success' as const,
    },
    PASSWORD_RESET_SUCCESS_MSG: {
      code: 'AUTH_137',
      message: 'Şifre başarıyla sıfırlandı',
      status: 'success' as const,
    },
    PASSWORD_RESET_SYSTEM_ERROR: {
      code: 'AUTH_138',
      message: 'AUTH_038: Sistem hatası - Şifre sıfırlama işlemi başarısız',
      status: 'error' as const,
    },
    // User Profile Messages
    USER_NOT_FOUND: {
      code: 'AUTH_139',
      message: 'AUTH_013: Kullanıcı bilgisi bulunamadı',
      status: 'error' as const,
    },
    USER_INFO_SYSTEM_ERROR: {
      code: 'AUTH_140',
      message: 'AUTH_014: Sistem hatası - Kullanıcı bilgileri alınamadı',
      status: 'error' as const,
    },
    USER_INFO_ERROR_LOG: {
      code: 'AUTH_141',
      message: 'Kullanıcı bilgileri getirilemedi',
      status: 'error' as const,
    },
    PROFILE_USER_NOT_FOUND: {
      code: 'AUTH_142',
      message: 'AUTH_027: Kullanıcı bulunamadı',
      status: 'error' as const,
    },
    PROFILE_UPDATE_SUCCESS: {
      code: 'AUTH_143',
      message: 'Profil bilgileri başarıyla güncellendi',
      status: 'success' as const,
    },
    PROFILE_UPDATE_SYSTEM_ERROR: {
      code: 'AUTH_144',
      message: 'AUTH_029: Sistem hatası - Profil güncelleme işlemi başarısız',
      status: 'error' as const,
    },
    PROFILE_UPDATE_ERROR_LOG: {
      code: 'AUTH_145',
      message: 'Profil güncelleme hatası',
      status: 'error' as const,
    },
    // Password Change Messages
    PASSWORD_CHANGE_USER_NOT_FOUND: {
      code: 'AUTH_146',
      message: 'AUTH_030: Kullanıcı bulunamadı',
      status: 'error' as const,
    },
    PASSWORD_CHANGE_INVALID_CURRENT: {
      code: 'AUTH_147',
      message: 'AUTH_031: Mevcut şifre hatalı',
      status: 'error' as const,
    },
    PASSWORD_CHANGE_SUCCESS: {
      code: 'AUTH_148',
      message: 'Şifre başarıyla değiştirildi',
      status: 'success' as const,
    },
    PASSWORD_CHANGE_SYSTEM_ERROR: {
      code: 'AUTH_149',
      message: 'AUTH_032: Sistem hatası - Şifre değiştirme işlemi başarısız',
      status: 'error' as const,
    },
    PASSWORD_CHANGE_ERROR_LOG: {
      code: 'AUTH_150',
      message: 'Şifre değiştirme hatası',
      status: 'error' as const,
    },
    // Session Messages
    SESSION_USER_NOT_FOUND: {
      code: 'AUTH_151',
      message: 'Kullanıcı bulunamadı',
      status: 'error' as const,
    },
    SESSION_GET_ERROR_LOG: {
      code: 'AUTH_152',
      message: 'Oturumlar getirilemedi',
      status: 'error' as const,
    },
    SESSION_GET_SYSTEM_ERROR: {
      code: 'AUTH_153',
      message: 'AUTH_015: Sistem hatası - Oturum bilgileri alınamadı',
      status: 'error' as const,
    },
  },

  // Template Messages (TEMPLATE_xxx)
  TEMPLATE: {
    // Turkish Template Headers
    TR_PERSONAL_INFO: {
      code: 'TEMPLATE_001',
      message: 'KİŞİSEL BİLGİLER:',
      status: 'info' as const,
    },
    TR_PROFESSIONAL_PROFILE: {
      code: 'TEMPLATE_002',
      message: 'PROFESYONEL PROFİL:',
      status: 'info' as const,
    },
    TR_APPLICATION_INFO: {
      code: 'TEMPLATE_003',
      message: 'BAŞVURU BİLGİLERİ:',
      status: 'info' as const,
    },
    TR_REQUIREMENTS: {
      code: 'TEMPLATE_004',
      message: 'GEREKSINIMLER:',
      status: 'info' as const,
    },
    TR_FULL_NAME: {
      code: 'TEMPLATE_005',
      message: 'Ad Soyad:',
      status: 'info' as const,
    },
    TR_EMAIL: {
      code: 'TEMPLATE_006',
      message: 'E-posta:',
      status: 'info' as const,
    },
    TR_PHONE: {
      code: 'TEMPLATE_007',
      message: 'Telefon:',
      status: 'info' as const,
    },
    TR_CITY: {
      code: 'TEMPLATE_008',
      message: 'Şehir:',
      status: 'info' as const,
    },
    // English Template Headers
    EN_PERSONAL_INFO: {
      code: 'TEMPLATE_021',
      message: 'PERSONAL INFORMATION:',
      status: 'info' as const,
    },
    EN_PROFESSIONAL_PROFILE: {
      code: 'TEMPLATE_022',
      message: 'PROFESSIONAL PROFILE:',
      status: 'info' as const,
    },
    EN_APPLICATION_DETAILS: {
      code: 'TEMPLATE_023',
      message: 'APPLICATION DETAILS:',
      status: 'info' as const,
    },
    EN_REQUIREMENTS: {
      code: 'TEMPLATE_024',
      message: 'REQUIREMENTS:',
      status: 'info' as const,
    },
    EN_FULL_NAME: {
      code: 'TEMPLATE_025',
      message: 'Full Name:',
      status: 'info' as const,
    },
    EN_EMAIL: {
      code: 'TEMPLATE_026',
      message: 'Email:',
      status: 'info' as const,
    },
  },

  // AI Instructions (AI_INST_xxx)
  AI_INSTRUCTIONS: {
    NATURAL_TONE: {
      code: 'AI_INST_001',
      message:
        'Doğal ve samimi bir dil kullan - sanki gerçek bir kişi yazıyormuş gibi',
      status: 'info' as const,
    },
    HUMAN_STYLE: {
      code: 'AI_INST_002',
      message: 'Mükemmel olmayan, insan benzeri bir yazım stili benimse',
      status: 'info' as const,
    },
    VARIED_SENTENCES: {
      code: 'AI_INST_003',
      message: 'Ara sıra kısa cümleler, ara sıra uzun cümleler kullan',
      status: 'info' as const,
    },
    AVOID_CLICHES: {
      code: 'AI_INST_004',
      message: 'Klişe ifadelerden kaçın, kişisel ve özgün bir ton kullan',
      status: 'info' as const,
    },
  },

  // Email Content (EMAIL_CONTENT_xxx)
  EMAIL_CONTENT: {
    SENDER_KANBAN: {
      code: 'EMAIL_CONTENT_001',
      message: 'Kanban System <noreply@starkon-kanban.com>',
      status: 'info' as const,
    },
    SENDER_ATS: {
      code: 'EMAIL_CONTENT_002',
      message: 'ATS CV System <noreply@atscv.com>',
      status: 'info' as const,
    },
    VERIFY_EMAIL_SUBJECT: {
      code: 'EMAIL_CONTENT_003',
      message: 'Email Adresinizi Doğrulayın',
      status: 'info' as const,
    },
    PASSWORD_RESET_SUBJECT: {
      code: 'EMAIL_CONTENT_004',
      message: 'Şifre Sıfırlama Talebi',
      status: 'info' as const,
    },
  },

  // Contact Messages Extended (CONTACT_EXT_xxx)
  CONTACT_EXT: {
    MESSAGE_TYPE_CONTACT: {
      code: 'CONTACT_EXT_001',
      message: 'İletişim mesajınız',
      status: 'info' as const,
    },
    MESSAGE_TYPE_SUPPORT: {
      code: 'CONTACT_EXT_002',
      message: 'Destek talebiniz',
      status: 'info' as const,
    },
    MESSAGE_SENT_SUCCESS: {
      code: 'CONTACT_EXT_003',
      message: 'başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
      status: 'success' as const,
    },
    EMAIL_SEND_FAILED: {
      code: 'CONTACT_EXT_004',
      message: 'Email gönderimi başarısız - Lütfen daha sonra tekrar deneyin',
      status: 'error' as const,
    },
    SYSTEM_ERROR_MESSAGE: {
      code: 'CONTACT_EXT_005',
      message: 'Sistem hatası - Mesaj gönderilemedi',
      status: 'error' as const,
    },
    LIMIT_INFO_ERROR: {
      code: 'CONTACT_EXT_006',
      message: 'Limit bilgisi alınamadı',
      status: 'error' as const,
    },
    MESSAGE_LOAD_ERROR: {
      code: 'CONTACT_EXT_007',
      message: 'Sistem hatası - Mesajlar yüklenemedi',
      status: 'error' as const,
    },
    LIMIT_RESET_INFO: {
      code: 'CONTACT_EXT_008',
      message: 'Limit {resetTime} saatinde sıfırlanacak.',
      status: 'info' as const,
    },
  },

  // Logger Messages (LOG_xxx)
  LOGGER: {
    COVER_LETTER_GET_ERROR: {
      code: 'LOG_001',
      message: 'Cover letter getirme hatası:',
      status: 'error' as const,
    },
    COVER_LETTER_UPDATE_ERROR: {
      code: 'LOG_002',
      message: 'Cover letter güncelleme hatası:',
      status: 'error' as const,
    },
    COVER_LETTER_LIST_ERROR: {
      code: 'LOG_003',
      message: 'Cover letter listesi getirme hatası:',
      status: 'error' as const,
    },
    PDF_DOWNLOAD_ERROR: {
      code: 'LOG_004',
      message: 'PDF indirme hatası:',
      status: 'error' as const,
    },
    ERROR_OCCURRED: {
      code: 'LOG_005',
      message: 'Error occurred:',
      status: 'error' as const,
    },
  },

  // General Messages (GENERAL_xxx)
  GENERAL: {
    SUCCESS: {
      code: 'GENERAL_001',
      message: 'İşlem başarıyla tamamlandı',
      status: 'success' as const,
    },
    FAILED: {
      code: 'GENERAL_002',
      message: 'İşlem başarısız',
      status: 'error' as const,
    },
    VALIDATION_ERROR: {
      code: 'GENERAL_003',
      message: 'Veri doğrulama hatası',
      status: 'error' as const,
    },
    UNAUTHORIZED: {
      code: 'GENERAL_004',
      message: 'Yetkisiz erişim',
      status: 'error' as const,
    },
    NOT_FOUND: {
      code: 'GENERAL_005',
      message: 'Kaynak bulunamadı',
      status: 'error' as const,
    },
  },
};

/**
 * Mesaj formatlama fonksiyonu
 */
export function formatMessage(
  message: ServiceMessage,
  additionalInfo?: string
): string {
  let formattedMessage = `${message.code}: ${message.message}`;
  if (additionalInfo) {
    formattedMessage += ` - ${additionalInfo}`;
  }
  return formattedMessage;
}

/**
 * Hata mesajı oluşturma fonksiyonu
 */
export function createErrorMessage(
  message: ServiceMessage,
  error?: Error
): string {
  let errorMessage = formatMessage(message);
  if (error) {
    errorMessage += ` (${error.message})`;
  }
  return errorMessage;
}

/**
 * Başarı mesajı oluşturma fonksiyonu
 */
export function createSuccessMessage(
  message: ServiceMessage,
  data?: any
): string {
  let successMessage = formatMessage(message);
  if (data) {
    successMessage += ` - ${JSON.stringify(data)}`;
  }
  return successMessage;
}

/**
 * Dinamik mesaj oluşturma fonksiyonu
 */
export function createDynamicMessage(
  message: ServiceMessage,
  params: Record<string, any>
): string {
  let dynamicMessage = message.message;

  // Parametre değiştirme
  Object.keys(params).forEach((key) => {
    dynamicMessage = dynamicMessage.replace(`{${key}}`, params[key]);
  });

  return `${message.code}: ${dynamicMessage}`;
}
