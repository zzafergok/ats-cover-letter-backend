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

      if (
        !UserLimitService.canCreateCoverLetter(
          userRole,
          currentCoverLetterCount
        )
      ) {
        const limitInfo = UserLimitService.formatLimitInfo(
          userRole,
          currentCoverLetterCount,
          'coverLetters'
        );
        throw new Error(
          `Detaylı cover letter oluşturma limitine ulaştınız (${limitInfo.current}/${limitInfo.maximum})`
        );
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
      generatedContent:
        updated.updatedContent || updated.generatedContent || '',
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
  ): Promise<{ coverLetters: DetailedCoverLetterResponse[]; limitInfo: any }> {
    const coverLetters = await prisma.coverLetterDetailed.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const limitInfo = UserLimitService.formatLimitInfo(
      userRole,
      coverLetters.length,
      'coverLetters'
    );

    const formattedCoverLetters = coverLetters.map((coverLetter) => ({
      id: coverLetter.id,
      generatedContent:
        coverLetter.updatedContent || coverLetter.generatedContent || '',
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
      limitInfo,
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

    let generatedContent =
      await generateCoverLetterWithClaude(coverLetterPrompt);

    // Post-processing için human-like düzenlemeler
    generatedContent = this.humanizeCoverLetter(
      generatedContent,
      request.language
    );

    // Character limit kontrolü ve düzeltmesi
    generatedContent = this.enforceCharacterLimit(
      generatedContent,
      detailedProfile.personalInfo,
      6000,
      request.language
    );

    return generatedContent;
  }

  private buildDetailedProfileData(userProfile: any) {
    return {
      personalInfo: {
        fullName:
          `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim(),
        email: userProfile.email,
        phone: userProfile.phone,
        address: userProfile.address,
        city: userProfile.city,
        github: userProfile.github,
        linkedin: userProfile.linkedin,
        portfolioWebsite: userProfile.portfolioWebsite,
        aboutMe: userProfile.aboutMe,
      },
      education:
        userProfile.educations?.map((edu: any) => ({
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
      experience:
        userProfile.experiences?.map((exp: any) => ({
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
      skills:
        userProfile.skills?.map((skill: any) => ({
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
          'Gerçek bir kişi gibi son derece doğal, samimi ve kişisel bir dil kullan - sanki arkadaşına yazıyormuş gibi ama profesyonel',
          'Mükemmel olmayan, kusurlu ama çekici insan benzeri yazım stili kullan - bazen uzun cümleler, bazen kısa',
          'Kişisel deneyimleri hikaye anlatır gibi detaylı ve duygusal bir şekilde aktarın - okuyucuyu hikayeye dahil et',
          'Verilen motivasyon cevaplarını çok doğal ve organik bir şekilde mektubun içine serpiştiir - zoraki durmasın',
          'Sadece listelemek yerine eğitim ve iş deneyimlerinden spesifik örnekler ve başarılar anlat',
          'Kişilik, tutku ve gerçek motivasyonu yansıt - insani duyguları göster',
          'Günlük konuşma dilinden kelimeler ve ifadeler kullan ama saygılı kal',
        ],
      },
      ENGLISH: {
        instructions: [
          'Write extremely naturally and conversationally like a real person - as if writing to a friend but professional',
          'Use imperfect, flawed but charming human-like writing style - mix long and short sentences',
          'Tell detailed, emotional stories about experiences and achievements - make the reader part of the story',
          'Naturally weave the provided motivation answers throughout the letter - make it organic, not forced',
          'Instead of just listing, tell specific examples and success stories from education and work experience',
          'Show personality, passion, and genuine motivation - display human emotions',
          'Use everyday conversational language while remaining respectful and professional',
        ],
      },
    };

    const config = languageConfig[language];
    const personalInfo = profile.personalInfo;

    // Dil-spesifik prompt başlangıcı
    const promptStart =
      language === 'TURKISH'
        ? `${personalInfo.fullName} için ${companyName} şirketindeki ${positionTitle} pozisyonuna yönelik son derece detaylı ve kişiselleştirilmiş bir cover letter (ön yazı) yazıyorsunuz.

**Kişisel Bilgiler:**
- İsim: ${personalInfo.fullName}
- E-posta: ${personalInfo.email}
- Telefon: ${personalInfo.phone || 'Belirtilmemiş'}
- Konum: ${personalInfo.city || 'Belirtilmemiş'}
- Hakkında: ${personalInfo.aboutMe || 'Belirtilmemiş'}`
        : `You are helping ${personalInfo.fullName} write a highly detailed and personalized cover letter for a ${positionTitle} position at ${companyName}.

**Personal Information:**
- Name: ${personalInfo.fullName}
- Email: ${personalInfo.email}
- Phone: ${personalInfo.phone || 'Not specified'}
- Location: ${personalInfo.city || 'Not specified'}
- About: ${personalInfo.aboutMe || 'Not specified'}`;

    let prompt = promptStart;

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
      const sectionTitle =
        language === 'TURKISH' ? '**Eğitim:**' : '**Education:**';
      prompt += `\n\n${sectionTitle}\n`;
      profile.education.forEach((edu: any) => {
        prompt += `- ${edu.schoolName}`;
        if (edu.degree) prompt += ` - ${edu.degree}`;
        if (edu.fieldOfStudy) prompt += ` in ${edu.fieldOfStudy}`;
        if (edu.grade && edu.gradeSystem) {
          const gradeDisplay =
            edu.gradeSystem === 'PERCENTAGE'
              ? `${edu.grade}/100`
              : `${edu.grade}/4.0 GPA`;
          prompt += ` (Grade: ${gradeDisplay})`;
        }
        prompt += ` (${edu.startYear}${edu.endYear ? `-${edu.endYear}` : edu.isCurrent ? '-Present' : ''})`;
        if (edu.description) prompt += `\n  ${edu.description}`;
        prompt += '\n';
      });
    }

    // Experience
    if (profile.experience && profile.experience.length > 0) {
      const sectionTitle =
        language === 'TURKISH' ? '**İş Deneyimi:**' : '**Work Experience:**';
      prompt += `\n${sectionTitle}\n`;
      profile.experience.forEach((exp: any) => {
        prompt += `- ${exp.position} at ${exp.companyName}`;
        if (exp.location) prompt += ` (${exp.location})`;
        prompt += ` - ${exp.employmentType}, ${exp.workMode}`;
        const startDate = `${exp.startMonth}/${exp.startYear}`;
        const endDate = exp.isCurrent
          ? 'Present'
          : exp.endMonth && exp.endYear
            ? `${exp.endMonth}/${exp.endYear}`
            : 'Present';
        prompt += ` (${startDate} - ${endDate})`;
        if (exp.description) prompt += `\n  Description: ${exp.description}`;
        if (exp.achievements) prompt += `\n  Achievements: ${exp.achievements}`;
        prompt += '\n';
      });
    }

    // Skills
    if (profile.skills && profile.skills.length > 0) {
      const sectionTitle =
        language === 'TURKISH'
          ? '**Yetenekler ve Uzmanlık:**'
          : '**Skills & Expertise:**';
      prompt += `\n${sectionTitle}\n`;
      const skillsByCategory = profile.skills.reduce((acc: any, skill: any) => {
        const category = skill.category || 'OTHER';
        if (!acc[category]) acc[category] = [];
        acc[category].push(
          `${skill.name}${skill.level ? ` (${skill.level})` : ''}${skill.yearsOfExperience ? ` - ${skill.yearsOfExperience} years` : ''}`
        );
        return acc;
      }, {});

      Object.entries(skillsByCategory).forEach(
        ([category, skills]: [string, any]) => {
          prompt += `- ${category}: ${skills.join(', ')}\n`;
        }
      );
    }

    // Certificates and Courses
    if (profile.certificates && profile.certificates.length > 0) {
      const sectionTitle =
        language === 'TURKISH' ? '**Sertifikalar:**' : '**Certificates:**';
      prompt += `\n${sectionTitle}\n`;
      profile.certificates.slice(0, 5).forEach((cert: any) => {
        prompt += `- ${cert.certificateName}`;
        if (cert.issuer) prompt += ` by ${cert.issuer}`;
        if (cert.issueYear) prompt += ` (${cert.issueYear})`;
        prompt += '\n';
      });
    }

    if (profile.courses && profile.courses.length > 0) {
      const sectionTitle =
        language === 'TURKISH'
          ? '**İlgili Kurslar:**'
          : '**Relevant Courses:**';
      prompt += `\n${sectionTitle}\n`;
      profile.courses.slice(0, 5).forEach((course: any) => {
        prompt += `- ${course.courseName}`;
        if (course.provider) prompt += ` by ${course.provider}`;
        prompt += '\n';
      });
    }

    // Job Information
    const jobSectionTitle =
      language === 'TURKISH'
        ? '**İş Başvuru Detayları:**'
        : '**Job Application Details:**';
    const posLabel = language === 'TURKISH' ? '- Pozisyon:' : '- Position:';
    const compLabel = language === 'TURKISH' ? '- Şirket:' : '- Company:';
    const jobDescLabel =
      language === 'TURKISH' ? '- İş Tanımı:' : '- Job Description:';

    prompt += `\n${jobSectionTitle}
${posLabel} ${positionTitle}
${compLabel} ${companyName}
${jobDescLabel} ${jobDescription}`;

    // Personal Motivation (if provided)
    if (whyPosition || whyCompany || workMotivation) {
      const motivationTitle =
        language === 'TURKISH'
          ? '**Kişisel Motivasyon ve Görüşler:**'
          : '**Personal Motivation & Insights:**';
      const whyPosLabel =
        language === 'TURKISH'
          ? '- Bu pozisyonu neden istiyorum:'
          : '- Why this position:';
      const whyCompLabel =
        language === 'TURKISH'
          ? '- Bu şirketi neden seçiyorum:'
          : '- Why this company:';
      const workMotLabel =
        language === 'TURKISH'
          ? '- Çalışma motivasyonum:'
          : '- Work motivation:';

      prompt += `\n\n${motivationTitle}`;
      if (whyPosition) prompt += `\n${whyPosLabel} ${whyPosition}`;
      if (whyCompany) prompt += `\n${whyCompLabel} ${whyCompany}`;
      if (workMotivation) prompt += `\n${workMotLabel} ${workMotivation}`;
    }

    // Dil-spesifik instructions ve format
    const languageSpecificContent = this.getLanguageSpecificContent(
      language,
      personalInfo
    );

    prompt += `\n\n**Writing Guidelines:**
${config.instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}
6. ${languageSpecificContent.guidelines.closing}
7. ${languageSpecificContent.guidelines.style}
8. ${languageSpecificContent.guidelines.passion}
9. ${languageSpecificContent.guidelines.examples}
10. ${languageSpecificContent.guidelines.language}

**Important Format Requirements:**
- ${languageSpecificContent.formatRequirements.closing}
- ${languageSpecificContent.formatRequirements.contactInfo}

${languageSpecificContent.contactFormat}

${languageSpecificContent.finalInstruction}`;

    return prompt.trim();
  }

  private getLanguageSpecificContent(
    language: 'TURKISH' | 'ENGLISH',
    personalInfo: any
  ) {
    if (language === 'TURKISH') {
      return {
        guidelines: {
          closing:
            "Cover letter'ı MUTLAKA uygun bir kapanış ve tam iletişim bilgileri ile bitir",
          style:
            'Yazım stilini konuşma diline yakın ve hikaye anlatır tarzda yap',
          passion: 'Mektup boyunca gerçek tutku ve kişiliği göster',
          examples:
            'İddiaları desteklemek için spesifik örnekler ve başarılar kullan',
          language: 'SADECE TÜRKÇE yaz - hiçbir İngilizce kelime kullanma',
        },
        formatRequirements: {
          closing:
            'Cover letter MUTLAKA uygun bir Türkçe kapanış ile bitmelidir (örn: "Saygılarımla," veya "En iyi dileklerimle,")',
          contactInfo: 'İletişim bilgilerini aşağıdaki TAM FORMAT ile ekleyin:',
        },
        contactFormat: `Saygılarımla,
${personalInfo.fullName}

${personalInfo.email}
${personalInfo.phone || ''}
${this.formatContactLinks(personalInfo)}`,
        finalInstruction: `Şimdi ${personalInfo.fullName}'in yeterliliklerini, deneyimlerini ve bu spesifik role olan gerçek ilgisini sergileyen kapsamlı, kişiselleştirilmiş bir Türkçe cover letter yazın. Profesyonel olmanın yanı sıra otantik, insani ve sohbet havasında hissettirin. Mektup bir hikaye anlatmalı ve gerçek kişilik ve tutku göstermelidir. SADECE TÜRKÇE YAZIN.`,
      };
    } else {
      return {
        guidelines: {
          closing:
            'ALWAYS end the cover letter with proper closing and complete contact information',
          style: 'Make the writing style conversational and storytelling-based',
          passion: 'Show genuine passion and personality throughout the letter',
          examples: 'Use specific examples and achievements to support claims',
          language: 'Write ONLY in ENGLISH - do not use any other language',
        },
        formatRequirements: {
          closing:
            'The cover letter MUST end with a proper English closing (e.g., "Best regards," or "Sincerely,")',
          contactInfo:
            'ALWAYS include the contact information in this EXACT format at the end:',
        },
        contactFormat: `Best regards,
${personalInfo.fullName}

${personalInfo.email}
${personalInfo.phone || ''}
${this.formatContactLinks(personalInfo)}`,
        finalInstruction: `Now write a comprehensive, personalized English cover letter that showcases ${personalInfo.fullName}'s qualifications, experiences, and genuine interest in this specific role. Make it feel authentic, human, and conversational while being professional. The letter should tell a story and show real personality and passion. WRITE ONLY IN ENGLISH.`,
      };
    }
  }

  private humanizeCoverLetter(
    content: string,
    language: 'TURKISH' | 'ENGLISH'
  ): string {
    let humanizedContent = content;

    if (language === 'TURKISH') {
      const turkishHumanizers = [
        {
          from: /Saygıdeğer İşe Alım Ekibi/g,
          to: Math.random() > 0.5 ? 'Merhaba değerli team' : 'Saygılar',
        },
        {
          from: /Saygıdeğer/g,
          to: Math.random() > 0.5 ? 'Merhaba' : 'Saygılar',
        },
        {
          from: /ile ilgili olarak/g,
          to: Math.random() > 0.5 ? 'hakkında' : 'konusunda',
        },
        {
          from: /Bu nedenle/g,
          to: Math.random() > 0.3 ? 'Bu yüzden' : 'O yüzden',
        },
        { from: /büyük bir memnuniyet/g, to: 'çok mutluluk' },
        {
          from: /deneyimim/g,
          to: Math.random() > 0.4 ? 'tecrübem' : 'deneyimim',
        },
        {
          from: /çalışmalarım/g,
          to: Math.random() > 0.4 ? 'projelerim' : 'çalışmalarım',
        },
        {
          from: /memnuniyetle/g,
          to: Math.random() > 0.5 ? 'mutlulukla' : 'keyifle',
        },
        {
          from: /sunacağım/g,
          to: Math.random() > 0.4 ? 'getireceğim' : 'sunacağım',
        },
        {
          from: /katkıda bulunacağım/g,
          to: Math.random() > 0.5 ? 'yardımcı olacağım' : 'destek olacağım',
        },
        { from: /fırsat/g, to: Math.random() > 0.3 ? 'şans' : 'fırsat' },
        {
          from: /deneyimlerim/g,
          to: Math.random() > 0.4 ? 'tecrübelerim' : 'deneyimlerim',
        },
      ];

      turkishHumanizers.forEach((humanizer) => {
        humanizedContent = humanizedContent.replace(
          humanizer.from,
          humanizer.to.toString()
        );
      });
    } else {
      const englishHumanizers = [
        {
          from: /Dear Hiring Manager/g,
          to: Math.random() > 0.5 ? 'Hello there' : 'Hi',
        },
        {
          from: /Dear Sir\/Madam/g,
          to: Math.random() > 0.5 ? 'Hello' : 'Hi there',
        },
        {
          from: /I am writing to express/g,
          to:
            Math.random() > 0.4
              ? 'I wanted to reach out'
              : "I'm writing because",
        },
        {
          from: /I would be delighted/g,
          to: Math.random() > 0.5 ? "I'd love" : 'I would really like',
        },
        { from: /utilize/g, to: Math.random() > 0.6 ? 'use' : 'utilize' },
        { from: /Furthermore/g, to: Math.random() > 0.4 ? 'Also' : 'Plus' },
        {
          from: /I am confident that/g,
          to: Math.random() > 0.5 ? 'I believe' : "I'm sure",
        },
        {
          from: /opportunities/g,
          to: Math.random() > 0.3 ? 'chances' : 'opportunities',
        },
        { from: /exceptionally/g, to: Math.random() > 0.5 ? 'really' : 'very' },
        {
          from: /demonstrate/g,
          to: Math.random() > 0.4 ? 'show' : 'demonstrate',
        },
        {
          from: /passionate/g,
          to: Math.random() > 0.3 ? 'excited' : 'passionate',
        },
        { from: /Nevertheless/g, to: Math.random() > 0.5 ? 'However' : 'But' },
      ];

      englishHumanizers.forEach((humanizer) => {
        humanizedContent = humanizedContent.replace(
          humanizer.from,
          humanizer.to.toString()
        );
      });
    }

    // Ensure contact information is properly formatted and present
    if (!humanizedContent.includes('@')) {
      // If no email is found in the content, it means contact info might be missing
      // This shouldn't happen with the new prompt, but just in case
      const lines = humanizedContent.split('\n');
      const lastLine = lines[lines.length - 1];
      if (!lastLine.includes('@') && !lastLine.includes('http')) {
        // Contact info seems to be missing, but the prompt should handle this now
      }
    }

    return humanizedContent.trim();
  }

  private formatContactLinks(personalInfo: any): string {
    const links: string[] = [];

    // Mevcut linkleri topla
    if (personalInfo.portfolioWebsite)
      links.push(personalInfo.portfolioWebsite);
    if (personalInfo.github) links.push(personalInfo.github);
    if (personalInfo.linkedin) links.push(personalInfo.linkedin);

    // Email ile başlayan linkler varsa onları da ekle (portfolioWebsite kontrolü)
    const emailBasedLinks = links.filter(
      (link) => link.includes('@') || link.startsWith('mailto:')
    );
    const otherLinks = links.filter(
      (link) => !link.includes('@') && !link.startsWith('mailto:')
    );

    // Uzunluğa göre sırala (en kısadan en uzuna)
    const sortedLinks = [...emailBasedLinks, ...otherLinks].sort(
      (a, b) => a.length - b.length
    );

    // Her birini yeni satırda döndür, email'den sonra bir boşluk
    return sortedLinks.length > 0 ? '\n\n' + sortedLinks.join('\n') : '';
  }

  private enforceCharacterLimit(
    content: string,
    personalInfo: any,
    maxLength: number,
    language: 'TURKISH' | 'ENGLISH' = 'ENGLISH'
  ): string {
    // Dil-spesifik contact info formatını hazırla
    const contactInfo =
      language === 'TURKISH'
        ? `\n\nSaygılarımla,\n${personalInfo.fullName}\n\n${personalInfo.email}${personalInfo.phone ? '\n' + personalInfo.phone : ''}${this.formatContactLinks(personalInfo)}`
        : `\n\nBest regards,\n${personalInfo.fullName}\n\n${personalInfo.email}${personalInfo.phone ? '\n' + personalInfo.phone : ''}${this.formatContactLinks(personalInfo)}`;

    // Mevcut contact info'yu temizle (varsa)
    let cleanContent = content;

    // Dil-spesifik ending patterns - daha kapsamlı
    const endingPatterns =
      language === 'TURKISH'
        ? [
            /\n\n?Saygılarımla[,.]?[\s\S]*$/g,
            /\n\n?En iyi dileklerimle[,.]?[\s\S]*$/g,
            /\n\n?Saygılar[,.]?[\s\S]*$/g,
            /\n\n?İyi çalışmalar[,.]?[\s\S]*$/g,
            /\n\n?Teşekkürler[,.]?[\s\S]*$/g,
            /\n\n?Best regards[,.]?[\s\S]*$/g,
            /\n\n?Sincerely[,.]?[\s\S]*$/g,
          ]
        : [
            /\n\n?Best regards[,.]?[\s\S]*$/g,
            /\n\n?Sincerely[,.]?[\s\S]*$/g,
            /\n\n?Kind regards[,.]?[\s\S]*$/g,
            /\n\n?Yours sincerely[,.]?[\s\S]*$/g,
            /\n\n?With regards[,.]?[\s\S]*$/g,
          ];

    endingPatterns.forEach((pattern) => {
      cleanContent = cleanContent.replace(pattern, '');
    });

    // Trim trailing whitespace
    cleanContent = cleanContent.trim();

    // Target length hesapla (contact info için yer bırak)
    const targetLength = maxLength - contactInfo.length;

    // Eğer content çok uzunsa kısalt
    if (cleanContent.length > targetLength) {
      // Son paragrafı bul ve kısalt
      const paragraphs = cleanContent.split('\n\n');

      while (cleanContent.length > targetLength && paragraphs.length > 1) {
        // Son paragrafı kısalt veya çıkar
        const lastParagraph = paragraphs[paragraphs.length - 1];

        if (lastParagraph.length > 200) {
          // Uzun paragrafı kısalt
          const sentences = lastParagraph.split('. ');
          if (sentences.length > 1) {
            sentences.pop();
            paragraphs[paragraphs.length - 1] = sentences.join('. ') + '.';
          } else {
            paragraphs.pop();
          }
        } else {
          // Kısa paragrafı çıkar
          paragraphs.pop();
        }

        cleanContent = paragraphs.join('\n\n');
      }

      // Hala uzunsa, son paragrafı karakter bazında kısalt
      if (cleanContent.length > targetLength) {
        cleanContent = cleanContent.substring(0, targetLength - 3) + '...';
      }
    }

    // Contact info'yu ekle
    return cleanContent + contactInfo;
  }
}
