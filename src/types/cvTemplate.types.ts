export interface CVTemplateData {
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
  objective: string;
  experience: Array<{
    company: string;
    description: string;
    endDate: string;
    isCurrent: boolean;
    jobTitle: string;
    location: string;
    startDate: string;
  }>;
  education: Array<{
    degree: string;
    details?: string;
    field: string;
    graduationDate: string;
    location: string;
    startDate: string;
    university: string;
  }>;
  // Global version fields
  communication?: string;
  leadership?: string;
  // Turkey version fields
  technicalSkills?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    tools?: string[];
  };
  skills?: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies: string;
    link?: string;
  }>;
  certificates?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  languages?: Array<{
    language: string;
    level: string;
  }>;
  references?: Array<{
    name: string;
    company: string;
    contact: string;
  }>;
  // Version control
  version?: 'global' | 'turkey';
  language?: 'turkish' | 'english';
}