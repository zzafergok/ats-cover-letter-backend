import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function extractCvContent(filePath: string): Promise<string> {
  const fileExtension = path.extname(filePath).toLowerCase();

  try {
    if (fileExtension === '.pdf') {
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      return pdfData.text;
    } else if (fileExtension === '.docx' || fileExtension === '.doc') {
      const docBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: docBuffer });
      return result.value;
    } else {
      throw new Error('Desteklenmeyen dosya formatı');
    }
  } catch (error) {
    console.error('Dosya okuma hatası:', error);
    throw new Error('Dosya içeriği okunamadı');
  }
}

export async function convertToMarkdown(text: string): Promise<string> {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let markdown = '';
  let currentSection = '';

  const sectionKeywords = {
    turkish: [
      'kişisel bilgiler',
      'iletişim',
      'özet',
      'profil',
      'hakkımda',
      'deneyim',
      'iş deneyimi',
      'çalışma deneyimi',
      'profesyonel deneyim',
      'eğitim',
      'öğrenim',
      'akademik',
      'üniversite',
      'okul',
      'beceriler',
      'yetenekler',
      'yetkinlikler',
      'teknolojiler',
      'projeler',
      'proje deneyimi',
      'kişisel projeler',
      'sertifikalar',
      'sertifika',
      'belgeler',
      'diller',
      'yabancı dil',
      'dil yetkinliği',
      'hobi',
      'ilgi alanları',
      'kişisel ilgiler',
      'referanslar',
      'referans',
      'tavsiye',
    ],
    english: [
      'personal information',
      'contact',
      'summary',
      'profile',
      'about me',
      'about',
      'experience',
      'work experience',
      'professional experience',
      'employment',
      'education',
      'academic',
      'university',
      'school',
      'degree',
      'skills',
      'technical skills',
      'competencies',
      'technologies',
      'projects',
      'project experience',
      'personal projects',
      'certifications',
      'certificates',
      'credentials',
      'languages',
      'language skills',
      'language proficiency',
      'hobbies',
      'interests',
      'personal interests',
      'references',
      'recommendation',
    ],
  };

  const allKeywords = [...sectionKeywords.turkish, ...sectionKeywords.english];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    const isSection = allKeywords.some(
      (keyword) => lowerLine.includes(keyword) && line.length < 50
    );

    if (isSection) {
      currentSection = line;
      markdown += `\n## ${line}\n\n`;
    } else if (line.includes('@') && line.includes('.')) {
      markdown += `**Email:** ${line}\n\n`;
    } else if (line.match(/^\+?[\d\s\-\(\)]+$/)) {
      markdown += `**Telefon:** ${line}\n\n`;
    } else if (line.match(/^\d{4}\s*-\s*\d{4}$/)) {
      markdown += `**Tarih:** ${line}\n\n`;
    } else if (line.match(/^\d{4}\s*-\s*(günümüz|present|halen)$/i)) {
      markdown += `**Tarih:** ${line}\n\n`;
    } else {
      if (currentSection) {
        markdown += `- ${line}\n`;
      } else {
        markdown += `${line}\n\n`;
      }
    }
  }

  return markdown.trim();
}

export function extractKeywords(text: string): {
  turkish: string[];
  english: string[];
} {
  const turkishKeywords: string[] = [];
  const englishKeywords: string[] = [];

  const commonTurkishWords = [
    'deneyim',
    'proje',
    'geliştirme',
    'yönetim',
    'analiz',
    'tasarım',
    'yazılım',
    'veritabanı',
    'web',
    'mobil',
    'sistem',
    'network',
    'satış',
    'pazarlama',
    'müşteri',
    'hizmet',
    'kalite',
    'süreç',
  ];

  const commonEnglishWords = [
    'experience',
    'project',
    'development',
    'management',
    'analysis',
    'design',
    'software',
    'database',
    'web',
    'mobile',
    'system',
    'network',
    'sales',
    'marketing',
    'customer',
    'service',
    'quality',
    'process',
  ];

  const words = text.toLowerCase().split(/\s+/);

  for (const word of words) {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length > 3) {
      if (commonTurkishWords.some((tw) => cleanWord.includes(tw))) {
        if (!turkishKeywords.includes(cleanWord)) {
          turkishKeywords.push(cleanWord);
        }
      }
      if (commonEnglishWords.some((ew) => cleanWord.includes(ew))) {
        if (!englishKeywords.includes(cleanWord)) {
          englishKeywords.push(cleanWord);
        }
      }
    }
  }

  return {
    turkish: turkishKeywords.slice(0, 20),
    english: englishKeywords.slice(0, 20),
  };
}
