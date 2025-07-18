// src/services/cvParser.service.ts
import pdfParse from 'pdf-parse';
import fs from 'fs';

interface ParsedCVData {
  personalInfo: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  experience: Array<{
    title?: string;
    company?: string;
    duration?: string;
    description?: string;
  }>;
  education: Array<{
    degree?: string;
    institution?: string;
    year?: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    level?: string;
  }>;
  certifications: string[];
}

export class CVParserService {
  private static instance: CVParserService;

  public static getInstance(): CVParserService {
    if (!CVParserService.instance) {
      CVParserService.instance = new CVParserService();
    }
    return CVParserService.instance;
  }

  public async parsePDF(
    filePathOrBuffer: string | Buffer
  ): Promise<ParsedCVData> {
    try {
      let dataBuffer: Buffer;

      if (typeof filePathOrBuffer === 'string') {
        dataBuffer = fs.readFileSync(filePathOrBuffer);
      } else {
        dataBuffer = filePathOrBuffer;
      }

      const pdfData = await pdfParse(dataBuffer);
      const text = pdfData.text;

      return this.extractCVData(text);
    } catch (error) {
      console.error('PDF parsing hatası:', error);
      throw new Error('CV_PARSE_001: PDF dosyası okunamadı');
    }
  }

  private extractCVData(text: string): ParsedCVData {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    const cvData: ParsedCVData = {
      personalInfo: {},
      experience: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
    };

    cvData.personalInfo = this.extractPersonalInfo(text);
    cvData.summary = this.extractSummary(lines);
    cvData.experience = this.extractExperience(lines);
    cvData.education = this.extractEducation(lines);
    cvData.skills = this.extractSkills(lines);
    cvData.languages = this.extractLanguages(lines);
    cvData.certifications = this.extractCertifications(lines);

    return cvData;
  }

  private extractPersonalInfo(text: string): ParsedCVData['personalInfo'] {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const phoneRegex =
      /(\+?[0-9]{1,3}[-.\s]?\(?[0-9]{1,4}\)?[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9})/g;
    const linkedinRegex = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/gi;
    const githubRegex = /github\.com\/([a-zA-Z0-9-]+)/gi;

    const emails = text.match(emailRegex);
    const phones = text.match(phoneRegex);
    const linkedin = text.match(linkedinRegex);
    const github = text.match(githubRegex);

    const nameRegex =
      /^([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+)+)/m;
    const nameMatch = text.match(nameRegex);

    return {
      fullName: nameMatch ? nameMatch[0] : undefined,
      email: emails ? emails[0] : undefined,
      phone: phones ? phones[0] : undefined,
      linkedin: linkedin ? linkedin[0] : undefined,
      github: github ? github[0] : undefined,
    };
  }

  private extractSummary(lines: string[]): string | undefined {
    const summaryKeywords = [
      'özet',
      'profil',
      'hakkımda',
      'profesyonel özet',
      'summary',
      'profile',
      'about me',
      'professional summary',
    ];

    let summaryStart = -1;
    let summaryEnd = -1;

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();

      if (summaryKeywords.some((keyword) => lineLower.includes(keyword))) {
        summaryStart = i + 1;
        continue;
      }

      if (summaryStart !== -1 && this.isSectionHeader(lines[i])) {
        summaryEnd = i;
        break;
      }
    }

    if (summaryStart !== -1) {
      const endIndex =
        summaryEnd !== -1
          ? summaryEnd
          : Math.min(summaryStart + 5, lines.length);
      return lines.slice(summaryStart, endIndex).join(' ').trim();
    }

    return undefined;
  }

  private extractExperience(lines: string[]): ParsedCVData['experience'] {
    const experienceKeywords = [
      'deneyim',
      'iş deneyimi',
      'çalışma deneyimi',
      'profesyonel deneyim',
      'experience',
      'work experience',
      'professional experience',
      'employment',
    ];

    const experiences: ParsedCVData['experience'] = [];
    let inExperienceSection = false;
    let currentExperience: any = {};

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();

      if (experienceKeywords.some((keyword) => lineLower.includes(keyword))) {
        inExperienceSection = true;
        continue;
      }

      if (inExperienceSection && this.isSectionHeader(lines[i])) {
        if (currentExperience.title) {
          experiences.push(currentExperience);
        }
        break;
      }

      if (inExperienceSection) {
        const datePattern = /(\d{4})\s*[-–]\s*(\d{4}|günümüz|present|halen)/i;
        const dateMatch = lines[i].match(datePattern);

        if (dateMatch) {
          if (currentExperience.title) {
            experiences.push(currentExperience);
            currentExperience = {};
          }
          currentExperience.duration = lines[i];
        } else if (lines[i].includes('|') || lines[i].includes('-')) {
          const parts = lines[i].split(/[|\-–]/);
          if (parts.length >= 2) {
            currentExperience.title = parts[0].trim();
            currentExperience.company = parts[1].trim();
          }
        } else if (currentExperience.title && !currentExperience.description) {
          currentExperience.description = lines[i];
        }
      }
    }

    if (currentExperience.title) {
      experiences.push(currentExperience);
    }

    return experiences;
  }

  private extractEducation(lines: string[]): ParsedCVData['education'] {
    const educationKeywords = [
      'eğitim',
      'öğrenim',
      'akademik',
      'üniversite',
      'education',
      'academic',
      'university',
      'degree',
    ];

    const education: ParsedCVData['education'] = [];
    let inEducationSection = false;

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();

      if (educationKeywords.some((keyword) => lineLower.includes(keyword))) {
        inEducationSection = true;
        continue;
      }

      if (inEducationSection && this.isSectionHeader(lines[i])) {
        break;
      }

      if (inEducationSection) {
        const yearPattern = /\b(19|20)\d{2}\b/g;
        const years = lines[i].match(yearPattern);

        if (lines[i].length > 10) {
          const educationItem: any = {};

          if (years && years.length > 0) {
            educationItem.year = years.join(' - ');
          }

          const cleanedLine = lines[i].replace(yearPattern, '').trim();
          const parts = cleanedLine.split(/[,|]/);

          if (parts.length >= 2) {
            educationItem.degree = parts[0].trim();
            educationItem.institution = parts[1].trim();
          } else {
            educationItem.degree = cleanedLine;
          }

          if (educationItem.degree) {
            education.push(educationItem);
          }
        }
      }
    }

    return education;
  }

  private extractSkills(lines: string[]): string[] {
    const skillKeywords = [
      'beceriler',
      'yetenekler',
      'yetkinlikler',
      'teknolojiler',
      'skills',
      'technical skills',
      'competencies',
      'technologies',
    ];

    const skills: string[] = [];
    let inSkillSection = false;

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();

      if (skillKeywords.some((keyword) => lineLower.includes(keyword))) {
        inSkillSection = true;
        continue;
      }

      if (inSkillSection && this.isSectionHeader(lines[i])) {
        break;
      }

      if (inSkillSection) {
        const skillItems = lines[i].split(/[,;•·]/);
        skillItems.forEach((skill) => {
          const trimmedSkill = skill.trim();
          if (
            trimmedSkill &&
            trimmedSkill.length > 1 &&
            trimmedSkill.length < 50
          ) {
            skills.push(trimmedSkill);
          }
        });
      }
    }

    return [...new Set(skills)];
  }

  private extractLanguages(lines: string[]): ParsedCVData['languages'] {
    const languageKeywords = [
      'diller',
      'yabancı dil',
      'dil yetkinliği',
      'languages',
      'language skills',
      'language proficiency',
    ];

    const languages: ParsedCVData['languages'] = [];
    let inLanguageSection = false;

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();

      if (languageKeywords.some((keyword) => lineLower.includes(keyword))) {
        inLanguageSection = true;
        continue;
      }

      if (inLanguageSection && this.isSectionHeader(lines[i])) {
        break;
      }

      if (inLanguageSection) {
        const levelPattern =
          /(a1|a2|b1|b2|c1|c2|native|fluent|intermediate|beginner|ana dil|akıcı|orta|başlangıç)/i;
        const match = lines[i].match(levelPattern);

        if (match) {
          const language = lines[i]
            .replace(levelPattern, '')
            .replace(/[-–:]/g, '')
            .trim();
          if (language) {
            languages.push({
              language,
              level: match[0],
            });
          }
        }
      }
    }

    return languages;
  }

  private extractCertifications(lines: string[]): string[] {
    const certKeywords = [
      'sertifikalar',
      'sertifika',
      'belgeler',
      'certifications',
      'certificates',
      'credentials',
    ];

    const certifications: string[] = [];
    let inCertSection = false;

    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();

      if (certKeywords.some((keyword) => lineLower.includes(keyword))) {
        inCertSection = true;
        continue;
      }

      if (inCertSection && this.isSectionHeader(lines[i])) {
        break;
      }

      if (inCertSection && lines[i].length > 5 && lines[i].length < 100) {
        certifications.push(lines[i]);
      }
    }

    return certifications;
  }

  private isSectionHeader(line: string): boolean {
    const sectionKeywords = [
      'deneyim',
      'eğitim',
      'beceriler',
      'projeler',
      'sertifika',
      'diller',
      'referans',
      'experience',
      'education',
      'skills',
      'projects',
      'certification',
      'languages',
      'reference',
    ];

    const lineLower = line.toLowerCase();
    return sectionKeywords.some(
      (keyword) => lineLower.includes(keyword) && line.length < 50
    );
  }
}
