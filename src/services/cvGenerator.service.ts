import { PrismaClient } from '@prisma/client';
import { CVTemplateBasicHRService, CVBasicHRData } from './cvTemplateBasicHR.service';
import { CVTemplateOfficeManagerService, CVOfficeManagerData } from './cvTemplateOfficeManager.service';
import { CVTemplateSimpleClassicService, CVSimpleClassicData } from './cvTemplateSimpleClassic.service';
import { CVTemplateStylishAccountingService, CVStylishAccountingData } from './cvTemplateStylishAccounting.service';
import { CVTemplateMinimalistTurkishService, CVMinimalistTurkishData } from './cvTemplateMinimalistTurkish.service';
import { UserLimitService } from './userLimit.service';
import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';

const prisma = new PrismaClient();

export type CVTemplateType = 
  | 'basic_hr'
  | 'office_manager'
  | 'simple_classic'
  | 'stylish_accounting'
  | 'minimalist_turkish';

export interface CVGenerationRequest {
  templateType: CVTemplateType;
  data: CVBasicHRData | CVOfficeManagerData | CVSimpleClassicData | CVStylishAccountingData | CVMinimalistTurkishData;
}

export interface CVGenerationResponse {
  id: string;
  templateType: string;
  generationStatus: string;
  pdfBuffer?: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

export class CVGeneratorService {
  private static instance: CVGeneratorService;
  private basicHRService: CVTemplateBasicHRService;
  private officeManagerService: CVTemplateOfficeManagerService;
  private simpleClassicService: CVTemplateSimpleClassicService;
  private stylishAccountingService: CVTemplateStylishAccountingService;
  private minimalistTurkishService: CVTemplateMinimalistTurkishService;

  private constructor() {
    this.basicHRService = CVTemplateBasicHRService.getInstance();
    this.officeManagerService = CVTemplateOfficeManagerService.getInstance();
    this.simpleClassicService = CVTemplateSimpleClassicService.getInstance();
    this.stylishAccountingService = CVTemplateStylishAccountingService.getInstance();
    this.minimalistTurkishService = CVTemplateMinimalistTurkishService.getInstance();
  }

  public static getInstance(): CVGeneratorService {
    if (!CVGeneratorService.instance) {
      CVGeneratorService.instance = new CVGeneratorService();
    }
    return CVGeneratorService.instance;
  }

  async generateCV(
    userId: string,
    userRole: string,
    request: CVGenerationRequest
  ): Promise<CVGenerationResponse> {
    try {
      // Kullanıcı limit kontrolü
      const currentCVCount = await prisma.generatedCv.count({
        where: { userId },
      });

      if (!UserLimitService.canCreateCV(userRole, currentCVCount)) {
        const limitInfo = UserLimitService.formatLimitInfo(
          userRole,
          currentCVCount,
          'generatedCvs'
        );
        throw new Error(
          `CV oluşturma limitine ulaştınız (${limitInfo.current}/${limitInfo.maximum})`
        );
      }

      // CV kaydını oluştur (başlangıçta PROCESSING durumda)
      const cvRecord = await prisma.generatedCv.create({
        data: {
          userId,
          templateType: request.templateType,
          templateData: JSON.stringify(request.data),
          generationStatus: 'PROCESSING',
        },
      });

      try {
        // PDF oluştur
        const pdfBuffer = await this.generatePDFByTemplate(
          request.templateType,
          request.data
        );

        // Database'i güncelle
        const updatedCV = await prisma.generatedCv.update({
          where: { id: cvRecord.id },
          data: {
            pdfData: pdfBuffer,
            generationStatus: 'COMPLETED',
            updatedAt: new Date(),
          },
        });

        return {
          id: updatedCV.id,
          templateType: updatedCV.templateType,
          generationStatus: updatedCV.generationStatus,
          pdfBuffer: pdfBuffer,
          createdAt: updatedCV.createdAt,
          updatedAt: updatedCV.updatedAt,
        };
      } catch (pdfError) {
        // PDF oluşturma hatası durumunda status'u güncelle
        await prisma.generatedCv.update({
          where: { id: cvRecord.id },
          data: {
            generationStatus: 'FAILED',
            updatedAt: new Date(),
          },
        });
        throw pdfError;
      }
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.CV.GENERATION_ERROR,
          error as Error
        )
      );
      throw error;
    }
  }

  async getCV(
    userId: string,
    cvId: string
  ): Promise<CVGenerationResponse | null> {
    const cv = await prisma.generatedCv.findFirst({
      where: {
        id: cvId,
        userId,
      },
    });

    if (!cv) {
      return null;
    }

    return {
      id: cv.id,
      templateType: cv.templateType,
      generationStatus: cv.generationStatus,
      pdfBuffer: cv.pdfData ? Buffer.from(cv.pdfData) : undefined,
      createdAt: cv.createdAt,
      updatedAt: cv.updatedAt,
    };
  }

  async getUserCVs(
    userId: string,
    userRole: string
  ): Promise<{ cvs: Omit<CVGenerationResponse, 'pdfBuffer'>[]; limitInfo: any }> {
    const cvs = await prisma.generatedCv.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        templateType: true,
        generationStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const limitInfo = UserLimitService.formatLimitInfo(
      userRole,
      cvs.length,
      'generatedCvs'
    );

    const formattedCVs = cvs.map((cv) => ({
      id: cv.id,
      templateType: cv.templateType,
      generationStatus: cv.generationStatus,
      createdAt: cv.createdAt,
      updatedAt: cv.updatedAt,
    }));

    return {
      cvs: formattedCVs,
      limitInfo,
    };
  }

  async deleteCV(userId: string, cvId: string): Promise<void> {
    const cv = await prisma.generatedCv.findFirst({
      where: {
        id: cvId,
        userId,
      },
    });

    if (!cv) {
      throw new Error(formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND));
    }

    await prisma.generatedCv.delete({
      where: { id: cvId },
    });
  }

  async regenerateCV(
    userId: string,
    cvId: string
  ): Promise<CVGenerationResponse> {
    const cv = await prisma.generatedCv.findFirst({
      where: {
        id: cvId,
        userId,
      },
    });

    if (!cv) {
      throw new Error(formatMessage(SERVICE_MESSAGES.CV.NOT_FOUND));
    }

    try {
      // Template data'yı parse et
      const templateData = JSON.parse(cv.templateData);

      // PDF'i yeniden oluştur
      const pdfBuffer = await this.generatePDFByTemplate(
        cv.templateType as CVTemplateType,
        templateData
      );

      // Database'i güncelle
      const updatedCV = await prisma.generatedCv.update({
        where: { id: cvId },
        data: {
          pdfData: pdfBuffer,
          generationStatus: 'COMPLETED',
          updatedAt: new Date(),
        },
      });

      return {
        id: updatedCV.id,
        templateType: updatedCV.templateType,
        generationStatus: updatedCV.generationStatus,
        pdfBuffer: pdfBuffer,
        createdAt: updatedCV.createdAt,
        updatedAt: updatedCV.updatedAt,
      };
    } catch (error) {
      // Hata durumunda status'u güncelle
      await prisma.generatedCv.update({
        where: { id: cvId },
        data: {
          generationStatus: 'FAILED',
          updatedAt: new Date(),
        },
      });
      throw error;
    }
  }

  private async generatePDFByTemplate(
    templateType: CVTemplateType,
    data: any
  ): Promise<Buffer> {
    switch (templateType) {
      case 'basic_hr':
        return await this.basicHRService.generatePDF(data as CVBasicHRData);
      
      case 'office_manager':
        return await this.officeManagerService.generatePDF(data as CVOfficeManagerData);
      
      case 'simple_classic':
        return await this.simpleClassicService.generatePDF(data as CVSimpleClassicData);
      
      case 'stylish_accounting':
        return await this.stylishAccountingService.generatePDF(data as CVStylishAccountingData);
      
      case 'minimalist_turkish':
        return await this.minimalistTurkishService.generatePDF(data as CVMinimalistTurkishData);
      
      default:
        throw new Error(`Unsupported template type: ${templateType}`);
    }
  }

  // Utility method to get available templates
  getAvailableTemplates(): { id: CVTemplateType; name: string; description: string }[] {
    return [
      {
        id: 'basic_hr',
        name: 'Basic HR Resume',
        description: 'Clean and professional HR-focused resume template'
      },
      {
        id: 'office_manager',
        name: 'Office Manager Resume',
        description: 'Modern template designed for office management positions'
      },
      {
        id: 'simple_classic',
        name: 'Simple Classic Resume',
        description: 'Classic design with green accents and clean layout'
      },
      {
        id: 'stylish_accounting',
        name: 'Stylish Accounting Resume',
        description: 'Professional template optimized for accounting and finance roles'
      },
      {
        id: 'minimalist_turkish',
        name: 'Minimalist Turkish Resume',
        description: 'Clean, minimalist Turkish resume template'
      }
    ];
  }

  // Helper method to validate template data
  validateTemplateData(templateType: CVTemplateType, data: any): boolean {
    // Basic validation - can be expanded based on requirements
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Template-specific validation
    switch (templateType) {
      case 'basic_hr':
        return this.validateBasicHRData(data);
      case 'office_manager':
        return this.validateOfficeManagerData(data);
      case 'simple_classic':
        return this.validateSimpleClassicData(data);
      case 'stylish_accounting':
        return this.validateStylishAccountingData(data);
      case 'minimalist_turkish':
        return this.validateMinimalistTurkishData(data);
      default:
        return false;
    }
  }

  private validateTemplateDataStructure(data: any): boolean {
    // Check required fields
    if (!data.personalInfo?.fullName || !data.personalInfo?.email) {
      return false;
    }

    // Validate version and language
    if (!data.version || !['global', 'turkey'].includes(data.version)) {
      return false;
    }

    if (!data.language || !['turkish', 'english'].includes(data.language)) {
      return false;
    }

    // Turkey version specific validation
    if (data.version === 'turkey') {
      // Validate technical skills
      if (data.technicalSkills) {
        const { frontend, backend, database, tools } = data.technicalSkills;
        if (frontend && !Array.isArray(frontend)) return false;
        if (backend && !Array.isArray(backend)) return false;
        if (database && !Array.isArray(database)) return false;
        if (tools && !Array.isArray(tools)) return false;
      }

      // Validate projects
      if (data.projects && !Array.isArray(data.projects)) {
        return false;
      }

      // Validate certificates
      if (data.certificates && !Array.isArray(data.certificates)) {
        return false;
      }

      // Validate languages
      if (data.languages && !Array.isArray(data.languages)) {
        return false;
      }
    }

    // Validate common arrays
    if (data.experience && !Array.isArray(data.experience)) {
      return false;
    }

    if (data.education && !Array.isArray(data.education)) {
      return false;
    }

    if (data.references && !Array.isArray(data.references)) {
      return false;
    }

    return true;
  }

  private validateBasicHRData(data: any): boolean {
    return this.validateTemplateDataStructure(data);
  }

  private validateOfficeManagerData(data: any): boolean {
    return this.validateTemplateDataStructure(data);
  }

  private validateSimpleClassicData(data: any): boolean {
    return this.validateTemplateDataStructure(data);
  }

  private validateStylishAccountingData(data: any): boolean {
    return this.validateTemplateDataStructure(data);
  }

  private validateMinimalistTurkishData(data: any): boolean {
    return this.validateTemplateDataStructure(data);
  }
}