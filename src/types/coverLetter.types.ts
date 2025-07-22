export interface MinimalCoverLetterRequest {
  positionTitle: string;
  companyName: string;
  motivation?: string; // İsteğe bağlı
}

export interface CvBasedCoverLetterData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    city?: string;
    linkedin?: string;
  };
  professionalProfile: {
    experienceYears: number;
    currentPosition?: string;
    industryExperience: string[];
    keySkills: string[];
    achievements: string[];
  };
}
