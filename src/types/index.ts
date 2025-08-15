// Authentication Types
export interface VerifyEmailRequest {
  token: string;
}

export interface ResendEmailVerificationRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'ADMIN' | 'USER';
}

export interface RegisterResponse {
  success: boolean;
  data: RegisterData;
  message?: string;
}

export interface RegisterData {
  message: string;
  email: string;
  emailSent: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    emailVerified?: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateUserProfileRequest {
  firstName: string;
  lastName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: any[];
}

// Cover Letter Types
export interface CoverLetterGenerateRequest {
  positionTitle: string;
  companyName: string;
  jobDescription?: string;
  additionalInfo?: string;
}

export interface MinimalCoverLetterRequest {
  positionTitle: string;
  companyName: string;
  keySkills: string[];
  experienceLevel: 'NEW_GRADUATE' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';
}

// Staged Cover Letter Types
export interface BasicCoverLetterRequest {
  positionTitle: string;
  companyName: string;
  experienceLevel: 'NEW_GRADUATE' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';
  keySkills: string[];
}

export interface EnhanceCoverLetterRequest {
  companyResearch?: string;
  achievements?: string[];
  careerGoals?: string;
  motivation?: string;
}

// Contact Types
export interface ContactMessageRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// CV Template Types
export * from './cvTemplate.types';

// Salary Calculation Types
export * from './salary.types';

// User Profile Types
export * from './userProfile.types';

// ATS Optimization Types
export * from './ats.types';
