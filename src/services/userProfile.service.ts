import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';
import { CVTemplateData } from '../types/cvTemplate.types';
import { DateTransformOptions } from '../types/userProfile.types';

const prisma = new PrismaClient();

export interface UserProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  github?: string;
  linkedin?: string;
  portfolioWebsite?: string;
  aboutMe?: string;
  avatarColor?: string;
  communication?: string;
  leadership?: string;
  technicalSkills?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    tools?: string[];
  };
}

export interface EducationData {
  id?: string;
  schoolName: string;
  degree?: string;
  fieldOfStudy?: string;
  grade?: number;
  gradeSystem: 'PERCENTAGE' | 'GPA_4';
  educationType?: 'LISE' | 'ONLISANS' | 'LISANS' | 'YUKSEKLISANS';
  startYear: number;
  endYear?: number;
  isCurrent: boolean;
  description?: string;
}

export interface ExperienceData {
  id?: string;
  companyName: string;
  position: string;
  employmentType:
    | 'FULL_TIME'
    | 'PART_TIME'
    | 'CONTRACT'
    | 'FREELANCE'
    | 'INTERNSHIP'
    | 'TEMPORARY';
  workMode: 'ONSITE' | 'REMOTE' | 'HYBRID';
  location?: string;
  startMonth: number;
  startYear: number;
  endMonth?: number;
  endYear?: number;
  isCurrent: boolean;
  description?: string;
  achievements?: string;
}

export interface CourseData {
  id?: string;
  courseName: string;
  provider?: string;
  startMonth?: number;
  startYear?: number;
  endMonth?: number;
  endYear?: number;
  duration?: string;
  description?: string;
}

export interface CertificateData {
  id?: string;
  certificateName: string;
  issuer?: string;
  issueMonth?: number;
  issueYear?: number;
  expiryMonth?: number;
  expiryYear?: number;
  credentialId?: string;
  credentialUrl?: string;
  description?: string;
}

export interface HobbyData {
  id?: string;
  name: string;
  description?: string;
}

export interface SkillData {
  id?: string;
  name: string;
  category?:
    | 'TECHNICAL'
    | 'SOFT_SKILL'
    | 'LANGUAGE'
    | 'TOOL'
    | 'FRAMEWORK'
    | 'OTHER';
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  yearsOfExperience?: number;
  description?: string;
}

export interface ProjectData {
  id?: string;
  name: string;
  description: string;
  technologies: string;
  link?: string;
}

export interface LanguageData {
  id?: string;
  language: string;
  level: string;
}

export interface ReferenceData {
  id?: string;
  name: string;
  company: string;
  contact: string;
}

export class UserProfileService {
  private static instance: UserProfileService;

  public static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  // User Profile Methods
  async updateUserProfile(userId: string, profileData: UserProfileData) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...profileData,
          profileCompleted: this.isProfileCompleted(profileData),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          github: true,
          linkedin: true,
          medium: true,
          portfolioWebsite: true,
          aboutMe: true,
          profileCompleted: true,
          avatarColor: true,
        },
      });

      logger.info(formatMessage(SERVICE_MESSAGES.USER.PROFILE_UPDATED), {
        userId,
      });
      return updatedUser;
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.USER.PROFILE_UPDATE_ERROR,
          error as Error
        )
      );
      throw error;
    }
  }

  async getUserProfile(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          github: true,
          linkedin: true,
          medium: true,
          portfolioWebsite: true,
          aboutMe: true,
          communication: true,
          leadership: true,
          technicalSkills: true,
          profileCompleted: true,
          avatarColor: true,
          educations: {
            orderBy: { startYear: 'desc' },
          },
          experiences: {
            orderBy: [
              { isCurrent: 'desc' },
              { startYear: 'desc' },
              { startMonth: 'desc' },
            ],
          },
          courses: {
            orderBy: { createdAt: 'desc' },
          },
          certificates: {
            orderBy: { createdAt: 'desc' },
          },
          hobbies: {
            orderBy: { name: 'asc' },
          },
          skills: {
            orderBy: { name: 'asc' },
          },
          projects: {
            orderBy: { createdAt: 'desc' },
          },
          languages: {
            orderBy: { createdAt: 'desc' },
          },
          references: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        throw new Error(formatMessage(SERVICE_MESSAGES.USER.NOT_FOUND));
      }

      return user;
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.USER.PROFILE_GET_ERROR,
          error as Error
        )
      );
      throw error;
    }
  }

  // Education Methods
  async addEducation(userId: string, educationData: EducationData) {
    try {
      const education = await prisma.education.create({
        data: {
          userId,
          ...educationData,
        },
      });

      logger.info('Education added successfully', {
        userId,
        educationId: education.id,
      });
      return education;
    } catch (error) {
      logger.error('Failed to add education', error);
      throw error;
    }
  }

  async updateEducation(
    userId: string,
    educationId: string,
    educationData: Partial<EducationData>
  ) {
    try {
      const education = await prisma.education.updateMany({
        where: { id: educationId, userId },
        data: educationData,
      });

      if (education.count === 0) {
        throw new Error('Education not found or unauthorized');
      }

      logger.info('Education updated successfully', { userId, educationId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update education', error);
      throw error;
    }
  }

  async deleteEducation(userId: string, educationId: string) {
    try {
      const education = await prisma.education.deleteMany({
        where: { id: educationId, userId },
      });

      if (education.count === 0) {
        throw new Error('Education not found or unauthorized');
      }

      logger.info('Education deleted successfully', { userId, educationId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete education', error);
      throw error;
    }
  }

  // Experience Methods
  async addExperience(userId: string, experienceData: ExperienceData) {
    try {
      const experience = await prisma.experience.create({
        data: {
          userId,
          ...experienceData,
        },
      });

      logger.info('Experience added successfully', {
        userId,
        experienceId: experience.id,
      });
      return experience;
    } catch (error) {
      logger.error('Failed to add experience', error);
      throw error;
    }
  }

  async updateExperience(
    userId: string,
    experienceId: string,
    experienceData: Partial<ExperienceData>
  ) {
    try {
      const experience = await prisma.experience.updateMany({
        where: { id: experienceId, userId },
        data: experienceData,
      });

      if (experience.count === 0) {
        throw new Error('Experience not found or unauthorized');
      }

      logger.info('Experience updated successfully', { userId, experienceId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update experience', error);
      throw error;
    }
  }

  async deleteExperience(userId: string, experienceId: string) {
    try {
      const experience = await prisma.experience.deleteMany({
        where: { id: experienceId, userId },
      });

      if (experience.count === 0) {
        throw new Error('Experience not found or unauthorized');
      }

      logger.info('Experience deleted successfully', { userId, experienceId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete experience', error);
      throw error;
    }
  }

  // Course Methods
  async addCourse(userId: string, courseData: CourseData) {
    try {
      const course = await prisma.course.create({
        data: {
          userId,
          ...courseData,
        },
      });

      logger.info('Course added successfully', { userId, courseId: course.id });
      return course;
    } catch (error) {
      logger.error('Failed to add course', error);
      throw error;
    }
  }

  async updateCourse(
    userId: string,
    courseId: string,
    courseData: Partial<CourseData>
  ) {
    try {
      const course = await prisma.course.updateMany({
        where: { id: courseId, userId },
        data: courseData,
      });

      if (course.count === 0) {
        throw new Error('Course not found or unauthorized');
      }

      logger.info('Course updated successfully', { userId, courseId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update course', error);
      throw error;
    }
  }

  async deleteCourse(userId: string, courseId: string) {
    try {
      const course = await prisma.course.deleteMany({
        where: { id: courseId, userId },
      });

      if (course.count === 0) {
        throw new Error('Course not found or unauthorized');
      }

      logger.info('Course deleted successfully', { userId, courseId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete course', error);
      throw error;
    }
  }

  // Certificate Methods
  async addCertificate(userId: string, certificateData: CertificateData) {
    try {
      const certificate = await prisma.certificate.create({
        data: {
          userId,
          ...certificateData,
        },
      });

      logger.info('Certificate added successfully', {
        userId,
        certificateId: certificate.id,
      });
      return certificate;
    } catch (error) {
      logger.error('Failed to add certificate', error);
      throw error;
    }
  }

  async updateCertificate(
    userId: string,
    certificateId: string,
    certificateData: Partial<CertificateData>
  ) {
    try {
      const certificate = await prisma.certificate.updateMany({
        where: { id: certificateId, userId },
        data: certificateData,
      });

      if (certificate.count === 0) {
        throw new Error('Certificate not found or unauthorized');
      }

      logger.info('Certificate updated successfully', {
        userId,
        certificateId,
      });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update certificate', error);
      throw error;
    }
  }

  async deleteCertificate(userId: string, certificateId: string) {
    try {
      const certificate = await prisma.certificate.deleteMany({
        where: { id: certificateId, userId },
      });

      if (certificate.count === 0) {
        throw new Error('Certificate not found or unauthorized');
      }

      logger.info('Certificate deleted successfully', {
        userId,
        certificateId,
      });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete certificate', error);
      throw error;
    }
  }

  // Hobby Methods
  async addHobby(userId: string, hobbyData: HobbyData) {
    try {
      const hobby = await prisma.hobby.create({
        data: {
          userId,
          ...hobbyData,
        },
      });

      logger.info('Hobby added successfully', { userId, hobbyId: hobby.id });
      return hobby;
    } catch (error) {
      logger.error('Failed to add hobby', error);
      throw error;
    }
  }

  async updateHobby(
    userId: string,
    hobbyId: string,
    hobbyData: Partial<HobbyData>
  ) {
    try {
      const hobby = await prisma.hobby.updateMany({
        where: { id: hobbyId, userId },
        data: hobbyData,
      });

      if (hobby.count === 0) {
        throw new Error('Hobby not found or unauthorized');
      }

      logger.info('Hobby updated successfully', { userId, hobbyId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update hobby', error);
      throw error;
    }
  }

  async deleteHobby(userId: string, hobbyId: string) {
    try {
      const hobby = await prisma.hobby.deleteMany({
        where: { id: hobbyId, userId },
      });

      if (hobby.count === 0) {
        throw new Error('Hobby not found or unauthorized');
      }

      logger.info('Hobby deleted successfully', { userId, hobbyId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete hobby', error);
      throw error;
    }
  }

  // Skill Methods
  async addSkill(userId: string, skillData: SkillData) {
    try {
      const skill = await prisma.skill.create({
        data: {
          userId,
          ...skillData,
        },
      });

      logger.info('Skill added successfully', { userId, skillId: skill.id });
      return skill;
    } catch (error) {
      logger.error('Failed to add skill', error);
      throw error;
    }
  }

  async addBulkSkills(userId: string, skillsData: SkillData[]) {
    try {
      // Use transaction to ensure all skills are added or none
      const skills = await prisma.$transaction(
        skillsData.map((skillData) =>
          prisma.skill.create({
            data: {
              userId,
              ...skillData,
            },
          })
        )
      );

      logger.info('Bulk skills added successfully', { 
        userId, 
        skillCount: skills.length,
        skillIds: skills.map(s => s.id)
      });
      
      return skills;
    } catch (error) {
      logger.error('Failed to add bulk skills', error);
      throw error;
    }
  }

  async updateSkill(
    userId: string,
    skillId: string,
    skillData: Partial<SkillData>
  ) {
    try {
      const skill = await prisma.skill.updateMany({
        where: { id: skillId, userId },
        data: skillData,
      });

      if (skill.count === 0) {
        throw new Error('Skill not found or unauthorized');
      }

      logger.info('Skill updated successfully', { userId, skillId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update skill', error);
      throw error;
    }
  }

  async deleteSkill(userId: string, skillId: string) {
    try {
      const skill = await prisma.skill.deleteMany({
        where: { id: skillId, userId },
      });

      if (skill.count === 0) {
        throw new Error('Skill not found or unauthorized');
      }

      logger.info('Skill deleted successfully', { userId, skillId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete skill', error);
      throw error;
    }
  }

  private isProfileCompleted(profileData: UserProfileData): boolean {
    return !!(
      profileData.firstName &&
      profileData.lastName &&
      profileData.phone &&
      profileData.city &&
      profileData.aboutMe
    );
  }

  // CVTemplate Transformation Methods
  async getUserProfileAsCVTemplate(userId: string): Promise<CVTemplateData> {
    try {
      const userProfile = await this.getUserProfile(userId);
      return this.transformToCVTemplate(userProfile);
    } catch (error) {
      logger.error('Failed to get user profile as CV template', error);
      throw error;
    }
  }

  private transformToCVTemplate(userProfile: any): CVTemplateData {
    return {
      personalInfo: {
        address: userProfile.address || '',
        city: userProfile.city || '',
        email: userProfile.email || '',
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
        github: userProfile.github,
        linkedin: userProfile.linkedin,
        website: userProfile.portfolioWebsite,
        jobTitle: this.extractJobTitleFromExperience(userProfile.experiences),
      },
      objective: userProfile.aboutMe || '',
      experience: this.transformExperiences(userProfile.experiences || []),
      education: this.transformEducations(userProfile.educations || []),
      skills: this.transformSkills(userProfile.skills || []),
      technicalSkills: this.categorizeTechnicalSkills(userProfile.skills || []),
      certificates: this.transformCertificates(userProfile.certificates || []),
      projects: [], // Will be populated when we add projects feature
      languages: this.extractLanguageSkills(userProfile.skills || []),
      references: [], // Will be populated when we add references feature
      version: 'turkey',
      language: 'turkish',
    };
  }

  private extractJobTitleFromExperience(
    experiences: any[]
  ): string | undefined {
    if (!experiences || experiences.length === 0) return undefined;

    // Get the most recent experience (first in array due to ordering)
    const mostRecent =
      experiences.find((exp) => exp.isCurrent) || experiences[0];
    return mostRecent?.position;
  }

  private transformExperiences(experiences: any[]): any[] {
    return experiences.map((exp) => ({
      company: exp.companyName,
      jobTitle: exp.position,
      location: exp.location || '',
      startDate: this.formatDate({
        month: exp.startMonth,
        year: exp.startYear,
      }),
      endDate: exp.isCurrent
        ? 'Present'
        : this.formatDate({ month: exp.endMonth, year: exp.endYear }),
      isCurrent: exp.isCurrent,
      description: exp.description || '',
    }));
  }

  private transformEducations(educations: any[]): any[] {
    return educations.map((edu) => ({
      university: edu.schoolName,
      degree: edu.degree || '',
      field: edu.fieldOfStudy || '',
      location: '', // Not available in current schema
      startDate: this.formatDate({ year: edu.startYear }),
      graduationDate: edu.isCurrent
        ? 'Present'
        : this.formatDate({ year: edu.endYear }),
      details: edu.description,
    }));
  }

  private transformSkills(skills: any[]): string[] {
    return skills
      .filter((skill) => skill.category !== 'LANGUAGE')
      .map((skill) => skill.name);
  }

  private categorizeTechnicalSkills(skills: any[]) {
    const technicalSkills = skills.filter(
      (skill) =>
        skill.category === 'TECHNICAL' ||
        skill.category === 'TOOL' ||
        skill.category === 'FRAMEWORK'
    );

    const categorized = {
      frontend: [] as string[],
      backend: [] as string[],
      database: [] as string[],
      tools: [] as string[],
    };

    technicalSkills.forEach((skill) => {
      // Simple categorization - can be enhanced with AI later
      const skillName = skill.name.toLowerCase();

      if (this.isFrontendSkill(skillName)) {
        categorized.frontend.push(skill.name);
      } else if (this.isBackendSkill(skillName)) {
        categorized.backend.push(skill.name);
      } else if (this.isDatabaseSkill(skillName)) {
        categorized.database.push(skill.name);
      } else {
        categorized.tools.push(skill.name);
      }
    });

    return categorized;
  }

  private isFrontendSkill(skill: string): boolean {
    const frontendKeywords = [
      'react',
      'vue',
      'angular',
      'javascript',
      'typescript',
      'html',
      'css',
      'sass',
      'less',
      'webpack',
      'vite',
      'next.js',
      'nuxt',
    ];
    return frontendKeywords.some((keyword) => skill.includes(keyword));
  }

  private isBackendSkill(skill: string): boolean {
    const backendKeywords = [
      'node.js',
      'express',
      'nestjs',
      'python',
      'django',
      'flask',
      'java',
      'spring',
      'php',
      'laravel',
      'ruby',
      'rails',
      '.net',
      'go',
      'rust',
    ];
    return backendKeywords.some((keyword) => skill.includes(keyword));
  }

  private isDatabaseSkill(skill: string): boolean {
    const databaseKeywords = [
      'mysql',
      'postgresql',
      'mongodb',
      'redis',
      'elasticsearch',
      'oracle',
      'sqlite',
      'prisma',
      'typeorm',
      'sequelize',
    ];
    return databaseKeywords.some((keyword) => skill.includes(keyword));
  }

  private transformCertificates(certificates: any[]): any[] {
    return certificates.map((cert) => ({
      name: cert.certificateName,
      issuer: cert.issuer || '',
      date: this.formatDate({ month: cert.issueMonth, year: cert.issueYear }),
    }));
  }

  private extractLanguageSkills(skills: any[]) {
    return skills
      .filter((skill) => skill.category === 'LANGUAGE')
      .map((skill) => ({
        language: skill.name,
        level: this.mapSkillLevelToLanguageLevel(skill.level),
      }));
  }

  private mapSkillLevelToLanguageLevel(level?: string): string {
    switch (level) {
      case 'BEGINNER':
        return 'A1-A2';
      case 'INTERMEDIATE':
        return 'B1-B2';
      case 'ADVANCED':
        return 'C1';
      case 'EXPERT':
        return 'C2';
      default:
        return 'Intermediate';
    }
  }

  private formatDate(options: DateTransformOptions): string {
    if (!options.year) return '';

    if (options.month) {
      return `${options.year}-${options.month.toString().padStart(2, '0')}`;
    }

    return options.year.toString();
  }

  // Reverse transformation: CVTemplate to UserProfile data
  async updateUserProfileFromCVTemplate(
    userId: string,
    cvData: CVTemplateData
  ) {
    try {
      // Update basic user info
      await this.updateUserProfile(userId, {
        firstName: cvData.personalInfo.firstName,
        lastName: cvData.personalInfo.lastName,
        phone: cvData.personalInfo.phone,
        address: cvData.personalInfo.address,
        city: cvData.personalInfo.city,
        github: cvData.personalInfo.github,
        linkedin: cvData.personalInfo.linkedin,
        portfolioWebsite: cvData.personalInfo.website,
        aboutMe: cvData.objective,
      });

      // Note: Experiences, education, etc. would need individual update calls
      // This method can be expanded as needed

      logger.info('User profile updated from CV template', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Failed to update user profile from CV template', error);
      throw error;
    }
  }
}
