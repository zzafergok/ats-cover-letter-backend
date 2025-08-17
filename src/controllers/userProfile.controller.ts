import { Request, Response } from 'express';
import { z } from 'zod';

import { UserProfileService } from '../services/userProfile.service';
import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';
import {
  updateUserDetailedProfileSchema,
  educationSchema,
  experienceSchema,
  courseSchema,
  certificateSchema,
  hobbySchema,
  skillSchema,
  flexibleSkillSchema,
} from '../schemas';

export class UserProfileController {
  private userProfileService = UserProfileService.getInstance();

  // Profile Methods
  public getUserProfile = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userProfile = await this.userProfileService.getUserProfile(
        req.user!.userId
      );

      res.json({
        success: true,
        data: userProfile,
      });
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.USER.PROFILE_GET_ERROR,
          error as Error
        )
      );
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.USER.PROFILE_GET_ERROR),
      });
    }
  };

  public updateUserProfile = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const validatedData = updateUserDetailedProfileSchema.parse(req.body);

      const updatedProfile = await this.userProfileService.updateUserProfile(
        req.user!.userId,
        validatedData
      );

      res.json({
        success: true,
        message: formatMessage(SERVICE_MESSAGES.USER.PROFILE_UPDATED),
        data: updatedProfile,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.USER.PROFILE_UPDATE_ERROR,
          error as Error
        )
      );
      res.status(500).json({
        success: false,
        message: formatMessage(SERVICE_MESSAGES.USER.PROFILE_UPDATE_ERROR),
      });
    }
  };

  // Education Methods
  public addEducation = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = educationSchema.parse(req.body);

      const education = await this.userProfileService.addEducation(
        req.user!.userId,
        validatedData
      );

      res.status(201).json({
        success: true,
        message: 'Eğitim bilgisi başarıyla eklendi',
        data: education,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to add education', error);
      res.status(500).json({
        success: false,
        message: 'Eğitim bilgisi eklenirken hata oluştu',
      });
    }
  };

  public updateEducation = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = educationSchema.partial().parse(req.body);

      await this.userProfileService.updateEducation(
        req.user!.userId,
        id,
        validatedData
      );

      res.json({
        success: true,
        message: 'Eğitim bilgisi başarıyla güncellendi',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to update education', error);
      res.status(500).json({
        success: false,
        message: 'Eğitim bilgisi güncellenirken hata oluştu',
      });
    }
  };

  public deleteEducation = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      await this.userProfileService.deleteEducation(req.user!.userId, id);

      res.json({
        success: true,
        message: 'Eğitim bilgisi başarıyla silindi',
      });
    } catch (error) {
      logger.error('Failed to delete education', error);
      res.status(500).json({
        success: false,
        message: 'Eğitim bilgisi silinirken hata oluştu',
      });
    }
  };

  // Experience Methods
  public addExperience = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = experienceSchema.parse(req.body);

      const experience = await this.userProfileService.addExperience(
        req.user!.userId,
        validatedData
      );

      res.status(201).json({
        success: true,
        message: 'İş deneyimi başarıyla eklendi',
        data: experience,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to add experience', error);
      res.status(500).json({
        success: false,
        message: 'İş deneyimi eklenirken hata oluştu',
      });
    }
  };

  public updateExperience = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = experienceSchema.partial().parse(req.body);

      await this.userProfileService.updateExperience(
        req.user!.userId,
        id,
        validatedData
      );

      res.json({
        success: true,
        message: 'İş deneyimi başarıyla güncellendi',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to update experience', error);
      res.status(500).json({
        success: false,
        message: 'İş deneyimi güncellenirken hata oluştu',
      });
    }
  };

  public deleteExperience = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      await this.userProfileService.deleteExperience(req.user!.userId, id);

      res.json({
        success: true,
        message: 'İş deneyimi başarıyla silindi',
      });
    } catch (error) {
      logger.error('Failed to delete experience', error);
      res.status(500).json({
        success: false,
        message: 'İş deneyimi silinirken hata oluştu',
      });
    }
  };

  // Course Methods
  public addCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = courseSchema.parse(req.body);

      const course = await this.userProfileService.addCourse(
        req.user!.userId,
        validatedData
      );

      res.status(201).json({
        success: true,
        message: 'Kurs bilgisi başarıyla eklendi',
        data: course,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to add course', error);
      res.status(500).json({
        success: false,
        message: 'Kurs bilgisi eklenirken hata oluştu',
      });
    }
  };

  public updateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = courseSchema.partial().parse(req.body);

      await this.userProfileService.updateCourse(
        req.user!.userId,
        id,
        validatedData
      );

      res.json({
        success: true,
        message: 'Kurs bilgisi başarıyla güncellendi',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to update course', error);
      res.status(500).json({
        success: false,
        message: 'Kurs bilgisi güncellenirken hata oluştu',
      });
    }
  };

  public deleteCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.userProfileService.deleteCourse(req.user!.userId, id);

      res.json({
        success: true,
        message: 'Kurs bilgisi başarıyla silindi',
      });
    } catch (error) {
      logger.error('Failed to delete course', error);
      res.status(500).json({
        success: false,
        message: 'Kurs bilgisi silinirken hata oluştu',
      });
    }
  };

  // Certificate Methods
  public addCertificate = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const validatedData = certificateSchema.parse(req.body);

      const certificate = await this.userProfileService.addCertificate(
        req.user!.userId,
        validatedData
      );

      res.status(201).json({
        success: true,
        message: 'Sertifika bilgisi başarıyla eklendi',
        data: certificate,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to add certificate', error);
      res.status(500).json({
        success: false,
        message: 'Sertifika bilgisi eklenirken hata oluştu',
      });
    }
  };

  public updateCertificate = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = certificateSchema.partial().parse(req.body);

      await this.userProfileService.updateCertificate(
        req.user!.userId,
        id,
        validatedData
      );

      res.json({
        success: true,
        message: 'Sertifika bilgisi başarıyla güncellendi',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to update certificate', error);
      res.status(500).json({
        success: false,
        message: 'Sertifika bilgisi güncellenirken hata oluştu',
      });
    }
  };

  public deleteCertificate = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      await this.userProfileService.deleteCertificate(req.user!.userId, id);

      res.json({
        success: true,
        message: 'Sertifika bilgisi başarıyla silindi',
      });
    } catch (error) {
      logger.error('Failed to delete certificate', error);
      res.status(500).json({
        success: false,
        message: 'Sertifika bilgisi silinirken hata oluştu',
      });
    }
  };

  // Hobby Methods
  public addHobby = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = hobbySchema.parse(req.body);

      const hobby = await this.userProfileService.addHobby(
        req.user!.userId,
        validatedData
      );

      res.status(201).json({
        success: true,
        message: 'Hobi bilgisi başarıyla eklendi',
        data: hobby,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to add hobby', error);
      res.status(500).json({
        success: false,
        message: 'Hobi bilgisi eklenirken hata oluştu',
      });
    }
  };

  public updateHobby = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = hobbySchema.partial().parse(req.body);

      await this.userProfileService.updateHobby(
        req.user!.userId,
        id,
        validatedData
      );

      res.json({
        success: true,
        message: 'Hobi bilgisi başarıyla güncellendi',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to update hobby', error);
      res.status(500).json({
        success: false,
        message: 'Hobi bilgisi güncellenirken hata oluştu',
      });
    }
  };

  public deleteHobby = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.userProfileService.deleteHobby(req.user!.userId, id);

      res.json({
        success: true,
        message: 'Hobi bilgisi başarıyla silindi',
      });
    } catch (error) {
      logger.error('Failed to delete hobby', error);
      res.status(500).json({
        success: false,
        message: 'Hobi bilgisi silinirken hata oluştu',
      });
    }
  };

  // Skill Methods
  public addSkill = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = flexibleSkillSchema.parse(req.body);
      
      // Check if it's single skill or multiple skills
      if ('skills' in validatedData) {
        // Multiple skills format
        const skills = await this.userProfileService.addBulkSkills(
          req.user!.userId,
          validatedData.skills
        );
        res.status(201).json({
          success: true,
          message: `${skills.length} yetenek bilgisi başarıyla eklendi`,
          data: skills,
        });
      } else {
        // Single skill format
        const skill = await this.userProfileService.addSkill(
          req.user!.userId,
          validatedData
        );
        res.status(201).json({
          success: true,
          message: 'Yetenek bilgisi başarıyla eklendi',
          data: skill,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to add skill(s)', error);
      res.status(500).json({
        success: false,
        message: 'Yetenek bilgisi eklenirken hata oluştu',
      });
    }
  };

  public updateSkill = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = skillSchema.partial().parse(req.body);

      await this.userProfileService.updateSkill(
        req.user!.userId,
        id,
        validatedData
      );

      res.json({
        success: true,
        message: 'Yetenek bilgisi başarıyla güncellendi',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Geçersiz veri',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }

      logger.error('Failed to update skill', error);
      res.status(500).json({
        success: false,
        message: 'Yetenek bilgisi güncellenirken hata oluştu',
      });
    }
  };

  public deleteSkill = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.userProfileService.deleteSkill(req.user!.userId, id);

      res.json({
        success: true,
        message: 'Yetenek bilgisi başarıyla silindi',
      });
    } catch (error) {
      logger.error('Failed to delete skill', error);
      res.status(500).json({
        success: false,
        message: 'Yetenek bilgisi silinirken hata oluştu',
      });
    }
  };
}
