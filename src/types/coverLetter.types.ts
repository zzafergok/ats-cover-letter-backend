// src/types/coverLetter.types.ts
export interface CoverLetterTemplate {
  id: string;
  name: string;
  category: CoverLetterCategory;
  description: string;
  structure: string;
  sampleContent: string;
  targetAudience: string[];
  keyFeatures: string[];
}

export interface CoverLetterAnalysis {
  wordCount: number;
  paragraphCount: number;
  hasPersonalization: boolean;
  hasQuantifiableAchievements: boolean;
  hasCompanyResearch: boolean;
  hasCallToAction: boolean;
  keywordDensity: number;
  score: number;
  suggestions: string[];
}

export interface SavedCoverLetter {
  id: string;
  userId: string;
  title: string;
  content: string;
  coverLetterType: CoverLetterType;
  positionTitle: string;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CoverLetterType {
  PROFESSIONAL = 'PROFESSIONAL',
  CREATIVE = 'CREATIVE',
  TECHNICAL = 'TECHNICAL',
  ENTRY_LEVEL = 'ENTRY_LEVEL',
}

export enum CoverLetterCategory {
  SOFTWARE_DEVELOPER = 'SOFTWARE_DEVELOPER',
  MARKETING_SPECIALIST = 'MARKETING_SPECIALIST',
  SALES_REPRESENTATIVE = 'SALES_REPRESENTATIVE',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DATA_ANALYST = 'DATA_ANALYST',
  UI_UX_DESIGNER = 'UI_UX_DESIGNER',
  BUSINESS_ANALYST = 'BUSINESS_ANALYST',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  HR_SPECIALIST = 'HR_SPECIALIST',
  FINANCE_SPECIALIST = 'FINANCE_SPECIALIST',
  CONTENT_WRITER = 'CONTENT_WRITER',
  DIGITAL_MARKETING = 'DIGITAL_MARKETING',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  QUALITY_ASSURANCE = 'QUALITY_ASSURANCE',
  GRAPHIC_DESIGNER = 'GRAPHIC_DESIGNER',
  ADMINISTRATIVE_ASSISTANT = 'ADMINISTRATIVE_ASSISTANT',
  CONSULTANT = 'CONSULTANT',
  ENGINEER = 'ENGINEER',
  TEACHER = 'TEACHER',
  HEALTHCARE = 'HEALTHCARE',
  LEGAL = 'LEGAL',
  GENERAL = 'GENERAL',
}
