import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

import { sendError } from '../utils/response';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Proje adı gereklidir')
    .max(100, 'Proje adı en fazla 100 karakter olabilir'),
  description: z
    .string()
    .max(500, 'Açıklama en fazla 500 karakter olabilir')
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const createColumnSchema = z.object({
  name: z
    .string()
    .min(1, 'Kolon adı gereklidir')
    .max(50, 'Kolon adı en fazla 50 karakter olabilir'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Geçersiz renk formatı')
    .optional(),
});

export const updateColumnSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  position: z.number().int().min(0).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
});

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Görev başlığı gereklidir')
    .max(200, 'Görev başlığı en fazla 200 karakter olabilir'),
  description: z
    .string()
    .max(1000, 'Açıklama en fazla 1000 karakter olabilir')
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  position: z.number().int().min(0, 'Pozisyon 0 veya daha büyük olmalıdır'),
  columnId: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  dueDate: z.string().datetime('Geçersiz tarih formatı').optional(),
  estimatedTime: z
    .number()
    .int()
    .min(1, 'Tahmini süre en az 1 dakika olmalıdır')
    .optional(),
  // assigneeId: z.string().cuid('Geçersiz atanan kişi ID').optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  position: z.number().int().min(0).optional(),
  columnId: z.string().cuid().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  dueDate: z.string().datetime().optional(),
  estimatedTime: z.number().int().min(1).optional(),
  // assigneeId: z.string().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export const createTaskTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag adı gereklidir')
    .max(30, 'Tag adı en fazla 30 karakter olabilir'),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Geçersiz renk formatı')
    .optional(),
});

export const updateTaskTagSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
});

export const moveTaskSchema = z.object({
  columnId: z.string().min(1, 'Kolon ID gereklidir'),
  position: z.number().int().min(0, 'Pozisyon 0 veya daha büyük olmalıdır'),
});

export const uploadTasksSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        columnName: z.string().min(1).max(50).optional(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
        dueDate: z.string().datetime().optional(),
        estimatedTime: z.number().int().min(1).optional(),
        assigneeEmail: z.string().email().optional(),
        tags: z.array(z.string().min(1).max(30)).optional(),
      })
    )
    .min(1, 'En az bir görev gereklidir')
    .max(100, 'En fazla 100 görev yüklenebilir'),
});

export const uploadTasksJsonSchema = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1, 'Görev başlığı gereklidir').max(200),
        description: z.string().max(1000).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        columnName: z.string().min(1, 'Kolon adı gereklidir').max(50),
        status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
        dueDate: z.string().datetime().optional(),
        estimatedTime: z.number().int().min(1).optional(),
        assigneeEmail: z.string().email().optional(),
        tags: z.array(z.string().min(1).max(30)).optional(),
      })
    )
    .min(1, 'En az bir görev gereklidir')
    .max(100, 'En fazla 100 görev yüklenebilir'),
  createMissingColumns: z.boolean().optional(),
  createMissingTags: z.boolean().optional(),
});

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map((err) => err.message).join(', ');
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
  role: z
    .enum(['ADMIN', 'DEVELOPER', 'PRODUCT_OWNER', 'PROJECT_ANALYST'])
    .optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token gereklidir'),
});

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map((err) => err.message).join(', ');
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

export const idParamSchema = z.object({
  id: z.string().cuid('Geçersiz ID formatı'),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().cuid('Geçersiz proje ID formatı'),
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

export const bulkMoveTasksSchema = z.object({
  taskIds: z
    .array(z.string().cuid('Geçersiz task ID formatı'))
    .min(1, 'En az bir görev seçilmelidir')
    .max(50, 'En fazla 50 görev aynı anda taşınabilir'),
  targetColumnId: z.string().cuid('Geçersiz hedef kolon ID formatı'),
});

export const columnIdParamSchema = z.object({
  projectId: z.string().cuid('Geçersiz proje ID formatı'),
  columnId: z.string().cuid('Geçersiz kolon ID formatı'),
});

export const contactMessageSchema = z.object({
  type: z.enum(['CONTACT', 'SUPPORT'], {
    required_error: 'Mesaj tipi gereklidir',
    invalid_type_error: 'Geçersiz mesaj tipi',
  }),
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
