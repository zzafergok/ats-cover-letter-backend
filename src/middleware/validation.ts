import { z, ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

import { sendError } from '../utils/response';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues.map((err) => err.message).join(', ');
        sendError(
          res,
          `VALID_001: Giriş doğrulama hatası - ${errorMessage}`,
          400
        );
      } else {
        sendError(res, 'VALID_002: Beklenmeyen doğrulama hatası', 400);
      }
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues.map((err) => err.message).join(', ');
        sendError(
          res,
          `VALID_003: Parametre doğrulama hatası - ${errorMessage}`,
          400
        );
      } else {
        sendError(
          res,
          'VALID_004: Beklenmeyen parametre doğrulama hatası',
          400
        );
      }
    }
  };
};

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(1, 'Şifre gereklidir'),
});

export const registerSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .max(100, 'Şifre en fazla 100 karakter olabilir')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
      'Şifre en az bir harf, bir rakam içermeli ve sadece izin verilen özel karakterleri kullanmalıdır'
    ),
  name: z
    .string()
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(50, 'Ad en fazla 50 karakter olabilir'),
  role: z.enum(['ADMIN', 'USER']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token gereklidir'),
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
  email: z.string().email('Geçerli bir email adresi giriniz'),
});

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
