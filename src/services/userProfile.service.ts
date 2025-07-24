import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';

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
          portfolioWebsite: true,
          aboutMe: true,
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
}
