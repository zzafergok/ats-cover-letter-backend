// ATS Uyumlu CV Veri Yapısı
export interface ATSCVData {
  // Kişisel Bilgiler
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: {
      city: string;
      country: string;
    };
    linkedIn?: string;
    github?: string;
    portfolio?: string;
  };

  // Profesyonel Özet
  professionalSummary: {
    summary: string; // 3-4 cümle, anahtar kelimeler ile
    targetPosition: string;
    yearsOfExperience: number;
    keySkills: string[]; // İş ilanından alınan keywords
  };

  // İş Deneyimi
  workExperience: Array<{
    id: string;
    companyName: string;
    position: string;
    location: string;
    startDate: Date;
    endDate?: Date; // null ise current
    isCurrentRole: boolean;
    achievements: string[]; // Bullet points, sayısal veriler içermeli
    technologies?: string[]; // Kullanılan teknolojiler
    industryType?: string;
  }>;

  // Eğitim Bilgileri
  education: Array<{
    id: string;
    institution: string;
    degree: string; // "Bachelor of Science", "Master of Arts" gibi
    fieldOfStudy: string;
    location: string;
    startDate: Date;
    endDate?: Date; // null ise devam ediyor
    gpa?: number; // 3.5 ve üzeri ise ekle
    honors?: string[];
    relevantCoursework?: string[];
  }>;

  // Beceriler
  skills: {
    technical: Array<{
      category: string; // "Programming Languages", "Databases" vs.
      items: Array<{
        name: string;
        proficiencyLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert";
      }>;
    }>;
    languages: Array<{
      language: string;
      proficiency: "Native" | "Fluent" | "Advanced" | "Intermediate" | "Basic";
    }>;
    soft: string[]; // "Leadership", "Team Collaboration" vs.
  };

  // Sertifikalar
  certifications?: Array<{
    id: string;
    name: string;
    issuingOrganization: string;
    issueDate: Date;
    expirationDate?: Date;
    credentialId?: string;
    verificationUrl?: string;
  }>;

  // Projeler
  projects?: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    startDate: Date;
    endDate?: Date;
    url?: string;
    achievements: string[];
  }>;

  // CV Konfigürasyonu
  configuration: {
    targetCompany?: string;
    jobDescription?: string; // Keyword matching için
    language: "TURKISH" | "ENGLISH";
    cvType: "ATS_OPTIMIZED" | "TECHNICAL" | "EXECUTIVE";
    templateStyle: "MINIMAL" | "PROFESSIONAL" | "MODERN";
    useAI?: boolean; // AI optimization kullanılsın mı?
  };
}

// ATS Validation Result
export interface ATSValidationResult {
  score: number; // 0-100
  issues: ATSIssue[];
  recommendations: string[];
  keywords: {
    found: string[];
    missing: string[];
    density: number;
  };
  formatChecks: {
    fontCompliant: boolean;
    layoutCompliant: boolean;
    sectionHeadersValid: boolean;
    contactInfoComplete: boolean;
  };
}

export interface ATSIssue {
  type: "ERROR" | "WARNING" | "INFO";
  category: "FORMAT" | "CONTENT" | "STRUCTURE" | "KEYWORDS";
  message: string;
  suggestion: string;
}

// PDF Generation için optimize edilmiş veri
export interface ATSOptimizedCVData extends ATSCVData {
  optimizedSummary: string;
  sectionOrder: string[];
  optimizedAchievements: Array<{
    workExperienceId: string;
    achievements: string[];
  }>;
  keywordDensity: number;
}

// Mevcut CV Upload Response (backward compatibility için)
export interface CvUploadResponse {
  id: string;
  fileInfo: {
    originalName: string;
    fileType: string;
    uploadDate: Date;
    sizeInfo: {
      original: string;
      compressed: string;
      compressionRatio: string;
    };
  };
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    linkedin: string | null;
    website: string | null;
    address: string | null;
  };
  contentAnalysis: {
    wordCount: number;
    characterCount: number;
    estimatedPages: number;
    sectionsFound: Array<{
      title: string;
      contentLength: number;
    }>;
  };
  skillsAndKeywords: {
    technicalSkills: string[];
    softSkills: string[];
    languageDetected: {
      turkish: boolean;
      english: boolean;
    };
    topKeywords: string[];
  };
  processedContent: {
    markdownVersion: string;
    sections: Array<{
      title: string;
      preview: string;
    }>;
  };
  status: {
    success: boolean;
    message: string;
    processingTime: string;
  };
}
