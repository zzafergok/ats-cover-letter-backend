import { Request, Response } from 'express';
import HighSchoolService from '../services/highSchool.service';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';

export class HighSchoolController {
  public static async getAllHighSchools(req: Request, res: Response): Promise<void> {
    try {
      const { limit } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : undefined;
      
      const highSchools = HighSchoolService.getAllHighSchools();
      const result = limitNum ? highSchools.slice(0, limitNum) : highSchools;
      
      sendSuccess(res, result, 'Liseler başarıyla getirildi');
    } catch (error) {
      logger.error('Error fetching all high schools:', error);
      sendError(res, 'Liseler getirilirken hata oluştu', 500);
    }
  }

  public static async searchHighSchools(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit } = req.query;
      
      if (!q || typeof q !== 'string') {
        sendError(res, 'Arama terimi gereklidir', 400);
        return;
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 50;
      const highSchools = HighSchoolService.searchHighSchools(q, limitNum);
      
      sendSuccess(res, highSchools, 'Arama başarıyla tamamlandı');
    } catch (error) {
      logger.error('Error searching high schools:', error);
      sendError(res, 'Arama sırasında hata oluştu', 500);
    }
  }

  public static async getHighSchoolsByCity(req: Request, res: Response): Promise<void> {
    try {
      const { city } = req.params;
      
      if (!city) {
        sendError(res, 'Şehir adı gereklidir', 400);
        return;
      }

      const highSchools = HighSchoolService.getHighSchoolsByCity(city);
      
      sendSuccess(res, highSchools, `${city} şehrindeki liseler başarıyla getirildi`);
    } catch (error) {
      logger.error('Error fetching high schools by city:', error);
      sendError(res, 'Şehir bazlı liseler getirilirken hata oluştu', 500);
    }
  }

  public static async getHighSchoolById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        sendError(res, 'Lise ID\'si gereklidir', 400);
        return;
      }

      const highSchool = HighSchoolService.getHighSchoolById(id);
      
      if (!highSchool) {
        sendError(res, 'Lise bulunamadı', 404);
        return;
      }

      sendSuccess(res, highSchool, 'Lise başarıyla getirildi');
    } catch (error) {
      logger.error('Error fetching high school by ID:', error);
      sendError(res, 'Lise getirilirken hata oluştu', 500);
    }
  }

  public static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = HighSchoolService.getStats();
      sendSuccess(res, stats, 'İstatistikler başarıyla getirildi');
    } catch (error) {
      logger.error('Error fetching high school stats:', error);
      sendError(res, 'İstatistikler getirilirken hata oluştu', 500);
    }
  }

  public static async reloadData(req: Request, res: Response): Promise<void> {
    try {
      HighSchoolService.reloadData();
      const stats = HighSchoolService.getStats();
      
      sendSuccess(res, stats, 'Veriler başarıyla yeniden yüklendi');
    } catch (error) {
      logger.error('Error reloading high school data:', error);
      sendError(res, 'Veriler yeniden yüklenirken hata oluştu', 500);
    }
  }
}

export default HighSchoolController;