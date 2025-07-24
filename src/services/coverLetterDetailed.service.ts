import { PrismaClient } from '@prisma/client';
import { generateCoverLetterWithClaude } from './claude.service';
import { UserProfileService } from './userProfile.service';
import { UserLimitService } from './userLimit.service';
import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';

const prisma = new PrismaClient();

export interface DetailedCoverLetterRequest {
  positionTitle: string;
  companyName: string;
  jobDescription: string;
  language: 'TURKISH' | 'ENGLISH';
  whyPosition?: string;
  whyCompany?: string;
  workMotivation?: string;
}

export interface DetailedCoverLetterResponse {
  id: string;
  generatedContent: string;
  positionTitle: string;
  companyName: string;
  language: string;
  generationStatus: string;
  whyPosition?: string;
  whyCompany?: string;
  workMotivation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CoverLetterDetailedService {
  private static instance: CoverLetterDetailedService;
  private userProfileService: UserProfileService;

  private constructor() {
    this.userProfileService = UserProfileService.getInstance();
  }

  public static getInstance(): CoverLetterDetailedService {
    if (!CoverLetterDetailedService.instance) {
      CoverLetterDetailedService.instance = new CoverLetterDetailedService();
    }
    return CoverLetterDetailedService.instance;
  }

  async createDetailedCoverLetter(
    userId: string,
    userRole: string,
    request: DetailedCoverLetterRequest
  ): Promise<DetailedCoverLetterResponse> {
    try {
      // Kullanıcı limit kontrolü
      const currentCoverLetterCount = await prisma.coverLetterDetailed.count({
        where: { userId },
      });

      if (!UserLimitService.canCreateCoverLetter(userRole, currentCoverLetterCount)) {
        const limitInfo = UserLimitService.formatLimitInfo(userRole, currentCoverLetterCount, 'coverLetters');
        throw new Error(`Detaylı cover letter oluşturma limitine ulaştınız (${limitInfo.current}/${limitInfo.maximum})`);
      }

      // Kullanıcı profil bilgilerini al
      const userProfile = await this.userProfileService.getUserProfile(userId);
      
      if (!userProfile) {
        throw new Error(formatMessage(SERVICE_MESSAGES.USER.NOT_FOUND));
      }

      // Cover letter kaydını oluştur (başlangıçta PROCESSING durumda)
      const coverLetter = await prisma.coverLetterDetailed.create({
        data: {
          userId,
          positionTitle: request.positionTitle,
          companyName: request.companyName,
          jobDescription: request.jobDescription,
          language: request.language,
          whyPosition: request.whyPosition,
          whyCompany: request.whyCompany,
          workMotivation: request.workMotivation,
          generationStatus: 'PROCESSING',
        },
      });

      // Synchronous olarak cover letter oluştur
      const generatedContent = await this.generateDetailedCoverLetterSync(
        userProfile,
        request
      );

      // Database'i güncelle
      const updatedCoverLetter = await prisma.coverLetterDetailed.update({
        where: { id: coverLetter.id },
        data: {
          generatedContent,
          generationStatus: 'COMPLETED',
          updatedAt: new Date(),
        },
      });

      return {
        id: updatedCoverLetter.id,
        generatedContent: updatedCoverLetter.generatedContent || '',
        positionTitle: updatedCoverLetter.positionTitle,
        companyName: updatedCoverLetter.companyName,
        language: updatedCoverLetter.language,
        generationStatus: updatedCoverLetter.generationStatus,
        whyPosition: updatedCoverLetter.whyPosition || undefined,
        whyCompany: updatedCoverLetter.whyCompany || undefined,
        workMotivation: updatedCoverLetter.workMotivation || undefined,
        createdAt: updatedCoverLetter.createdAt,
        updatedAt: updatedCoverLetter.updatedAt,
      };
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.COVER_LETTER.GENERATION_FAILED,
          error as Error
        )
      );
      throw error;
    }
  }

  async getDetailedCoverLetter(
    userId: string,
    coverLetterId: string
  ): Promise<DetailedCoverLetterResponse | null> {
    const coverLetter = await prisma.coverLetterDetailed.findFirst({
      where: {
        id: coverLetterId,
        userId,
      },
    });

    if (!coverLetter) {
      return null;
    }

    return {
      id: coverLetter.id,
      generatedContent: coverLetter.generatedContent || '',
      positionTitle: coverLetter.positionTitle,
      companyName: coverLetter.companyName,
      language: coverLetter.language,
      generationStatus: coverLetter.generationStatus,
      whyPosition: coverLetter.whyPosition || undefined,
      whyCompany: coverLetter.whyCompany || undefined,
      workMotivation: coverLetter.workMotivation || undefined,
      createdAt: coverLetter.createdAt,
      updatedAt: coverLetter.updatedAt,
    };
  }

  async updateDetailedCoverLetter(
    userId: string,
    coverLetterId: string,
    updatedContent: string
  ): Promise<DetailedCoverLetterResponse> {
    const coverLetter = await prisma.coverLetterDetailed.findFirst({
      where: {
        id: coverLetterId,
        userId,
      },
    });

    if (!coverLetter) {
      throw new Error(formatMessage(SERVICE_MESSAGES.COVER_LETTER.NOT_FOUND));
    }

    const updated = await prisma.coverLetterDetailed.update({
      where: { id: coverLetterId },
      data: {
        updatedContent,
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      generatedContent: updated.updatedContent || updated.generatedContent || '',
      positionTitle: updated.positionTitle,
      companyName: updated.companyName,
      language: updated.language,
      generationStatus: updated.generationStatus,
      whyPosition: updated.whyPosition || undefined,
      whyCompany: updated.whyCompany || undefined,
      workMotivation: updated.workMotivation || undefined,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async getUserDetailedCoverLetters(
    userId: string,
    userRole: string
  ): Promise<{coverLetters: DetailedCoverLetterResponse[], limitInfo: any}> {
    const coverLetters = await prisma.coverLetterDetailed.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const limitInfo = UserLimitService.formatLimitInfo(userRole, coverLetters.length, 'coverLetters');

    const formattedCoverLetters = coverLetters.map((coverLetter) => ({
      id: coverLetter.id,
      generatedContent: coverLetter.updatedContent || coverLetter.generatedContent || '',
      positionTitle: coverLetter.positionTitle,
      companyName: coverLetter.companyName,
      language: coverLetter.language,
      generationStatus: coverLetter.generationStatus,
      whyPosition: coverLetter.whyPosition || undefined,
      whyCompany: coverLetter.whyCompany || undefined,
      workMotivation: coverLetter.workMotivation || undefined,
      createdAt: coverLetter.createdAt,
      updatedAt: coverLetter.updatedAt,
    }));

    return {
      coverLetters: formattedCoverLetters,
      limitInfo
    };
  }

  async deleteDetailedCoverLetter(
    userId: string,
    coverLetterId: string
  ): Promise<void> {
    const coverLetter = await prisma.coverLetterDetailed.findFirst({
      where: {
        id: coverLetterId,
        userId,
      },
    });

    if (!coverLetter) {
      throw new Error(formatMessage(SERVICE_MESSAGES.COVER_LETTER.NOT_FOUND));
    }

    await prisma.coverLetterDetailed.delete({
      where: { id: coverLetterId },
    });
  }

  private async generateDetailedCoverLetterSync(
    userProfile: any,
    request: DetailedCoverLetterRequest
  ): Promise<string> {
    // Kullanıcı profil verisinden detaylı CV bilgilerini çıkar
    const detailedProfile = this.buildDetailedProfileData(userProfile);

    // Claude ile cover letter oluştur
    const coverLetterPrompt = this.buildDetailedCoverLetterPrompt(
      detailedProfile,
      request.positionTitle,
      request.companyName,
      request.jobDescription,
      request.language,
      request.whyPosition,
      request.whyCompany,
      request.workMotivation
    );

    let generatedContent = await generateCoverLetterWithClaude(coverLetterPrompt);

    // Post-processing için human-like düzenlemeler
    generatedContent = this.humanizeCoverLetter(generatedContent, request.language);

    return generatedContent;
  }

  private buildDetailedProfileData(userProfile: any) {
    return {
      personalInfo: {
        fullName: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        email: userProfile.email,
        phone: userProfile.phone,
        address: userProfile.address,
        city: userProfile.city,
        github: userProfile.github,
        linkedin: userProfile.linkedin,
        portfolioWebsite: userProfile.portfolioWebsite,
        aboutMe: userProfile.aboutMe,
      },
      education: userProfile.educations?.map((edu: any) => ({
        schoolName: edu.schoolName,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        grade: edu.grade,
        gradeSystem: edu.gradeSystem,
        startYear: edu.startYear,
        endYear: edu.endYear,
        isCurrent: edu.isCurrent,
        description: edu.description,
      })) || [],
      experience: userProfile.experiences?.map((exp: any) => ({
        companyName: exp.companyName,
        position: exp.position,
        employmentType: exp.employmentType,
        workMode: exp.workMode,
        location: exp.location,
        startMonth: exp.startMonth,
        startYear: exp.startYear,
        endMonth: exp.endMonth,
        endYear: exp.endYear,
        isCurrent: exp.isCurrent,
        description: exp.description,
        achievements: exp.achievements,
      })) || [],
      courses: userProfile.courses || [],
      certificates: userProfile.certificates || [],
      skills: userProfile.skills?.map((skill: any) => ({
        name: skill.name,
        category: skill.category,
        level: skill.level,
        yearsOfExperience: skill.yearsOfExperience,
        description: skill.description,
      })) || [],
      hobbies: userProfile.hobbies || [],
    };
  }

  private buildDetailedCoverLetterPrompt(
    profile: any,
    positionTitle: string,
    companyName: string,
    jobDescription: string,
    language: 'TURKISH' | 'ENGLISH',
    whyPosition?: string,
    whyCompany?: string,
    workMotivation?: string
  ): string {
    const languageConfig = {
      TURKISH: {
        instructions: [
          'Gerçek bir kişi gibi doğal ve samimi bir dil kullan',
          'Mükemmel olmayan, insan benzeri bir yazım stili benimse',
          'Kişisel deneyimleri hikaye anlatır gibi aktarın',
          'Verilen motivasyon cevaplarını doğal bir şekilde entegre et',
          'Detaylı eğitim ve iş deneyimlerini etkili şekilde vurgula',
        ],
      },
      ENGLISH: {
        instructions: [
          'Write naturally and conversationally like a real person',
          'Use imperfect, human-like writing style',
          'Tell stories about experiences and achievements',
          'Naturally integrate the provided motivation answers',
          'Effectively highlight detailed education and work experience',
        ],
      },
    };

    const config = languageConfig[language];
    const personalInfo = profile.personalInfo;

    let prompt = `
You are helping ${personalInfo.fullName} write a highly detailed and personalized cover letter for a ${positionTitle} position at ${companyName}.

**Personal Information:**
- Name: ${personalInfo.fullName}
- Email: ${personalInfo.email}
- Phone: ${personalInfo.phone || 'Not specified'}
- Location: ${personalInfo.city || 'Not specified'}
- About: ${personalInfo.aboutMe || 'Not specified'}`;

    if (personalInfo.linkedin) {
      prompt += `\n- LinkedIn: ${personalInfo.linkedin}`;
    }
    if (personalInfo.github) {
      prompt += `\n- GitHub: ${personalInfo.github}`;
    }
    if (personalInfo.portfolioWebsite) {
      prompt += `\n- Portfolio: ${personalInfo.portfolioWebsite}`;
    }

    // Education
    if (profile.education && profile.education.length > 0) {
      prompt += '\n\n**Education:**\n';
      profile.education.forEach((edu: any) => {
        prompt += `- ${edu.schoolName}`;
        if (edu.degree) prompt += ` - ${edu.degree}`;
        if (edu.fieldOfStudy) prompt += ` in ${edu.fieldOfStudy}`;
        if (edu.grade && edu.gradeSystem) {
          const gradeDisplay = edu.gradeSystem === 'PERCENTAGE' ? `${edu.grade}/100` : `${edu.grade}/4.0 GPA`;
          prompt += ` (Grade: ${gradeDisplay})`;
        }
        prompt += ` (${edu.startYear}${edu.endYear ? `-${edu.endYear}` : edu.isCurrent ? '-Present' : ''})`;
        if (edu.description) prompt += `\n  ${edu.description}`;
        prompt += '\n';
      });
    }

    // Experience
    if (profile.experience && profile.experience.length > 0) {
      prompt += '\n**Work Experience:**\n';
      profile.experience.forEach((exp: any) => {
        prompt += `- ${exp.position} at ${exp.companyName}`;
        if (exp.location) prompt += ` (${exp.location})`;
        prompt += ` - ${exp.employmentType}, ${exp.workMode}`;
        const startDate = `${exp.startMonth}/${exp.startYear}`;
        const endDate = exp.isCurrent ? 'Present' : exp.endMonth && exp.endYear ? `${exp.endMonth}/${exp.endYear}` : 'Present';
        prompt += ` (${startDate} - ${endDate})`;
        if (exp.description) prompt += `\n  Description: ${exp.description}`;
        if (exp.achievements) prompt += `\n  Achievements: ${exp.achievements}`;
        prompt += '\n';
      });
    }

    // Skills
    if (profile.skills && profile.skills.length > 0) {
      prompt += '\n**Skills & Expertise:**\n';
      const skillsByCategory = profile.skills.reduce((acc: any, skill: any) => {
        const category = skill.category || 'OTHER';
        if (!acc[category]) acc[category] = [];
        acc[category].push(`${skill.name}${skill.level ? ` (${skill.level})` : ''}${skill.yearsOfExperience ? ` - ${skill.yearsOfExperience} years` : ''}`);
        return acc;
      }, {});

      Object.entries(skillsByCategory).forEach(([category, skills]: [string, any]) => {
        prompt += `- ${category}: ${skills.join(', ')}\n`;
      });
    }

    // Certificates and Courses
    if (profile.certificates && profile.certificates.length > 0) {
      prompt += '\n**Certificates:**\n';
      profile.certificates.slice(0, 5).forEach((cert: any) => {
        prompt += `- ${cert.certificateName}`;
        if (cert.issuer) prompt += ` by ${cert.issuer}`;
        if (cert.issueYear) prompt += ` (${cert.issueYear})`;
        prompt += '\n';
      });
    }

    if (profile.courses && profile.courses.length > 0) {
      prompt += '\n**Relevant Courses:**\n';
      profile.courses.slice(0, 5).forEach((course: any) => {
        prompt += `- ${course.courseName}`;
        if (course.provider) prompt += ` by ${course.provider}`;
        prompt += '\n';
      });
    }

    // Job Information
    prompt += `\n**Job Application Details:**
- Position: ${positionTitle}
- Company: ${companyName}
- Job Description: ${jobDescription}`;

    // Personal Motivation (if provided)
    if (whyPosition || whyCompany || workMotivation) {
      prompt += '\n\n**Personal Motivation & Insights:**';
      if (whyPosition) prompt += `\n- Why this position: ${whyPosition}`;
      if (whyCompany) prompt += `\n- Why this company: ${whyCompany}`;
      if (workMotivation) prompt += `\n- Work motivation: ${workMotivation}`;
    }

    prompt += `\n\n**Writing Guidelines:**
${config.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

Now write a comprehensive, personalized cover letter that showcases ${personalInfo.fullName}'s qualifications, experiences, and genuine interest in this specific role. Make it feel authentic and human while being professional.`;

    return prompt.trim();
  }

  private humanizeCoverLetter(content: string, language: 'TURKISH' | 'ENGLISH'): string {
    let humanizedContent = content;

    if (language === 'TURKISH') {
      const turkishHumanizers = [
        { from: /Saygıdeğer/g, to: Math.random() > 0.5 ? 'Merhaba' : 'Saygılar' },
        { from: /ile ilgili olarak/g, to: Math.random() > 0.5 ? 'hakkında' : 'konusunda' },
        { from: /Bu nedenle/g, to: Math.random() > 0.3 ? 'Bu yüzden' : 'O yüzden' },
        { from: /büyük bir memnuniyet/g, to: 'çok mutluluk' },
        { from: /deneyimim/g, to: Math.random() > 0.4 ? 'tecrübem' : 'deneyimim' },
        { from: /çalışmalarım/g, to: Math.random() > 0.4 ? 'projelerim' : 'çalışmalarım' },
      ];

      turkishHumanizers.forEach((humanizer) => {
        humanizedContent = humanizedContent.replace(humanizer.from, humanizer.to.toString());
      });
    } else {
      const englishHumanizers = [
        { from: /Dear Sir\/Madam/g, to: Math.random() > 0.5 ? 'Hello' : 'Hi there' },
        { from: /I am writing to express/g, to: Math.random() > 0.4 ? 'I wanted to reach out' : "I'm writing because" },
        { from: /I would be delighted/g, to: Math.random() > 0.5 ? "I'd love" : 'I would really like' },
        { from: /utilize/g, to: Math.random() > 0.6 ? 'use' : 'utilize' },
        { from: /Furthermore/g, to: Math.random() > 0.4 ? 'Also' : 'Plus' },
      ];

      englishHumanizers.forEach((humanizer) => {
        humanizedContent = humanizedContent.replace(humanizer.from, humanizer.to.toString());
      });
    }

    return humanizedContent.trim();
  }
}