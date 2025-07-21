import { PrismaClient, $Enums } from '@prisma/client';

// Define CoverLetterStage enum locally
export enum CoverLetterStage {
  BASIC_INFO = 'BASIC_INFO',
  ENHANCEMENT = 'ENHANCEMENT',
  COMPLETED = 'COMPLETED',
}

import logger from '../config/logger';

const prisma = new PrismaClient();

interface BasicCoverLetterData {
  positionTitle: string;
  companyName: string;
  experienceLevel: $Enums.ExperienceLevel;
  keySkills: string[];
}

interface EnhancementData {
  companyResearch?: string;
  achievements?: string[];
  careerGoals?: string;
  motivation?: string;
}

export class StagedCoverLetterService {
  // Stage 1: Create basic cover letter with minimal data
  static async createBasicCoverLetter(
    userId: string,
    sessionId: string,
    data: BasicCoverLetterData
  ) {
    try {
      // Generate basic cover letter content
      const basicContent = await this.generateBasicContent(data);

      // Save to database
      const stagedCoverLetter = await prisma.stagedCoverLetter.create({
        data: {
          userId,
          sessionId,
          positionTitle: data.positionTitle,
          companyName: data.companyName,
          experienceLevel: data.experienceLevel,
          keySkills: data.keySkills,
          basicContent,
          stage: CoverLetterStage.BASIC_INFO,
        },
      });

      logger.info('Basic cover letter created', {
        id: stagedCoverLetter.id,
        userId,
        sessionId,
      });

      return stagedCoverLetter;
    } catch (error) {
      logger.error('Error creating basic cover letter:', error);
      throw error;
    }
  }

  // Stage 2: Enhance cover letter with additional data
  static async enhanceCoverLetter(
    id: string,
    userId: string,
    enhancements: EnhancementData
  ) {
    try {
      // Get existing staged cover letter
      const existing = await prisma.stagedCoverLetter.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new Error('Staged cover letter not found');
      }

      // Generate enhanced content
      const enhancedContent = await this.generateEnhancedContent(
        {
          positionTitle: existing.positionTitle,
          companyName: existing.companyName,
          experienceLevel: existing.experienceLevel,
          keySkills: existing.keySkills,
        },
        enhancements
      );

      // Update database
      const updated = await prisma.stagedCoverLetter.update({
        where: { id },
        data: {
          ...enhancements,
          enhancedContent,
          stage: CoverLetterStage.ENHANCEMENT,
          updatedAt: new Date(),
        },
      });

      logger.info('Cover letter enhanced', { id, userId });
      return updated;
    } catch (error) {
      logger.error('Error enhancing cover letter:', error);
      throw error;
    }
  }

  // Generate basic content with minimal data
  private static async generateBasicContent(
    data: BasicCoverLetterData
  ): Promise<string> {
    const { positionTitle, companyName, experienceLevel, keySkills } = data;

    // Experience level mapping for Turkish content
    const experienceLevelText = {
      NEW_GRADUATE: 'yeni mezun',
      JUNIOR: 'junior seviyede',
      MID_LEVEL: 'orta seviyede',
      SENIOR: 'senior seviyede',
    };

    const skillsText = keySkills.join(' ve ');
    const expText = experienceLevelText[experienceLevel];

    // Basic template for Turkish cover letter
    const basicTemplate = `Sayın İnsan Kaynakları Yetkilileri,

${companyName} şirketindeki ${positionTitle} pozisyonu için başvuru yapmak istiyorum. ${expText} deneyim sahibi bir profesyonel olarak, özellikle ${skillsText} alanlarındaki güçlü becerilerimle bu pozisyona değer katacağımı düşünüyorum.

Teknik yetkinliklerim ve problem çözme becerim sayesinde, ${companyName}'in hedeflerine ulaşmasında aktif rol almaya hazırım. Dinamik bir ekipte çalışarak, projelerinize katkı sağlamaktan memnuniyet duyarım.

Bu pozisyon için görüşme fırsatı verirseniz memnun olurum.

Saygılarımla,
[İsim Soyisim]`;

    return basicTemplate;
  }

  // Generate enhanced content with additional data
  private static async generateEnhancedContent(
    basicData: BasicCoverLetterData,
    enhancements: EnhancementData
  ): Promise<string> {
    const { positionTitle, companyName, experienceLevel, keySkills } =
      basicData;
    const { companyResearch, achievements, careerGoals, motivation } =
      enhancements;

    const experienceLevelText = {
      NEW_GRADUATE: 'yeni mezun',
      JUNIOR: 'junior seviyede',
      MID_LEVEL: 'orta seviyede',
      SENIOR: 'senior seviyede',
    };

    const skillsText = keySkills.join(', ');
    const expText = experienceLevelText[experienceLevel];

    // Build enhanced template sections
    let enhancedTemplate = `Sayın İnsan Kaynakları Yetkilileri,

${companyName} şirketindeki ${positionTitle} pozisyonu için başvuru yapmak istiyorum.`;

    // Add motivation if provided
    if (motivation) {
      enhancedTemplate += ` ${motivation}`;
    }

    // Add company research
    if (companyResearch) {
      enhancedTemplate += `\n\n${companyResearch}`;
    }

    // Add experience and skills
    enhancedTemplate += `\n\n${expText} deneyim sahibi bir profesyonel olarak, ${skillsText} alanlarında güçlü yetkinliklerim bulunmaktadır.`;

    // Add achievements if provided
    if (achievements && achievements.length > 0) {
      enhancedTemplate += `\n\nKariyerim boyunca önemli başarılara imza attım:\n`;
      achievements.forEach((achievement) => {
        enhancedTemplate += `• ${achievement}\n`;
      });
    }

    // Add career goals if provided
    if (careerGoals) {
      enhancedTemplate += `\n\nKariyer hedefim ${careerGoals} Bu pozisyon, bu hedefime ulaşmam için mükemmel bir fırsat sunuyor.`;
    }

    enhancedTemplate += `\n\nBu pozisyon için görüşme fırsatı verirseniz memnun olurum.

Saygılarımla,
[İsim Soyisim]`;

    return enhancedTemplate;
  }

  // Get staged cover letter by ID
  static async getStagedCoverLetter(id: string, userId: string) {
    try {
      const stagedCoverLetter = await prisma.stagedCoverLetter.findFirst({
        where: { id, userId },
      });

      if (!stagedCoverLetter) {
        throw new Error('Staged cover letter not found');
      }

      return stagedCoverLetter;
    } catch (error) {
      logger.error('Error getting staged cover letter:', error);
      throw error;
    }
  }

  // Get all staged cover letters for a user
  static async getUserStagedCoverLetters(userId: string) {
    try {
      const stagedCoverLetters = await prisma.stagedCoverLetter.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return stagedCoverLetters;
    } catch (error) {
      logger.error('Error getting user staged cover letters:', error);
      throw error;
    }
  }

  // Complete the staged process and convert to regular cover letter
  static async completeStagedCoverLetter(id: string, userId: string) {
    try {
      const stagedCoverLetter = await prisma.stagedCoverLetter.findFirst({
        where: { id, userId },
      });

      if (!stagedCoverLetter) {
        throw new Error('Staged cover letter not found');
      }

      // Use enhanced content if available, otherwise use basic content
      const finalContent =
        stagedCoverLetter.enhancedContent || stagedCoverLetter.basicContent;

      if (!finalContent) {
        throw new Error('No content available to complete');
      }

      // Create regular cover letter
      const coverLetter = await prisma.coverLetter.create({
        data: {
          userId,
          title: `${stagedCoverLetter.positionTitle} - ${stagedCoverLetter.companyName}`,
          content: finalContent,
          coverLetterType: 'PROFESSIONAL',
          positionTitle: stagedCoverLetter.positionTitle,
          companyName: stagedCoverLetter.companyName,
        },
      });

      // Mark staged cover letter as completed
      await prisma.stagedCoverLetter.update({
        where: { id },
        data: {
          stage: CoverLetterStage.COMPLETED,
          isCompleted: true,
        },
      });

      logger.info('Staged cover letter completed', {
        id,
        coverLetterId: coverLetter.id,
      });
      return { coverLetter, stagedCoverLetter };
    } catch (error) {
      logger.error('Error completing staged cover letter:', error);
      throw error;
    }
  }

  // Delete staged cover letter
  static async deleteStagedCoverLetter(id: string, userId: string) {
    try {
      const deleted = await prisma.stagedCoverLetter.delete({
        where: { id, userId },
      });

      logger.info('Staged cover letter deleted', { id, userId });
      return deleted;
    } catch (error) {
      logger.error('Error deleting staged cover letter:', error);
      throw error;
    }
  }
}
