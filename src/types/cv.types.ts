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
