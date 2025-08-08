import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import logger from '../config/logger';
import { FontLoader } from '../utils/fontLoader';
import { DateFormatter } from '../utils/dateFormatter';

export interface CVMinimalistTurkishData {
  personalInfo: {
    address: string;
    city: string;
    email: string;
    firstName: string;
    github?: string;
    jobTitle?: string;
    lastName: string;
    linkedin?: string;
    medium?: string;
    phone: string;
    website?: string;
  };
  objective: string;
  experience: Array<{
    company: string;
    description: string;
    endDate: string;
    isCurrent: boolean;
    jobTitle: string;
    location: string;
    startDate: string;
  }>;
  education: Array<{
    degree: string;
    details?: string;
    field: string;
    graduationDate: string;
    location: string;
    startDate: string;
    university: string;
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
  skills?: string[];
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

export class CVTemplateMinimalistTurkishService {
  private static instance: CVTemplateMinimalistTurkishService;

  private constructor() {}

  public static getInstance(): CVTemplateMinimalistTurkishService {
    if (!CVTemplateMinimalistTurkishService.instance) {
      CVTemplateMinimalistTurkishService.instance =
        new CVTemplateMinimalistTurkishService();
    }
    return CVTemplateMinimalistTurkishService.instance;
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
        references: 'REFERENCES',
      };
    }
  }

  async generatePDF(data: CVMinimalistTurkishData): Promise<Buffer> {
    // Set default version if not specified
    if (!data.version) {
      data.version = 'global';
    }

    // Set default language based on version
    if (!data.language) {
      data.language = data.version === 'turkey' ? 'turkish' : 'english';
    }

    try {
      const doc = await FontLoader.createPDFDocument({
        size: 'A4',
        margin: 50,
      });

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
            'PDF generation error in minimalist turkish template:',
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
    data: CVMinimalistTurkishData
  ): void {
    const colors = { black: '#000000' };
    const headers = this.getSectionHeaders(data.language!);

    let yPosition = 50;

    this.addHeader(doc, data, colors, yPosition);
    yPosition = this.updateYPosition(yPosition, 65);

    if (data.objective) {
      yPosition = this.addObjectiveSection(
        doc,
        data.objective,
        headers.objective,
        colors,
        yPosition
      );
    }

    if (data.experience && data.experience.length > 0) {
      yPosition = this.addExperienceSection(
        doc,
        data.experience,
        headers.experience,
        colors,
        yPosition
      );
    }

    if (data.education && data.education.length > 0) {
      yPosition = this.addEducationSection(
        doc,
        data.education,
        headers.education,
        colors,
        yPosition
      );
    }

    if (data.version === 'turkey') {
      if (data.technicalSkills) {
        yPosition = this.addTechnicalSkillsSection(
          doc,
          data.technicalSkills,
          headers.technicalSkills,
          colors,
          yPosition
        );
      }

      if (data.projects && data.projects.length > 0) {
        yPosition = this.addProjectsSection(
          doc,
          data.projects,
          headers.projects,
          colors,
          yPosition
        );
      }

      if (data.certificates && data.certificates.length > 0) {
        yPosition = this.addCertificatesSection(
          doc,
          data.certificates,
          headers.certificates,
          colors,
          yPosition
        );
      }

      if (data.languages && data.languages.length > 0) {
        yPosition = this.addLanguagesSection(
          doc,
          data.languages,
          headers.languages,
          colors,
          yPosition
        );
      }
    } else {
      if (data.communication) {
        yPosition = this.addCommunicationSection(
          doc,
          data.communication,
          headers.communication,
          colors,
          yPosition
        );
      }

      if (data.leadership) {
        yPosition = this.addLeadershipSection(
          doc,
          data.leadership,
          headers.leadership,
          colors,
          yPosition
        );
      }
    }

    if (data.references && data.references.length > 0) {
      this.addReferencesSection(
        doc,
        data.references,
        headers.references,
        colors,
        yPosition
      );
    }
  }

  private addHeader(
    doc: InstanceType<typeof PDFDocument>,
    data: CVMinimalistTurkishData,
    colors: any,
    yPosition: number
  ): void {
    // Header with name - minimalist style
    const fullName = `${this.sanitizeText(data.personalInfo.firstName)} ${this.sanitizeText(data.personalInfo.lastName)}`;
    doc
      .fontSize(18)
      .fillColor(colors.black)
      .font('NotoSans-Bold')
      .text(fullName.toUpperCase(), 50, yPosition);

    // Contact information - clean single line format
    const contactInfo = [
      `${this.sanitizeText(data.personalInfo.address)}, ${this.sanitizeText(data.personalInfo.city)},`,
      this.sanitizeText(data.personalInfo.phone),
      this.sanitizeText(data.personalInfo.email),
    ]
      .filter(Boolean)
      .join(' – ');

    doc
      .fontSize(10)
      .fillColor(colors.black)
      .font('NotoSans')
      .text(contactInfo, 50, yPosition + 30, {
        width: 515,
      });
  }

  private addObjectiveSection(
    doc: InstanceType<typeof PDFDocument>,
    objective: string,
    title: string,
    colors: any,
    yPosition: number
  ): number {
    this.checkPageBreak(doc, yPosition, 80);
    this.addSectionHeader(doc, title, yPosition);
    yPosition += 20;

    const objectiveText = this.sanitizeText(objective);
    doc
      .fontSize(10)
      .fillColor(colors.black)
      .font('NotoSans')
      .text(objectiveText, 50, yPosition, {
        width: 515,
        align: 'justify',
        lineGap: 2,
      });

    return this.updateYPosition(
      yPosition,
      this.calculateTextHeight(doc, objectiveText, {
        width: 515,
        lineGap: 2,
      }) + 20
    );
  }

  private addExperienceSection(
    doc: InstanceType<typeof PDFDocument>,
    experience: any[],
    title: string,
    colors: any,
    yPosition: number
  ): number {
    this.checkPageBreak(doc, yPosition, 120);
    this.addSectionHeader(doc, title, yPosition);
    yPosition += 20;

    experience.forEach((exp) => {
      yPosition = this.checkPageBreak(doc, yPosition, 80);

      const jobTitle = this.sanitizeText(exp.jobTitle);
      doc
        .fontSize(11)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(jobTitle, 50, yPosition);
      yPosition += 15;

      const companyLocation = `${this.sanitizeText(exp.company)}, ${this.sanitizeText(exp.location)}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(companyLocation, 50, yPosition);
      yPosition += 15;

      const startDate = DateFormatter.formatDate(
        this.sanitizeText(exp.startDate)
      );
      const endDate = DateFormatter.formatDate(this.sanitizeText(exp.endDate));
      const dateRange = `${startDate} – ${endDate}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(dateRange, 50, yPosition);
      yPosition += 15;

      const description = this.sanitizeText(exp.description);
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(description, 50, yPosition, {
          width: 515,
          align: 'justify',
          lineGap: 2,
        });

      yPosition = this.updateYPosition(
        yPosition,
        this.calculateTextHeight(doc, description, {
          width: 515,
          lineGap: 2,
        }) + 20
      );
    });

    return yPosition;
  }

  private addEducationSection(
    doc: InstanceType<typeof PDFDocument>,
    education: any[],
    title: string,
    colors: any,
    yPosition: number
  ): number {
    this.checkPageBreak(doc, yPosition, 100);
    this.addSectionHeader(doc, title, yPosition);
    yPosition += 20;

    education.forEach((edu) => {
      yPosition = this.checkPageBreak(doc, yPosition, 70);

      const degree = this.sanitizeText(edu.degree);
      doc
        .fontSize(11)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(degree, 50, yPosition);
      yPosition += 15;

      const universityLocation = `${this.sanitizeText(edu.university)}, ${this.sanitizeText(edu.location)}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(universityLocation, 50, yPosition);
      yPosition += 15;

      const graduationDate = DateFormatter.formatGraduationDate(
        this.sanitizeText(edu.graduationDate)
      );
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(graduationDate, 50, yPosition);
      yPosition += 15;

      if (edu.details) {
        const details = this.sanitizeText(edu.details);
        doc
          .fontSize(10)
          .fillColor(colors.black)
          .font('NotoSans')
          .text(details, 50, yPosition, {
            width: 515,
            align: 'justify',
            lineGap: 2,
          });

        yPosition = this.updateYPosition(
          yPosition,
          this.calculateTextHeight(doc, details, {
            width: 515,
            lineGap: 2,
          }) + 15
        );
      }

      yPosition += 10;
    });

    return yPosition;
  }

  private addTechnicalSkillsSection(
    doc: InstanceType<typeof PDFDocument>,
    skills: any,
    title: string,
    colors: any,
    yPosition: number
  ): number {
    yPosition = this.checkPageBreak(doc, yPosition, 80);
    this.addSectionHeader(doc, title, yPosition);
    yPosition += 20;

    if (skills.frontend && skills.frontend.length > 0) {
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text('Frontend:', 50, yPosition);
      const frontendText = skills.frontend.join(', ');
      doc.font('NotoSans').text(frontendText, 120, yPosition, { width: 395 });
      yPosition += 15;
    }

    if (skills.backend && skills.backend.length > 0) {
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text('Backend:', 50, yPosition);
      const backendText = skills.backend.join(', ');
      doc.font('NotoSans').text(backendText, 120, yPosition, { width: 395 });
      yPosition += 15;
    }

    if (skills.database && skills.database.length > 0) {
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text('Database:', 50, yPosition);
      const databaseText = skills.database.join(', ');
      doc.font('NotoSans').text(databaseText, 120, yPosition, { width: 395 });
      yPosition += 15;
    }

    if (skills.tools && skills.tools.length > 0) {
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text('Tools:', 50, yPosition);
      const toolsText = skills.tools.join(', ');
      doc.font('NotoSans').text(toolsText, 120, yPosition, { width: 395 });
      yPosition += 15;
    }

    return yPosition + 15;
  }

  private addCommunicationSection(
    doc: InstanceType<typeof PDFDocument>,
    communication: string,
    title: string,
    colors: any,
    yPosition: number
  ): number {
    yPosition = this.checkPageBreak(doc, yPosition, 60);
    this.addSectionHeader(doc, title, yPosition);
    yPosition += 20;

    const communicationText = this.sanitizeText(communication);
    doc
      .fontSize(10)
      .fillColor(colors.black)
      .font('NotoSans')
      .text(communicationText, 50, yPosition, {
        width: 515,
        align: 'justify',
        lineGap: 2,
      });

    return this.updateYPosition(
      yPosition,
      this.calculateTextHeight(doc, communicationText, {
        width: 515,
        lineGap: 2,
      }) + 20
    );
  }

  private addProjectsSection(
    doc: InstanceType<typeof PDFDocument>,
    projects: any[],
    title: string,
    colors: any,
    yPosition: number
  ): number {
    yPosition = this.checkPageBreak(doc, yPosition, 80);
    this.addSectionHeader(doc, title, yPosition);
    yPosition += 20;

    projects.forEach((project) => {
      yPosition = this.checkPageBreak(doc, yPosition, 80);

      const projectName = this.sanitizeText(project.name);
      doc
        .fontSize(11)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(projectName, 50, yPosition);
      yPosition += 15;

      const technologies = this.sanitizeText(project.technologies);
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(technologies, 50, yPosition);
      yPosition += 15;

      const description = this.sanitizeText(project.description);
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(description, 50, yPosition, {
          width: 515,
          align: 'justify',
          lineGap: 2,
        });

      yPosition = this.updateYPosition(
        yPosition,
        this.calculateTextHeight(doc, description, {
          width: 515,
          lineGap: 2,
        }) + 20
      );
    });

    return yPosition;
  }

  private addLeadershipSection(
    doc: InstanceType<typeof PDFDocument>,
    leadership: string,
    title: string,
    colors: any,
    yPosition: number
  ): number {
    yPosition = this.checkPageBreak(doc, yPosition, 60);
    this.addSectionHeader(doc, title, yPosition);
    yPosition += 20;

    const leadershipText = this.sanitizeText(leadership);
    doc
      .fontSize(10)
      .fillColor(colors.black)
      .font('NotoSans')
      .text(leadershipText, 50, yPosition, {
        width: 515,
        align: 'justify',
        lineGap: 2,
      });

    return this.updateYPosition(
      yPosition,
      this.calculateTextHeight(doc, leadershipText, {
        width: 515,
        lineGap: 2,
      }) + 20
    );
  }

  private addCertificatesSection(
    doc: InstanceType<typeof PDFDocument>,
    certificates: any[],
    title: string,
    colors: any,
    yPosition: number
  ): number {
    yPosition = this.checkPageBreak(doc, yPosition, 80);
    this.addSectionHeader(doc, title, yPosition);
    yPosition += 20;

    certificates.forEach((cert) => {
      yPosition = this.checkPageBreak(doc, yPosition, 40);

      const certName = this.sanitizeText(cert.name);
      doc
        .fontSize(11)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(certName, 50, yPosition);
      yPosition += 15;

      const issuerDate = `${this.sanitizeText(cert.issuer)} – ${DateFormatter.formatDate(this.sanitizeText(cert.date))}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(issuerDate, 50, yPosition);
      yPosition += 25;
    });

    return yPosition + 5;
  }

  private addLanguagesSection(
    doc: InstanceType<typeof PDFDocument>,
    languages: any[],
    title: string,
    colors: any,
    yPosition: number
  ): number {
    yPosition = this.checkPageBreak(doc, yPosition, 60);
    this.addSectionHeader(doc, title, yPosition);
    yPosition += 20;

    languages.forEach((lang) => {
      const languageLevel = `${this.sanitizeText(lang.language)} – ${this.sanitizeText(lang.level)}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(languageLevel, 50, yPosition);
      yPosition += 18;
    });

    return yPosition + 10;
  }

  private addReferencesSection(
    doc: InstanceType<typeof PDFDocument>,
    references: any[],
    title: string,
    colors: any,
    yPosition: number
  ): number {
    yPosition = this.checkPageBreak(doc, yPosition, 80);
    this.addSectionHeader(doc, title, yPosition);
    yPosition += 20;

    references.forEach((ref) => {
      yPosition = this.checkPageBreak(doc, yPosition, 40);

      const name = this.sanitizeText(ref.name);
      doc
        .fontSize(11)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(name, 50, yPosition);
      yPosition += 15;

      const companyContact = `${this.sanitizeText(ref.company)} – ${this.sanitizeText(ref.contact)}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(companyContact, 50, yPosition);
      yPosition += 25;
    });

    return yPosition;
  }

  private checkPageBreak(
    doc: InstanceType<typeof PDFDocument>,
    yPosition: number,
    requiredSpace: number
  ): number {
    if (yPosition + requiredSpace > 720) {
      doc.addPage();
      return 50;
    }
    return yPosition;
  }

  private updateYPosition(currentY: number, increment: number): number {
    return currentY + increment;
  }

  private addSectionHeader(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    yPosition: number
  ): void {
    doc
      .fontSize(12)
      .fillColor('#000000')
      .font('NotoSans-Bold')
      .text(title, 50, yPosition, {
        underline: true,
        width: 515,
      });
  }

  private calculateTextHeight(
    doc: InstanceType<typeof PDFDocument>,
    text: string,
    options: any = {}
  ): number {
    try {
      if (!text || typeof text !== 'string') {
        return 0;
      }
      const height = doc.heightOfString(text, options);
      return height || 0;
    } catch (error) {
      logger.error('Error calculating text height:', error);
      return 20;
    }
  }
}
