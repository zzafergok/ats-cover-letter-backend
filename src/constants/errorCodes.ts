export enum ErrorCode {
  // Authentication
  AUTH_INVALID_CREDENTIALS = 'AUTH_001',
  AUTH_INVALID_PASSWORD = 'AUTH_002',
  AUTH_USER_NOT_FOUND = 'AUTH_003',
  AUTH_EMAIL_NOT_VERIFIED = 'AUTH_004',
  AUTH_TOKEN_INVALID = 'AUTH_005',
  AUTH_TOKEN_EXPIRED = 'AUTH_006',
  AUTH_REFRESH_TOKEN_INVALID = 'AUTH_007',
  AUTH_SESSION_EXPIRED = 'AUTH_008',

  // Database
  DB_CONNECTION_FAILED = 'DB_001',
  DB_QUERY_FAILED = 'DB_002',
  DB_TRANSACTION_FAILED = 'DB_003',
  DB_DUPLICATE_ENTRY = 'DB_004',

  // File Upload
  FILE_UPLOAD_FAILED = 'FILE_001',
  FILE_SIZE_EXCEEDED = 'FILE_002',
  FILE_TYPE_INVALID = 'FILE_003',
  FILE_NOT_FOUND = 'FILE_004',

  // CV Processing
  CV_PROCESSING_FAILED = 'CV_001',
  CV_PARSE_FAILED = 'CV_002',
  CV_GENERATION_FAILED = 'CV_003',
  CV_LIMIT_EXCEEDED = 'CV_004',

  // Email
  EMAIL_SEND_FAILED = 'EMAIL_001',
  EMAIL_TEMPLATE_NOT_FOUND = 'EMAIL_002',
  EMAIL_INVALID_RECIPIENT = 'EMAIL_003',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_001',

  // Validation
  VALIDATION_FAILED = 'VAL_001',
  INVALID_INPUT = 'VAL_002',

  // System
  INTERNAL_SERVER_ERROR = 'SYS_001',
  SERVICE_UNAVAILABLE = 'SYS_002',
  NOT_IMPLEMENTED = 'SYS_003',
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Geçersiz kimlik bilgileri',
  [ErrorCode.AUTH_INVALID_PASSWORD]: 'Geçersiz şifre',
  [ErrorCode.AUTH_USER_NOT_FOUND]: 'Kullanıcı bulunamadı',
  [ErrorCode.AUTH_EMAIL_NOT_VERIFIED]: 'Email doğrulanmamış',
  [ErrorCode.AUTH_TOKEN_INVALID]: 'Geçersiz token',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Token süresi dolmuş',
  [ErrorCode.AUTH_REFRESH_TOKEN_INVALID]: 'Geçersiz yenileme tokeni',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Oturum süresi dolmuş',
  [ErrorCode.DB_CONNECTION_FAILED]: 'Veritabanı bağlantısı başarısız',
  [ErrorCode.DB_QUERY_FAILED]: 'Veritabanı sorgusu başarısız',
  [ErrorCode.DB_TRANSACTION_FAILED]: 'Veritabanı işlemi başarısız',
  [ErrorCode.DB_DUPLICATE_ENTRY]: 'Kayıt zaten mevcut',
  [ErrorCode.FILE_UPLOAD_FAILED]: 'Dosya yükleme başarısız',
  [ErrorCode.FILE_SIZE_EXCEEDED]: 'Dosya boyutu çok büyük',
  [ErrorCode.FILE_TYPE_INVALID]: 'Geçersiz dosya tipi',
  [ErrorCode.FILE_NOT_FOUND]: 'Dosya bulunamadı',
  [ErrorCode.CV_PROCESSING_FAILED]: 'CV işleme başarısız',
  [ErrorCode.CV_PARSE_FAILED]: 'CV ayrıştırma başarısız',
  [ErrorCode.CV_GENERATION_FAILED]: 'CV oluşturma başarısız',
  [ErrorCode.CV_LIMIT_EXCEEDED]: 'CV limiti aşıldı',
  [ErrorCode.EMAIL_SEND_FAILED]: 'Email gönderimi başarısız',
  [ErrorCode.EMAIL_TEMPLATE_NOT_FOUND]: 'Email şablonu bulunamadı',
  [ErrorCode.EMAIL_INVALID_RECIPIENT]: 'Geçersiz alıcı',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'İstek limiti aşıldı',
  [ErrorCode.VALIDATION_FAILED]: 'Doğrulama başarısız',
  [ErrorCode.INVALID_INPUT]: 'Geçersiz giriş',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Sunucu hatası',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Servis kullanılamıyor',
  [ErrorCode.NOT_IMPLEMENTED]: 'Henüz uygulanmadı',
};
