import { ATSCVData } from '../types/cv.types';
import logger from '../config/logger';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

export interface DOCXGenerationOptions {
  format: 'ATS_OPTIMIZED' | 'STANDARD';
  includePageNumbers: boolean;
  fontFamily: 'Arial' | 'Calibri' | 'Times New Roman';
  fontSize: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export class DOCXExportService {
  private static instance: DOCXExportService;

  private constructor() {}

  /**
   * Başlık formatlaması - sadece ilk harf büyük, geri kalan küçük (Sentence case)
   */
  private formatTitle(text: string, language: 'TURKISH' | 'ENGLISH' = 'TURKISH'): string {
    if (!text) return '';
    
    const sanitized = String(text).trim().toLowerCase();
    
    if (language === 'TURKISH') {
      // Türkçe karakterleri destekleyen sentence case - sadece ilk harf büyük
      if (sanitized.length === 0) return '';
      
      const firstChar = sanitized.charAt(0);
      const restOfText = sanitized.slice(1);
      
      // Türkçe karakter dönüşümleri - sadece ilk harf için
      const turkishUpperMap: { [key: string]: string } = {
        'i': 'İ',
        'ı': 'I',
        'ğ': 'Ğ',
        'ü': 'Ü',
        'ş': 'Ş',
        'ö': 'Ö',
        'ç': 'Ç'
      };
      
      const upperFirstChar = turkishUpperMap[firstChar] || firstChar.toUpperCase();
      return upperFirstChar + restOfText;
    } else {
      // İngilizce için standart sentence case - sadece ilk harf büyük
      if (sanitized.length === 0) return '';
      return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
    }
  }

  /**
   * Dil tespiti - içeriğe bakarak Türkçe/İngilizce tespit eder
   */
  private detectLanguage(text: string): 'TURKISH' | 'ENGLISH' {
    if (!text) return 'TURKISH';
    
    // Türkçe karakterlerin varlığını kontrol et
    const turkishChars = /[çğıöşüÇĞIÖŞÜ]/;
    if (turkishChars.test(text)) {
      return 'TURKISH';
    }
    
    // Türkçe kelimelerin varlığını kontrol et
    const turkishWords = /\b(için|ile|bir|bu|şu|olan|olan|saygılarımla|mektub|başvuru|pozisyon|şirket)\b/i;
    if (turkishWords.test(text)) {
      return 'TURKISH';
    }
    
    // İngilizce kelimelerin varlığını kontrol et  
    const englishWords = /\b(for|with|and|the|this|that|position|company|application|letter|regards)\b/i;
    if (englishWords.test(text)) {
      return 'ENGLISH';
    }
    
    // Varsayılan olarak Türkçe
    return 'TURKISH';
  }

  public static getInstance(): DOCXExportService {
    if (!DOCXExportService.instance) {
      DOCXExportService.instance = new DOCXExportService();
    }
    return DOCXExportService.instance;
  }

  /**
   * ATS uyumlu DOCX CV oluştur
   */
  async generateATSCompliantDOCX(
    cvData: ATSCVData,
    options: Partial<DOCXGenerationOptions> = {}
  ): Promise<Buffer> {
    try {
      const defaultOptions: DOCXGenerationOptions = {
        format: 'ATS_OPTIMIZED',
        includePageNumbers: false,
        fontFamily: 'Arial',
        fontSize: 11,
        margins: {
          top: 1,
          bottom: 1,
          left: 1,
          right: 1
        }
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Validate options
      const validationErrors = this.validateDOCXOptions(finalOptions);
      if (validationErrors.length > 0) {
        const errorMessage = `DOCX generation options validation failed: ${validationErrors.join(', ')}`;
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      logger.info('Starting DOCX generation', {
        applicantName: `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`,
        format: finalOptions.format,
        font: finalOptions.fontFamily
      });

      // Create actual DOCX document
      const doc = this.createATSDocument(cvData, finalOptions);
      const buffer = await Packer.toBuffer(doc);

      logger.info('DOCX generation completed', {
        bufferSize: buffer.length
      });

      return buffer;

    } catch (error) {
      logger.error('DOCX generation failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('DOCX generation could not be completed');
    }
  }

  /**
   * ATS-optimized DOCX document oluştur
   */
  private createATSDocument(cvData: ATSCVData, options: DOCXGenerationOptions): Document {
    const sections = [];

    // Dil tespiti
    const detectedLanguage = this.detectLanguage(`${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName}`);
    
    // Header - Contact Information
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${this.formatTitle(cvData.personalInfo.firstName, detectedLanguage)} ${this.formatTitle(cvData.personalInfo.lastName, detectedLanguage)}`.toUpperCase(),
            font: options.fontFamily,
            size: (options.fontSize + 4) * 2, // Convert to half-points
            bold: true
          })
        ]
      })
    );

    // Contact details
    const contactInfo = [
      cvData.personalInfo.email,
      cvData.personalInfo.phone,
      `${this.formatTitle(cvData.personalInfo.address.city, detectedLanguage)}, ${this.formatTitle(cvData.personalInfo.address.country, detectedLanguage)}`
    ].join(' | ');

    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: contactInfo,
            font: options.fontFamily,
            size: options.fontSize * 2
          })
        ]
      })
    );

    // Links
    const links = [];
    if (cvData.personalInfo.linkedIn) links.push(cvData.personalInfo.linkedIn);
    if (cvData.personalInfo.portfolio) links.push(cvData.personalInfo.portfolio);
    if (cvData.personalInfo.github) links.push(cvData.personalInfo.github);
    
    if (links.length > 0) {
      sections.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: links.join(' | '),
              font: options.fontFamily,
              size: options.fontSize * 2
            })
          ]
        })
      );
    }

    // Add spacing
    sections.push(new Paragraph({ text: '' }));

    // Professional Summary
    sections.push(this.createSectionHeader('PROFESSIONAL SUMMARY', options));
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: cvData.professionalSummary.summary,
            font: options.fontFamily,
            size: options.fontSize * 2
          })
        ]
      })
    );
    sections.push(new Paragraph({ text: '' }));

    // Work Experience
    sections.push(this.createSectionHeader('WORK EXPERIENCE', options));
    cvData.workExperience.forEach(exp => {
      // Dil tespiti (deneyim içeriğinden)
      const expLanguage = this.detectLanguage(`${exp.position} ${exp.companyName}`);
      
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: this.formatTitle(exp.position, expLanguage),
              font: options.fontFamily,
              size: options.fontSize * 2,
              bold: true
            }),
            new TextRun({
              text: ` | ${this.formatTitle(exp.companyName, expLanguage)}`,
              font: options.fontFamily,
              size: options.fontSize * 2
            })
          ]
        })
      );

      const endDate = exp.isCurrentRole ? 'Present' : this.formatDate(exp.endDate!);
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${this.formatDate(exp.startDate)} - ${endDate} | ${this.formatTitle(exp.location, expLanguage)}`,
              font: options.fontFamily,
              size: options.fontSize * 2,
              italics: true
            })
          ]
        })
      );

      exp.achievements.forEach(achievement => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${achievement}`,
                font: options.fontFamily,
                size: options.fontSize * 2
              })
            ]
          })
        );
      });

      if (exp.technologies && exp.technologies.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Technologies: ${exp.technologies.join(', ')}`,
                font: options.fontFamily,
                size: options.fontSize * 2,
                italics: true
              })
            ]
          })
        );
      }
      sections.push(new Paragraph({ text: '' }));
    });

    // Education
    sections.push(this.createSectionHeader('EDUCATION', options));
    cvData.education.forEach(edu => {
      // Dil tespiti (eğitim içeriğinden)
      const eduLanguage = this.detectLanguage(`${edu.degree} ${edu.fieldOfStudy} ${edu.institution}`);
      
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${this.formatTitle(edu.degree, eduLanguage)} in ${this.formatTitle(edu.fieldOfStudy, eduLanguage)}`,
              font: options.fontFamily,
              size: options.fontSize * 2,
              bold: true
            })
          ]
        })
      );

      const endDate = edu.endDate ? this.formatDate(edu.endDate) : 'Present';
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${this.formatTitle(edu.institution, eduLanguage)} | ${this.formatDate(edu.startDate)} - ${endDate}`,
              font: options.fontFamily,
              size: options.fontSize * 2,
              italics: true
            })
          ]
        })
      );

      if (edu.gpa && edu.gpa >= 3.5) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `GPA: ${edu.gpa.toFixed(2)}`,
                font: options.fontFamily,
                size: options.fontSize * 2
              })
            ]
          })
        );
      }

      if (edu.honors && edu.honors.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Honors: ${edu.honors.join(', ')}`,
                font: options.fontFamily,
                size: options.fontSize * 2
              })
            ]
          })
        );
      }
      sections.push(new Paragraph({ text: '' }));
    });

    // Skills
    sections.push(this.createSectionHeader('SKILLS', options));
    cvData.skills.technical.forEach(category => {
      // Dil tespiti (skill kategorisinden)
      const skillLanguage = this.detectLanguage(category.category);
      
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${this.formatTitle(category.category, skillLanguage)}:`,
              font: options.fontFamily,
              size: options.fontSize * 2,
              bold: true
            })
          ]
        })
      );

      const skillNames = category.items.map(item => item.name).join(', ');
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: skillNames,
              font: options.fontFamily,
              size: options.fontSize * 2
            })
          ]
        })
      );
      sections.push(new Paragraph({ text: '' }));
    });

    if (cvData.skills.languages.length > 0) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Languages:',
              font: options.fontFamily,
              size: options.fontSize * 2,
              bold: true
            })
          ]
        })
      );

      const languageList = cvData.skills.languages
        .map(lang => `${lang.language} (${lang.proficiency})`)
        .join(', ');
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: languageList,
              font: options.fontFamily,
              size: options.fontSize * 2
            })
          ]
        })
      );
      sections.push(new Paragraph({ text: '' }));
    }

    // Certifications
    if (cvData.certifications && cvData.certifications.length > 0) {
      sections.push(this.createSectionHeader('CERTIFICATIONS', options));
      cvData.certifications.forEach(cert => {
        // Dil tespiti (sertifika içeriğinden)
        const certLanguage = this.detectLanguage(`${cert.name} ${cert.issuingOrganization}`);
        
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: this.formatTitle(cert.name, certLanguage),
                font: options.fontFamily,
                size: options.fontSize * 2,
                bold: true
              })
            ]
          })
        );
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${this.formatTitle(cert.issuingOrganization, certLanguage)} | ${this.formatDate(cert.issueDate)}`,
                font: options.fontFamily,
                size: options.fontSize * 2,
                italics: true
              })
            ]
          })
        );
        sections.push(new Paragraph({ text: '' }));
      });
    }

    // Projects
    if (cvData.projects && cvData.projects.length > 0) {
      sections.push(this.createSectionHeader('PROJECTS', options));
      cvData.projects.forEach(project => {
        // Dil tespiti (proje içeriğinden)
        const projectLanguage = this.detectLanguage(`${project.name} ${project.description}`);
        
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: this.formatTitle(project.name, projectLanguage),
                font: options.fontFamily,
                size: options.fontSize * 2,
                bold: true
              })
            ]
          })
        );
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: project.description,
                font: options.fontFamily,
                size: options.fontSize * 2
              })
            ]
          })
        );
        if (project.technologies.length > 0) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Technologies: ${project.technologies.join(', ')}`,
                  font: options.fontFamily,
                  size: options.fontSize * 2,
                  italics: true
                })
              ]
            })
          );
        }
        sections.push(new Paragraph({ text: '' }));
      });
    }

    return new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: options.margins.top * 1440, // Convert inches to twips
                bottom: options.margins.bottom * 1440,
                left: options.margins.left * 1440,
                right: options.margins.right * 1440
              }
            }
          },
          children: sections
        }
      ]
    });
  }

  /**
   * Section header oluştur
   */
  private createSectionHeader(title: string, options: DOCXGenerationOptions): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: title,
          font: options.fontFamily,
          size: (options.fontSize + 1) * 2,
          bold: true,
          allCaps: true
        })
      ]
    });
  }


  /**
   * Date formatting
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  /**
   * DOCX format options'larını validate et
   */
  validateDOCXOptions(options: Partial<DOCXGenerationOptions>): string[] {
    const errors: string[] = [];

    if (options.fontSize && (options.fontSize < 9 || options.fontSize > 14)) {
      errors.push('Font size should be between 9 and 14 points for ATS compatibility');
    }

    if (options.margins) {
      const { top, bottom, left, right } = options.margins;
      if (top < 0.5 || bottom < 0.5 || left < 0.5 || right < 0.5) {
        errors.push('Margins should be at least 0.5 inches for proper formatting');
      }
      if (top > 2 || bottom > 2 || left > 2 || right > 2) {
        errors.push('Margins should not exceed 2 inches for efficient space usage');
      }
    }

    return errors;
  }

  /**
   * ATS-friendly DOCX best practices
   */
  getATSDOCXBestPractices(): {
    format: string[];
    structure: string[];
    content: string[];
  } {
    return {
      format: [
        'Use standard fonts: Arial, Calibri, or Times New Roman',
        'Keep font size between 10-12pt for body text',
        'Use 0.5-1 inch margins on all sides',
        'Save as .docx format for best compatibility',
        'Avoid headers, footers, and page numbers',
        'Use simple formatting - no text boxes or tables'
      ],
      structure: [
        'Start with contact information at the top',
        'Use clear section headings in ALL CAPS',
        'Maintain consistent spacing between sections',
        'Use bullet points for achievements',
        'Keep to 1-2 pages maximum',
        'Use single-column layout only'
      ],
      content: [
        'Include exact keywords from job posting',
        'Use standard section names (WORK EXPERIENCE, EDUCATION)',
        'Quantify achievements with numbers',
        'Write in active voice with strong action verbs',
        'Avoid graphics, images, or special characters',
        'Proofread carefully for spelling and grammar'
      ]
    };
  }

  /**
   * DOCX vs PDF karşılaştırması
   */
  getDOCXvsPDFComparison(): {
    docx: { advantages: string[]; disadvantages: string[] };
    pdf: { advantages: string[]; disadvantages: string[] };
    recommendation: string;
  } {
    return {
      docx: {
        advantages: [
          'Better ATS parsing accuracy',
          'Easier for recruiters to edit/comment',
          'Smaller file sizes',
          'Better keyword searchability',
          'More compatible with older ATS systems'
        ],
        disadvantages: [
          'Formatting may change between devices',
          'Less secure than PDF',
          'May not preserve exact layout',
          'Version compatibility issues possible'
        ]
      },
      pdf: {
        advantages: [
          'Preserves exact formatting',
          'Professional appearance',
          'Universal compatibility',
          'Secure and tamper-resistant',
          'Consistent display across devices'
        ],
        disadvantages: [
          'Some ATS systems struggle with parsing',
          'Cannot be easily edited',
          'Larger file sizes',
          'May have keyword extraction issues'
        ]
      },
      recommendation: 'Use DOCX for ATS applications when specified, PDF for direct human review. Always check job posting requirements first.'
    };
  }
}