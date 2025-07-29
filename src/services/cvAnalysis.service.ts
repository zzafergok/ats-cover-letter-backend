import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

export interface ProfessionalProfile {
  experience: string;
  skills: string[];
  education: string;
  summary: string;
  keyAchievements: string[];
}

export class CvAnalysisService {
  private static instance: CvAnalysisService;
  private prisma = new PrismaClient();

  private constructor() {}

  public static getInstance(): CvAnalysisService {
    if (!CvAnalysisService.instance) {
      CvAnalysisService.instance = new CvAnalysisService();
    }
    return CvAnalysisService.instance;
  }

  /**
   * CV'den profesyonel profil çıkar
   */
  async extractProfessionalProfile(cvData: any): Promise<ProfessionalProfile> {
    try {
      logger.info('Extracting professional profile from CV data');

      // CV data'dan temel bilgileri çıkar
      const experience = this.extractExperienceText(cvData.experience || []);
      const skills = this.extractSkillsList(cvData.skills || []);
      const education = this.extractEducationText(cvData.education || []);
      const summary = cvData.summary || '';
      const keyAchievements = this.extractKeyAchievements(
        cvData.experience || []
      );

      const profile: ProfessionalProfile = {
        experience,
        skills,
        education,
        summary,
        keyAchievements,
      };

      logger.info('Professional profile extracted successfully', {
        experienceLength: experience.length,
        skillsCount: skills.length,
        achievementsCount: keyAchievements.length,
      });

      return profile;
    } catch (error: any) {
      logger.error('Failed to extract professional profile', {
        error: error.message,
      });

      // Hata durumunda boş profil döndür
      return {
        experience: '',
        skills: [],
        education: '',
        summary: '',
        keyAchievements: [],
      };
    }
  }

  /**
   * Deneyim metni oluştur
   */
  private extractExperienceText(experienceArray: any[]): string {
    if (!Array.isArray(experienceArray) || experienceArray.length === 0) {
      return '';
    }

    return experienceArray
      .map((exp) => {
        const title = exp.title || exp.position || 'Pozisyon belirtilmemiş';
        const company =
          exp.company || exp.companyName || 'Şirket belirtilmemiş';
        const duration = exp.duration || exp.period || 'Süre belirtilmemiş';
        const description = exp.description || exp.responsibilities || '';

        return `${title} - ${company} (${duration})\n${description}`;
      })
      .join('\n\n');
  }

  /**
   * Beceri listesi oluştur
   */
  private extractSkillsList(skillsArray: any[]): string[] {
    if (!Array.isArray(skillsArray)) {
      return [];
    }

    const skills: string[] = [];

    skillsArray.forEach((skill) => {
      if (typeof skill === 'string') {
        skills.push(skill);
      } else if (skill && typeof skill === 'object') {
        if (skill.name) {
          skills.push(skill.name);
        } else if (skill.skill) {
          skills.push(skill.skill);
        }
      }
    });

    return [...new Set(skills)]; // Duplicate'ları kaldır
  }

  /**
   * Eğitim metni oluştur
   */
  private extractEducationText(educationArray: any[]): string {
    if (!Array.isArray(educationArray) || educationArray.length === 0) {
      return '';
    }

    return educationArray
      .map((edu) => {
        const degree = edu.degree || 'Derece belirtilmemiş';
        const institution =
          edu.institution || edu.school || 'Kurum belirtilmemiş';
        const year = edu.year || edu.graduationYear || 'Yıl belirtilmemiş';

        return `${degree} - ${institution} (${year})`;
      })
      .join('\n');
  }

  /**
   * Anahtar başarıları çıkar
   */
  private extractKeyAchievements(experienceArray: any[]): string[] {
    if (!Array.isArray(experienceArray)) {
      return [];
    }

    const achievements: string[] = [];

    experienceArray.forEach((exp) => {
      if (exp.achievements && Array.isArray(exp.achievements)) {
        achievements.push(...exp.achievements);
      } else if (exp.description) {
        // Açıklamadan başarı ifadelerini çıkarmaya çalış
        const achievementKeywords = [
          'başardı',
          'gerçekleştirdi',
          'geliştirdi',
          'artırdı',
          'azalttı',
          'achieved',
          'implemented',
          'developed',
          'increased',
          'decreased',
          'improved',
          'optimized',
          'led',
          'managed',
        ];

        const sentences = exp.description.split(/[.!?]+/);
        sentences.forEach((sentence: string) => {
          const lowerSentence = sentence.toLowerCase();
          if (
            achievementKeywords.some((keyword) =>
              lowerSentence.includes(keyword)
            )
          ) {
            achievements.push(sentence.trim());
          }
        });
      }
    });

    return achievements.slice(0, 5); // En fazla 5 başarı
  }

  /**
   * CV kalitesini analiz et
   */
  async analyzeCvQuality(cvData: any): Promise<{
    score: number;
    recommendations: string[];
    strengths: string[];
    weaknesses: string[];
  }> {
    try {
      let score = 0;
      const recommendations: string[] = [];
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      // İletişim bilgileri kontrolü (20 puan)
      if (cvData.personalInfo?.email) {
        score += 10;
        strengths.push('E-posta adresi mevcut');
      } else {
        weaknesses.push('E-posta adresi eksik');
        recommendations.push('E-posta adresinizi ekleyin');
      }

      if (cvData.personalInfo?.phone) {
        score += 10;
        strengths.push('Telefon numarası mevcut');
      } else {
        weaknesses.push('Telefon numarası eksik');
        recommendations.push('Telefon numaranızı ekleyin');
      }

      // Özet bölümü kontrolü (20 puan)
      if (cvData.summary && cvData.summary.length > 50) {
        score += 20;
        strengths.push('Profesyonel özet mevcut');
      } else {
        weaknesses.push('Profesyonel özet eksik veya çok kısa');
        recommendations.push(
          'En az 50 karakter uzunluğunda profesyonel özet ekleyin'
        );
      }

      // Deneyim bölümü kontrolü (30 puan)
      if (cvData.experience && cvData.experience.length > 0) {
        score += 15;
        strengths.push('İş deneyimi bilgileri mevcut');

        const hasDetailedExperience = cvData.experience.some(
          (exp: any) => exp.description && exp.description.length > 100
        );
        if (hasDetailedExperience) {
          score += 15;
          strengths.push('Detaylı iş deneyimi açıklamaları var');
        } else {
          weaknesses.push('İş deneyimi açıklamaları çok kısa');
          recommendations.push('İş deneyimlerinizi daha detaylı açıklayın');
        }
      } else {
        weaknesses.push('İş deneyimi bilgileri eksik');
        recommendations.push('İş deneyimlerinizi ekleyin');
      }

      // Eğitim bölümü kontrolü (15 puan)
      if (cvData.education && cvData.education.length > 0) {
        score += 15;
        strengths.push('Eğitim bilgileri mevcut');
      } else {
        weaknesses.push('Eğitim bilgileri eksik');
        recommendations.push('Eğitim bilgilerinizi ekleyin');
      }

      // Beceriler bölümü kontrolü (15 puan)
      if (cvData.skills && cvData.skills.length > 3) {
        score += 15;
        strengths.push('Yeterli sayıda beceri listelenmiş');
      } else {
        weaknesses.push('Beceri listesi yetersiz');
        recommendations.push('En az 4 beceri ekleyin');
      }

      return {
        score: Math.min(score, 100),
        recommendations,
        strengths,
        weaknesses,
      };
    } catch (error: any) {
      logger.error('CV quality analysis failed', { error: error.message });

      return {
        score: 0,
        recommendations: ['CV analizi yapılamadı'],
        strengths: [],
        weaknesses: ['Analiz hatası'],
      };
    }
  }

  /**
   * Pozisyona uygunluk analizi
   */
  async analyzeJobFit(
    cvData: any,
    jobDescription: string
  ): Promise<{
    matchScore: number;
    matchingSkills: string[];
    missingSkills: string[];
    recommendations: string[];
  }> {
    try {
      const jobKeywords = this.extractJobKeywords(jobDescription);
      const cvSkills = this.extractSkillsList(cvData.skills || []);
      const cvText = JSON.stringify(cvData).toLowerCase();

      const matchingSkills: string[] = [];
      const missingSkills: string[] = [];

      jobKeywords.forEach((keyword) => {
        const keywordLower = keyword.toLowerCase();
        if (
          cvSkills.some((skill) =>
            skill.toLowerCase().includes(keywordLower)
          ) ||
          cvText.includes(keywordLower)
        ) {
          matchingSkills.push(keyword);
        } else {
          missingSkills.push(keyword);
        }
      });

      const matchScore =
        jobKeywords.length > 0
          ? Math.round((matchingSkills.length / jobKeywords.length) * 100)
          : 0;

      const recommendations: string[] = [];
      if (missingSkills.length > 0) {
        recommendations.push(
          `Bu becerileri CV'nize ekleyebilirsiniz: ${missingSkills.slice(0, 5).join(', ')}`
        );
      }
      if (matchScore < 60) {
        recommendations.push(
          "İş ilanındaki anahtar kelimeleri CV'nizde daha fazla vurgulayın"
        );
      }

      return {
        matchScore,
        matchingSkills,
        missingSkills: missingSkills.slice(0, 10),
        recommendations,
      };
    } catch (error: any) {
      logger.error('Job fit analysis failed', { error: error.message });

      return {
        matchScore: 0,
        matchingSkills: [],
        missingSkills: [],
        recommendations: ['İş uygunluk analizi yapılamadı'],
      };
    }
  }

  /**
   * İş ilanından anahtar kelimeleri çıkar
   */
  private extractJobKeywords(jobDescription: string): string[] {
    const commonWords = [
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      've',
      'ile',
      'için',
      'olan',
      'bu',
      'şu',
      'o',
      'bir',
      'de',
      'da',
      'is',
      'are',
      'will',
      'be',
      'have',
      'has',
      'can',
      'should',
      'must',
      'may',
      'would',
      'could',
    ];

    const words = jobDescription
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !commonWords.includes(word));

    // Kelime frekansı hesapla
    const wordCount: { [key: string]: number } = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // En sık kullanılan kelimeleri döndür
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([word]) => word);
  }
}
