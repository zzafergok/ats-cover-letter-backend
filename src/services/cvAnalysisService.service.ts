// src/services/cvAnalysisService.service.ts - Yeni servis
import { CvBasedCoverLetterData } from '@/types/coverLetter.types';

export class CvAnalysisService {
  private static instance: CvAnalysisService;

  public static getInstance(): CvAnalysisService {
    if (!CvAnalysisService.instance) {
      CvAnalysisService.instance = new CvAnalysisService();
    }
    return CvAnalysisService.instance;
  }

  public extractProfessionalProfile(cvData: any): CvBasedCoverLetterData {
    const personalInfo = {
      fullName:
        cvData.personalInfo?.name || cvData.personalInfo?.fullName || '',
      email: cvData.personalInfo?.email || '',
      phone: cvData.personalInfo?.phone || '',
      city: cvData.personalInfo?.city || cvData.personalInfo?.address,
      linkedin: cvData.personalInfo?.linkedin,
    };

    const professionalProfile = {
      experienceYears: this.calculateExperienceYears(cvData.experience || []),
      currentPosition: this.getCurrentPosition(cvData.experience || []),
      industryExperience: this.extractIndustries(cvData.experience || []),
      keySkills: this.extractTopSkills(cvData.skills || [], 8),
      achievements: this.extractAchievements(cvData.experience || []),
    };

    return {
      personalInfo,
      professionalProfile,
    };
  }

  private calculateExperienceYears(experiences: any[]): number {
    if (!experiences.length) return 0;

    const totalMonths = experiences.reduce((total, exp) => {
      const months = this.parseExperienceDuration(exp.duration);
      return total + months;
    }, 0);

    return Math.ceil(totalMonths / 12);
  }

  private getCurrentPosition(experiences: any[]): string | undefined {
    const sortedExp = experiences.sort((a, b) => {
      const aIsCurrent = this.isCurrentPosition(a.duration);
      const bIsCurrent = this.isCurrentPosition(b.duration);
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      return 0;
    });

    return sortedExp[0]?.title;
  }

  private extractIndustries(experiences: any[]): string[] {
    const industries = experiences
      .map((exp) => exp.company)
      .filter(Boolean)
      .slice(0, 3);
    return industries;
  }

  private extractTopSkills(skills: string[], limit: number): string[] {
    return skills.slice(0, limit);
  }

  private extractAchievements(experiences: any[]): string[] {
    const achievements: string[] = [];

    experiences.forEach((exp) => {
      if (exp.description) {
        const achievementPattern = /(%|\d+|artır|geliştir|iyileştir|başar)/i;
        const sentences = exp.description.split(/[.!]/).filter(Boolean);

        sentences.forEach((sentence: string) => {
          if (achievementPattern.test(sentence) && sentence.length > 20) {
            achievements.push(sentence.trim());
          }
        });
      }
    });

    return achievements.slice(0, 3);
  }

  private parseExperienceDuration(duration: string): number {
    if (!duration) return 0;

    const yearMatch = duration.match(/(\d+)\s*y/i);
    const monthMatch = duration.match(/(\d+)\s*m/i);

    const years = yearMatch ? parseInt(yearMatch[1]) : 0;
    const months = monthMatch ? parseInt(monthMatch[1]) : 0;

    return years * 12 + months;
  }

  private isCurrentPosition(duration: string): boolean {
    return /present|current|günümüz|devam/i.test(duration || '');
  }
}
