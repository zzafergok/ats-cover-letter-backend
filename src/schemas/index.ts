import { z } from 'zod';

import { SERVICE_MESSAGES } from '../constants/messages';

// Environment validation schema
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  RESEND_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).default('0'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  FRONTEND_URL: z.string().url(),
  ADMIN_EMAIL: z.string().email(),
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email(SERVICE_MESSAGES.SCHEMA.EMAIL_REQUIRED.message),
  password: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.PASSWORD_REQUIRED.message),
});

export const registerSchema = z.object({
  email: z.string().email(SERVICE_MESSAGES.SCHEMA.EMAIL_REQUIRED.message),
  password: z
    .string()
    .min(8, SERVICE_MESSAGES.SCHEMA.PASSWORD_MIN_LENGTH.message)
    .max(100, SERVICE_MESSAGES.SCHEMA.PASSWORD_MAX_LENGTH.message)
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
      SERVICE_MESSAGES.SCHEMA.PASSWORD_PATTERN.message
    ),
  name: z
    .string()
    .min(2, SERVICE_MESSAGES.SCHEMA.NAME_MIN_LENGTH.message)
    .max(50, SERVICE_MESSAGES.SCHEMA.NAME_MAX_LENGTH.message),
  role: z.enum(['ADMIN', 'USER']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(SERVICE_MESSAGES.SCHEMA.EMAIL_REQUIRED.message),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.REFRESH_TOKEN_REQUIRED.message),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Şifre sıfırlama token gereklidir'),
    newPassword: z
      .string()
      .min(8, 'Yeni şifre en az 8 karakter olmalıdır')
      .max(100, 'Yeni şifre en fazla 100 karakter olabilir')
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
        'Yeni şifre en az bir harf ve bir rakam içermelidir'
      ),
    confirmPassword: z.string().min(1, 'Şifre tekrarı gereklidir'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Yeni şifre ve şifre tekrarı eşleşmiyor',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Email doğrulama token gereklidir'),
});

export const resendEmailVerificationSchema = z.object({
  email: z.string().email(SERVICE_MESSAGES.SCHEMA.EMAIL_REQUIRED.message),
});

// User profile schemas
export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Ad soyad en az 2 karakter olmalıdır')
    .max(50, 'Ad soyad en fazla 50 karakter olabilir'),
  email: z
    .string()
    .email('Geçerli bir email adresi giriniz')
    .max(255, 'Email adresi en fazla 255 karakter olabilir'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre gereklidir'),
    newPassword: z
      .string()
      .min(8, 'Yeni şifre en az 8 karakter olmalıdır')
      .max(100, 'Yeni şifre en fazla 100 karakter olabilir')
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
        'Yeni şifre en az bir harf ve bir rakam içermelidir'
      ),
    confirmPassword: z.string().min(1, 'Şifre tekrarı gereklidir'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Yeni şifre ve şifre tekrarı eşleşmiyor',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Yeni şifre mevcut şifreden farklı olmalıdır',
    path: ['newPassword'],
  });

// Contact message schema
export const contactMessageSchema = z.object({
  type: z.enum(['CONTACT', 'SUPPORT']),
  name: z
    .string()
    .min(2, 'Ad soyad en az 2 karakter olmalıdır')
    .max(100, 'Ad soyad en fazla 100 karakter olabilir')
    .trim(),
  email: z
    .string()
    .email('Geçerli bir email adresi giriniz')
    .max(255, 'Email adresi çok uzun'),
  subject: z
    .string()
    .min(3, 'Konu en az 3 karakter olmalıdır')
    .max(200, 'Konu en fazla 200 karakter olabilir')
    .trim(),
  message: z
    .string()
    .min(10, 'Mesaj en az 10 karakter olmalıdır')
    .max(2000, 'Mesaj en fazla 2000 karakter olabilir')
    .trim(),
});

// Cover letter schemas
export const generateCoverLetterSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1, 'Ad soyad gereklidir'),
    email: z.string().email('Geçerli email gereklidir'),
    phone: z.string().min(1, 'Telefon gereklidir'),
    city: z.string().optional(),
    state: z.string().optional(),
    linkedin: z.string().optional(),
  }),
  jobInfo: z.object({
    positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
    companyName: z.string().min(1, 'Şirket adı gereklidir'),
    department: z.string().optional(),
    hiringManagerName: z.string().optional(),
    jobDescription: z.string().optional(),
    requirements: z.array(z.string()).optional(),
  }),
  experience: z.object({
    currentPosition: z.string().optional(),
    yearsOfExperience: z.number().min(0, 'Deneyim yılı 0 veya üzeri olmalı'),
    relevantSkills: z.array(z.string()).min(1, 'En az bir beceri gereklidir'),
    achievements: z.array(z.string()).min(1, 'En az bir başarı gereklidir'),
    previousCompanies: z.array(z.string()).optional(),
  }),
  coverLetterType: z.enum([
    'PROFESSIONAL',
    'CREATIVE',
    'TECHNICAL',
    'ENTRY_LEVEL',
  ]),
  tone: z.enum(['FORMAL', 'FRIENDLY', 'CONFIDENT', 'ENTHUSIASTIC']),
  additionalInfo: z
    .object({
      reasonForApplying: z.string().optional(),
      companyKnowledge: z.string().optional(),
      careerGoals: z.string().optional(),
    })
    .optional(),
});

export const saveCoverLetterSchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  content: z.string().min(1, 'İçerik gereklidir'),
  coverLetterType: z.enum([
    'PROFESSIONAL',
    'CREATIVE',
    'TECHNICAL',
    'ENTRY_LEVEL',
  ]),
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  category: z
    .enum([
      'SOFTWARE_DEVELOPER',
      'MARKETING_SPECIALIST',
      'SALES_REPRESENTATIVE',
      'PROJECT_MANAGER',
      'DATA_ANALYST',
      'UI_UX_DESIGNER',
      'BUSINESS_ANALYST',
      'CUSTOMER_SERVICE',
      'HR_SPECIALIST',
      'FINANCE_SPECIALIST',
      'CONTENT_WRITER',
      'DIGITAL_MARKETING',
      'PRODUCT_MANAGER',
      'QUALITY_ASSURANCE',
      'GRAPHIC_DESIGNER',
      'ADMINISTRATIVE_ASSISTANT',
      'CONSULTANT',
      'ENGINEER',
      'TEACHER',
      'HEALTHCARE',
      'LEGAL',
      'GENERAL',
    ])
    .optional()
    .default('GENERAL'),
});

export const analyzeCoverLetterSchema = z.object({
  content: z.string().min(1, 'Cover letter içeriği gereklidir'),
});

export const generateMinimalCoverLetterSchema = z.object({
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  motivation: z.string().optional(),
});

// Cover letter basic schemas
export const createCoverLetterSchema = z.object({
  cvUploadId: z.string().min(1, 'CV upload ID gereklidir'),
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  jobDescription: z.string().min(10, 'İş tanımı en az 10 karakter olmalıdır'),
  language: z
    .enum(['TURKISH', 'ENGLISH'], {
      errorMap: () => ({
        message: 'Dil seçeneği TURKISH veya ENGLISH olmalıdır',
      }),
    })
    .default('TURKISH'),
});

export const updateCoverLetterSchema = z.object({
  updatedContent: z
    .string()
    .min(50, 'Cover letter içeriği en az 50 karakter olmalıdır'),
});

// CV schemas
export const createCvSchema = z.object({
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  cvType: z.enum(['ATS_OPTIMIZED', 'CREATIVE', 'TECHNICAL']),
  jobDescription: z.string().optional(),
  additionalRequirements: z.string().optional(),
  targetKeywords: z.array(z.string()).optional(),
});

export const saveCvSchema = z.object({
  title: z.string().min(1, 'CV başlığı gereklidir'),
  content: z.string().min(1, 'CV içeriği gereklidir'),
  cvType: z.enum(['ATS_OPTIMIZED', 'CREATIVE', 'TECHNICAL']),
});
