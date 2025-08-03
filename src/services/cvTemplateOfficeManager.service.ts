/* eslint-disable prefer-const */
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import logger from '../config/logger';
import { FontLoader } from '../utils/fontLoader';
import { DateFormatter } from '../utils/dateFormatter';

export interface CVOfficeManagerData {
  personalInfo: {
    firstName: string;
    lastName: string;
    jobTitle?: string;
    linkedin?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string;
    email: string;
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
    startDate?: string;
    graduationDate: string;
    details?: string;
    field?: string;
  }>;
  // Global version fields
  communication?: string;
  leadership?: string;
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

export class CVTemplateOfficeManagerService {
  private static instance: CVTemplateOfficeManagerService;

  private constructor() {}

  public static getInstance(): CVTemplateOfficeManagerService {
    if (!CVTemplateOfficeManagerService.instance) {
      CVTemplateOfficeManagerService.instance =
        new CVTemplateOfficeManagerService();
    }
    return CVTemplateOfficeManagerService.instance;
  }

  private generateFileName(
    firstName: string,
    lastName: string,
    version: 'global' | 'turkey'
  ): string {
    // Clean name for file naming (remove special characters, spaces)
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
        references: 'REFERENCES',
      };
    }
  }

  async generatePDF(data: CVOfficeManagerData): Promise<Buffer> {
    if (!data.version) {
      data.version = 'global';
    }

    if (!data.language) {
      data.language = data.version === 'turkey' ? 'turkish' : 'english';
    }

    try {
      const doc = await FontLoader.createPDFDocument();

      const fullName = `${this.sanitizeText(data.personalInfo.firstName)} ${this.sanitizeText(data.personalInfo.lastName)}`;
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
              data.personalInfo.firstName,
              data.personalInfo.lastName,
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
            'PDF generation error in office_manager template:',
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
    data: CVOfficeManagerData
  ): void {
    const colors = { black: '#000000', gray: '#333333' };
    const headers = this.getSectionHeaders(data.language!);
    const margins = { left: 50, right: 545 };

    doc.x = margins.left;
    doc.y = 30;

    this.addHeader(doc, data, colors);
    doc.moveDown(1);

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
      this.addSectionSeparator(doc, margins);
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
        this.addSectionSeparator(doc, margins);
        doc.moveDown(1);
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
        this.addSectionSeparator(doc, margins);
        doc.moveDown(1);
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
        this.addSectionSeparator(doc, margins);
        doc.moveDown(1);
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
        this.addSectionSeparator(doc, margins);
        doc.moveDown(1);
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
      if (data.communication) {
        this.addSectionSeparator(doc, margins);
        doc.moveDown(1);
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
        this.addSectionSeparator(doc, margins);
        doc.moveDown(1);
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

    if (data.references && data.references.length > 0 && doc.y < 720) {
      this.addSectionSeparator(doc, margins);
      doc.moveDown(1);
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
    data: CVOfficeManagerData,
    colors: any
  ): void {
    const firstName = this.sanitizeText(data.personalInfo.firstName);
    const lastName = this.sanitizeText(data.personalInfo.lastName);
    const margins = { left: 50, right: 545 };

    const firstNameY = doc.y;
    doc
      .fontSize(48)
      .fillColor(colors.black)
      .font('NotoSans-Bold')
      .text(firstName, 50, firstNameY);

    doc.text(lastName, 50, firstNameY + 45);
    doc.moveDown(0.3);

    const jobTitle = this.sanitizeText(
      data.personalInfo.jobTitle || 'OFFICE MANAGER'
    ).toUpperCase();
    doc.fontSize(14).font('NotoSans-Bold').text(jobTitle, 50, doc.y);

    const email = this.sanitizeText(data.personalInfo.email);
    const phone = this.sanitizeText(data.personalInfo.phone);
    const linkedin = data.personalInfo.linkedin
      ? this.sanitizeText(data.personalInfo.linkedin)
      : 'LinkedIn profile';

    doc.moveDown(0.4);
    this.addSeparator(doc, margins);
    doc.moveDown(0.6);

    const contactY = doc.y;

    // Email - left aligned
    doc.fontSize(11).font('NotoSans').text(email, margins.left, contactY);

    // Phone - center aligned
    const phoneWidth = doc.widthOfString(phone);
    const centerX = (margins.left + margins.right) / 2 - phoneWidth / 2;
    doc.text(phone, centerX, contactY);

    // LinkedIn - right aligned, full URL
    const linkedinWidth = doc.widthOfString(linkedin);
    const linkedinStartX = margins.right - linkedinWidth;
    doc.text(linkedin, linkedinStartX, contactY);

    doc.moveDown(0.6);
    this.addSeparator(doc, margins);
  }

  private addSeparator(
    doc: InstanceType<typeof PDFDocument>,
    margins: any
  ): void {
    doc
      .strokeColor('#000000')
      .lineWidth(0.275)
      .moveTo(margins.left, doc.y)
      .lineTo(margins.right, doc.y)
      .stroke();
  }

  private addSectionSeparator(
    doc: InstanceType<typeof PDFDocument>,
    margins: any
  ): void {
    const separatorLength = 145; // Daha kısa çizgi
    const startX = margins.left;
    doc
      .strokeColor('#000000')
      .lineWidth(0.275)
      .moveTo(startX, doc.y)
      .lineTo(startX + separatorLength, doc.y)
      .stroke();
  }

  private addExperienceSection(
    doc: InstanceType<typeof PDFDocument>,
    experience: any[],
    title: string,
    colors: any,
    margins: any,
    language: 'turkish' | 'english'
  ): void {
    this.addSectionTitle(doc, title, colors.black);
    doc.moveDown(0.4);

    experience.forEach((exp, index) => {
      if (index > 0) doc.moveDown(0.6);

      const startDate = DateFormatter.formatDate(
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
        const endDate = DateFormatter.formatDate(
          this.sanitizeText(exp.endDate)
        );
        dateRange = `${startDate} - ${endDate}`;
      }

      doc.fontSize(11).font('NotoSans').text(dateRange, margins.left, doc.y);
      doc.moveDown(0.3);

      const jobTitle = this.sanitizeText(exp.jobTitle);
      const company = this.sanitizeText(exp.company);

      doc
        .fontSize(11)
        .font('NotoSans-Bold')
        .fillColor(colors.black)
        .text(`${jobTitle}, `, margins.left, doc.y, { continued: true })
        .fontSize(11)
        .font('NotoSans')
        .fillColor(colors.gray)
        .text(company, { continued: false });
      doc.moveDown(0.5);

      const description = this.sanitizeText(exp.description);
      doc
        .fontSize(11)
        .font('NotoSans')
        .fillColor(colors.black)
        .text(description, margins.left, doc.y, {
          width: margins.right - margins.left,
          align: 'justify',
          lineGap: 2,
        });
      doc.moveDown(0.3);
    });
  }

  private addEducationSection(
    doc: InstanceType<typeof PDFDocument>,
    education: any[],
    title: string,
    colors: any,
    margins: any
  ): void {
    this.addSectionTitle(doc, title, colors.black);
    doc.moveDown(0.4);

    education.forEach((edu, index) => {
      if (index > 0) doc.moveDown(0.4);

      // Date formatting
      const gradDate = this.sanitizeText(edu.graduationDate);
      const startDate = this.sanitizeText(edu.startDate || '');
      let dateText = '';

      if (startDate) {
        const formattedStart = DateFormatter.formatDate(startDate);
        const formattedGrad = DateFormatter.formatGraduationDate(gradDate);
        dateText = `${formattedStart} - ${formattedGrad}`;
      } else {
        dateText = DateFormatter.formatGraduationDate(gradDate);
      }

      doc.fontSize(11).font('NotoSans').text(dateText, margins.left, doc.y);
      doc.moveDown(0.5);

      const degree = this.sanitizeText(edu.degree);
      const field = edu.field ? this.sanitizeText(edu.field) : '';
      const university = this.sanitizeText(edu.university);

      // Bold degree, normal field, normal university
      doc
        .fontSize(12)
        .font('NotoSans-Bold')
        .text(`${degree}`, margins.left, doc.y, { continued: true });

      if (field) {
        doc.font('NotoSans').text(`, ${field}`, { continued: true });
      }

      doc.font('NotoSans').text(`, ${university}`, { continued: false });

      doc.moveDown(0.3);
    });
  }

  private addTechnicalSkillsSection(
    doc: InstanceType<typeof PDFDocument>,
    skills: any,
    title: string,
    colors: any,
    margins: any
  ): void {
    this.addSectionTitle(doc, title, colors.black);
    doc.moveDown(0.4);

    if (skills.frontend?.length) {
      doc
        .fontSize(11)
        .font('NotoSans-Bold')
        .text('Frontend:', margins.left, doc.y, { continued: true });
      doc
        .fontSize(11)
        .font('NotoSans')
        .text(` ${skills.frontend.join(', ')}`, { continued: false });
      doc.moveDown(0.4);
    }

    if (skills.backend?.length) {
      doc
        .fontSize(11)
        .font('NotoSans-Bold')
        .text('Backend:', margins.left, doc.y, { continued: true });
      doc
        .fontSize(11)
        .font('NotoSans')
        .text(` ${skills.backend.join(', ')}`, { continued: false });
      doc.moveDown(0.4);
    }

    if (skills.database?.length) {
      doc
        .fontSize(11)
        .font('NotoSans-Bold')
        .text('Database:', margins.left, doc.y, { continued: true });
      doc
        .fontSize(11)
        .font('NotoSans')
        .text(` ${skills.database.join(', ')}`, { continued: false });
      doc.moveDown(0.4);
    }

    if (skills.tools?.length) {
      doc
        .fontSize(11)
        .font('NotoSans-Bold')
        .text('Tools:', margins.left, doc.y, { continued: true });
      doc
        .fontSize(11)
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
    this.addSectionTitle(doc, title, colors.black);
    doc.moveDown(0.4);

    projects.forEach((project, index) => {
      if (index > 0) doc.moveDown(0.3);

      const projectName = this.sanitizeText(project.name);
      const technologies = this.sanitizeText(project.technologies);

      const currentY = doc.y;
      doc
        .fontSize(11)
        .font('NotoSans-Bold')
        .text(projectName, margins.left, currentY);

      const techWidth = doc.widthOfString(technologies);
      doc
        .fontSize(11)
        .font('NotoSans')
        .text(technologies, margins.right - techWidth, currentY);
      doc.moveDown(0.8);

      const description = this.sanitizeText(project.description);
      doc
        .fontSize(11)
        .font('NotoSans')
        .text(description, margins.left, doc.y, {
          width: margins.right - margins.left,
          align: 'justify',
          lineGap: 2,
        });
      doc.moveDown(0.6);
    });
  }

  private addCommunicationSection(
    doc: InstanceType<typeof PDFDocument>,
    communication: string,
    title: string,
    colors: any,
    margins: any
  ): void {
    this.addSectionTitle(doc, title, colors.black);
    doc.moveDown(0.4);

    const text = this.sanitizeText(communication);
    doc
      .fontSize(11)
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
    this.addSectionTitle(doc, title, colors.black);
    doc.moveDown(0.4);

    const text = this.sanitizeText(leadership);
    doc
      .fontSize(11)
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
    this.addSectionTitle(doc, title, colors.black);
    doc.moveDown(0.4);

    certificates.forEach((cert, index) => {
      if (index > 0) doc.moveDown(0.5);

      const certName = this.sanitizeText(cert.name);
      const issuer = this.sanitizeText(cert.issuer);
      const certDate = DateFormatter.formatDate(this.sanitizeText(cert.date));

      const currentY = doc.y;
      doc
        .fontSize(11)
        .font('NotoSans-Bold')
        .text(certName, margins.left, currentY);

      const dateWidth = doc.widthOfString(certDate);
      doc
        .fontSize(11)
        .font('NotoSans')
        .text(certDate, margins.right - dateWidth, currentY);

      doc.moveDown(0.3);
      doc.fontSize(11).font('NotoSans').text(issuer, margins.left, doc.y);
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
    this.addSectionTitle(doc, title, colors.black);
    doc.moveDown(0.4);

    const languageEntries = languages
      .map(
        (lang) =>
          `${this.sanitizeText(lang.language)}: ${this.sanitizeText(lang.level)}`
      )
      .join(' • ');

    doc
      .fontSize(11)
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
    this.addSectionTitle(doc, title, colors.black);
    doc.moveDown(0.4);

    references.forEach((ref, index) => {
      if (index > 0) doc.moveDown(0.3);

      const refText = `${this.sanitizeText(ref.name)} - ${this.sanitizeText(ref.company)} | ${this.sanitizeText(ref.contact)}`;
      doc
        .fontSize(10)
        .font('NotoSans')
        .text(refText, margins.left, doc.y, {
          width: margins.right - margins.left,
        });
    });
  }

  private addSectionTitle(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    color: string
  ): void {
    doc
      .fontSize(14)
      .fillColor(color)
      .font('NotoSans-Bold')
      .text(title, 50, doc.y);
  }
}
