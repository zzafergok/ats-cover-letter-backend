// src/services/cvService.service.ts

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

      return cleanPdfText(pdfData.text);
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

function cleanPdfText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+/gm, '')
    .replace(/\s+$/gm, '')
    .trim();
}

export async function convertToMarkdown(text: string): Promise<string> {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let markdown = '';
  let currentSection = '';
  let previousLineWasHeader = false;
  let inBulletList = false;

  const sectionPatterns = {
    personalInfo:
      /^(kişisel bilgiler|personal information|iletişim bilgileri|contact info)/i,
    summary:
      /^(özet|profil özeti|kariyer özeti|profesyonel özet|summary|profile|objective|hakkımda|about)/i,
    experience:
      /^(deneyim|iş deneyimi|çalışma deneyimi|profesyonel deneyim|experience|work experience|employment)/i,
    education:
      /^(eğitim|öğrenim|akademik|üniversite|education|academic|university|degree)/i,
    skills:
      /^(beceriler|yetenekler|yetkinlikler|teknik beceriler|skills|technical skills|competencies)/i,
    projects: /^(projeler|proje deneyimi|projects|project experience)/i,
    certifications:
      /^(sertifikalar|sertifika|belgeler|certifications|certificates)/i,
    languages:
      /^(diller|yabancı dil|dil yetkinliği|languages|language skills)/i,
    hobbies: /^(hobiler|ilgi alanları|hobbies|interests)/i,
    references: /^(referanslar|referans|references)/i,
  };

  const datePatterns = {
    dateRange:
      /^(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|january|february|march|april|may|june|july|august|september|october|november|december)?\s*\d{4}\s*[-–—]\s*(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|january|february|march|april|may|june|july|august|september|october|november|december)?\s*\d{4}$/i,
    currentDate:
      /^(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|january|february|march|april|may|june|july|august|september|october|november|december)?\s*\d{4}\s*[-–—]\s*(günümüz|halen|devam ediyor|present|current|ongoing|today)/i,
    singleDate:
      /^(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık|january|february|march|april|may|june|july|august|september|october|november|december)?\s*\d{4}$/i,
  };

  const bulletPatterns = [
    /^[•·▪▫◦‣⁃]\s*/,
    /^[-*]\s+/,
    /^\d+\.\s+/,
    /^[a-zA-Z]\)\s+/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
    const lowerLine = line.toLowerCase();

    const isSection = Object.values(sectionPatterns).some(
      (pattern) => pattern.test(lowerLine) && line.length < 50
    );

    const isDate = Object.values(datePatterns).some((pattern) =>
      pattern.test(line)
    );

    const isBullet = bulletPatterns.some((pattern) => pattern.test(line));

    const isEmail = line.includes('@') && line.includes('.');
    const isPhone =
      /^[\+\(\)\d\s\-\.]+$/.test(line) &&
      line.length >= 10 &&
      line.length <= 20;
    const isWebsite = /^(www\.|https?:\/\/)/.test(lowerLine);
    const isLinkedIn = lowerLine.includes('linkedin.com');
    const isGitHub = lowerLine.includes('github.com');

    if (isSection) {
      if (inBulletList) {
        markdown += '\n';
        inBulletList = false;
      }
      currentSection = line;
      markdown += `\n## ${line}\n\n`;
      previousLineWasHeader = true;
    } else if (isEmail) {
      markdown += `**Email:** ${line}\n`;
    } else if (isPhone) {
      markdown += `**Telefon:** ${line}\n`;
    } else if (isLinkedIn) {
      markdown += `**LinkedIn:** ${line}\n`;
    } else if (isGitHub) {
      markdown += `**GitHub:** ${line}\n`;
    } else if (isWebsite) {
      markdown += `**Web:** ${line}\n`;
    } else if (isDate && currentSection && nextLine && !isBullet) {
      markdown += `\n### ${nextLine} | ${line}\n`;
      i++;
      previousLineWasHeader = true;
    } else if (isBullet) {
      const cleanedLine = line
        .replace(/^[•·▪▫◦‣⁃\-\*]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/^[a-zA-Z]\)\s*/, '');
      markdown += `- ${cleanedLine}\n`;
      inBulletList = true;
      previousLineWasHeader = false;
    } else if (previousLineWasHeader && line.length > 0) {
      if (inBulletList) {
        markdown += '\n';
        inBulletList = false;
      }
      markdown += `${line}\n\n`;
      previousLineWasHeader = false;
    } else {
      if (inBulletList) {
        markdown += '\n';
        inBulletList = false;
      }

      if (line.length > 0) {
        if (
          currentSection.match(/deneyim|experience/i) &&
          !isDate &&
          !isBullet &&
          i > 0
        ) {
          markdown += `- ${line}\n`;
        } else {
          markdown += `${line}\n\n`;
        }
      }
      previousLineWasHeader = false;
    }
  }

  return markdown
    .trim()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n');
}

export function extractKeywords(text: string): {
  turkish: string[];
  english: string[];
} {
  const turkishKeywords: string[] = [];
  const englishKeywords: string[] = [];

  const technicalKeywords = {
    programming: [
      'javascript',
      'typescript',
      'python',
      'java',
      'c#',
      'c++',
      'php',
      'ruby',
      'go',
      'swift',
      'kotlin',
      'react',
      'angular',
      'vue',
      'node.js',
      'express',
      'django',
      'flask',
      'spring',
      '.net',
      'laravel',
    ],
    database: [
      'sql',
      'mysql',
      'postgresql',
      'mongodb',
      'redis',
      'oracle',
      'elasticsearch',
      'cassandra',
      'dynamodb',
    ],
    cloud: [
      'aws',
      'azure',
      'gcp',
      'docker',
      'kubernetes',
      'jenkins',
      'ci/cd',
      'devops',
    ],
    tools: [
      'git',
      'github',
      'gitlab',
      'jira',
      'confluence',
      'slack',
      'agile',
      'scrum',
      'kanban',
    ],
  };

  const commonTurkishKeywords = {
    skills: [
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
      'güvenlik',
      'test',
      'kalite',
    ],
    roles: [
      'uzman',
      'müdür',
      'yönetici',
      'geliştirici',
      'analist',
      'danışman',
      'koordinatör',
      'sorumlu',
      'asistan',
      'stajyer',
    ],
    business: [
      'satış',
      'pazarlama',
      'müşteri',
      'hizmet',
      'operasyon',
      'strateji',
      'planlama',
      'bütçe',
      'rapor',
      'sunum',
    ],
  };

  const commonEnglishKeywords = {
    skills: [
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
      'security',
      'testing',
      'quality',
    ],
    roles: [
      'specialist',
      'manager',
      'developer',
      'analyst',
      'consultant',
      'coordinator',
      'assistant',
      'intern',
      'engineer',
      'architect',
    ],
    business: [
      'sales',
      'marketing',
      'customer',
      'service',
      'operations',
      'strategy',
      'planning',
      'budget',
      'report',
      'presentation',
    ],
  };

  const words = text.toLowerCase().split(/[\s,;.\-\(\)\/\[\]]+/);
  const wordFrequency = new Map<string, number>();

  for (const word of words) {
    const cleanWord = word.trim();
    if (cleanWord.length > 2) {
      wordFrequency.set(cleanWord, (wordFrequency.get(cleanWord) || 0) + 1);
    }
  }

  wordFrequency.forEach((count, word) => {
    if (count >= 2 || Object.values(technicalKeywords).flat().includes(word)) {
      Object.values(technicalKeywords)
        .flat()
        .forEach((keyword) => {
          if (word.includes(keyword) || keyword.includes(word)) {
            if (!englishKeywords.includes(keyword)) {
              englishKeywords.push(keyword);
            }
          }
        });

      Object.values(commonTurkishKeywords)
        .flat()
        .forEach((keyword) => {
          if (word.includes(keyword) || keyword.includes(word)) {
            if (!turkishKeywords.includes(word)) {
              turkishKeywords.push(word);
            }
          }
        });

      Object.values(commonEnglishKeywords)
        .flat()
        .forEach((keyword) => {
          if (word.includes(keyword) || keyword.includes(word)) {
            if (!englishKeywords.includes(word)) {
              englishKeywords.push(word);
            }
          }
        });
    }
  });

  return {
    turkish: turkishKeywords.slice(0, 30),
    english: englishKeywords.slice(0, 30),
  };
}
