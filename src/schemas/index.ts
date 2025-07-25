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
  JWT_EXPIRES_IN: z.string().default('4h'),
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
    token: z
      .string()
      .min(1, SERVICE_MESSAGES.SCHEMA.RESET_TOKEN_REQUIRED.message),
    newPassword: z
      .string()
      .min(8, SERVICE_MESSAGES.SCHEMA.NEW_PASSWORD_MIN_LENGTH.message)
      .max(100, SERVICE_MESSAGES.SCHEMA.NEW_PASSWORD_MAX_LENGTH.message)
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
        SERVICE_MESSAGES.SCHEMA.NEW_PASSWORD_PATTERN.message
      ),
    confirmPassword: z
      .string()
      .min(1, SERVICE_MESSAGES.SCHEMA.CONFIRM_PASSWORD_REQUIRED.message),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: SERVICE_MESSAGES.SCHEMA.PASSWORD_MISMATCH.message,
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.EMAIL_VERIFICATION_TOKEN_REQUIRED.message),
});

export const resendEmailVerificationSchema = z.object({
  email: z.string().email(SERVICE_MESSAGES.SCHEMA.EMAIL_REQUIRED.message),
});

// User profile schemas
export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .min(2, SERVICE_MESSAGES.SCHEMA.USER_PROFILE_NAME_MIN.message)
    .max(50, SERVICE_MESSAGES.SCHEMA.USER_PROFILE_NAME_MAX.message),
  email: z
    .string()
    .email(SERVICE_MESSAGES.SCHEMA.EMAIL_REQUIRED.message)
    .max(255, SERVICE_MESSAGES.SCHEMA.USER_PROFILE_EMAIL_MAX.message),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, SERVICE_MESSAGES.SCHEMA.CURRENT_PASSWORD_REQUIRED.message),
    newPassword: z
      .string()
      .min(8, SERVICE_MESSAGES.SCHEMA.NEW_PASSWORD_MIN_LENGTH.message)
      .max(100, SERVICE_MESSAGES.SCHEMA.NEW_PASSWORD_MAX_LENGTH.message)
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
        SERVICE_MESSAGES.SCHEMA.NEW_PASSWORD_PATTERN.message
      ),
    confirmPassword: z
      .string()
      .min(1, SERVICE_MESSAGES.SCHEMA.CONFIRM_PASSWORD_REQUIRED.message),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: SERVICE_MESSAGES.SCHEMA.PASSWORD_MISMATCH.message,
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: SERVICE_MESSAGES.SCHEMA.PASSWORD_SAME_AS_CURRENT.message,
    path: ['newPassword'],
  });

// Contact message schema
export const contactMessageSchema = z.object({
  type: z.enum(['CONTACT', 'SUPPORT']),
  name: z
    .string()
    .min(2, SERVICE_MESSAGES.SCHEMA.CONTACT_NAME_MIN.message)
    .max(100, SERVICE_MESSAGES.SCHEMA.CONTACT_NAME_MAX.message)
    .trim(),
  email: z
    .string()
    .email(SERVICE_MESSAGES.SCHEMA.EMAIL_REQUIRED.message)
    .max(255, SERVICE_MESSAGES.SCHEMA.CONTACT_EMAIL_MAX.message),
  subject: z
    .string()
    .min(3, SERVICE_MESSAGES.SCHEMA.CONTACT_SUBJECT_MIN.message)
    .max(200, SERVICE_MESSAGES.SCHEMA.CONTACT_SUBJECT_MAX.message)
    .trim(),
  message: z
    .string()
    .min(10, SERVICE_MESSAGES.SCHEMA.CONTACT_MESSAGE_MIN.message)
    .max(2000, SERVICE_MESSAGES.SCHEMA.CONTACT_MESSAGE_MAX.message)
    .trim(),
});

// Cover letter schemas
export const generateCoverLetterSchema = z.object({
  personalInfo: z.object({
    fullName: z
      .string()
      .min(1, SERVICE_MESSAGES.SCHEMA.FULL_NAME_REQUIRED.message),
    email: z
      .string()
      .email(SERVICE_MESSAGES.SCHEMA.VALID_EMAIL_REQUIRED.message),
    phone: z.string().min(1, SERVICE_MESSAGES.SCHEMA.PHONE_REQUIRED.message),
    city: z.string().optional(),
    state: z.string().optional(),
    linkedin: z.string().optional(),
  }),
  jobInfo: z.object({
    positionTitle: z
      .string()
      .min(1, SERVICE_MESSAGES.SCHEMA.POSITION_TITLE_REQUIRED.message),
    companyName: z
      .string()
      .min(1, SERVICE_MESSAGES.SCHEMA.COMPANY_NAME_REQUIRED.message),
    department: z.string().optional(),
    hiringManagerName: z.string().optional(),
    jobDescription: z.string().optional(),
    requirements: z.array(z.string()).optional(),
  }),
  experience: z.object({
    currentPosition: z.string().optional(),
    yearsOfExperience: z
      .number()
      .min(0, SERVICE_MESSAGES.SCHEMA.YEARS_EXPERIENCE_MIN.message),
    relevantSkills: z
      .array(z.string())
      .min(1, SERVICE_MESSAGES.SCHEMA.SKILLS_REQUIRED.message),
    achievements: z
      .array(z.string())
      .min(1, SERVICE_MESSAGES.SCHEMA.ACHIEVEMENTS_REQUIRED.message),
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
  title: z.string().min(1, SERVICE_MESSAGES.SCHEMA.TITLE_REQUIRED.message),
  content: z.string().min(1, SERVICE_MESSAGES.SCHEMA.CONTENT_REQUIRED.message),
  coverLetterType: z.enum([
    'PROFESSIONAL',
    'CREATIVE',
    'TECHNICAL',
    'ENTRY_LEVEL',
  ]),
  positionTitle: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.POSITION_TITLE_REQUIRED.message),
  companyName: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.COMPANY_NAME_REQUIRED.message),
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
  content: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.COVER_LETTER_CONTENT_REQUIRED.message),
});

export const generateMinimalCoverLetterSchema = z.object({
  positionTitle: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.POSITION_TITLE_REQUIRED.message),
  companyName: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.COMPANY_NAME_REQUIRED.message),
  motivation: z.string().optional(),
});

// Cover letter basic schemas
export const createCoverLetterSchema = z.object({
  cvUploadId: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.CV_UPLOAD_ID_REQUIRED.message),
  positionTitle: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.POSITION_TITLE_REQUIRED.message),
  companyName: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.COMPANY_NAME_REQUIRED.message),
  jobDescription: z
    .string()
    .min(10, SERVICE_MESSAGES.SCHEMA.JOB_DESCRIPTION_MIN.message),
  language: z
    .enum(['TURKISH', 'ENGLISH'], {
      errorMap: () => ({
        message: SERVICE_MESSAGES.SCHEMA.LANGUAGE_OPTION_ERROR.message,
      }),
    })
    .default('TURKISH'),
});

export const updateCoverLetterSchema = z.object({
  updatedContent: z
    .string()
    .min(50, SERVICE_MESSAGES.SCHEMA.COVER_LETTER_MIN_LENGTH.message),
});

// CV schemas
export const createCvSchema = z.object({
  positionTitle: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.POSITION_TITLE_REQUIRED.message),
  companyName: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.COMPANY_NAME_REQUIRED.message),
  cvType: z.enum(['ATS_OPTIMIZED', 'CREATIVE', 'TECHNICAL']),
  jobDescription: z.string().optional(),
  additionalRequirements: z.string().optional(),
  targetKeywords: z.array(z.string()).optional(),
});

export const saveCvSchema = z.object({
  title: z.string().min(1, SERVICE_MESSAGES.SCHEMA.CV_TITLE_REQUIRED.message),
  content: z
    .string()
    .min(1, SERVICE_MESSAGES.SCHEMA.CV_CONTENT_REQUIRED.message),
  cvType: z.enum(['ATS_OPTIMIZED', 'CREATIVE', 'TECHNICAL']),
});

// User detailed profile schemas
export const updateUserDetailedProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  github: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  portfolioWebsite: z.string().url().optional().or(z.literal('')),
  aboutMe: z.string().max(1000).optional(),
  avatarColor: z.string().optional(),
});

export const educationSchema = z.object({
  schoolName: z.string().min(1, 'Okul adı gereklidir'),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  grade: z.number().optional(),
  gradeSystem: z.enum(['PERCENTAGE', 'GPA_4']),
  educationType: z
    .enum(['LISE', 'ONLISANS', 'LISANS', 'YUKSEKLISANS'])
    .optional(),
  startYear: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 10),
  endYear: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 10)
    .optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
});

export const experienceSchema = z.object({
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  position: z.string().min(1, 'Pozisyon gereklidir'),
  employmentType: z.enum([
    'FULL_TIME',
    'PART_TIME',
    'CONTRACT',
    'FREELANCE',
    'INTERNSHIP',
    'TEMPORARY',
  ]),
  workMode: z.enum(['ONSITE', 'REMOTE', 'HYBRID']),
  location: z.string().optional(),
  startMonth: z.number().int().min(1).max(12),
  startYear: z.number().int().min(1950).max(new Date().getFullYear()),
  endMonth: z.number().int().min(1).max(12).optional(),
  endYear: z.number().int().min(1950).max(new Date().getFullYear()).optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  achievements: z.string().optional(),
});

export const courseSchema = z.object({
  courseName: z.string().min(1, 'Kurs adı gereklidir'),
  provider: z.string().optional(),
  startMonth: z.number().int().min(1).max(12).optional(),
  startYear: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear())
    .optional(),
  endMonth: z.number().int().min(1).max(12).optional(),
  endYear: z.number().int().min(1950).max(new Date().getFullYear()).optional(),
  duration: z.string().optional(),
  description: z.string().optional(),
});

export const certificateSchema = z.object({
  certificateName: z.string().min(1, 'Sertifika adı gereklidir'),
  issuer: z.string().optional(),
  issueMonth: z.number().int().min(1).max(12).optional(),
  issueYear: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear())
    .optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 50)
    .optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
});

export const hobbySchema = z.object({
  name: z.string().min(1, 'Hobi adı gereklidir'),
  description: z.string().optional(),
});

export const skillSchema = z.object({
  name: z.string().min(1, 'Yetenek adı gereklidir'),
  category: z
    .enum(['TECHNICAL', 'SOFT_SKILL', 'LANGUAGE', 'TOOL', 'FRAMEWORK', 'OTHER'])
    .optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  yearsOfExperience: z.number().int().min(0).max(50).optional(),
  description: z.string().optional(),
});

// Detailed cover letter schema
export const createDetailedCoverLetterSchema = z.object({
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  jobDescription: z.string().min(10, 'İş tanımı en az 10 karakter olmalıdır'),
  language: z.enum(['TURKISH', 'ENGLISH']).default('TURKISH'),
  whyPosition: z.string().optional(),
  whyCompany: z.string().optional(),
  workMotivation: z.string().optional(),
});

export const updateDetailedCoverLetterSchema = z.object({
  updatedContent: z
    .string()
    .min(50, 'Cover letter en az 50 karakter olmalıdır'),
});

// Detailed CV generation schema
export const createDetailedCvSchema = z.object({
  jobDescription: z.string().min(10, 'İş tanımı en az 10 karakter olmalıdır'),
  language: z.enum(['TURKISH', 'ENGLISH']).default('TURKISH'),
});

// Template schemas
export const getTemplatesSchema = z.object({
  industry: z.enum(['TECHNOLOGY', 'FINANCE']).optional(),
  category: z.enum([
    'SOFTWARE_DEVELOPER',
    'FRONTEND_DEVELOPER', 
    'BACKEND_DEVELOPER',
    'FULLSTACK_DEVELOPER',
    'DATA_SCIENTIST',
    'FINANCIAL_ANALYST',
    'INVESTMENT_BANKER',
    'FINANCIAL_ADVISOR',
    'ACCOUNTING_SPECIALIST',
    'RISK_ANALYST'
  ]).optional(),
  language: z.enum(['TURKISH', 'ENGLISH']).optional(),
});

export const createCoverLetterFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID gereklidir'),
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  personalizations: z.object({
    whyPosition: z.string().optional(),
    whyCompany: z.string().optional(),
    additionalSkills: z.string().optional(),
  }).optional(),
});
