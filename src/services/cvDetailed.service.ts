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

export interface DetailedCvRequest {
  jobDescription: string;
  language: 'TURKISH' | 'ENGLISH';
}

export interface DetailedCvResponse {
  id: string;
  generatedContent: string;
  positionTitle: string;
  companyName: string;
  language: string;
  cvType: string;
  generationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CvDetailedService {
  private static instance: CvDetailedService;
  private userProfileService: UserProfileService;

  private constructor() {
    this.userProfileService = UserProfileService.getInstance();
  }

  public static getInstance(): CvDetailedService {
    if (!CvDetailedService.instance) {
      CvDetailedService.instance = new CvDetailedService();
    }
    return CvDetailedService.instance;
  }

  async createDetailedCv(
    userId: string,
    userRole: string,
    request: DetailedCvRequest
  ): Promise<DetailedCvResponse> {
    try {
      // Kullanıcı limit kontrolü
      const currentCvCount = await prisma.savedCv.count({
        where: { userId },
      });

      if (!UserLimitService.canSaveCv(userRole, currentCvCount)) {
        const limitInfo = UserLimitService.formatLimitInfo(userRole, currentCvCount, 'savedCvs');
        throw new Error(`CV oluşturma limitine ulaştınız (${limitInfo.current}/${limitInfo.maximum})`);
      }

      // Kullanıcı profil bilgilerini al
      const userProfile = await this.userProfileService.getUserProfile(userId);
      
      if (!userProfile) {
        throw new Error(formatMessage(SERVICE_MESSAGES.USER.NOT_FOUND));
      }

      // Profil tamamlanmış mı kontrol et
      if (!userProfile.profileCompleted) {
        throw new Error('CV oluşturmak için önce profil bilgilerinizi tamamlamanız gerekiyor');
      }

      // İş tanımından pozisyon ve şirket bilgilerini çıkar (basit çıkarım)
      const { positionTitle, companyName } = this.extractJobInfo(request.jobDescription);
      const cvType = 'ATS_OPTIMIZED'; // Default CV tipi

      // CV kaydını oluştur (başlangıçta PENDING durumda)
      const savedCv = await prisma.savedCv.create({
        data: {
          userId,
          title: `${companyName || 'Şirket'} - ${positionTitle || 'Pozisyon'} CV`,
          content: '',
          cvType,
        },
      });

      // Arka planda CV oluştur
      this.generateDetailedCvAsync(
        savedCv.id,
        userProfile,
        request,
        positionTitle,
        companyName,
        cvType
      );

      return {
        id: savedCv.id,
        generatedContent: '',
        positionTitle: positionTitle || 'Pozisyon',
        companyName: companyName || 'Şirket',
        language: request.language,
        cvType,
        generationStatus: 'PENDING',
        createdAt: savedCv.createdAt,
        updatedAt: savedCv.updatedAt,
      };
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.CV.GENERATION_ERROR,
          error as Error
        )
      );
      throw error;
    }
  }

  private async generateDetailedCvAsync(
    cvId: string,
    userProfile: any,
    request: DetailedCvRequest,
    positionTitle: string,
    companyName: string,
    cvType: string
  ): Promise<void> {
    try {
      // Kullanıcı profil verisinden detaylı CV bilgilerini çıkar
      const detailedProfile = this.buildDetailedCvData(userProfile);

      // Claude ile CV oluştur
      const cvPrompt = this.buildDetailedCvPrompt(
        detailedProfile,
        positionTitle,
        companyName,
        request.jobDescription,
        request.language,
        cvType as 'ATS_OPTIMIZED' | 'CREATIVE' | 'TECHNICAL'
      );

      let generatedContent = await generateCoverLetterWithClaude(cvPrompt);

      // Post-processing için human-like düzenlemeler
      generatedContent = this.humanizeCv(generatedContent, request.language);

      // Veritabanını güncelle
      await prisma.savedCv.update({
        where: { id: cvId },
        data: {
          content: generatedContent,
          updatedAt: new Date(),
        },
      });

      logger.info(
        formatMessage(SERVICE_MESSAGES.CV.GENERATION_SUCCESS),
        { cvId }
      );
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.CV.GENERATION_ERROR,
          error as Error
        ),
        { cvId }
      );

      // Hata durumunda CV'yi sil
      await prisma.savedCv.delete({
        where: { id: cvId },
      });
    }
  }

  private buildDetailedCvData(userProfile: any) {
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
        portfolioTitle: userProfile.portfolioTitle,
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

  private buildDetailedCvPrompt(
    profile: any,
    positionTitle: string,
    companyName: string,
    jobDescription: string,
    language: 'TURKISH' | 'ENGLISH',
    cvType: 'ATS_OPTIMIZED' | 'CREATIVE' | 'TECHNICAL'
  ): string {
    const languageConfig = {
      TURKISH: {
        instructions: [
          'ATS (Application Tracking System) uyumlu CV oluştur',
          'Anahtar kelimeleri doğal bir şekilde metin içinde kullan',
          'İnsan yazdığı gibi doğal bir dil kullan - çok mükemmel olmasın',
          'İş ilanındaki gereksinimlere uygun deneyimleri öne çıkar',
          'Başarıları somut sayılarla destekle',
          'Bölüm başlıkları net ve standart olsun',
          'Kronolojik sıralama kullan (en yeni en üstte)',
        ],
      },
      ENGLISH: {
        instructions: [
          'Create ATS (Application Tracking System) optimized CV',
          'Use keywords naturally throughout the content',
          'Write naturally like a human - avoid being too perfect',
          'Highlight experiences relevant to job requirements',
          'Support achievements with concrete numbers',
          'Use clear and standard section headers',
          'Use reverse chronological order (newest first)',
        ],
      },
    };

    const cvTypeConfig = {
      ATS_OPTIMIZED: {
        focus: 'ATS tarama sistemlerine optimize edilmiş, anahtar kelime yoğun',
        format: 'Standart, temiz format, net bölümler',
      },
      CREATIVE: {
        focus: 'Yaratıcı projeler ve tasarım becerilerini öne çıkaran',
        format: 'Görsel ve yaratıcı öğeler içeren, kişilik yansıtan',
      },
      TECHNICAL: {
        focus: 'Teknik yetenekler ve projeler ağırlıklı',
        format: 'Teknik detaylar, kullanılan teknolojiler odaklı',
      },
    };

    const config = languageConfig[language];
    const typeConfig = cvTypeConfig[cvType];
    const personalInfo = profile.personalInfo;

    let prompt = `
You are creating a professional ${cvType} CV for ${personalInfo.fullName} applying for ${positionTitle} at ${companyName}.

**CV Type Focus**: ${typeConfig.focus}
**Format Style**: ${typeConfig.format}

**Personal Information:**
- Name: ${personalInfo.fullName}
- Email: ${personalInfo.email}
- Phone: ${personalInfo.phone || 'Not specified'}
- Location: ${personalInfo.city || 'Not specified'}
- Professional Summary: ${personalInfo.aboutMe || 'Not specified'}`;

    if (personalInfo.linkedin) {
      prompt += `\n- LinkedIn: ${personalInfo.linkedin}`;
    }
    if (personalInfo.github) {
      prompt += `\n- GitHub: ${personalInfo.github}`;
    }
    if (personalInfo.portfolioWebsite) {
      prompt += `\n- Portfolio: ${personalInfo.portfolioWebsite} (${personalInfo.portfolioTitle || 'Personal Website'})`;
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
      prompt += '\n**Certifications:**\n';
      profile.certificates.forEach((cert: any) => {
        prompt += `- ${cert.certificateName}`;
        if (cert.issuer) prompt += ` by ${cert.issuer}`;
        if (cert.issueYear) prompt += ` (${cert.issueYear})`;
        if (cert.credentialId) prompt += ` - ID: ${cert.credentialId}`;
        prompt += '\n';
      });
    }

    if (profile.courses && profile.courses.length > 0) {
      prompt += '\n**Professional Development:**\n';
      profile.courses.forEach((course: any) => {
        prompt += `- ${course.courseName}`;
        if (course.provider) prompt += ` by ${course.provider}`;
        if (course.duration) prompt += ` (${course.duration})`;
        prompt += '\n';
      });
    }

    // Job Requirements
    prompt += `\n**Target Position Details:**
- Position: ${positionTitle}
- Company: ${companyName}
- Job Description: ${jobDescription}`;


    // Hobbies (if creative type)
    if (cvType === 'CREATIVE' && profile.hobbies && profile.hobbies.length > 0) {
      prompt += '\n**Personal Interests:**\n';
      profile.hobbies.forEach((hobby: any) => {
        prompt += `- ${hobby.name}`;
        if (hobby.description) prompt += `: ${hobby.description}`;
        prompt += '\n';
      });
    }

    prompt += `\n\n**CV Creation Guidelines:**
${config.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

**Important ATS Optimization Rules:**
- Include target keywords naturally in context
- Use standard section headers (Experience, Education, Skills, etc.)
- Avoid graphics, tables, or complex formatting
- Use bullet points for easy scanning
- Include relevant metrics and achievements
- Match job requirements with candidate's experience
- Ensure keyword density without keyword stuffing

Now create a comprehensive, ATS-optimized CV that highlights ${personalInfo.fullName}'s qualifications for the ${positionTitle} role. Make it professional yet human-written, not AI-generated.

Format the CV with clear sections and use the following structure:
1. Contact Information & Professional Summary
2. Work Experience (reverse chronological)
3. Education
4. Skills & Technical Expertise
5. Certifications (if any)
6. Professional Development (if any)
7. Personal Interests (only for creative CVs)

Write in ${language === 'TURKISH' ? 'Turkish' : 'English'} language.`;

    return prompt.trim();
  }

  private extractJobInfo(jobDescription: string): { positionTitle: string; companyName: string } {
    // Basit regex patterns ile pozisyon ve şirket adını çıkarmaya çalış
    const positionPatterns = [
      /(?:pozisyon|position|role|job)[:]\s*([^,.]+)/i,
      /(?:için|for)\s+([^,.]+?)\s+(?:aranıyor|needed|wanted|required)/i,
      /([^,.]+?)\s+(?:pozisyonu|position|role)\s+(?:için|for)/i,
    ];

    const companyPatterns = [
      /(?:şirket|company|firma)[:]\s*([^,.]+)/i,
      /(?:at|@)\s+([^,.]+)/i,
      /([A-Z][a-zA-ZüğıöçşÜĞIÖÇŞ\s]+(?:Ltd|A\.Ş|Inc|Corp|GmbH|Co)\.?)/,
    ];

    let positionTitle = 'İlgili Pozisyon';
    let companyName = 'Hedef Şirket';

    // Pozisyon adını bul
    for (const pattern of positionPatterns) {
      const match = jobDescription.match(pattern);
      if (match && match[1]) {
        positionTitle = match[1].trim();
        break;
      }
    }

    // Şirket adını bul
    for (const pattern of companyPatterns) {
      const match = jobDescription.match(pattern);
      if (match && match[1]) {
        companyName = match[1].trim();
        break;
      }
    }

    // Eğer hiç bulamadıysak ilk cümleden çıkarım yap
    if (positionTitle === 'İlgili Pozisyon' || companyName === 'Hedef Şirket') {
      const firstSentence = jobDescription.split(/[.!?]/)[0];
      const words = firstSentence.split(/\s+/);
      
      if (words.length >= 2) {
        // İlk iki kelimeyi pozisyon olarak al
        if (positionTitle === 'İlgili Pozisyon') {
          positionTitle = words.slice(0, 2).join(' ');
        }
        // Büyük harfle başlayan kelimeleri şirket olarak al
        if (companyName === 'Hedef Şirket') {
          const capitalizedWords = words.filter(word => /^[A-ZÇĞÜÖŞ]/.test(word));
          if (capitalizedWords.length > 0) {
            companyName = capitalizedWords.slice(0, 2).join(' ');
          }
        }
      }
    }

    return { positionTitle, companyName };
  }

  private humanizeCv(content: string, language: 'TURKISH' | 'ENGLISH'): string {
    let humanizedContent = content;

    if (language === 'TURKISH') {
      const turkishHumanizers = [
        { from: /çok iyi/g, to: Math.random() > 0.5 ? 'oldukça iyi' : 'gayet iyi' },
        { from: /başarılı bir şekilde/g, to: Math.random() > 0.5 ? 'başarıyla' : 'etkili bir şekilde' },
        { from: /geliştirme/g, to: Math.random() > 0.4 ? 'geliştirme' : 'development' },
        { from: /sorumluluklarım/g, to: Math.random() > 0.4 ? 'görevlerim' : 'sorumluluklarım' },
        { from: /ekip ile/g, to: Math.random() > 0.5 ? 'takım ile' : 'ekip ile' },
      ];

      turkishHumanizers.forEach((humanizer) => {
        humanizedContent = humanizedContent.replace(humanizer.from, humanizer.to.toString());
      });
    } else {
      const englishHumanizers = [
        { from: /successfully/g, to: Math.random() > 0.5 ? 'effectively' : 'successfully' },
        { from: /responsible for/g, to: Math.random() > 0.4 ? 'handled' : 'managed' },
        { from: /developed/g, to: Math.random() > 0.6 ? 'built' : 'created' },
        { from: /collaborated with/g, to: Math.random() > 0.5 ? 'worked with' : 'partnered with' },
      ];

      englishHumanizers.forEach((humanizer) => {
        humanizedContent = humanizedContent.replace(humanizer.from, humanizer.to.toString());
      });
    }

    return humanizedContent.trim();
  }

  async getDetailedCv(userId: string, cvId: string): Promise<DetailedCvResponse | null> {
    const savedCv = await prisma.savedCv.findFirst({
      where: {
        id: cvId,
        userId,
      },
    });

    if (!savedCv) {
      return null;
    }

    return {
      id: savedCv.id,
      generatedContent: savedCv.content,
      positionTitle: savedCv.title.split(' - ')[1] || '',
      companyName: savedCv.title.split(' - ')[0] || '',
      language: 'TURKISH', // Default
      cvType: savedCv.cvType,
      generationStatus: savedCv.content ? 'COMPLETED' : 'PENDING',
      createdAt: savedCv.createdAt,
      updatedAt: savedCv.updatedAt,
    };
  }

  async getUserDetailedCvs(userId: string, userRole: string) {
    const savedCvs = await prisma.savedCv.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const limitInfo = UserLimitService.formatLimitInfo(userRole, savedCvs.length, 'savedCvs');

    return {
      cvs: savedCvs,
      limitInfo
    };
  }

  async deleteDetailedCv(userId: string, cvId: string): Promise<void> {
    const savedCv = await prisma.savedCv.findFirst({
      where: {
        id: cvId,
        userId,
      },
    });

    if (!savedCv) {
      throw new Error(formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND));
    }

    await prisma.savedCv.delete({
      where: { id: cvId },
    });
  }
}