import fs from 'fs';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import {
  extractSections,
  extractKeywords,
  extractCvContent,
  convertToMarkdown,
  cleanAndNormalizeText,
  generateDocumentMetadata,
  extractContactInformation,
} from '../services/cvUpload.service';
import { FileCompressionService } from '../services/fileCompression.service';
import { UserLimitService } from '../services/userLimit.service';
import logger from '../config/logger';

export class CvUploadController {
  private prisma = new PrismaClient();
  private fileCompressionService = FileCompressionService.getInstance();
  private userLimitService = UserLimitService.getInstance();

  /**
   * CV dosyası yükle ve işle (Cover Letter için)
   */
  public uploadCv = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'Dosya yüklenmedi',
        });
        return;
      }

      const userId = req.user!.userId;

      // Kullanıcı limit kontrolü
      const limitResult = await this.userLimitService.checkCvUploadLimit(userId);
      if (!limitResult.allowed) {
        // Yüklenen dosyayı sil
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(429).json({
          success: false,
          message: limitResult.message,
        });
        return;
      }

      logger.info('CV upload started', {
        userId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      });

      // Dosya compression
      const compressedFileData = await this.fileCompressionService.compressFile(req.file.buffer);
      const compressionRatio = req.file.size > 0 ? compressedFileData.length / req.file.size : 0;

      // Database'e upload kaydı oluştur
      const cvUpload = await this.prisma.cvUpload.create({
        data: {
          userId,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          filePath: req.file.path,
          processingStatus: 'PENDING',
          fileData: compressedFileData,
          originalSize: req.file.size,
          compressedSize: compressedFileData.length,
          compressionRatio,
        },
      });

      // Background'da CV'yi işle
      this.processCvInBackground(cvUpload.id, req.file.path)
        .catch(error => {
          logger.error('Background CV processing failed', { 
            cvUploadId: cvUpload.id, 
            error: error.message 
          });
        });

      res.status(201).json({
        success: true,
        message: 'CV başarıyla yüklendi',
        data: {
          id: cvUpload.id,
          fileName: cvUpload.originalName,
          processingStatus: cvUpload.processingStatus,
          uploadDate: cvUpload.uploadDate,
        },
      });

    } catch (error: any) {
      logger.error('CV upload failed', {
        userId: req.user?.userId,
        error: error.message,
      });

      // Yüklenen dosyayı temizle
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          logger.error('Failed to cleanup uploaded file', { error: unlinkError });
        }
      }

      res.status(500).json({
        success: false,
        message: 'CV yükleme başarısız: ' + error.message,
      });
    }
  };

  /**
   * Kullanıcının CV upload'larını getir
   */
  public getCvUploads = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const cvUploads = await this.prisma.cvUpload.findMany({
        where: { userId },
        select: {
          id: true,
          originalName: true,
          processingStatus: true,
          uploadDate: true,
          originalSize: true,
          compressedSize: true,
        },
        orderBy: { uploadDate: 'desc' },
      });

      res.json({
        success: true,
        data: cvUploads,
      });

    } catch (error: any) {
      logger.error('Failed to get CV uploads', {
        userId: req.user?.userId,
        error: error.message,
      });

      res.status(500).json({
        success: false,
        message: 'CV listesi alınamadı: ' + error.message,
      });
    }
  };

  /**
   * CV upload durumunu getir
   */
  public getCvUploadStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const cvUpload = await this.prisma.cvUpload.findFirst({
        where: { id, userId },
        select: {
          id: true,
          originalName: true,
          processingStatus: true,
          uploadDate: true,
          extractedData: true,
        },
      });

      if (!cvUpload) {
        res.status(404).json({
          success: false,
          message: 'CV bulunamadı',
        });
        return;
      }

      res.json({
        success: true,
        data: cvUpload,
      });

    } catch (error: any) {
      logger.error('Failed to get CV upload status', {
        uploadId: req.params.id,
        error: error.message,
      });

      res.status(500).json({
        success: false,
        message: 'CV durumu alınamadı: ' + error.message,
      });
    }
  };

  /**
   * CV upload'ı sil
   */
  public deleteCvUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const cvUpload = await this.prisma.cvUpload.findFirst({
        where: { id, userId },
      });

      if (!cvUpload) {
        res.status(404).json({
          success: false,
          message: 'CV bulunamadı',
        });
        return;
      }

      // Dosyayı sil
      if (cvUpload.filePath && fs.existsSync(cvUpload.filePath)) {
        fs.unlinkSync(cvUpload.filePath);
      }

      // Database'den sil
      await this.prisma.cvUpload.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'CV başarıyla silindi',
      });

    } catch (error: any) {
      logger.error('Failed to delete CV upload', {
        uploadId: req.params.id,
        error: error.message,
      });

      res.status(500).json({
        success: false,
        message: 'CV silinemedi: ' + error.message,
      });
    }
  };

  /**
   * Background'da CV'yi işle
   */
  private async processCvInBackground(cvUploadId: string, filePath: string): Promise<void> {
    try {
      logger.info('Starting CV processing', { cvUploadId });

      // CV içeriğini extract et
      const extractedText = await extractCvContent(filePath);
      const markdownContent = convertToMarkdown(extractedText);
      const cleanedText = cleanAndNormalizeText(extractedText);

      // CV bölümlerini analiz et
      const sections = extractSections(cleanedText);
      const keywords = extractKeywords(cleanedText);
      const contactInfo = extractContactInformation(cleanedText);
      const metadata = generateDocumentMetadata(cleanedText);

      const extractedData = {
        sections,
        keywords,
        contactInfo,
        metadata,
        personalInfo: contactInfo,
        summary: sections.summary || '',
        experience: sections.experience || [],
        education: sections.education || [],
        skills: sections.skills || [],
        languages: sections.languages || [],
        certifications: sections.certifications || [],
      };

      // Database'i güncelle
      await this.prisma.cvUpload.update({
        where: { id: cvUploadId },
        data: {
          extractedText,
          markdownContent,
          extractedData,
          processingStatus: 'COMPLETED',
        },
      });

      logger.info('CV processing completed', { cvUploadId });

    } catch (error: any) {
      logger.error('CV processing failed', {
        cvUploadId,
        error: error.message,
      });

      // Hata durumunu database'e kaydet
      await this.prisma.cvUpload.update({
        where: { id: cvUploadId },
        data: {
          processingStatus: 'FAILED',
        },
      }).catch(updateError => {
        logger.error('Failed to update processing status', { updateError });
      });
    }
  }
}