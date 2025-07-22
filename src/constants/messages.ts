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
      status: 'success' as const
    },
    CONNECTION_FAILED: {
      code: 'DB_002',
      message: 'Veritabanı bağlantısı başarısız',
      status: 'error' as const
    },
    CONNECTION_CLOSED: {
      code: 'DB_003',
      message: 'Veritabanı bağlantısı başarıyla kapatıldı',
      status: 'success' as const
    },
    CLIENT_CREATION_FAILED: {
      code: 'DB_004',
      message: 'Veritabanı istemci başlatma başarısız',
      status: 'error' as const
    },
    HEALTH_CHECK_FAILED: {
      code: 'DB_005',
      message: 'Veritabanı sağlık kontrolü başarısız',
      status: 'error' as const
    },
    TOKEN_CLEANUP_SUCCESS: {
      code: 'DB_006',
      message: 'Süresi dolmuş tokenlar temizlendi',
      status: 'success' as const
    },
    TOKEN_CLEANUP_FAILED: {
      code: 'DB_007',
      message: 'Token temizleme işlemi başarısız',
      status: 'error' as const
    },
    USER_CLEANUP_SUCCESS: {
      code: 'DB_008',
      message: 'Doğrulanmamış kullanıcılar temizlendi',
      status: 'success' as const
    },
    USER_CLEANUP_FAILED: {
      code: 'DB_009',
      message: 'Doğrulanmamış kullanıcı temizleme başarısız',
      status: 'error' as const
    },
    PASSWORD_RESET_CLEANUP_SUCCESS: {
      code: 'DB_010',
      message: 'Süresi dolmuş şifre sıfırlama tokenları temizlendi',
      status: 'success' as const
    },
    PASSWORD_RESET_CLEANUP_FAILED: {
      code: 'DB_011',
      message: 'Şifre sıfırlama token temizleme başarısız',
      status: 'error' as const
    }
  },

  // Authentication & JWT Messages (AUTH_xxx, JWT_xxx)
  AUTH: {
    TOKEN_GENERATION_FAILED: {
      code: 'AUTH_001',
      message: 'Token oluşturulamadı',
      status: 'error' as const
    },
    TOKEN_VERIFICATION_FAILED: {
      code: 'AUTH_002',
      message: 'Token doğrulanamadı',
      status: 'error' as const
    },
    PASSWORD_RESET_TOKEN_GENERATION_FAILED: {
      code: 'AUTH_003',
      message: 'Şifre sıfırlama token oluşturma hatası',
      status: 'error' as const
    },
    PASSWORD_RESET_TOKEN_EXPIRED: {
      code: 'AUTH_004',
      message: 'Şifre sıfırlama süresi dolmuş',
      status: 'error' as const
    },
    PASSWORD_RESET_TOKEN_INVALID: {
      code: 'AUTH_005',
      message: 'Şifre sıfırlama token geçersiz',
      status: 'error' as const
    },
    EMAIL_VERIFICATION_TOKEN_GENERATION_FAILED: {
      code: 'AUTH_006',
      message: 'Email doğrulama token oluşturma hatası',
      status: 'error' as const
    },
    EMAIL_VERIFICATION_TOKEN_EXPIRED: {
      code: 'AUTH_007',
      message: 'Email doğrulama süresi dolmuş',
      status: 'error' as const
    },
    EMAIL_VERIFICATION_TOKEN_INVALID: {
      code: 'AUTH_008',
      message: 'Email doğrulama token geçersiz',
      status: 'error' as const
    }
  },

  // Email Messages (EMAIL_xxx)
  EMAIL: {
    VERIFICATION_SENT: {
      code: 'EMAIL_001',
      message: 'Email doğrulama başarıyla gönderildi',
      status: 'success' as const
    },
    VERIFICATION_SEND_FAILED: {
      code: 'EMAIL_002',
      message: 'Email doğrulama gönderilemedi',
      status: 'error' as const
    },
    PASSWORD_RESET_SENT: {
      code: 'EMAIL_003',
      message: 'Şifre sıfırlama emaili başarıyla gönderildi',
      status: 'success' as const
    },
    PASSWORD_RESET_SEND_FAILED: {
      code: 'EMAIL_004',
      message: 'Şifre sıfırlama emaili gönderilemedi',
      status: 'error' as const
    },
    CONTACT_MESSAGE_SENT: {
      code: 'EMAIL_005',
      message: 'İletişim mesajı başarıyla gönderildi',
      status: 'success' as const
    },
    CONTACT_MESSAGE_SEND_FAILED: {
      code: 'EMAIL_006',
      message: 'İletişim mesajı gönderilemedi',
      status: 'error' as const
    }
  },

  // Contact Messages (CONTACT_xxx)
  CONTACT: {
    DAILY_LIMIT_EXCEEDED: {
      code: 'CONTACT_001',
      message: 'Günlük mesaj gönderme limitine ulaştınız (3/3)',
      status: 'error' as const
    },
    MESSAGE_SENT: {
      code: 'CONTACT_002',
      message: 'Mesajınız başarıyla gönderildi',
      status: 'success' as const
    }
  },

  // File Processing Messages (FILE_xxx)
  FILE: {
    NOT_FOUND: {
      code: 'FILE_001',
      message: 'Dosya bulunamadı',
      status: 'error' as const
    },
    EMPTY_FILE: {
      code: 'FILE_002',
      message: 'Dosya boş',
      status: 'error' as const
    },
    UNSUPPORTED_FORMAT: {
      code: 'FILE_003',
      message: 'Desteklenmeyen dosya formatı',
      status: 'error' as const
    },
    PDF_EXTRACTION_FAILED: {
      code: 'FILE_004',
      message: 'PDF dosyasından metin çıkarılamadı',
      status: 'error' as const
    },
    WORD_EXTRACTION_FAILED: {
      code: 'FILE_005',
      message: 'Word dosyasından metin çıkarılamadı',
      status: 'error' as const
    },
    TEXT_FILE_EMPTY: {
      code: 'FILE_006',
      message: 'Metin dosyası boş',
      status: 'error' as const
    },
    READING_FAILED: {
      code: 'FILE_007',
      message: 'Dosya içeriği okunamadı',
      status: 'error' as const
    },
    COMPRESSION_FAILED: {
      code: 'FILE_008',
      message: 'Dosya sıkıştırılamadı',
      status: 'error' as const
    },
    DECOMPRESSION_FAILED: {
      code: 'FILE_009',
      message: 'Sıkıştırılmış dosya açılamadı',
      status: 'error' as const
    }
  },

  // Cover Letter Messages (COVER_xxx)
  COVER_LETTER: {
    GENERATION_SUCCESS: {
      code: 'COVER_001',
      message: 'Cover letter başarıyla oluşturuldu',
      status: 'success' as const
    },
    GENERATION_FAILED: {
      code: 'COVER_002',
      message: 'Cover letter oluşturma hatası',
      status: 'error' as const
    },
    NOT_FOUND: {
      code: 'COVER_003',
      message: 'Cover letter bulunamadı',
      status: 'error' as const
    },
    UPDATE_SUCCESS: {
      code: 'COVER_004',
      message: 'Cover letter başarıyla güncellendi',
      status: 'success' as const
    },
    DELETE_SUCCESS: {
      code: 'COVER_005',
      message: 'Cover letter başarıyla silindi',
      status: 'success' as const
    }
  },

  // CV Messages (CV_xxx)
  CV: {
    UPLOAD_SUCCESS: {
      code: 'CV_001',
      message: 'CV başarıyla yüklendi',
      status: 'success' as const
    },
    PROCESSING_STARTED: {
      code: 'CV_002',
      message: 'CV işleme başlatıldı',
      status: 'info' as const
    },
    PROCESSING_COMPLETED: {
      code: 'CV_003',
      message: 'CV işleme tamamlandı',
      status: 'success' as const
    },
    PROCESSING_FAILED: {
      code: 'CV_004',
      message: 'CV işleme başarısız',
      status: 'error' as const
    },
    NOT_FOUND: {
      code: 'CV_005',
      message: 'CV bulunamadı',
      status: 'error' as const
    },
    ANALYSIS_DATA_MISSING: {
      code: 'CV_006',
      message: 'CV analiz verisi bulunamadı',
      status: 'error' as const
    },
    NO_FILE_UPLOADED: {
      code: 'CV_007',
      message: 'CV dosyası yüklenmedi',
      status: 'error' as const
    },
    UPLOAD_PROCESSING: {
      code: 'CV_008',
      message: 'CV yüklendi ve işleme alındı',
      status: 'success' as const
    },
    PROCESSING_PENDING: {
      code: 'CV_009',
      message: 'CV işleniyor, lütfen bekleyin...',
      status: 'info' as const
    },
    UPLOAD_ERROR: {
      code: 'CV_010',
      message: 'CV yüklenirken hata oluştu',
      status: 'error' as const
    },
    FILE_SIZE_EXCEEDED: {
      code: 'CV_011',
      message: 'Dosya boyutu çok büyük (maksimum 10MB)',
      status: 'error' as const
    },
    LIST_ERROR: {
      code: 'CV_012',
      message: 'CV listesi alınırken hata oluştu',
      status: 'error' as const
    },
    STATUS_CHECK_ERROR: {
      code: 'CV_013',
      message: 'Durum kontrolünde hata oluştu',
      status: 'error' as const
    },
    DELETE_SUCCESS: {
      code: 'CV_014',
      message: 'CV başarıyla silindi',
      status: 'success' as const
    },
    DELETE_ERROR: {
      code: 'CV_015',
      message: 'CV silinirken hata oluştu',
      status: 'error' as const
    },
    UPLOAD_ID_REQUIRED: {
      code: 'CV_016',
      message: 'CV yükleme ID\'si gereklidir',
      status: 'error' as const
    },
    DATA_NOT_FOUND: {
      code: 'CV_017',
      message: 'CV verisi bulunamadı',
      status: 'error' as const
    },
    GENERATION_SUCCESS: {
      code: 'CV_018',
      message: 'CV başarıyla oluşturuldu',
      status: 'success' as const
    },
    GENERATION_ERROR: {
      code: 'CV_019',
      message: 'CV oluşturulurken hata oluştu',
      status: 'error' as const
    },
    SAVE_SUCCESS: {
      code: 'CV_020',
      message: 'CV başarıyla kaydedildi',
      status: 'success' as const
    },
    SAVE_ERROR: {
      code: 'CV_021',
      message: 'CV kaydedilirken hata oluştu',
      status: 'error' as const
    },
    SAVE_LIMIT_EXCEEDED: {
      code: 'CV_022',
      message: 'Maksimum 5 CV kaydedebilirsiniz',
      status: 'error' as const
    },
    SAVED_LIST_ERROR: {
      code: 'CV_023',
      message: 'Kayıtlı CV\'ler alınırken hata oluştu',
      status: 'error' as const
    },
    FILE_NOT_IN_DATABASE: {
      code: 'CV_024',
      message: 'CV dosyası veritabanında bulunamadı',
      status: 'error' as const
    },
    DOWNLOAD_ERROR: {
      code: 'CV_025',
      message: 'CV indirilirken hata oluştu',
      status: 'error' as const
    },
    INVALID_DATA: {
      code: 'CV_026',
      message: 'Geçersiz veri',
      status: 'error' as const
    },
    FILE_DELETE_ERROR: {
      code: 'CV_027',
      message: 'Dosya silme hatası',
      status: 'error' as const
    }
  },

  // PDF Generation Messages (PDF_xxx)
  PDF: {
    GENERATION_SUCCESS: {
      code: 'PDF_001',
      message: 'PDF başarıyla oluşturuldu',
      status: 'success' as const
    },
    GENERATION_FAILED: {
      code: 'PDF_002',
      message: 'PDF oluşturulurken bir hata oluştu',
      status: 'error' as const
    },
    CUSTOM_FORMAT_SUCCESS: {
      code: 'PDF_003',
      message: 'Özelleştirilmiş cover letter PDF başarıyla oluşturuldu',
      status: 'success' as const
    }
  },

  // Claude AI Messages (AI_xxx)
  AI: {
    API_KEY_MISSING: {
      code: 'AI_001',
      message: 'Anthropic API anahtarı yapılandırılmamış',
      status: 'error' as const
    },
    API_KEY_INVALID: {
      code: 'AI_002',
      message: 'Anthropic API anahtarı geçersiz veya eksik',
      status: 'error' as const
    },
    CV_ANALYSIS_FAILED: {
      code: 'AI_003',
      message: 'CV analizi yapılırken bir hata oluştu',
      status: 'error' as const
    },
    COVER_LETTER_GENERATION_FAILED: {
      code: 'AI_004',
      message: 'Cover letter oluşturulurken bir hata oluştu',
      status: 'error' as const
    },
    API_ERROR: {
      code: 'AI_005',
      message: 'Claude API hatası',
      status: 'error' as const
    }
  },

  // Cache Messages (CACHE_xxx)
  CACHE: {
    GET_ERROR: {
      code: 'CACHE_001',
      message: 'Cache okuma hatası',
      status: 'error' as const
    },
    SET_ERROR: {
      code: 'CACHE_002',
      message: 'Cache yazma hatası',
      status: 'error' as const
    },
    DELETE_ERROR: {
      code: 'CACHE_003',
      message: 'Cache silme hatası',
      status: 'error' as const
    },
    FLUSH_ERROR: {
      code: 'CACHE_004',
      message: 'Cache temizleme hatası',
      status: 'error' as const
    },
    EXISTS_ERROR: {
      code: 'CACHE_005',
      message: 'Cache kontrol hatası',
      status: 'error' as const
    }
  },

  // Session Messages (SESSION_xxx)
  SESSION: {
    CREATION_ERROR: {
      code: 'SESSION_001',
      message: 'Session oluşturma hatası',
      status: 'error' as const
    },
    GET_ERROR: {
      code: 'SESSION_002',
      message: 'Session getirme hatası',
      status: 'error' as const
    },
    DELETE_ERROR: {
      code: 'SESSION_003',
      message: 'Session silme hatası',
      status: 'error' as const
    },
    DELETE_ALL_ERROR: {
      code: 'SESSION_004',
      message: 'Tüm session silme hatası',
      status: 'error' as const
    },
    EXTEND_ERROR: {
      code: 'SESSION_005',
      message: 'Session uzatma hatası',
      status: 'error' as const
    }
  },

  // Queue Messages (QUEUE_xxx)
  QUEUE: {
    EMAIL_JOB_PROCESSING: {
      code: 'QUEUE_001',
      message: 'Email job işleniyor',
      status: 'info' as const
    },
    EMAIL_JOB_COMPLETED: {
      code: 'QUEUE_002',
      message: 'Email job tamamlandı',
      status: 'success' as const
    },
    EMAIL_JOB_FAILED: {
      code: 'QUEUE_003',
      message: 'Email job işleme hatası',
      status: 'error' as const
    },
    MAX_RETRIES_REACHED: {
      code: 'QUEUE_004',
      message: 'Email job maksimum deneme sayısına ulaştı',
      status: 'error' as const
    },
    UNKNOWN_EMAIL_TYPE: {
      code: 'QUEUE_005',
      message: 'Bilinmeyen email tipi',
      status: 'error' as const
    }
  },

  // Validation Messages (VALID_xxx)
  VALIDATION: {
    INPUT_VALIDATION_ERROR: {
      code: 'VALID_001',
      message: 'Giriş doğrulama hatası',
      status: 'error' as const
    },
    UNEXPECTED_VALIDATION_ERROR: {
      code: 'VALID_002',
      message: 'Beklenmeyen doğrulama hatası',
      status: 'error' as const
    },
    PARAMS_VALIDATION_ERROR: {
      code: 'VALID_003',
      message: 'Parametre doğrulama hatası',
      status: 'error' as const
    },
    UNEXPECTED_PARAMS_VALIDATION_ERROR: {
      code: 'VALID_004',
      message: 'Beklenmeyen parametre doğrulama hatası',
      status: 'error' as const
    }
  },

  // CORS Messages (CORS_xxx)
  CORS: {
    ORIGIN_NOT_ALLOWED: {
      code: 'CORS_001',
      message: 'CORS: Origin not allowed',
      status: 'error' as const
    }
  },

  // Rate Limiting Messages (RATE_xxx)
  RATE_LIMIT: {
    GENERAL_EXCEEDED: {
      code: 'RATE_001',
      message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin',
      status: 'error' as const
    },
    AUTH_EXCEEDED: {
      code: 'RATE_002', 
      message: 'Çok fazla giriş denemesi, lütfen daha sonra tekrar deneyin',
      status: 'error' as const
    },
    UPLOAD_EXCEEDED: {
      code: 'RATE_003',
      message: 'Saatlik yükleme limitine ulaştınız',
      status: 'error' as const
    },
    API_EXCEEDED: {
      code: 'RATE_004',
      message: 'API rate limit aşıldı',
      status: 'error' as const
    }
  },

  // Schema Validation Messages (SCHEMA_xxx)
  SCHEMA: {
    EMAIL_REQUIRED: {
      code: 'SCHEMA_001',
      message: 'Geçerli bir email adresi giriniz',
      status: 'error' as const
    },
    PASSWORD_REQUIRED: {
      code: 'SCHEMA_002',
      message: 'Şifre gereklidir',
      status: 'error' as const
    },
    PASSWORD_MIN_LENGTH: {
      code: 'SCHEMA_003',
      message: 'Şifre en az 8 karakter olmalıdır',
      status: 'error' as const
    },
    PASSWORD_MAX_LENGTH: {
      code: 'SCHEMA_004',
      message: 'Şifre en fazla 100 karakter olabilir',
      status: 'error' as const
    },
    PASSWORD_PATTERN: {
      code: 'SCHEMA_005',
      message: 'Şifre en az bir harf, bir rakam içermeli ve sadece izin verilen özel karakterleri kullanmalıdır',
      status: 'error' as const
    },
    NAME_MIN_LENGTH: {
      code: 'SCHEMA_006',
      message: 'Ad en az 2 karakter olmalıdır',
      status: 'error' as const
    },
    NAME_MAX_LENGTH: {
      code: 'SCHEMA_007',
      message: 'Ad en fazla 50 karakter olabilir',
      status: 'error' as const
    },
    REFRESH_TOKEN_REQUIRED: {
      code: 'SCHEMA_008',
      message: 'Refresh token gereklidir',
      status: 'error' as const
    },
    RESET_TOKEN_REQUIRED: {
      code: 'SCHEMA_009',
      message: 'Şifre sıfırlama token gereklidir',
      status: 'error' as const
    },
    NEW_PASSWORD_MIN_LENGTH: {
      code: 'SCHEMA_010',
      message: 'Yeni şifre en az 8 karakter olmalıdır',
      status: 'error' as const
    },
    NEW_PASSWORD_MAX_LENGTH: {
      code: 'SCHEMA_011',
      message: 'Yeni şifre en fazla 100 karakter olabilir',
      status: 'error' as const
    },
    NEW_PASSWORD_PATTERN: {
      code: 'SCHEMA_012',
      message: 'Yeni şifre en az bir harf ve bir rakam içermelidir',
      status: 'error' as const
    },
    CONFIRM_PASSWORD_REQUIRED: {
      code: 'SCHEMA_013',
      message: 'Şifre tekrarı gereklidir',
      status: 'error' as const
    },
    PASSWORD_MISMATCH: {
      code: 'SCHEMA_014',
      message: 'Yeni şifre ve şifre tekrarı eşleşmiyor',
      status: 'error' as const
    },
    PASSWORD_SAME_AS_CURRENT: {
      code: 'SCHEMA_015',
      message: 'Yeni şifre mevcut şifreden farklı olmalıdır',
      status: 'error' as const
    },
    CURRENT_PASSWORD_REQUIRED: {
      code: 'SCHEMA_016',
      message: 'Mevcut şifre gereklidir',
      status: 'error' as const
    },
    EMAIL_VERIFICATION_TOKEN_REQUIRED: {
      code: 'SCHEMA_017',
      message: 'Email doğrulama token gereklidir',
      status: 'error' as const
    },
    USER_PROFILE_NAME_MIN: {
      code: 'SCHEMA_018',
      message: 'Ad soyad en az 2 karakter olmalıdır',
      status: 'error' as const
    },
    USER_PROFILE_NAME_MAX: {
      code: 'SCHEMA_019',
      message: 'Ad soyad en fazla 50 karakter olabilir',
      status: 'error' as const
    },
    USER_PROFILE_EMAIL_MAX: {
      code: 'SCHEMA_020',
      message: 'Email adresi en fazla 255 karakter olabilir',
      status: 'error' as const
    },
    CONTACT_NAME_MIN: {
      code: 'SCHEMA_021',
      message: 'Ad soyad en az 2 karakter olmalıdır',
      status: 'error' as const
    },
    CONTACT_NAME_MAX: {
      code: 'SCHEMA_022',
      message: 'Ad soyad en fazla 100 karakter olabilir',
      status: 'error' as const
    },
    CONTACT_EMAIL_MAX: {
      code: 'SCHEMA_023',
      message: 'Email adresi çok uzun',
      status: 'error' as const
    },
    CONTACT_SUBJECT_MIN: {
      code: 'SCHEMA_024',
      message: 'Konu en az 3 karakter olmalıdır',
      status: 'error' as const
    },
    CONTACT_SUBJECT_MAX: {
      code: 'SCHEMA_025',
      message: 'Konu en fazla 200 karakter olabilir',
      status: 'error' as const
    },
    CONTACT_MESSAGE_MIN: {
      code: 'SCHEMA_026',
      message: 'Mesaj en az 10 karakter olmalıdır',
      status: 'error' as const
    },
    CONTACT_MESSAGE_MAX: {
      code: 'SCHEMA_027',
      message: 'Mesaj en fazla 2000 karakter olabilir',
      status: 'error' as const
    }
  },

  // General Messages (GENERAL_xxx)
  GENERAL: {
    SUCCESS: {
      code: 'GENERAL_001',
      message: 'İşlem başarıyla tamamlandı',
      status: 'success' as const
    },
    FAILED: {
      code: 'GENERAL_002',
      message: 'İşlem başarısız',
      status: 'error' as const
    },
    VALIDATION_ERROR: {
      code: 'GENERAL_003',
      message: 'Veri doğrulama hatası',
      status: 'error' as const
    },
    UNAUTHORIZED: {
      code: 'GENERAL_004',
      message: 'Yetkisiz erişim',
      status: 'error' as const
    },
    NOT_FOUND: {
      code: 'GENERAL_005',
      message: 'Kaynak bulunamadı',
      status: 'error' as const
    }
  }
};

/**
 * Mesaj formatlama fonksiyonu
 */
export function formatMessage(message: ServiceMessage, additionalInfo?: string): string {
  let formattedMessage = `${message.code}: ${message.message}`;
  if (additionalInfo) {
    formattedMessage += ` - ${additionalInfo}`;
  }
  return formattedMessage;
}

/**
 * Hata mesajı oluşturma fonksiyonu
 */
export function createErrorMessage(message: ServiceMessage, error?: Error): string {
  let errorMessage = formatMessage(message);
  if (error) {
    errorMessage += ` (${error.message})`;
  }
  return errorMessage;
}

/**
 * Başarı mesajı oluşturma fonksiyonu
 */
export function createSuccessMessage(message: ServiceMessage, data?: any): string {
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
  Object.keys(params).forEach(key => {
    dynamicMessage = dynamicMessage.replace(`{${key}}`, params[key]);
  });
  
  return `${message.code}: ${dynamicMessage}`;
}