// src/services/cvService.service.ts - Güncellenmiş hali
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function extractCvContent(filePath: string): Promise<string> {
  const fileExtension = path.extname(filePath).toLowerCase();

  try {
    // Dosya varlığı kontrolü
    if (!fs.existsSync(filePath)) {
      throw new Error('Dosya bulunamadı');
    }

    // Dosya boyutu kontrolü
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error('Dosya boş');
    }

    if (fileExtension === '.pdf') {
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(pdfBuffer);

      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new Error('PDF dosyasından metin çıkarılamadı');
      }

      return pdfData.text;
    } else if (fileExtension === '.docx' || fileExtension === '.doc') {
      const docBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: docBuffer });

      if (!result.value || result.value.trim().length === 0) {
        throw new Error('Word dosyasından metin çıkarılamadı');
      }

      return result.value;
    } else if (fileExtension === '.txt') {
      const textContent = fs.readFileSync(filePath, 'utf-8');

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('Metin dosyası boş');
      }

      return textContent;
    } else {
      throw new Error('Desteklenmeyen dosya formatı');
    }
  } catch (error) {
    console.error('Dosya okuma hatası:', error);
    throw new Error(
      `Dosya içeriği okunamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    );
  }
}

export function cleanAndNormalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .replace(/^\s+|\s+$/gm, '')
    .trim();
}

export function extractContactInformation(text: string): {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  linkedin?: string;
  website?: string;
} {
  const contact: any = {};

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex =
    /(\+90|0)?[\s\-()]?[0-9]{3}[\s\-()]?[0-9]{3}[\s\-()]?[0-9]{2}[\s\-()]?[0-9]{2}/;
  const linkedinRegex = /(linkedin\.com\/in\/[A-Za-z0-9-_]+)/;
  const websiteRegex = /(https?:\/\/[^\s]+)/;
  const nameRegex = /^[A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+\s+[A-ZÇĞIİÖŞÜ][a-zçğıiöşü]+/m;

  const emailMatch = text.match(emailRegex);
  if (emailMatch) contact.email = emailMatch[0];

  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) contact.phone = phoneMatch[0];

  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch) contact.linkedin = linkedinMatch[0];

  const websiteMatch = text.match(websiteRegex);
  if (websiteMatch) contact.website = websiteMatch[0];

  const nameMatch = text.match(nameRegex);
  if (nameMatch) contact.name = nameMatch[0];

  return contact;
}

export function extractSections(text: string): Array<{
  title: string;
  content: string[];
  startIndex: number;
  endIndex: number;
}> {
  const lines = text.split('\n');
  const sections: any[] = [];

  const sectionKeywords = [
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
    'personal information',
    'contact',
    'summary',
    'profile',
    'about me',
    'experience',
    'work experience',
    'professional experience',
    'education',
    'academic',
    'university',
    'school',
    'skills',
    'technical skills',
    'competencies',
    'projects',
    'project experience',
    'personal projects',
    'certifications',
    'certificates',
    'credentials',
    'languages',
    'language skills',
    'references',
  ];

  let currentSection: any = null;

  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase().trim();

    const isSection = sectionKeywords.some(
      (keyword) => lowerLine.includes(keyword) && line.length < 80
    );

    if (isSection) {
      if (currentSection) {
        currentSection.endIndex = index - 1;
        sections.push(currentSection);
      }

      currentSection = {
        title: line.trim(),
        content: [],
        startIndex: index,
        endIndex: index,
      };
    } else if (currentSection && line.trim()) {
      currentSection.content.push(line.trim());
    }
  });

  if (currentSection) {
    currentSection.endIndex = lines.length - 1;
    sections.push(currentSection);
  }

  return sections;
}

export async function convertToMarkdown(text: string): Promise<string> {
  const cleanedText = cleanAndNormalizeText(text);
  const contactInfo = extractContactInformation(cleanedText);
  const sections = extractSections(cleanedText);

  let markdown = '';

  if (contactInfo.name) {
    markdown += `# ${contactInfo.name}\n\n`;
  }

  markdown += `## İletişim Bilgileri\n`;
  if (contactInfo.email) markdown += `**Email:** ${contactInfo.email}\n`;
  if (contactInfo.phone) markdown += `**Telefon:** ${contactInfo.phone}\n`;
  if (contactInfo.linkedin)
    markdown += `**LinkedIn:** ${contactInfo.linkedin}\n`;
  if (contactInfo.website) markdown += `**Website:** ${contactInfo.website}\n`;
  markdown += '\n';

  sections.forEach((section) => {
    markdown += `## ${section.title}\n`;
    section.content.forEach((content) => {
      if (content.length > 100) {
        markdown += `${content}\n\n`;
      } else {
        markdown += `- ${content}\n`;
      }
    });
    markdown += '\n';
  });

  return markdown;
}

export function extractKeywords(text: string): {
  turkish: string[];
  english: string[];
  technical: string[];
  soft: string[];
} {
  const technicalKeywords = [
    'javascript',
    'typescript',
    'python',
    'java',
    'react',
    'nodejs',
    'angular',
    'vue',
    'sql',
    'mysql',
    'postgresql',
    'mongodb',
    'redis',
    'elasticsearch',
    'aws',
    'azure',
    'gcp',
    'docker',
    'kubernetes',
    'git',
    'jenkins',
    'agile',
    'scrum',
    'kanban',
    'devops',
    'ci/cd',
    'microservices',
    'html',
    'css',
    'bootstrap',
    'tailwind',
    'sass',
    'less',
    'express',
    'spring',
    'django',
    'flask',
    'laravel',
    'nestjs',
    'php',
    'c#',
    'golang',
    'rust',
    'swift',
    'kotlin',
    'terraform',
    'ansible',
    'prometheus',
    'grafana',
    'elk',
  ];

  const softSkillKeywords = [
    'liderlik',
    'takım çalışması',
    'iletişim',
    'problem çözme',
    'analitik düşünce',
    'yaratıcılık',
    'adaptasyon',
    'zaman yönetimi',
    'stres yönetimi',
    'empati',
    'leadership',
    'teamwork',
    'communication',
    'problem solving',
    'analytical thinking',
    'creativity',
    'adaptation',
    'time management',
    'stress management',
    'empathy',
  ];

  const turkishWords = [
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

  const englishWords = [
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

  const textLower = text.toLowerCase();

  const foundTechnical = technicalKeywords.filter((keyword) =>
    textLower.includes(keyword.toLowerCase())
  );

  const foundSoft = softSkillKeywords.filter((keyword) =>
    textLower.includes(keyword.toLowerCase())
  );

  const foundTurkish = turkishWords.filter((keyword) =>
    textLower.includes(keyword.toLowerCase())
  );

  const foundEnglish = englishWords.filter((keyword) =>
    textLower.includes(keyword.toLowerCase())
  );

  return {
    technical: foundTechnical,
    soft: foundSoft,
    turkish: foundTurkish,
    english: foundEnglish,
  };
}

export function generateDocumentMetadata(
  filePath: string,
  text: string
): {
  fileType: string;
  fileSize: number;
  wordCount: number;
  characterCount: number;
  pageEstimate: number;
  processingDate: string;
} {
  const stats = fs.statSync(filePath);
  const fileExtension = path.extname(filePath).toLowerCase();
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const characterCount = text.length;
  const pageEstimate = Math.ceil(wordCount / 250);

  return {
    fileType: fileExtension.substring(1),
    fileSize: stats.size,
    wordCount,
    characterCount,
    pageEstimate,
    processingDate: new Date().toISOString(),
  };
}
