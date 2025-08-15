// Standardized UserProfile types that align with CVTemplate interface structure

export interface StandardizedUserProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  github?: string;
  linkedin?: string;
  portfolioWebsite?: string; // maps to website in CVTemplate
  aboutMe?: string; // maps to objective in CVTemplate
  avatarColor?: string;
  jobTitle?: string; // new field to match CVTemplate
  medium?: string; // new field to match CVTemplate
}

// Experience data that matches CVTemplate structure
export interface StandardizedExperienceData {
  id?: string;
  company: string; // maps to companyName in current schema
  jobTitle: string; // maps to position in current schema
  location?: string;
  startDate: string; // formatted date string (YYYY-MM format)
  endDate: string; // formatted date string or "Present"
  isCurrent: boolean;
  description?: string;
  employmentType?:
    | 'FULL_TIME'
    | 'PART_TIME'
    | 'CONTRACT'
    | 'FREELANCE'
    | 'INTERNSHIP'
    | 'TEMPORARY';
  workMode?: 'ONSITE' | 'REMOTE' | 'HYBRID';
  achievements?: string; // additional field from current schema
}

// Education data that matches CVTemplate structure
export interface StandardizedEducationData {
  id?: string;
  university: string; // maps to schoolName in current schema
  degree?: string;
  field: string; // maps to fieldOfStudy in current schema
  location?: string; // new field to match CVTemplate
  startDate: string; // formatted date string
  graduationDate: string; // formatted date string or "Present"
  details?: string; // maps to description in current schema
  grade?: number;
  gradeSystem?: 'PERCENTAGE' | 'GPA_4';
  educationType?: 'LISE' | 'ONLISANS' | 'LISANS' | 'YUKSEKLISANS';
  isCurrent?: boolean;
}

// Skills that match CVTemplate structure
export interface StandardizedSkillsData {
  // Technical skills categorized
  technicalSkills?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    tools?: string[];
  };
  // General skills array
  skills?: string[];
  // Communication and leadership (global version fields)
  communication?: string;
  leadership?: string;
}

// Individual skill data (for database storage)
export interface StandardizedSkillData {
  id?: string;
  name: string;
  category?:
    | 'TECHNICAL'
    | 'SOFT_SKILL'
    | 'LANGUAGE'
    | 'TOOL'
    | 'FRAMEWORK'
    | 'OTHER';
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience?: number;
  description?: string;
}

// Projects that match CVTemplate structure
export interface StandardizedProjectData {
  id?: string;
  name: string;
  description: string;
  technologies: string;
  link?: string;
}

// Certificates that match CVTemplate structure
export interface StandardizedCertificateData {
  id?: string;
  name: string; // maps to certificateName in current schema
  issuer?: string;
  date: string; // formatted date string combining issue month/year
  expiryMonth?: number;
  expiryYear?: number;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

// Languages that match CVTemplate structure
export interface StandardizedLanguageData {
  id?: string;
  language: string;
  level: string;
}

// References that match CVTemplate structure
export interface StandardizedReferenceData {
  id?: string;
  name: string;
  company: string;
  contact: string;
}

// Course data (keeping existing structure as it doesn't exist in CVTemplate)
export interface StandardizedCourseData {
  id?: string;
  courseName: string;
  provider?: string;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  duration?: string;
  description?: string;
}

// Hobby data (keeping existing structure as it doesn't exist in CVTemplate)
export interface StandardizedHobbyData {
  id?: string;
  name: string;
  description?: string;
}

// Complete user profile that can be transformed to CVTemplate format
export interface CompleteUserProfile {
  personalInfo: {
    address: string;
    city: string;
    email: string;
    firstName: string;
    github?: string;
    jobTitle?: string;
    lastName: string;
    linkedin?: string;
    medium?: string;
    phone: string;
    website?: string;
  };
  objective: string; // maps to aboutMe
  experience: StandardizedExperienceData[];
  education: StandardizedEducationData[];
  communication?: string;
  leadership?: string;
  technicalSkills?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    tools?: string[];
  };
  skills?: string[];
  projects?: StandardizedProjectData[];
  certificates?: StandardizedCertificateData[];
  languages?: StandardizedLanguageData[];
  references?: StandardizedReferenceData[];
  version?: 'global' | 'turkey';
  language?: 'turkish' | 'english';
}

// Transformation helper types
export interface DateTransformOptions {
  month?: number;
  year?: number;
  isCurrent?: boolean;
}

// Legacy interfaces (keeping for backward compatibility)
export interface UserProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  github?: string;
  linkedin?: string;
  portfolioWebsite?: string;
  aboutMe?: string;
  avatarColor?: string;
}

export interface EducationData {
  id?: string;
  schoolName: string;
  degree?: string;
  fieldOfStudy?: string;
  grade?: number;
  gradeSystem: 'PERCENTAGE' | 'GPA_4';
  educationType?: 'LISE' | 'ONLISANS' | 'LISANS' | 'YUKSEKLISANS';
  startYear: number;
  endYear?: number;
  isCurrent: boolean;
  description?: string;
}

export interface ExperienceData {
  id?: string;
  companyName: string;
  position: string;
  employmentType:
    | 'FULL_TIME'
    | 'PART_TIME'
    | 'CONTRACT'
    | 'FREELANCE'
    | 'INTERNSHIP'
    | 'TEMPORARY';
  workMode: 'ONSITE' | 'REMOTE' | 'HYBRID';
  location?: string;
  startMonth: number;
  startYear: number;
  endMonth?: number;
  endYear?: number;
  isCurrent: boolean;
  description?: string;
  achievements?: string;
}

export interface CourseData {
  id?: string;
  courseName: string;
  provider?: string;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  duration?: string;
  description?: string;
}

export interface CertificateData {
  id?: string;
  certificateName: string;
  issuer?: string;
  issueMonth?: number;
  issueYear?: number;
  expiryMonth?: number;
  expiryYear?: number;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

export interface HobbyData {
  id?: string;
  name: string;
  description?: string;
}

export interface SkillData {
  id?: string;
  name: string;
  category?:
    | 'TECHNICAL'
    | 'SOFT_SKILL'
    | 'LANGUAGE'
    | 'TOOL'
    | 'FRAMEWORK'
    | 'OTHER';
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience?: number;
  description?: string;
}
