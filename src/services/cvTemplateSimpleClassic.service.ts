import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import logger from '../config/logger';
import { FontLoader } from '../utils/fontLoader';
import { DateFormatter } from '../utils/dateFormatter';

export interface CVSimpleClassicData {
  personalInfo: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    email: string;
    jobTitle?: string;
    linkedin?: string;
    website?: string;
    github?: string;
    medium?: string;
    phone: string;
  };
  objective: string;
  experience: Array<{
    jobTitle: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    university: string;
    location: string;
    graduationDate: string;
    details?: string;
  }>;
  // Global version fields
  communication?: string;
  leadership?: string;
  skills?: string[];
  // Turkey version fields
  technicalSkills?: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    tools?: string[];
  };
  projects?: Array<{
    name: string;
    description: string;
    technologies: string;
    link?: string;
  }>;
  certificates?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  languages?: Array<{
    language: string;
    level: string;
  }>;
  references?: Array<{
    name: string;
    company: string;
    contact: string;
  }>;
  // Version control
  version?: 'global' | 'turkey';
  language?: 'turkish' | 'english';
}

export class CVTemplateSimpleClassicService {
  private static instance: CVTemplateSimpleClassicService;

  private constructor() {}

  public static getInstance(): CVTemplateSimpleClassicService {
    if (!CVTemplateSimpleClassicService.instance) {
      CVTemplateSimpleClassicService.instance =
        new CVTemplateSimpleClassicService();
    }
    return CVTemplateSimpleClassicService.instance;
  }

  private generateFileName(
    firstName: string,
    lastName: string,
    version: 'global' | 'turkey'
  ): string {
    const fullName = `${firstName} ${lastName}`;
    const cleanName = fullName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const versionSuffix = version === 'turkey' ? '_TR' : '_Global';
    return `${cleanName}_Resume${versionSuffix}.pdf`;
  }

  private sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    return text.trim();
  }

  private getSectionHeaders(language: 'turkish' | 'english') {
    if (language === 'turkish') {
      return {
        objective: 'HEDEF',
        experience: 'DENEYİM',
        education: 'EĞİTİM',
        technicalSkills: 'TEKNİK BECERİLER',
        projects: 'PROJELER',
        certificates: 'SERTİFİKALAR',
        languages: 'DİLLER',
        communication: 'İLETİŞİM',
        leadership: 'LİDERLİK',
        references: 'REFERANSLAR',
      };
    } else {
      return {
        objective: 'OBJECTIVE',
        experience: 'EXPERIENCE',
        education: 'EDUCATION',
        technicalSkills: 'TECHNICAL SKILLS',
        projects: 'PROJECTS',
        certificates: 'CERTIFICATES',
        languages: 'LANGUAGES',
        communication: 'COMMUNICATION',
        leadership: 'LEADERSHIP',
        skills: 'SKILLS',
        references: 'REFERENCES',
      };
    }
  }

  async generatePDF(data: CVSimpleClassicData): Promise<Buffer> {
    // Set default version if not specified
    if (!data.version) {
      data.version = 'global';
    }

    // Set default language based on version
    if (!data.language) {
      data.language = data.version === 'turkey' ? 'turkish' : 'english';
    }

    try {
      const doc = await FontLoader.createPDFDocument();

      // Extract names for metadata
      const firstName = this.sanitizeText(data.personalInfo.firstName);
      const lastName = this.sanitizeText(data.personalInfo.lastName);
      const fullName = `${firstName} ${lastName}`.trim();

      // Add PDF metadata
      doc.info.Title = `${fullName} - CV`;
      doc.info.Subject = 'Curriculum Vitae';
      doc.info.Author = fullName;
      doc.info.Creator = 'ATS Cover Letter Backend';
      doc.info.Producer = 'PDFKit with Accessibility';
      doc.info.Keywords =
        'CV, Resume, ' + (data.version === 'turkey' ? 'Turkey' : 'Global');

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const stream = new PassThrough();

        doc.pipe(stream);

        try {
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const fileName = this.generateFileName(
              firstName,
              lastName,
              data.version!
            );
            logger.info(`Generated CV PDF: ${fileName}`);
            resolve(buffer);
          });
          stream.on('error', (error) => {
            logger.error('PDF generation stream error:', error);
            reject(error);
          });

          this.generateContent(doc, data);

          doc.end();
        } catch (error) {
          logger.error(
            'PDF generation error in simple_classic template:',
            error
          );
          reject(
            new Error(
              `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
        }
      });
    } catch (error) {
      logger.error('PDF document creation failed:', error);
      throw new Error(
        `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private generateContent(
    doc: InstanceType<typeof PDFDocument>,
    data: CVSimpleClassicData
  ): void {
    const colors = { black: '#000000', gray: '#666666', green: '#5e7a5a' };
    const headers = this.getSectionHeaders(data.language!);
    const margins = { left: 100, right: 515 };

    // Add vertical borders
    this.addVerticalBorders(doc, colors.green);

    // Set initial position
    doc.x = margins.left;
    doc.y = 30;

    this.addHeader(doc, data, colors);
    doc.moveDown(1);

    if (data.objective) {
      this.addObjectiveSection(
        doc,
        data.objective,
        headers.objective,
        colors,
        margins
      );
      doc.moveDown(1.5);
    }

    if (data.experience && data.experience.length > 0) {
      this.addExperienceSection(
        doc,
        data.experience,
        headers.experience,
        colors,
        margins,
        data.language!
      );
      doc.moveDown(1);
    }

    if (data.education && data.education.length > 0) {
      this.addEducationSection(
        doc,
        data.education,
        headers.education,
        colors,
        margins
      );
      doc.moveDown(1);
    }

    if (data.version === 'turkey') {
      if (data.technicalSkills) {
        this.addTechnicalSkillsSection(
          doc,
          data.technicalSkills,
          headers.technicalSkills,
          colors,
          margins
        );
        doc.moveDown(1);
      }

      if (data.projects && data.projects.length > 0) {
        this.addProjectsSection(
          doc,
          data.projects,
          headers.projects,
          colors,
          margins
        );
        doc.moveDown(1);
      }

      if (data.certificates && data.certificates.length > 0) {
        this.addCertificatesSection(
          doc,
          data.certificates,
          headers.certificates,
          colors,
          margins
        );
        doc.moveDown(1);
      }

      if (data.languages && data.languages.length > 0) {
        this.addLanguagesSection(
          doc,
          data.languages,
          headers.languages,
          colors,
          margins
        );
        doc.moveDown(1);
      }
    } else {
      if (data.skills && data.skills.length > 0) {
        this.addSkillsSection(
          doc,
          data.skills,
          headers.skills!,
          colors,
          margins
        );
        doc.moveDown(1);
      }

      if (data.communication) {
        this.addCommunicationSection(
          doc,
          data.communication,
          headers.communication,
          colors,
          margins
        );
        doc.moveDown(1);
      }

      if (data.leadership) {
        this.addLeadershipSection(
          doc,
          data.leadership,
          headers.leadership,
          colors,
          margins
        );
        doc.moveDown(1);
      }
    }

    if (data.references && data.references.length > 0) {
      this.addReferencesSection(
        doc,
        data.references,
        headers.references,
        colors,
        margins
      );
    }
  }

  private addHeader(
    doc: InstanceType<typeof PDFDocument>,
    data: CVSimpleClassicData,
    colors: any
  ): void {
    const margins = { left: 75, right: 515 };

    // Header with name - Simple Classic style
    doc
      .fontSize(30)
      .fillColor(colors.green)
      .font('NotoSans-Bold')
      .text(
        `${this.sanitizeText(data.personalInfo.firstName)} ${this.sanitizeText(data.personalInfo.lastName)}`.toUpperCase(),
        margins.left,
        doc.y
      );

    doc.moveDown(1);

    // Contact Information - Left side
    const leftContactInfo = [
      this.sanitizeText(data.personalInfo.email),
      this.sanitizeText(data.personalInfo.phone),
      `${this.sanitizeText(data.personalInfo.address)} | ${this.sanitizeText(data.personalInfo.city)}`,
    ];

    // Links - Right side
    const rightLinks = [
      data.personalInfo.linkedin
        ? this.sanitizeText(data.personalInfo.linkedin)
        : '',
      data.personalInfo.website
        ? this.sanitizeText(data.personalInfo.website)
        : '',
      data.personalInfo.github
        ? this.sanitizeText(data.personalInfo.github)
        : '',
      data.personalInfo.medium
        ? this.sanitizeText(data.personalInfo.medium)
        : '',
    ].filter(Boolean);

    const startY = doc.y;
    
    // Left side contact info
    leftContactInfo.forEach((info, index) => {
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(info, margins.left, startY + index * 12);
    });

    // Right side links
    rightLinks.forEach((link, index) => {
      const linkWidth = doc.widthOfString(link);
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(link, margins.right - linkWidth, startY + index * 12);
    });

    // Move to next position
    const maxLines = Math.max(leftContactInfo.length, rightLinks.length);
    doc.y = startY + maxLines * 12;
  }

  private addObjectiveSection(
    doc: InstanceType<typeof PDFDocument>,
    objective: string,
    title: string,
    colors: any,
    margins: any
  ): void {
    const text = this.sanitizeText(objective);
    const estimatedHeight = Math.max(60, text.length / 5); // Rough estimation
    
    this.addSectionTitle(doc, title, colors.green, estimatedHeight);
    doc.moveDown(0.4);

    // Check if content fits, if not move to next page
    const contentHeight = this.calculateTextHeight(doc, text, {
      width: margins.right - margins.left,
      lineGap: 2,
    });
    
    if (doc.y + contentHeight > 750) {
      doc.addPage();
      this.addVerticalBorders(doc, colors.green);
      doc.y = 60;
    }

    doc
      .fontSize(9)
      .fillColor(colors.black)
      .font('NotoSans')
      .text(text, margins.left, doc.y, {
        width: margins.right - margins.left,
        align: 'justify',
        lineGap: 2,
      });
    doc.moveDown(0.6);
  }

  private addExperienceSection(
    doc: InstanceType<typeof PDFDocument>,
    experience: any[],
    title: string,
    colors: any,
    margins: any,
    language: 'turkish' | 'english'
  ): void {
    this.addSectionTitle(doc, title, colors.green, 120);
    doc.moveDown(0.4);

    experience.forEach((exp, index) => {
      if (index > 0) doc.moveDown(0.6);

      // Calculate required space for this experience item
      const description = this.sanitizeText(exp.description);
      const descriptionHeight = this.calculateTextHeight(doc, description, {
        width: margins.right - margins.left,
        lineGap: 2,
      });
      const requiredSpace = 80 + descriptionHeight; // Header + description + margins

      // Check if entire experience item fits
      if (doc.y + requiredSpace > 750) {
        doc.addPage();
        this.addVerticalBorders(doc, colors.green);
        doc.y = 60;
      }

      // Job title and company with location
      const jobTitle = this.sanitizeText(exp.jobTitle);
      const company = this.sanitizeText(exp.company);
      const location = this.sanitizeText(exp.location);

      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(`${jobTitle}, `, margins.left, doc.y, { continued: true })
        .font('NotoSans-Italic')
        .text(`${company}`, { continued: true })
        .font('NotoSans')
        .text(` | ${location}`, { continued: false });

      doc.moveDown(0.3);

      // Date range with isCurrent check
      const startDate = DateFormatter.formatDateLong(
        this.sanitizeText(exp.startDate)
      );

      let dateRange = '';
      if (
        exp.isCurrent ||
        !exp.endDate ||
        exp.endDate.toLowerCase().includes('günümüz') ||
        exp.endDate.toLowerCase().includes('current')
      ) {
        // Check language for current job text
        const currentText = language === 'turkish' ? 'devam ediyor' : 'Present';
        dateRange = `${startDate} - ${currentText}`;
      } else {
        const endDate = DateFormatter.formatDateLong(
          this.sanitizeText(exp.endDate)
        );
        dateRange = `${startDate} - ${endDate}`;
      }

      doc
        .fontSize(9)
        .fillColor(colors.gray)
        .font('NotoSans')
        .text(dateRange, margins.left, doc.y);

      doc.moveDown(0.7);

      // Description
      doc
        .fontSize(9)
        .font('NotoSans')
        .fillColor(colors.black)
        .text(description, margins.left, doc.y, {
          width: margins.right - margins.left,
          align: 'justify',
          lineGap: 2,
        });
      doc.moveDown(0.5);
    });
  }

  private addEducationSection(
    doc: InstanceType<typeof PDFDocument>,
    education: any[],
    title: string,
    colors: any,
    margins: any
  ): void {
    this.addSectionTitle(doc, title, colors.green, 100);
    doc.moveDown(0.4);

    education.forEach((edu, index) => {
      if (index > 0) doc.moveDown(0.4);

      // Calculate required space for education item
      const details = edu.details ? this.sanitizeText(edu.details) : '';
      const detailsHeight = details ? this.calculateTextHeight(doc, details, {
        width: margins.right - margins.left,
        lineGap: 2,
      }) : 0;
      const requiredSpace = 60 + detailsHeight;

      // Check if entire education item fits
      if (doc.y + requiredSpace > 750) {
        doc.addPage();
        this.addVerticalBorders(doc, colors.green);
        doc.y = 60;
      }

      // Date range for education with long format
      let dateRange = '';
      if (edu.startDate) {
        const startDate = DateFormatter.formatDateLong(this.sanitizeText(edu.startDate));
        const endDate = DateFormatter.formatDateLong(this.sanitizeText(edu.graduationDate));
        dateRange = `${startDate} - ${endDate}`;
      } else {
        dateRange = DateFormatter.formatDateLong(this.sanitizeText(edu.graduationDate));
      }
      
      doc
        .fontSize(9)
        .fillColor(colors.gray)
        .font('NotoSans')
        .text(dateRange, margins.left, doc.y);

      doc.moveDown(0.3);

      // Degree and university with location
      const degree = this.sanitizeText(edu.degree);
      const university = this.sanitizeText(edu.university);
      const location = this.sanitizeText(edu.location);

      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(`${degree}, `, margins.left, doc.y, { continued: true })
        .font('NotoSans-Italic')
        .text(`${university}`, { continued: true })
        .font('NotoSans')
        .text(` | ${location}`, { continued: false });

      doc.moveDown(0.5);

      // Description
      if (details) {
        doc
          .fontSize(9)
          .font('NotoSans')
          .fillColor(colors.black)
          .text(details, margins.left, doc.y, {
            width: margins.right - margins.left,
            align: 'justify',
            lineGap: 2,
          });
        doc.moveDown(0.7);
      }
    });
  }

  private addSkillsSection(
    doc: InstanceType<typeof PDFDocument>,
    skills: string[],
    title: string,
    colors: any,
    margins: any
  ): void {
    // Calculate required space for skills section
    const totalRows = Math.ceil(skills.length / 3);
    const skillsHeight = totalRows * 15;
    const requiredSpace = 40 + skillsHeight; // Title + skills + margins

    this.addSectionTitle(doc, title, colors.green, requiredSpace);
    doc.moveDown(0.4);

    const columnSpacing = 138;
    const startY = doc.y;

    skills.forEach((skill, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const xPosition = margins.left + column * columnSpacing;
      const currentYPosition = startY + row * 15;

      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(skill, xPosition, currentYPosition);
    });

    doc.y = startY + totalRows * 15;
    doc.moveDown(0.7);
  }

  private addTechnicalSkillsSection(
    doc: InstanceType<typeof PDFDocument>,
    skills: any,
    title: string,
    colors: any,
    margins: any
  ): void {
    // Calculate required space for technical skills section
    let lineCount = 0;
    if (skills.frontend?.length) lineCount++;
    if (skills.backend?.length) lineCount++;
    if (skills.database?.length) lineCount++;
    if (skills.tools?.length) lineCount++;
    
    const skillsHeight = lineCount * 20; // Approximate height per skill line
    const requiredSpace = 40 + skillsHeight; // Title + skills + margins

    this.addSectionTitle(doc, title, colors.green, requiredSpace);
    doc.moveDown(0.4);

    if (skills.frontend?.length) {
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text('Frontend:', margins.left, doc.y, { continued: true });
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(` ${skills.frontend.join(', ')}`, { continued: false });
      doc.moveDown(0.4);
    }

    if (skills.backend?.length) {
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text('Backend:', margins.left, doc.y, { continued: true });
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(` ${skills.backend.join(', ')}`, { continued: false });
      doc.moveDown(0.4);
    }

    if (skills.database?.length) {
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text('Database:', margins.left, doc.y, { continued: true });
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(` ${skills.database.join(', ')}`, { continued: false });
      doc.moveDown(0.4);
    }

    if (skills.tools?.length) {
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text('Tools:', margins.left, doc.y, { continued: true });
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(` ${skills.tools.join(', ')}`, { continued: false });
      doc.moveDown(0.4);
    }
  }

  private addProjectsSection(
    doc: InstanceType<typeof PDFDocument>,
    projects: any[],
    title: string,
    colors: any,
    margins: any
  ): void {
    // Calculate rough space needed for projects section
    let totalProjectsHeight = 0;
    projects.forEach((project) => {
      const technologies = Array.isArray(project.technologies) 
        ? project.technologies 
        : project.technologies.split(',').map((t: string) => t.trim());
      const techRows = Math.ceil(technologies.length / 4);
      const techHeight = techRows * 15;
      const descriptionHeight = this.calculateTextHeight(doc, project.description, {
        width: margins.right - margins.left,
        lineGap: 2
      });
      totalProjectsHeight += 40 + techHeight + descriptionHeight; // Name + tech + description + margins
    });
    const requiredSpace = 40 + Math.min(totalProjectsHeight, 120); // Title + first project or estimate

    this.addSectionTitle(doc, title, colors.green, requiredSpace);
    doc.moveDown(0.4);

    projects.forEach((project, index) => {
      if (index > 0) doc.moveDown(0.6);

      // Calculate space for this project item
      const technologies = Array.isArray(project.technologies) 
        ? project.technologies 
        : project.technologies.split(',').map((t: string) => t.trim());
      const techRows = Math.ceil(technologies.length / 4);
      const techHeight = techRows * 15;
      const descriptionHeight = this.calculateTextHeight(doc, project.description, {
        width: margins.right - margins.left,
        lineGap: 2
      });
      const projectRequiredSpace = 40 + techHeight + descriptionHeight;

      // Check if entire project item fits
      if (doc.y + projectRequiredSpace > 750) {
        doc.addPage();
        this.addVerticalBorders(doc, colors.green);
        doc.y = 60;
      }

      const projectName = this.sanitizeText(project.name);
      
      // Project name
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(projectName, margins.left, doc.y);

      doc.moveDown(0.4);

      // Technologies in 4-column grid
      if (technologies && technologies.length > 0) {
        const columnSpacing = 104; // 415 / 4 ≈ 104
        const startY = doc.y;
        
        technologies.forEach((tech: string, techIndex: number) => {
          const column = techIndex % 4;
          const row = Math.floor(techIndex / 4);
          const xPosition = margins.left + (column * columnSpacing);
          const currentYPosition = startY + (row * 15);

          doc
            .fontSize(9)
            .fillColor(colors.gray)
            .font('NotoSans')
            .text(tech.trim(), xPosition, currentYPosition);
        });

        const totalRows = Math.ceil(technologies.length / 4);
        doc.y = startY + (totalRows * 15);
        doc.moveDown(0.4);
      }

      // Description
      const description = this.sanitizeText(project.description);
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(description, margins.left, doc.y, {
          width: margins.right - margins.left,
          align: 'justify',
          lineGap: 2,
        });
      doc.moveDown(0.7);
    });
  }

  private addCommunicationSection(
    doc: InstanceType<typeof PDFDocument>,
    communication: string,
    title: string,
    colors: any,
    margins: any
  ): void {
    const text = this.sanitizeText(communication);
    const contentHeight = this.calculateTextHeight(doc, text, {
      width: margins.right - margins.left,
      lineGap: 2,
    });
    const requiredSpace = 40 + contentHeight; // Title + content + margins

    this.addSectionTitle(doc, title, colors.green, requiredSpace);
    doc.moveDown(0.4);

    // Check if content fits, if not move to next page
    if (doc.y + contentHeight > 750) {
      doc.addPage();
      this.addVerticalBorders(doc, colors.green);
      doc.y = 60;
    }

    doc
      .fontSize(9)
      .fillColor(colors.black)
      .font('NotoSans')
      .text(text, margins.left, doc.y, {
        width: margins.right - margins.left,
        align: 'justify',
        lineGap: 2,
      });
    doc.moveDown(0.6);
  }

  private addLeadershipSection(
    doc: InstanceType<typeof PDFDocument>,
    leadership: string,
    title: string,
    colors: any,
    margins: any
  ): void {
    const text = this.sanitizeText(leadership);
    const contentHeight = this.calculateTextHeight(doc, text, {
      width: margins.right - margins.left,
      lineGap: 2,
    });
    const requiredSpace = 40 + contentHeight; // Title + content + margins

    this.addSectionTitle(doc, title, colors.green, requiredSpace);
    doc.moveDown(0.4);

    // Check if content fits, if not move to next page
    if (doc.y + contentHeight > 750) {
      doc.addPage();
      this.addVerticalBorders(doc, colors.green);
      doc.y = 60;
    }

    doc
      .fontSize(9)
      .fillColor(colors.black)
      .font('NotoSans')
      .text(text, margins.left, doc.y, {
        width: margins.right - margins.left,
        align: 'justify',
        lineGap: 2,
      });
    doc.moveDown(0.6);
  }

  private addCertificatesSection(
    doc: InstanceType<typeof PDFDocument>,
    certificates: any[],
    title: string,
    colors: any,
    margins: any
  ): void {
    // Calculate required space for certificates section
    const certHeight = certificates.length * 35; // Approximate height per certificate
    const requiredSpace = 40 + certHeight; // Title + certificates + margins

    this.addSectionTitle(doc, title, colors.green, requiredSpace);
    doc.moveDown(0.4);

    certificates.forEach((cert, index) => {
      if (index > 0) doc.moveDown(0.5);

      // Check if certificate item fits
      const certRequiredSpace = 35; // Height for one certificate
      if (doc.y + certRequiredSpace > 750) {
        doc.addPage();
        this.addVerticalBorders(doc, colors.green);
        doc.y = 60;
      }

      const certName = this.sanitizeText(cert.name);
      const issuer = this.sanitizeText(cert.issuer);
      const certDate = DateFormatter.formatDateLong(this.sanitizeText(cert.date));

      const currentY = doc.y;
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(certName, margins.left, currentY);

      const dateWidth = doc.widthOfString(certDate);
      doc
        .fontSize(9)
        .fillColor(colors.gray)
        .font('NotoSans')
        .text(certDate, margins.right - dateWidth, currentY);

      doc.moveDown(0.3);
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(issuer, margins.left, doc.y);
      doc.moveDown(0.3);
    });
  }

  private addLanguagesSection(
    doc: InstanceType<typeof PDFDocument>,
    languages: any[],
    title: string,
    colors: any,
    margins: any
  ): void {
    const languageEntries = languages
      .map(
        (lang) =>
          `${this.sanitizeText(lang.language)}: ${this.sanitizeText(lang.level)}`
      )
      .join(' • ');

    const contentHeight = this.calculateTextHeight(doc, languageEntries, {
      width: margins.right - margins.left,
      lineGap: 2,
    });
    const requiredSpace = 40 + contentHeight; // Title + content + margins

    this.addSectionTitle(doc, title, colors.green, requiredSpace);
    doc.moveDown(0.4);

    // Check if content fits, if not move to next page
    if (doc.y + contentHeight > 750) {
      doc.addPage();
      this.addVerticalBorders(doc, colors.green);
      doc.y = 60;
    }

    doc
      .fontSize(9)
      .fillColor(colors.black)
      .font('NotoSans')
      .text(languageEntries, margins.left, doc.y, {
        width: margins.right - margins.left,
        lineGap: 2,
      });
    doc.moveDown(0.5);
  }

  private addReferencesSection(
    doc: InstanceType<typeof PDFDocument>,
    references: any[],
    title: string,
    colors: any,
    margins: any
  ): void {
    // Calculate required space for references section
    const refHeight = references.length * 20; // Approximate height per reference
    const requiredSpace = 40 + refHeight; // Title + references + margins

    this.addSectionTitle(doc, title, colors.green, requiredSpace);
    doc.moveDown(0.4);

    references.forEach((ref, index) => {
      if (index > 0) doc.moveDown(0.3);

      // Check if reference item fits
      const refRequiredSpace = 20; // Height for one reference
      if (doc.y + refRequiredSpace > 750) {
        doc.addPage();
        this.addVerticalBorders(doc, colors.green);
        doc.y = 60;
      }

      const refText = `${this.sanitizeText(ref.name)} - ${this.sanitizeText(ref.company)} | ${this.sanitizeText(ref.contact)}`;
      doc
        .fontSize(9)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(refText, margins.left, doc.y, {
          width: margins.right - margins.left,
        });
    });
  }

  private checkPageBreak(
    doc: InstanceType<typeof PDFDocument>,
    requiredSpace: number
  ): void {
    if (doc.y + requiredSpace > 750) {
      doc.addPage();
      this.addVerticalBorders(doc, '#5e7a5a');
      doc.y = 60;
    }
  }

  private calculateTextHeight(
    doc: InstanceType<typeof PDFDocument>,
    text: string,
    options: { width: number; lineGap?: number }
  ): number {
    const currentFontSize = 9; // Default font size for content
    const lineGap = options.lineGap || 0;
    const lineHeight = currentFontSize + lineGap;
    
    // Simple estimation: count words and estimate line wrapping
    const words = text.split(' ');
    const avgCharWidth = currentFontSize * 0.6; // Rough estimation
    let currentLineLength = 0;
    let lineCount = 1;
    
    for (const word of words) {
      const wordLength = word.length * avgCharWidth;
      if (currentLineLength + wordLength > options.width) {
        lineCount++;
        currentLineLength = wordLength;
      } else {
        currentLineLength += wordLength + avgCharWidth; // Add space
      }
    }
    
    return lineCount * lineHeight;
  }

  private addSectionTitle(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    color: string,
    requiredSpace: number = 80
  ): void {
    // Check if section title + minimum content fits
    this.checkPageBreak(doc, requiredSpace);
    
    doc
      .fontSize(14)
      .fillColor(color)
      .font('NotoSans-Bold')
      .text(title, 100, doc.y);
  }

  private addVerticalBorders(
    doc: InstanceType<typeof PDFDocument>,
    _greenColor: string
  ): void {
    // Lighter green for borders
    const borderColor = '#7a9175';

    // Left vertical line - 0.75px width, full page height
    doc
      .strokeColor(borderColor)
      .lineWidth(0.75)
      .moveTo(30, 0)
      .lineTo(30, 842)
      .stroke();

    // Second left line - 1.75px width with gap, full page height
    doc
      .strokeColor(borderColor)
      .lineWidth(1.75)
      .moveTo(33.5, 0)
      .lineTo(33.5, 842)
      .stroke();

    // Right vertical line - 0.75px width, full page height
    doc
      .strokeColor(borderColor)
      .lineWidth(0.75)
      .moveTo(565, 0)
      .lineTo(565, 842)
      .stroke();

    // Second right line - 1.75px width with gap, full page height
    doc
      .strokeColor(borderColor)
      .lineWidth(1.75)
      .moveTo(561.5, 0)
      .lineTo(561.5, 842)
      .stroke();
  }
}
