import { Request, Response } from 'express';
import UniversityService from '../services/university.service';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';

export class UniversityController {
  public static async getAllUniversities(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : undefined;
      
      const universities = await UniversityService.getAllUniversities();
      const result = limitNum ? universities.slice(0, limitNum) : universities;
      
      sendSuccess(res, result, 'Üniversiteler başarıyla getirildi');
    } catch (error) {
      logger.error('Error fetching all universities:', error);
      sendError(res, 'Üniversiteler getirilirken hata oluştu', 500);
    }
  }

  public static async searchUniversities(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit } = req.query;
      
      if (!q || typeof q !== 'string') {
        sendError(res, 'Arama terimi gereklidir', 400);
        return;
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 50;
      const universities = await UniversityService.searchUniversities(q, limitNum);
      
      sendSuccess(res, universities, 'Arama başarıyla tamamlandı');
    } catch (error) {
      logger.error('Error searching universities:', error);
      sendError(res, 'Arama sırasında hata oluştu', 500);
    }
  }

  public static async getUniversitiesByCity(req: Request, res: Response): Promise<void> {
    try {
      const { city } = req.params;
      
      if (!city) {
        sendError(res, 'Şehir adı gereklidir', 400);
        return;
      }

      const universities = await UniversityService.getUniversitiesByCity(city);
      
      sendSuccess(res, universities, `${city} şehrindeki üniversiteler başarıyla getirildi`);
    } catch (error) {
      logger.error('Error fetching universities by city:', error);
      sendError(res, 'Şehir bazlı üniversiteler getirilirken hata oluştu', 500);
    }
  }

  public static async getUniversitiesByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      
      if (!type || !['STATE', 'PRIVATE', 'FOUNDATION'].includes(type.toUpperCase())) {
        sendError(res, 'Geçerli bir üniversite türü gereklidir (STATE, PRIVATE, FOUNDATION)', 400);
        return;
      }

      const universities = await UniversityService.getUniversitiesByType(type.toUpperCase() as 'STATE' | 'PRIVATE' | 'FOUNDATION');
      
      sendSuccess(res, universities, `${type} türündeki üniversiteler başarıyla getirildi`);
    } catch (error) {
      logger.error('Error fetching universities by type:', error);
      sendError(res, 'Tür bazlı üniversiteler getirilirken hata oluştu', 500);
    }
  }

  public static async getUniversityById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        sendError(res, 'Üniversite ID\'si gereklidir', 400);
        return;
      }

      const university = await UniversityService.getUniversityById(id);
      
      if (!university) {
        sendError(res, 'Üniversite bulunamadı', 404);
        return;
      }

      sendSuccess(res, university, 'Üniversite başarıyla getirildi');
    } catch (error) {
      logger.error('Error fetching university by ID:', error);
      sendError(res, 'Üniversite getirilirken hata oluştu', 500);
    }
  }

  public static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await UniversityService.getStats();
      sendSuccess(res, stats, 'İstatistikler başarıyla getirildi');
    } catch (error) {
      logger.error('Error fetching university stats:', error);
      sendError(res, 'İstatistikler getirilirken hata oluştu', 500);
    }
  }

  public static async forceRefresh(req: Request, res: Response): Promise<void> {
    try {
      await UniversityService.forceRefresh();
      const stats = await UniversityService.getStats();
      
      sendSuccess(res, stats, 'Veriler başarıyla yeniden yüklendi');
    } catch (error) {
      logger.error('Error refreshing university data:', error);
      sendError(res, 'Veriler yeniden yüklenirken hata oluştu', 500);
    }
  }
}

export default UniversityController;