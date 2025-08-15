// ATS Optimization System Types

// Job Posting Analysis Types
export interface JobPostingAnalysisRequest {
  jobPostingUrl?: string;
  jobPostingText?: string;
  companyName?: string;
  positionTitle?: string;
}

export interface JobPostingAnalysisResult {
  id: string;
  userId: string;

  // Raw Input
  jobPostingUrl?: string;
  jobPostingText: string;
  companyName: string;
  positionTitle: string;

  // Extracted Information
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: ExperienceRequirement[];
  educationRequirements: EducationRequirement[];
  keywords: JobKeyword[];

  // Job Details
  location?: string;
  workMode?: 'ONSITE' | 'REMOTE' | 'HYBRID';
  employmentType?:
    | 'FULL_TIME'
    | 'PART_TIME'
    | 'CONTRACT'
    | 'FREELANCE'
    | 'INTERNSHIP';
  salaryRange?: SalaryRange;

  // ATS Analysis
  atsKeywords: string[];
  industryType?: string;
  seniorityLevel?: 'ENTRY' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';

  // Metadata
  analysisStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceRequirement {
  skillArea: string;
  minimumYears: number;
  maximumYears?: number;
  isRequired: boolean;
  description?: string;
}

export interface EducationRequirement {
  level: 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'PHD';
  field?: string;
  isRequired: boolean;
  alternatives?: string[];
}

export interface JobKeyword {
  keyword: string;
  category:
    | 'TECHNICAL'
    | 'SOFT_SKILL'
    | 'INDUSTRY'
    | 'TOOL'
    | 'FRAMEWORK'
    | 'CERTIFICATION'
    | 'OTHER';
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  frequency: number;
  context?: string;
}

export interface SalaryRange {
  minimum?: number;
  maximum?: number;
  currency: string;
  period: 'HOURLY' | 'MONTHLY' | 'YEARLY';
}

// CV-Job Matching Types
export interface CVJobMatchRequest {
  jobAnalysisId: string;
  cvData?: any; // Will use CVTemplateData or get from user profile
  useUserProfile?: boolean;
}

export interface CVJobMatchResult {
  id: string;
  userId: string;
  jobAnalysisId: string;

  // Overall Match Score (0-100)
  overallScore: number;

  // Detailed Scoring
  skillsMatch: SkillsMatchAnalysis;
  experienceMatch: ExperienceMatchAnalysis;
  educationMatch: EducationMatchAnalysis;
  keywordMatch: KeywordMatchAnalysis;

  // Gaps and Opportunities
  missingSkills: string[];
  missingKeywords: string[];
  weakAreas: WeakArea[];
  strengthAreas: StrengthArea[];

  // Recommendations
  recommendations: OptimizationRecommendation[];

  // Metadata
  matchStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface SkillsMatchAnalysis {
  score: number; // 0-100
  totalRequired: number;
  matched: number;
  missing: string[];
  partial: PartialSkillMatch[];
  extra: string[]; // Skills not mentioned in job but user has
}

export interface PartialSkillMatch {
  jobSkill: string;
  userSkill: string;
  similarity: number; // 0-1
  context?: string;
}

export interface ExperienceMatchAnalysis {
  score: number; // 0-100
  totalYearsRequired: number;
  totalYearsUser: number;
  byArea: ExperienceAreaMatch[];
  relevantExperiences: RelevantExperience[];
}

export interface ExperienceAreaMatch {
  area: string;
  required: number;
  userHas: number;
  score: number;
  isMatched: boolean;
}

export interface RelevantExperience {
  company: string;
  position: string;
  relevanceScore: number; // 0-1
  matchingSkills: string[];
  startDate: string;
  endDate: string;
}

export interface EducationMatchAnalysis {
  score: number; // 0-100
  hasRequiredLevel: boolean;
  hasRequiredField: boolean;
  userEducation: UserEducationSummary[];
  additionalCertifications: string[];
}

export interface UserEducationSummary {
  level: string;
  field: string;
  institution: string;
  relevanceScore: number;
}

export interface KeywordMatchAnalysis {
  score: number; // 0-100
  totalKeywords: number;
  matchedKeywords: number;
  missingHighPriority: string[];
  missingMediumPriority: string[];
  presentKeywords: PresentKeyword[];
}

export interface PresentKeyword {
  keyword: string;
  frequency: number;
  locations: string[]; // Where in CV it appears
}

export interface WeakArea {
  area: string;
  score: number;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestions: string[];
}

export interface StrengthArea {
  area: string;
  score: number;
  description: string;
  advantages: string[];
}

// ATS Optimization Types
export interface ATSOptimizationRequest {
  matchAnalysisId: string;
  optimizationLevel: 'BASIC' | 'ADVANCED' | 'COMPREHENSIVE';
  targetSections?: OptimizationSection[];
  preserveOriginal?: boolean;
}

export interface OptimizationSection {
  section: 'OBJECTIVE' | 'EXPERIENCE' | 'SKILLS' | 'EDUCATION' | 'ACHIEVEMENTS';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ATSOptimizationResult {
  id: string;
  userId: string;
  matchAnalysisId: string;

  // Original and Optimized CV Data
  originalCV: any; // CVTemplateData
  optimizedCV: any; // CVTemplateData

  // Optimization Changes
  changes: OptimizationChange[];
  addedKeywords: string[];
  enhancedSections: EnhancedSection[];

  // Improvement Metrics
  beforeScore: number;
  afterScore: number;
  improvementPercentage: number;

  // ATS Compliance
  atsCompliance: ATSComplianceCheck;

  // Metadata
  optimizationStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export interface OptimizationChange {
  section: string;
  field: string;
  changeType: 'ADDED' | 'MODIFIED' | 'ENHANCED' | 'REORDERED';
  originalValue?: string;
  newValue: string;
  reason: string;
  keywords?: string[];
}

export interface EnhancedSection {
  section: string;
  originalLength: number;
  newLength: number;
  addedKeywords: string[];
  improvementDescription: string;
}

export interface ATSComplianceCheck {
  score: number; // 0-100
  issues: ComplianceIssue[];
  recommendations: ComplianceRecommendation[];
  passedChecks: string[];
  failedChecks: string[];
}

export interface ComplianceIssue {
  type: 'FORMAT' | 'KEYWORD' | 'STRUCTURE' | 'LENGTH' | 'CONTENT';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  solution?: string;
}

export interface ComplianceRecommendation {
  category: string;
  recommendation: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
}

// General Optimization Recommendation
export interface OptimizationRecommendation {
  id: string;
  type:
    | 'SKILL_GAP'
    | 'KEYWORD_MISSING'
    | 'EXPERIENCE_WEAK'
    | 'FORMAT_ISSUE'
    | 'CONTENT_ENHANCEMENT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact: number; // Expected score improvement
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeToImplement?: string;
}

// API Response Types
export interface ATSAnalysisResponse {
  success: boolean;
  data?: {
    jobAnalysis?: JobPostingAnalysisResult;
    matchAnalysis?: CVJobMatchResult;
    optimization?: ATSOptimizationResult;
  };
  error?: string;
  message?: string;
}

// Batch Processing Types
export interface BatchOptimizationRequest {
  jobPostings: JobPostingAnalysisRequest[];
  userId: string;
  optimizationLevel: 'BASIC' | 'ADVANCED' | 'COMPREHENSIVE';
}

export interface BatchOptimizationResult {
  totalJobs: number;
  processedJobs: number;
  results: {
    jobAnalysisId: string;
    matchScore: number;
    optimizationId: string;
    improvementPercentage: number;
  }[];
  summary: {
    averageMatchScore: number;
    averageImprovement: number;
    topRecommendations: OptimizationRecommendation[];
  };
}

// Analytics and Reporting Types
export interface ATSAnalytics {
  userId: string;
  totalOptimizations: number;
  averageScoreImprovement: number;
  topIndustries: string[];
  skillGapAnalysis: SkillGapSummary[];
  successMetrics: {
    applicationsSubmitted: number;
    interviewsReceived: number;
    responseRate: number;
  };
}

export interface SkillGapSummary {
  skill: string;
  demandFrequency: number;
  userProficiency: number;
  marketImportance: number;
  learningRecommendation?: string;
}
