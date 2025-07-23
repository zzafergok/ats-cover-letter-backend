import { Request, Response } from 'express';
import LocationService from '../services/location.service';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';

export class LocationController {
  public static async getAllProvinces(req: Request, res: Response): Promise<void> {
    try {
      const provinces = LocationService.getAllProvinces();
      sendSuccess(res, provinces, 'İller başarıyla getirildi');
    } catch (error) {
      logger.error('Error fetching all provinces:', error);
      sendError(res, 'İller getirilirken hata oluştu', 500);
    }
  }

  public static async getProvinceByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      
      if (!code) {
        sendError(res, 'İl kodu gereklidir', 400);
        return;
      }

      const province = LocationService.getProvinceByCode(code);
      
      if (!province) {
        sendError(res, 'İl bulunamadı', 404);
        return;
      }

      sendSuccess(res, province, 'İl başarıyla getirildi');
    } catch (error) {
      logger.error('Error fetching province by code:', error);
      sendError(res, 'İl getirilirken hata oluştu', 500);
    }
  }

  public static async getProvinceByName(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      
      if (!name) {
        sendError(res, 'İl adı gereklidir', 400);
        return;
      }

      const province = LocationService.getProvinceByName(decodeURIComponent(name));
      
      if (!province) {
        sendError(res, 'İl bulunamadı', 404);
        return;
      }

      sendSuccess(res, province, 'İl başarıyla getirildi');
    } catch (error) {
      logger.error('Error fetching province by name:', error);
      sendError(res, 'İl getirilirken hata oluştu', 500);
    }
  }

  public static async getDistrictsByProvinceCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;
      
      if (!code) {
        sendError(res, 'İl kodu gereklidir', 400);
        return;
      }

      const districts = LocationService.getDistrictsByProvinceCode(code);
      
      sendSuccess(res, districts, `${code} kodlu ilin ilçeleri başarıyla getirildi`);
    } catch (error) {
      logger.error('Error fetching districts by province code:', error);
      sendError(res, 'İlçeler getirilirken hata oluştu', 500);
    }
  }

  public static async getDistrictsByProvinceName(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      
      if (!name) {
        sendError(res, 'İl adı gereklidir', 400);
        return;
      }

      const districts = LocationService.getDistrictsByProvinceName(decodeURIComponent(name));
      
      sendSuccess(res, districts, `${name} ilinin ilçeleri başarıyla getirildi`);
    } catch (error) {
      logger.error('Error fetching districts by province name:', error);
      sendError(res, 'İlçeler getirilirken hata oluştu', 500);
    }
  }

  public static async searchProvinces(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        sendError(res, 'Arama terimi gereklidir', 400);
        return;
      }

      const provinces = LocationService.searchProvinces(q);
      
      sendSuccess(res, provinces, 'İl araması başarıyla tamamlandı');
    } catch (error) {
      logger.error('Error searching provinces:', error);
      sendError(res, 'İl aramasında hata oluştu', 500);
    }
  }

  public static async searchDistricts(req: Request, res: Response): Promise<void> {
    try {
      const { q, provinceCode } = req.query;
      
      if (!q || typeof q !== 'string') {
        sendError(res, 'Arama terimi gereklidir', 400);
        return;
      }

      const districts = LocationService.searchDistricts(
        q, 
        provinceCode ? provinceCode as string : undefined
      );
      
      sendSuccess(res, districts, 'İlçe araması başarıyla tamamlandı');
    } catch (error) {
      logger.error('Error searching districts:', error);
      sendError(res, 'İlçe aramasında hata oluştu', 500);
    }
  }

  public static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = LocationService.getStats();
      sendSuccess(res, stats, 'İstatistikler başarıyla getirildi');
    } catch (error) {
      logger.error('Error fetching location stats:', error);
      sendError(res, 'İstatistikler getirilirken hata oluştu', 500);
    }
  }
}

export default LocationController;