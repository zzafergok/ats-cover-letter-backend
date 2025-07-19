import { Request, Response } from 'express';

import {
  GenerateCoverLetterData,
  CoverLetterTemplateService,
} from '../services/coverLetterTemplate.service';
import {
  sendError,
  sendSuccess,
  sendNotFound,
  sendServerError,
} from '../utils/response';

export class CoverLetterTemplateController {
  private templateService = CoverLetterTemplateService.getInstance();

  public getAllTemplates = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const templates = await this.templateService.getAllTemplates();

      const formattedTemplates = templates.map((template) => ({
        id: template.id,
        category: template.category,
        title: template.title,
        placeholders: template.placeholders,
        preview: template.content.substring(0, 200) + '...',
        createdAt: template.createdAt,
      }));

      sendSuccess(
        res,
        formattedTemplates,
        'Template listesi başarıyla getirildi'
      );
    } catch (error) {
      console.error('Template listesi getirme hatası:', error);
      sendServerError(
        res,
        'TEMPLATE_001: Template listesi alınırken hata oluştu'
      );
    }
  };

  public getTemplatesByCategory = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { category } = req.params;

      if (!category) {
        sendError(res, 'TEMPLATE_002: Kategori parametresi gereklidir', 400);
        return;
      }

      const templates =
        await this.templateService.getTemplatesByCategory(category);

      const formattedTemplates = templates.map((template) => ({
        id: template.id,
        category: template.category,
        title: template.title,
        placeholders: template.placeholders,
        preview: template.content.substring(0, 200) + '...',
      }));

      sendSuccess(
        res,
        formattedTemplates,
        `${category} kategorisi template'leri başarıyla getirildi`
      );
    } catch (error) {
      console.error('Kategori template getirme hatası:', error);
      sendServerError(
        res,
        "TEMPLATE_003: Kategori template'leri alınırken hata oluştu"
      );
    }
  };

  public getTemplateById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        sendError(res, 'TEMPLATE_004: Template ID gereklidir', 400);
        return;
      }

      const template = await this.templateService.getTemplateById(id);

      if (!template) {
        sendNotFound(res, 'TEMPLATE_005: Template bulunamadı');
        return;
      }

      sendSuccess(res, template, 'Template detayı başarıyla getirildi');
    } catch (error) {
      console.error('Template detay getirme hatası:', error);
      sendServerError(
        res,
        'TEMPLATE_006: Template detayı alınırken hata oluştu'
      );
    }
  };

  public generateCoverLetter = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const data: GenerateCoverLetterData = req.body;

      // Template var mı kontrol et
      const template = await this.templateService.getTemplateById(
        data.templateId
      );
      if (!template) {
        sendNotFound(res, 'TEMPLATE_007: Belirtilen template bulunamadı');
        return;
      }

      // Cover letter oluştur
      const generatedContent = this.templateService.generateCoverLetter(
        template,
        data
      );

      const responseData = {
        content: generatedContent,
        templateUsed: {
          id: template.id,
          title: template.title,
          category: template.category,
        },
        generatedFor: {
          companyName: data.companyName,
          positionTitle: data.positionTitle,
          applicantName: data.applicantName,
          contactPerson: data.contactPerson || 'İnsan Kaynakları Uzmanı',
        },
        generatedAt: new Date().toISOString(),
        statistics: {
          wordCount: generatedContent.split(/\s+/).length,
          characterCount: generatedContent.length,
          estimatedReadingTime: Math.ceil(
            generatedContent.split(/\s+/).length / 200
          ), // dakika
        },
      };

      sendSuccess(res, responseData, 'Cover letter başarıyla oluşturuldu');
    } catch (error) {
      console.error('Cover letter oluşturma hatası:', error);
      sendServerError(
        res,
        'TEMPLATE_008: Cover letter oluşturulurken hata oluştu'
      );
    }
  };

  public createTemplate = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { category, title, content, placeholders } = req.body;

      // Aynı başlıkta template var mı kontrol et
      const existingTemplates = await this.templateService.getAllTemplates();
      const titleExists = existingTemplates.some(
        (t) => t.title.toLowerCase() === title.toLowerCase()
      );

      if (titleExists) {
        sendError(
          res,
          'TEMPLATE_009: Bu başlıkta bir template zaten mevcut',
          400
        );
        return;
      }

      const newTemplate = await this.templateService.createTemplate({
        category,
        title,
        content,
        placeholders,
        isActive: true,
      });

      sendSuccess(res, newTemplate, 'Template başarıyla oluşturuldu');
    } catch (error) {
      console.error('Template oluşturma hatası:', error);
      sendServerError(res, 'TEMPLATE_010: Template oluşturulurken hata oluştu');
    }
  };

  public updateTemplate = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Template var mı kontrol et
      const existingTemplate = await this.templateService.getTemplateById(id);
      if (!existingTemplate) {
        sendNotFound(res, 'TEMPLATE_011: Güncellenecek template bulunamadı');
        return;
      }

      // Başlık değişikliği varsa çakışma kontrolü
      if (updateData.title && updateData.title !== existingTemplate.title) {
        const allTemplates = await this.templateService.getAllTemplates();
        const titleExists = allTemplates.some(
          (t) =>
            t.id !== id &&
            t.title.toLowerCase() === updateData.title.toLowerCase()
        );

        if (titleExists) {
          sendError(
            res,
            'TEMPLATE_012: Bu başlıkta başka bir template zaten mevcut',
            400
          );
          return;
        }
      }

      const updatedTemplate = await this.templateService.updateTemplate(
        id,
        updateData
      );

      sendSuccess(res, updatedTemplate, 'Template başarıyla güncellendi');
    } catch (error) {
      console.error('Template güncelleme hatası:', error);
      sendServerError(res, 'TEMPLATE_013: Template güncellenirken hata oluştu');
    }
  };

  public deactivateTemplate = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;

      // Template var mı kontrol et
      const existingTemplate = await this.templateService.getTemplateById(id);
      if (!existingTemplate) {
        sendNotFound(res, 'TEMPLATE_014: Deaktif edilecek template bulunamadı');
        return;
      }

      await this.templateService.deactivateTemplate(id);

      sendSuccess(res, null, 'Template başarıyla deaktif edildi');
    } catch (error) {
      console.error('Template deaktif etme hatası:', error);
      sendServerError(
        res,
        'TEMPLATE_015: Template deaktif edilirken hata oluştu'
      );
    }
  };

  public getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = [
        {
          key: 'WEB_DEVELOPER',
          label: 'Web Developer',
          description: 'Frontend ve Backend geliştiriciler için',
        },
        {
          key: 'ACCOUNT_EXECUTIVE',
          label: 'Account Executive',
          description: 'Satış temsilcileri ve account yöneticileri için',
        },
        {
          key: 'ACCOUNT_MANAGER',
          label: 'Account Manager',
          description: 'Müşteri hesap yöneticileri için',
        },
        {
          key: 'ACCOUNTING_MANAGER',
          label: 'Accounting Manager',
          description: 'Muhasebe ve finans yöneticileri için',
        },
        {
          key: 'DATA_ANALYST',
          label: 'Data Analyst',
          description: 'Veri analisti ve bilim insanları için',
        },
        {
          key: 'PROJECT_MANAGER',
          label: 'Project Manager',
          description: 'Proje yöneticileri ve koordinatörleri için',
        },
        {
          key: 'MARKETING_SPECIALIST',
          label: 'Marketing Specialist',
          description: 'Pazarlama uzmanları için',
        },
        {
          key: 'BUSINESS_ANALYST',
          label: 'Business Analyst',
          description: 'İş analisti ve süreç uzmanları için',
        },
        {
          key: 'SOFTWARE_ENGINEER',
          label: 'Software Engineer',
          description: 'Yazılım mühendisleri için',
        },
        {
          key: 'GENERAL',
          label: 'Genel',
          description: 'Tüm pozisyonlar için genel template',
        },
      ];

      // Her kategori için template sayısını al
      for (const category of categories) {
        const templates = await this.templateService.getTemplatesByCategory(
          category.key
        );
        (category as any).templateCount = templates.length;
      }

      sendSuccess(res, categories, 'Kategori listesi başarıyla getirildi');
    } catch (error) {
      console.error('Kategori listesi getirme hatası:', error);
      sendServerError(
        res,
        'TEMPLATE_016: Kategori listesi alınırken hata oluştu'
      );
    }
  };

  public getTemplateStatistics = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const allTemplates = await this.templateService.getAllTemplates();

      // Kategori bazında istatistikler
      const categoryStats = allTemplates.reduce((acc: any, template) => {
        acc[template.category] = (acc[template.category] || 0) + 1;
        return acc;
      }, {});

      const statistics = {
        totalTemplates: allTemplates.length,
        categoryBreakdown: categoryStats,
        averagePlaceholders:
          allTemplates.reduce(
            (acc, template) => acc + template.placeholders.length,
            0
          ) / allTemplates.length,
        mostUsedCategory: Object.entries(categoryStats).reduce(
          (a: any, b: any) =>
            categoryStats[a[0]] > categoryStats[b[0]] ? a : b
        )[0],
        recentlyAdded: allTemplates
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5)
          .map((t) => ({ id: t.id, title: t.title, category: t.category })),
      };

      sendSuccess(
        res,
        statistics,
        'Template istatistikleri başarıyla getirildi'
      );
    } catch (error) {
      console.error('Template istatistikleri getirme hatası:', error);
      sendServerError(
        res,
        'TEMPLATE_017: Template istatistikleri alınırken hata oluştu'
      );
    }
  };
}
