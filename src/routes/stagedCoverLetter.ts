import { z } from 'zod';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

import { authenticateToken } from '../middleware/auth';

import { StagedCoverLetterService } from '../services/stagedCoverLetterService.service';

import logger from '../config/logger';

interface StagedCoverLetterListItem {
  id: string;
  positionTitle: string;
  companyName: string;
  experienceLevel: 'NEW_GRADUATE' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR';
  stage: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const router = express.Router();

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    uuid
  );
};

// Stage 1: Basic Information Schema
const basicCoverLetterSchema = z.object({
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  experienceLevel: z.enum(['NEW_GRADUATE', 'JUNIOR', 'MID_LEVEL', 'SENIOR']),
  keySkills: z
    .array(z.string())
    .min(2, 'En az 2 temel beceri gereklidir')
    .max(2, 'Maksimum 2 temel beceri girilebilir'),
});

// Stage 2: Enhancement Schema
const enhancementSchema = z.object({
  companyResearch: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  careerGoals: z.string().optional(),
  motivation: z.string().optional(),
});

// POST /api/v1/staged-cover-letter/basic
// Stage 1: Create basic cover letter with minimal information
router.post('/basic', authenticateToken, async (req, res) => {
  try {
    const validatedData = basicCoverLetterSchema.parse(req.body);
    const userId = req.user!.userId;
    const sessionId = uuidv4();

    const stagedCoverLetter =
      await StagedCoverLetterService.createBasicCoverLetter(
        userId,
        sessionId,
        validatedData
      );

    logger.info('Basic cover letter created', {
      id: stagedCoverLetter.id,
      userId,
      positionTitle: validatedData.positionTitle,
      companyName: validatedData.companyName,
    });

    return res.json({
      success: true,
      message: 'Temel cover letter oluşturuldu',
      data: {
        id: stagedCoverLetter.id,
        sessionId: stagedCoverLetter.sessionId,
        positionTitle: stagedCoverLetter.positionTitle,
        companyName: stagedCoverLetter.companyName,
        experienceLevel: stagedCoverLetter.experienceLevel,
        keySkills: stagedCoverLetter.keySkills,
        basicContent: stagedCoverLetter.basicContent,
        stage: stagedCoverLetter.stage,
        createdAt: stagedCoverLetter.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    logger.error('Basic cover letter creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Temel cover letter oluşturulurken hata oluştu',
    });
  }
});

// PUT /api/v1/staged-cover-letter/:id/enhance
// Stage 2: Enhance cover letter with additional information
router.put('/:id/enhance', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ID formatı',
      });
    }

    const userId = req.user!.userId;
    const enhancements = enhancementSchema.parse(req.body);

    const updatedCoverLetter =
      await StagedCoverLetterService.enhanceCoverLetter(
        id,
        userId,
        enhancements
      );

    logger.info('Cover letter enhanced', {
      id,
      userId,
      enhancementsProvided: Object.keys(enhancements).filter(
        (key) => enhancements[key as keyof typeof enhancements] !== undefined
      ),
    });

    return res.json({
      success: true,
      message: 'Cover letter geliştirildi',
      data: {
        id: updatedCoverLetter.id,
        positionTitle: updatedCoverLetter.positionTitle,
        companyName: updatedCoverLetter.companyName,
        experienceLevel: updatedCoverLetter.experienceLevel,
        keySkills: updatedCoverLetter.keySkills,
        companyResearch: updatedCoverLetter.companyResearch,
        achievements: updatedCoverLetter.achievements,
        careerGoals: updatedCoverLetter.careerGoals,
        motivation: updatedCoverLetter.motivation,
        basicContent: updatedCoverLetter.basicContent,
        enhancedContent: updatedCoverLetter.enhancedContent,
        stage: updatedCoverLetter.stage,
        updatedAt: updatedCoverLetter.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    logger.error('Cover letter enhancement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Cover letter geliştirilirken hata oluştu',
    });
  }
});

// GET /api/v1/staged-cover-letter/:id
// Get specific staged cover letter
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ID formatı',
      });
    }

    const userId = req.user!.userId;

    const stagedCoverLetter =
      await StagedCoverLetterService.getStagedCoverLetter(id, userId);

    return res.json({
      success: true,
      data: {
        id: stagedCoverLetter.id,
        sessionId: stagedCoverLetter.sessionId,
        positionTitle: stagedCoverLetter.positionTitle,
        companyName: stagedCoverLetter.companyName,
        experienceLevel: stagedCoverLetter.experienceLevel,
        keySkills: stagedCoverLetter.keySkills,
        companyResearch: stagedCoverLetter.companyResearch,
        achievements: stagedCoverLetter.achievements,
        careerGoals: stagedCoverLetter.careerGoals,
        motivation: stagedCoverLetter.motivation,
        basicContent: stagedCoverLetter.basicContent,
        enhancedContent: stagedCoverLetter.enhancedContent,
        stage: stagedCoverLetter.stage,
        isCompleted: stagedCoverLetter.isCompleted,
        createdAt: stagedCoverLetter.createdAt,
        updatedAt: stagedCoverLetter.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Get staged cover letter error:', error);
    return res.status(404).json({
      success: false,
      message: 'Staged cover letter bulunamadı',
    });
  }
});

// GET /api/v1/staged-cover-letter
// Get all user's staged cover letters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const stagedCoverLetters =
      await StagedCoverLetterService.getUserStagedCoverLetters(userId);

    const formattedData: StagedCoverLetterListItem[] = stagedCoverLetters.map(
      (scl) => ({
        id: scl.id,
        positionTitle: scl.positionTitle,
        companyName: scl.companyName,
        experienceLevel: scl.experienceLevel,
        stage: scl.stage,
        isCompleted: scl.isCompleted,
        createdAt: scl.createdAt.toISOString(),
        updatedAt: scl.updatedAt.toISOString(),
      })
    );

    return res.json({
      success: true,
      data: formattedData,
      count: stagedCoverLetters.length,
    });
  } catch (error) {
    logger.error('Get user staged cover letters error:', error);
    return res.status(500).json({
      success: false,
      message: 'Staged cover letter listesi alınırken hata oluştu',
    });
  }
});

// POST /api/v1/staged-cover-letter/:id/complete
// Complete staged process and create regular cover letter
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ID formatı',
      });
    }

    const userId = req.user!.userId;

    const result = await StagedCoverLetterService.completeStagedCoverLetter(
      id,
      userId
    );

    logger.info('Staged cover letter completed', {
      stagedId: id,
      coverLetterId: result.coverLetter.id,
      userId,
    });

    return res.json({
      success: true,
      message: 'Cover letter tamamlandı ve kaydedildi',
      data: {
        coverLetter: {
          id: result.coverLetter.id,
          title: result.coverLetter.title,
          content: result.coverLetter.content,
          positionTitle: result.coverLetter.positionTitle,
          companyName: result.coverLetter.companyName,
          createdAt: result.coverLetter.createdAt,
        },
        stagedCoverLetter: {
          id: result.stagedCoverLetter.id,
          stage: result.stagedCoverLetter.stage,
          isCompleted: result.stagedCoverLetter.isCompleted,
        },
      },
    });
  } catch (error) {
    logger.error('Complete staged cover letter error:', error);
    return res.status(500).json({
      success: false,
      message: 'Cover letter tamamlanırken hata oluştu',
    });
  }
});

// DELETE /api/v1/staged-cover-letter/:id
// Delete staged cover letter
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz ID formatı',
      });
    }

    const userId = req.user!.userId;

    await StagedCoverLetterService.deleteStagedCoverLetter(id, userId);

    logger.info('Staged cover letter deleted', { id, userId });

    return res.json({
      success: true,
      message: 'Staged cover letter silindi',
    });
  } catch (error) {
    logger.error('Delete staged cover letter error:', error);
    return res.status(500).json({
      success: false,
      message: 'Staged cover letter silinirken hata oluştu',
    });
  }
});

export default router;
