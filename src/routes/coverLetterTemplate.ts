import { z } from 'zod';
import express from 'express';

import { validate } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';

import { CoverLetterTemplateService } from '../services/coverLetterTemplate.service';

const router = express.Router();
const templateService = CoverLetterTemplateService.getInstance();

const generateCoverLetterSchema = z.object({
  templateId: z.string().min(1, 'Template ID gereklidir'),
  companyName: z.string().min(1, 'Şirket adı gereklidir'),
  positionTitle: z.string().min(1, 'Pozisyon başlığı gereklidir'),
  applicantName: z.string().min(1, 'Başvuran adı gereklidir'),
  applicantEmail: z.string().email('Geçerli email adresi gereklidir'),
  contactPerson: z.string().optional(),
  specificSkills: z.array(z.string()).optional(),
  additionalInfo: z.string().optional(),
});

const createTemplateSchema = z.object({
  category: z.string().min(1, 'Kategori gereklidir'),
  title: z.string().min(1, 'Başlık gereklidir'),
  content: z.string().min(1, 'İçerik gereklidir'),
  placeholders: z.array(z.string()),
});

// Tüm template'leri getir
router.get('/templates', async (req, res) => {
  try {
    const templates = await templateService.getAllTemplates();

    const formattedTemplates = templates.map((template) => ({
      id: template.id,
      category: template.category,
      title: template.title,
      placeholders: template.placeholders,
      preview: template.content.substring(0, 200) + '...',
    }));

    res.json({
      success: true,
      data: formattedTemplates,
    });
  } catch (error) {
    console.error('Template listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Template listesi alınırken hata oluştu',
    });
  }
});

// Kategoriye göre template'leri getir
router.get('/templates/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const templates = await templateService.getTemplatesByCategory(category);

    const formattedTemplates = templates.map((template) => ({
      id: template.id,
      category: template.category,
      title: template.title,
      placeholders: template.placeholders,
      preview: template.content.substring(0, 200) + '...',
    }));

    res.json({
      success: true,
      data: formattedTemplates,
    });
  } catch (error) {
    console.error('Kategori template getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: "Kategori template'leri alınırken hata oluştu",
    });
  }
});

// Belirli template detayını getir
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await templateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template bulunamadı',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Template detay getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Template detayı alınırken hata oluştu',
    });
  }
});

// Cover letter oluştur
router.post(
  '/generate',
  authenticateToken,
  validate(generateCoverLetterSchema),
  async (req, res) => {
    try {
      const data = req.body;

      const template = await templateService.getTemplateById(data.templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template bulunamadı',
        });
      }

      const generatedContent = templateService.generateCoverLetter(
        template,
        data
      );

      res.json({
        success: true,
        message: 'Cover letter başarıyla oluşturuldu',
        data: {
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
          },
        },
      });
    } catch (error) {
      console.error('Cover letter oluşturma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Cover letter oluşturulurken hata oluştu',
      });
    }
  }
);

// Admin: Yeni template oluştur
router.post(
  '/templates',
  authenticateToken,
  requireAdmin,
  validate(createTemplateSchema),
  async (req, res) => {
    try {
      const { category, title, content, placeholders } = req.body;

      const newTemplate = await templateService.createTemplate({
        category,
        title,
        content,
        placeholders,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        message: 'Template başarıyla oluşturuldu',
        data: newTemplate,
      });
    } catch (error) {
      console.error('Template oluşturma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Template oluşturulurken hata oluştu',
      });
    }
  }
);

// Admin: Template güncelle
router.put(
  '/templates/:id',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const existingTemplate = await templateService.getTemplateById(id);
      if (!existingTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Template bulunamadı',
        });
      }

      const updatedTemplate = await templateService.updateTemplate(
        id,
        updateData
      );

      res.json({
        success: true,
        message: 'Template başarıyla güncellendi',
        data: updatedTemplate,
      });
    } catch (error) {
      console.error('Template güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Template güncellenirken hata oluştu',
      });
    }
  }
);

// Admin: Template deaktif et
router.delete(
  '/templates/:id',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingTemplate = await templateService.getTemplateById(id);
      if (!existingTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Template bulunamadı',
        });
      }

      await templateService.deactivateTemplate(id);

      res.json({
        success: true,
        message: 'Template başarıyla deaktif edildi',
      });
    } catch (error) {
      console.error('Template deaktif etme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Template deaktif edilirken hata oluştu',
      });
    }
  }
);

// Mevcut kategorileri listele
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { key: 'WEB_DEVELOPER', label: 'Web Developer', count: 0 },
      { key: 'ACCOUNT_EXECUTIVE', label: 'Account Executive', count: 0 },
      { key: 'ACCOUNT_MANAGER', label: 'Account Manager', count: 0 },
      { key: 'ACCOUNTING_MANAGER', label: 'Accounting Manager', count: 0 },
      { key: 'DATA_ANALYST', label: 'Data Analyst', count: 0 },
      { key: 'PROJECT_MANAGER', label: 'Project Manager', count: 0 },
      { key: 'MARKETING_SPECIALIST', label: 'Marketing Specialist', count: 0 },
      { key: 'BUSINESS_ANALYST', label: 'Business Analyst', count: 0 },
      { key: 'SOFTWARE_ENGINEER', label: 'Software Engineer', count: 0 },
      { key: 'GENERAL', label: 'Genel', count: 0 },
    ];

    // Her kategori için template sayısını al
    for (const category of categories) {
      const templates = await templateService.getTemplatesByCategory(
        category.key
      );
      category.count = templates.length;
    }

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Kategori listesi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kategori listesi alınırken hata oluştu',
    });
  }
});

export default router;
