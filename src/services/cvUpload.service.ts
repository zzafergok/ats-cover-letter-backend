import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

import logger from '../config/logger';
import { ClaudeService } from './claude.wrapper.service';

/**
 * CV içeriğini extract et (PDF, DOC, DOCX)
 */
export async function extractCvContent(filePath: string): Promise<string> {
  try {
    const fileExtension = path.extname(filePath).toLowerCase();
    const fileBuffer = fs.readFileSync(filePath);

    logger.info('Extracting CV content', {
      filePath,
      fileExtension,
      fileSize: fileBuffer.length,
    });

    switch (fileExtension) {
      case '.pdf':
        return await extractPdfContent(fileBuffer);
      case '.doc':
      case '.docx':
        return await extractDocContent(fileBuffer);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  } catch (error: any) {
    logger.error('CV content extraction failed', {
      filePath,
      error: error.message,
    });
    throw new Error('CV içeriği çıkarılamadı: ' + error.message);
  }
}

/**
 * PDF içeriğini extract et
 */
async function extractPdfContent(fileBuffer: Buffer): Promise<string> {
  try {
    const data = await pdf(fileBuffer);
    return data.text;
  } catch (error: any) {
    logger.error('PDF extraction failed', { error: error.message });
    throw new Error('PDF dosyası okunamadı');
  }
}

/**
 * DOC/DOCX içeriğini extract et
 */
async function extractDocContent(fileBuffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  } catch (error: any) {
    logger.error('DOC/DOCX extraction failed', { error: error.message });
    throw new Error('Word dosyası okunamadı');
  }
}

/**
 * Text'i markdown formatına dönüştür
 */
export function convertToMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n\n');
}

/**
 * Text'i temizle ve normalize et
 */
export function cleanAndNormalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * CV bölümlerini extract et
 */
export function extractSections(text: string): {
  summary?: string;
  experience: any[];
  education: any[];
  skills: string[];
  languages: any[];
  certifications: string[];
} {
  const lines = text.split('\n').map((line) => line.trim());

  const sections = {
    summary: '',
    experience: [] as any[],
    education: [] as any[],
    skills: [] as string[],
    languages: [] as any[],
    certifications: [] as string[],
  };

  // Basit pattern matching ile bölümleri ayır
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Bölüm başlıklarını tespit et
    if (
      lowerLine.includes('özet') ||
      lowerLine.includes('summary') ||
      lowerLine.includes('profil')
    ) {
      if (currentSection) {
        processSectionContent(sections, currentSection, currentContent);
      }
      currentSection = 'summary';
      currentContent = [];
    } else if (
      lowerLine.includes('deneyim') ||
      lowerLine.includes('experience') ||
      lowerLine.includes('iş') ||
      lowerLine.includes('work')
    ) {
      if (currentSection) {
        processSectionContent(sections, currentSection, currentContent);
      }
      currentSection = 'experience';
      currentContent = [];
    } else if (
      lowerLine.includes('eğitim') ||
      lowerLine.includes('education') ||
      lowerLine.includes('öğrenim')
    ) {
      if (currentSection) {
        processSectionContent(sections, currentSection, currentContent);
      }
      currentSection = 'education';
      currentContent = [];
    } else if (
      lowerLine.includes('beceri') ||
      lowerLine.includes('skill') ||
      lowerLine.includes('yetenek')
    ) {
      if (currentSection) {
        processSectionContent(sections, currentSection, currentContent);
      }
      currentSection = 'skills';
      currentContent = [];
    } else if (lowerLine.includes('dil') || lowerLine.includes('language')) {
      if (currentSection) {
        processSectionContent(sections, currentSection, currentContent);
      }
      currentSection = 'languages';
      currentContent = [];
    } else if (
      lowerLine.includes('sertifika') ||
      lowerLine.includes('certificate')
    ) {
      if (currentSection) {
        processSectionContent(sections, currentSection, currentContent);
      }
      currentSection = 'certifications';
      currentContent = [];
    } else if (line.length > 0) {
      currentContent.push(line);
    }
  }

  // Son bölümü işle
  if (currentSection) {
    processSectionContent(sections, currentSection, currentContent);
  }

  return sections;
}

/**
 * Bölüm içeriğini işle
 */
function processSectionContent(
  sections: any,
  sectionType: string,
  content: string[]
): void {
  const contentText = content.join(' ').trim();

  switch (sectionType) {
    case 'summary':
      sections.summary = contentText;
      break;
    case 'experience':
      sections.experience.push({
        title: content[0] || 'Pozisyon belirtilmemiş',
        company: content[1] || 'Şirket belirtilmemiş',
        duration: content[2] || 'Süre belirtilmemiş',
        description: content.slice(3).join(' ') || 'Açıklama yok',
      });
      break;
    case 'education':
      sections.education.push({
        degree: content[0] || 'Derece belirtilmemiş',
        institution: content[1] || 'Kurum belirtilmemiş',
        year: content[2] || 'Yıl belirtilmemiş',
      });
      break;
    case 'skills':
      sections.skills = content.filter((skill) => skill.trim().length > 0);
      break;
    case 'languages':
      content.forEach((lang) => {
        const parts = lang.split(/[(),]/);
        sections.languages.push({
          language: parts[0]?.trim() || lang,
          level: parts[1]?.trim() || 'Seviye belirtilmemiş',
        });
      });
      break;
    case 'certifications':
      sections.certifications = content.filter(
        (cert) => cert.trim().length > 0
      );
      break;
  }
}

/**
 * Anahtar kelimeleri extract et
 */
export function extractKeywords(text: string): string[] {
  const commonWords = [
    'the',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    've',
    'ile',
    'için',
    'olan',
    'olan',
    'bu',
    'şu',
    'o',
    'bir',
    'de',
    'da',
  ];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !commonWords.includes(word));

  // Kelime frekansı hesapla
  const wordCount: { [key: string]: number } = {};
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // En sık kullanılan kelimeleri döndür
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * İletişim bilgilerini extract et
 */
export function extractContactInformation(text: string): {
  fullName?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
} {
  const contactInfo: any = {};

  // Email regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    contactInfo.email = emailMatch[0];
  }

  // Telefon regex
  const phoneRegex =
    /(?:\+90|0)?[\s\-.]?5\d{2}[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    contactInfo.phone = phoneMatch[0];
  }

  // LinkedIn regex
  const linkedinRegex =
    /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=)([A-Za-z0-9\-._]+)/g;
  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch) {
    contactInfo.linkedin = linkedinMatch[0];
  }

  // GitHub regex
  const githubRegex = /(?:github\.com\/)([A-Za-z0-9\-._]+)/g;
  const githubMatch = text.match(githubRegex);
  if (githubMatch) {
    contactInfo.github = githubMatch[0];
  }

  // İsim için basit pattern (ilk birkaç satırdaki büyük harfli kelimeler)
  const lines = text.split('\n').slice(0, 5);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length > 5 && trimmedLine.length < 50) {
      const words = trimmedLine.split(/\s+/);
      if (words.length >= 2 && words.length <= 4) {
        const isLikelyName = words.every((word) =>
          /^[A-ZÇĞİÖŞÜ][a-zçğıöşü]*$/.test(word)
        );
        if (isLikelyName) {
          contactInfo.fullName = trimmedLine;
          break;
        }
      }
    }
  }

  return contactInfo;
}

/**
 * Doküman metadata'sını oluştur
 */
export function generateDocumentMetadata(text: string): {
  wordCount: number;
  characterCount: number;
  estimatedReadingTime: number;
  sections: string[];
} {
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;
  const characterCount = text.length;
  const estimatedReadingTime = Math.ceil(wordCount / 200); // 200 kelime/dakika

  const sections = [];
  if (
    text.toLowerCase().includes('özet') ||
    text.toLowerCase().includes('summary')
  ) {
    sections.push('Summary');
  }
  if (
    text.toLowerCase().includes('deneyim') ||
    text.toLowerCase().includes('experience')
  ) {
    sections.push('Experience');
  }
  if (
    text.toLowerCase().includes('eğitim') ||
    text.toLowerCase().includes('education')
  ) {
    sections.push('Education');
  }
  if (
    text.toLowerCase().includes('beceri') ||
    text.toLowerCase().includes('skill')
  ) {
    sections.push('Skills');
  }

  return {
    wordCount,
    characterCount,
    estimatedReadingTime,
    sections,
  };
}

/**
 * AI-powered CV parsing using Claude
 */
export async function parseWithAI(cvText: string): Promise<any> {
  try {
    logger.info('Starting AI-powered CV parsing', {
      textLength: cvText.length,
      wordCount: cvText.split(/\s+/).length
    });

    const claudeService = ClaudeService.getInstance();
    const aiResult = await claudeService.parseCvContent(cvText);

    logger.info('AI CV parsing completed successfully');
    return aiResult;
  } catch (error: any) {
    logger.error('AI CV parsing failed', {
      error: error.message,
      textPreview: cvText.substring(0, 200)
    });
    throw new Error('AI parsing başarısız: ' + error.message);
  }
}
