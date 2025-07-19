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

export const generateCoverLetterFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID gereklidir'),
  companyName: z
    .string()
    .min(1, 'Şirket adı gereklidir')
    .max(100, 'Şirket adı en fazla 100 karakter olabilir'),
  positionTitle: z
    .string()
    .min(1, 'Pozisyon başlığı gereklidir')
    .max(100, 'Pozisyon başlığı en fazla 100 karakter olabilir'),
  applicantName: z
    .string()
    .min(1, 'Başvuran adı gereklidir')
    .max(100, 'Başvuran adı en fazla 100 karakter olabilir'),
  applicantEmail: z
    .string()
    .email('Geçerli email adresi gereklidir')
    .max(255, 'Email adresi en fazla 255 karakter olabilir'),
  contactPerson: z
    .string()
    .max(100, 'İletişim kişisi adı en fazla 100 karakter olabilir')
    .optional(),
  specificSkills: z
    .array(z.string())
    .max(10, 'En fazla 10 beceri ekleyebilirsiniz')
    .optional(),
  additionalInfo: z
    .string()
    .max(500, 'Ek bilgi en fazla 500 karakter olabilir')
    .optional(),
});

export const createCoverLetterTemplateSchema = z.object({
  category: z
    .string()
    .min(1, 'Kategori gereklidir')
    .max(50, 'Kategori en fazla 50 karakter olabilir'),
  title: z
    .string()
    .min(3, 'Başlık en az 3 karakter olmalıdır')
    .max(200, 'Başlık en fazla 200 karakter olabilir'),
  content: z
    .string()
    .min(100, 'İçerik en az 100 karakter olmalıdır')
    .max(10000, 'İçerik en fazla 10000 karakter olabilir'),
  placeholders: z
    .array(z.string())
    .min(1, 'En az bir placeholder gereklidir')
    .max(20, 'En fazla 20 placeholder olabilir'),
});

export const updateCoverLetterTemplateSchema = z.object({
  category: z
    .string()
    .max(50, 'Kategori en fazla 50 karakter olabilir')
    .optional(),
  title: z
    .string()
    .min(3, 'Başlık en az 3 karakter olmalıdır')
    .max(200, 'Başlık en fazla 200 karakter olabilir')
    .optional(),
  content: z
    .string()
    .min(100, 'İçerik en az 100 karakter olmalıdır')
    .max(10000, 'İçerik en fazla 10000 karakter olabilir')
    .optional(),
  placeholders: z
    .array(z.string())
    .min(1, 'En az bir placeholder gereklidir')
    .max(20, 'En fazla 20 placeholder olabilir')
    .optional(),
  isActive: z.boolean().optional(),
});
