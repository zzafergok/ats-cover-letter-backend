import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import logger from '../config/logger';
import { FontLoader } from '../utils/fontLoader';
import { DateFormatter } from '../utils/dateFormatter';
import { shortenUrlForDisplay } from '../utils/urlShortener';

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
        skills: 'SKILLS',
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

    // Page dimensions: A4 = 595x842 points
    const pageWidth = 545; // 595 - 50 margin
    const marginLeft = pageWidth * 0.05; // 5% left side
    const marginRight = pageWidth * 0.125; // 12.5% right side
    const contentWidth = pageWidth - marginLeft - marginRight;

    // Two-column layout settings (17.5% - 82.5%)
    const leftColumnX = 50 + marginLeft;
    const leftColumnWidth = contentWidth * 0.175;
    const rightColumnX = leftColumnX + leftColumnWidth + 20; // 20px gap
    const rightColumnWidth = contentWidth * 0.825 - 20;

    let currentY = 50;

    // Add header only in right column (wide)
    this.addMainHeader(
      doc,
      data,
      colors,
      rightColumnX,
      currentY,
      rightColumnWidth
    );
    currentY += 120; // Increased space after header

    // Add sections with title-content layout
    if (data.objective) {
      currentY = this.addTwoColumnSection(
        doc,
        headers.objective,
        data.objective,
        'text',
        colors,
        currentY,
        leftColumnX,
        leftColumnWidth,
        rightColumnX,
        rightColumnWidth
      );
    }

    if (data.experience && data.experience.length > 0) {
      currentY = this.addTwoColumnSection(
        doc,
        headers.experience,
        data.experience,
        'experience',
        colors,
        currentY,
        leftColumnX,
        leftColumnWidth,
        rightColumnX,
        rightColumnWidth
      );
    }

    if (data.education && data.education.length > 0) {
      currentY = this.addTwoColumnSection(
        doc,
        headers.education,
        data.education,
        'education',
        colors,
        currentY,
        leftColumnX,
        leftColumnWidth,
        rightColumnX,
        rightColumnWidth
      );
    }

    if (data.version === 'turkey') {
      if (data.technicalSkills) {
        currentY = this.addTwoColumnSection(
          doc,
          headers.technicalSkills,
          data.technicalSkills,
          'technicalSkills',
          colors,
          currentY,
          leftColumnX,
          leftColumnWidth,
          rightColumnX,
          rightColumnWidth
        );
      }

      if (data.projects && data.projects.length > 0) {
        currentY = this.addTwoColumnSection(
          doc,
          headers.projects,
          data.projects,
          'projects',
          colors,
          currentY,
          leftColumnX,
          leftColumnWidth,
          rightColumnX,
          rightColumnWidth
        );
      }

      if (data.certificates && data.certificates.length > 0) {
        currentY = this.addTwoColumnSection(
          doc,
          headers.certificates,
          data.certificates,
          'certificates',
          colors,
          currentY,
          leftColumnX,
          leftColumnWidth,
          rightColumnX,
          rightColumnWidth
        );
      }

      if (data.languages && data.languages.length > 0) {
        currentY = this.addTwoColumnSection(
          doc,
          headers.languages,
          data.languages,
          'languages',
          colors,
          currentY,
          leftColumnX,
          leftColumnWidth,
          rightColumnX,
          rightColumnWidth
        );
      }
    } else {
      if (data.communication) {
        currentY = this.addTwoColumnSection(
          doc,
          headers.communication,
          data.communication,
          'text',
          colors,
          currentY,
          leftColumnX,
          leftColumnWidth,
          rightColumnX,
          rightColumnWidth
        );
      }

      if (data.leadership) {
        currentY = this.addTwoColumnSection(
          doc,
          headers.leadership,
          data.leadership,
          'text',
          colors,
          currentY,
          leftColumnX,
          leftColumnWidth,
          rightColumnX,
          rightColumnWidth
        );
      }

      if (data.skills && data.skills.length > 0) {
        currentY = this.addTwoColumnSection(
          doc,
          headers.skills!,
          data.skills,
          'skills',
          colors,
          currentY,
          leftColumnX,
          leftColumnWidth,
          rightColumnX,
          rightColumnWidth
        );
      }
    }

    if (data.references && data.references.length > 0) {
      currentY = this.addTwoColumnSection(
        doc,
        headers.references,
        data.references,
        'references',
        colors,
        currentY,
        leftColumnX,
        leftColumnWidth,
        rightColumnX,
        rightColumnWidth
      );
    }
  }

  private renderContactInfoWithSmartWrapping(
    doc: InstanceType<typeof PDFDocument>,
    contactInfoParts: string[],
    urlInfoParts: Array<{ display: string; url: string; platform: string }>,
    startX: number,
    startY: number,
    maxWidth: number,
    textColor: string
  ): number {
    const fontSize = 10;
    const fontFamily = 'NotoSans';
    const lineHeight = 15;
    let currentY = startY;

    doc.fontSize(fontSize).font(fontFamily).fillColor(textColor);

    // Group parts into lines based on available width
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentLineWidth = 0;

    for (let i = 0; i < contactInfoParts.length; i++) {
      const part = contactInfoParts[i];
      const partWidth = doc.widthOfString(part);
      const separatorWidth =
        i < contactInfoParts.length - 1 ? doc.widthOfString(' | ') : 0;
      const totalPartWidth = partWidth + separatorWidth;

      // Check if adding this part would exceed the line width
      if (
        currentLineWidth + totalPartWidth > maxWidth &&
        currentLine.length > 0
      ) {
        lines.push([...currentLine]);
        currentLine = [part];
        currentLineWidth = partWidth + separatorWidth;
      } else {
        currentLine.push(part);
        currentLineWidth += totalPartWidth;
      }
    }

    // Add the last line if it has content
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Render each line with hyperlinks
    lines.forEach((line) => {
      let currentX = startX;

      line.forEach((part, partIndex) => {
        // Draw the text part
        doc.text(part, currentX, currentY);

        // Add hyperlink if this part is a URL or email
        const urlInfo = urlInfoParts.find((ui) => ui.display === part);
        if (urlInfo) {
          const actualPartWidth = doc.widthOfString(part);
          doc.link(
            currentX,
            currentY,
            actualPartWidth,
            fontSize + 2,
            urlInfo.url
          );
        }

        // Move to next position
        currentX += doc.widthOfString(part);

        // Add separator if not the last part in the line
        if (partIndex < line.length - 1) {
          doc.text(' | ', currentX, currentY);
          currentX += doc.widthOfString(' | ');
        }
      });

      currentY += lineHeight;
    });

    return currentY;
  }

  private addMainHeader(
    doc: InstanceType<typeof PDFDocument>,
    data: CVMinimalistTurkishData,
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): void {
    const fullName = `${this.sanitizeText(data.personalInfo.firstName)} ${this.sanitizeText(data.personalInfo.lastName)}`;

    // Name - centered in the wide column
    doc
      .fontSize(20)
      .fillColor(colors.black)
      .font('NotoSans-Bold')
      .text(fullName.toUpperCase(), xPosition, yPosition, {
        width: columnWidth,
        align: 'left',
      });

    // Contact information - professional order with smart line wrapping
    const contactInfoParts: string[] = [
      `${this.sanitizeText(data.personalInfo.address)}, ${this.sanitizeText(data.personalInfo.city)}`,
      this.sanitizeText(data.personalInfo.phone),
      this.sanitizeText(data.personalInfo.email),
    ];

    // Add shortened URLs for social links with hyperlink info
    const socialFields = [
      { key: 'website', value: data.personalInfo.website },
      { key: 'linkedin', value: data.personalInfo.linkedin },
      { key: 'github', value: data.personalInfo.github },
      { key: 'medium', value: data.personalInfo.medium },
    ];

    const urlInfoParts: Array<{ display: string; url: string; platform: string }> = [];

    socialFields.forEach((field) => {
      if (field.value) {
        try {
          const shortUrl = shortenUrlForDisplay(field.value);
          contactInfoParts.push(this.sanitizeText(shortUrl.displayText));
          urlInfoParts.push({
            display: this.sanitizeText(shortUrl.displayText),
            url: shortUrl.fullUrl,
            platform: shortUrl.platform || 'unknown',
          });
        } catch (error) {
          logger.warn(`Invalid ${field.key} URL format: ${field.value}`, {
            error,
          });
          contactInfoParts.push(this.sanitizeText(field.value));
        }
      }
    });

    // Add email as clickable link too
    if (data.personalInfo.email) {
      urlInfoParts.push({
        display: this.sanitizeText(data.personalInfo.email),
        url: `mailto:${data.personalInfo.email}`,
        platform: 'email',
      });
    }

    // Add website as clickable link if it exists separately
    if (data.personalInfo.website) {
      const websiteDisplay = this.sanitizeText(data.personalInfo.website);
      // Check if website is not already in urlInfoParts (to avoid duplicates)
      const websiteExists = urlInfoParts.find(info => info.display === websiteDisplay);
      if (!websiteExists) {
        // Ensure website has proper protocol
        const websiteUrl = data.personalInfo.website.startsWith('http') 
          ? data.personalInfo.website 
          : `https://${data.personalInfo.website}`;
        
        urlInfoParts.push({
          display: websiteDisplay,
          url: websiteUrl,
          platform: 'website',
        });
      }
    }

    const finalContactParts = contactInfoParts.filter(Boolean);

    // Smart line wrapping for contact info with hyperlinks
    const contactEndY = this.renderContactInfoWithSmartWrapping(
      doc,
      finalContactParts,
      urlInfoParts,
      xPosition,
      yPosition + 35,
      columnWidth,
      colors.black
    );

    // Underline - spans the column width with proper spacing below text
    doc
      .moveTo(xPosition, contactEndY + 10)
      .lineTo(xPosition + columnWidth, contactEndY + 10)
      .stroke(colors.black);
  }

  private addTwoColumnSection(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    content: any,
    contentType:
      | 'text'
      | 'experience'
      | 'education'
      | 'technicalSkills'
      | 'projects'
      | 'certificates'
      | 'languages'
      | 'skills'
      | 'references',
    colors: any,
    yPosition: number,
    leftX: number,
    leftWidth: number,
    rightX: number,
    rightWidth: number
  ): number {
    // Check if we need a page break
    yPosition = this.checkPageBreak(doc, yPosition, 60);

    // Add title in left column
    doc
      .fontSize(11)
      .fillColor(colors.black)
      .font('NotoSans-Bold')
      .text(title, leftX, yPosition, {
        width: leftWidth,
        align: 'left',
      });

    // Add content in right column
    const contentHeight = this.addContentByType(
      doc,
      content,
      contentType,
      colors,
      rightX,
      yPosition,
      rightWidth
    );

    return yPosition + Math.max(25, contentHeight) + 15; // Space between sections
  }

  private addContentByType(
    doc: InstanceType<typeof PDFDocument>,
    content: any,
    contentType: string,
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): number {
    switch (contentType) {
      case 'text':
        return this.addTextContent(
          doc,
          content,
          colors,
          xPosition,
          yPosition,
          columnWidth
        );
      case 'experience':
        return this.addExperienceContent(
          doc,
          content,
          colors,
          xPosition,
          yPosition,
          columnWidth
        );
      case 'education':
        return this.addEducationContent(
          doc,
          content,
          colors,
          xPosition,
          yPosition,
          columnWidth
        );
      case 'technicalSkills':
        return this.addTechnicalSkillsContent(
          doc,
          content,
          colors,
          xPosition,
          yPosition,
          columnWidth
        );
      case 'skills':
        return this.addSkillsContent(
          doc,
          content,
          colors,
          xPosition,
          yPosition,
          columnWidth
        );
      case 'projects':
        return this.addProjectsContent(
          doc,
          content,
          colors,
          xPosition,
          yPosition,
          columnWidth
        );
      case 'certificates':
        return this.addCertificatesContent(
          doc,
          content,
          colors,
          xPosition,
          yPosition,
          columnWidth
        );
      case 'languages':
        return this.addLanguagesContent(
          doc,
          content,
          colors,
          xPosition,
          yPosition,
          columnWidth
        );
      case 'references':
        return this.addReferencesContent(
          doc,
          content,
          colors,
          xPosition,
          yPosition,
          columnWidth
        );
      default:
        return 25;
    }
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

  // Content rendering methods for two-column layout
  private addTextContent(
    doc: InstanceType<typeof PDFDocument>,
    text: string,
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): number {
    const content = this.sanitizeText(text);
    doc
      .fontSize(10)
      .fillColor(colors.black)
      .font('NotoSans')
      .text(content, xPosition, yPosition, {
        width: columnWidth,
        align: 'justify',
        lineGap: 2,
      });

    return this.calculateTextHeight(doc, content, {
      width: columnWidth,
      lineGap: 2,
    });
  }

  private addExperienceContent(
    doc: InstanceType<typeof PDFDocument>,
    experiences: any[],
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): number {
    let currentY = yPosition;

    experiences.forEach((exp, index) => {
      if (index > 0) currentY += 12; // Reduced space between entries

      // Job title with date range on the right
      const jobTitle = this.sanitizeText(exp.jobTitle);
      const jobTitleY = currentY;
      doc
        .fontSize(11)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(jobTitle, xPosition, jobTitleY);

      // Date range on the right side of the same row
      const startDate = DateFormatter.formatDate(
        this.sanitizeText(exp.startDate)
      );
      let dateRange: string;

      if (
        exp.isCurrent ||
        !exp.endDate ||
        exp.endDate.toLowerCase().includes('günümüz') ||
        exp.endDate.toLowerCase().includes('current')
      ) {
        const currentText = 'Present'; // Always use English for consistency
        dateRange = `${startDate} – ${currentText}`;
      } else {
        const endDate = DateFormatter.formatDate(
          this.sanitizeText(exp.endDate)
        );
        dateRange = `${startDate} – ${endDate}`;
      }

      const dateWidth = doc.widthOfString(dateRange);
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(dateRange, xPosition + columnWidth - dateWidth, jobTitleY);

      currentY += 15;

      // Company - Location (with short space below job title)
      const companyLocation = `${this.sanitizeText(exp.company)} - ${this.sanitizeText(exp.location)}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(companyLocation, xPosition, currentY);
      currentY += 22; // Even more space before description

      // Description with more spacing
      const description = this.sanitizeText(exp.description);
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(description, xPosition, currentY, {
          width: columnWidth,
          align: 'justify',
          lineGap: 2,
        });

      currentY +=
        this.calculateTextHeight(doc, description, {
          width: columnWidth,
          lineGap: 2,
        }) + 10; // Extra space after description
    });

    return currentY - yPosition;
  }

  private addEducationContent(
    doc: InstanceType<typeof PDFDocument>,
    educations: any[],
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): number {
    let currentY = yPosition;

    educations.forEach((edu, index) => {
      if (index > 0) currentY += 12; // Consistent spacing with experience

      // Degree with graduation date on the right
      const degree = this.sanitizeText(edu.degree);
      const degreeY = currentY;
      doc
        .fontSize(11)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(degree, xPosition, degreeY);

      // Education date range on the right side of the same row
      const startDate = DateFormatter.formatDate(
        this.sanitizeText(edu.startDate)
      );
      const graduationDate = DateFormatter.formatGraduationDate(
        this.sanitizeText(edu.graduationDate)
      );
      const educationDateRange = `${startDate} – ${graduationDate}`;
      const dateWidth = doc.widthOfString(educationDateRange);
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(educationDateRange, xPosition + columnWidth - dateWidth, degreeY);

      currentY += 15;

      // University - Location (with short space below degree)
      const universityLocation = `${this.sanitizeText(edu.university)} - ${this.sanitizeText(edu.location)}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(universityLocation, xPosition, currentY);
      currentY += 18; // More space before details

      // Details if available
      if (edu.details) {
        const details = this.sanitizeText(edu.details);
        doc
          .fontSize(10)
          .fillColor(colors.black)
          .font('NotoSans')
          .text(details, xPosition, currentY, {
            width: columnWidth,
            align: 'justify',
            lineGap: 2,
          });

        currentY +=
          this.calculateTextHeight(doc, details, {
            width: columnWidth,
            lineGap: 2,
          }) + 10; // Extra space after details
      }
    });

    return currentY - yPosition;
  }

  private addTechnicalSkillsContent(
    doc: InstanceType<typeof PDFDocument>,
    skills: any,
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): number {
    let currentY = yPosition;

    const skillCategories = [
      { key: 'frontend', label: 'Frontend:' },
      { key: 'backend', label: 'Backend:' },
      { key: 'database', label: 'Database:' },
      { key: 'tools', label: 'Tools:' },
    ];

    skillCategories.forEach((category, index) => {
      if (skills[category.key] && skills[category.key].length > 0) {
        if (index > 0) currentY += 5; // Space between skill categories

        doc
          .fontSize(10)
          .fillColor(colors.black)
          .font('NotoSans-Bold')
          .text(category.label, xPosition, currentY);

        const skillsText = skills[category.key].join(', ');
        doc.font('NotoSans').text(skillsText, xPosition + 70, currentY, {
          width: columnWidth - 70,
        });
        currentY += 18; // More space between lines
      }
    });

    return currentY - yPosition;
  }

  private addSkillsContent(
    doc: InstanceType<typeof PDFDocument>,
    skills: string[],
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): number {
    let currentY = yPosition;
    const skillsPerLine = 3;

    for (let i = 0; i < skills.length; i += skillsPerLine) {
      const lineSkills = skills.slice(i, i + skillsPerLine);
      const skillsText = lineSkills.join(' • ');

      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(skillsText, xPosition, currentY, {
          width: columnWidth,
          align: 'left',
        });

      currentY += 15;
    }

    return currentY - yPosition;
  }

  private addProjectsContent(
    doc: InstanceType<typeof PDFDocument>,
    projects: any[],
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): number {
    let currentY = yPosition;

    projects.forEach((project, index) => {
      if (index > 0) currentY += 12; // Consistent spacing with other sections

      const projectName = this.sanitizeText(project.name);
      doc
        .fontSize(11)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(projectName, xPosition, currentY);
      currentY += 18; // Reduced space after project name

      // Handle technologies as either string or array
      const technologies = Array.isArray(project.technologies)
        ? project.technologies.join(', ')
        : this.sanitizeText(project.technologies);
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(technologies, xPosition, currentY);
      currentY += 20; // Normal space before description

      const description = this.sanitizeText(project.description);
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(description, xPosition, currentY, {
          width: columnWidth,
          align: 'justify',
          lineGap: 2,
        });

      currentY += this.calculateTextHeight(doc, description, {
        width: columnWidth,
        lineGap: 2,
      });
    });

    return currentY - yPosition;
  }

  private addCertificatesContent(
    doc: InstanceType<typeof PDFDocument>,
    certificates: any[],
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): number {
    let currentY = yPosition;

    certificates.forEach((cert, index) => {
      if (index > 0) currentY += 15;

      const certName = this.sanitizeText(cert.name);
      doc
        .fontSize(11)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(certName, xPosition, currentY);
      currentY += 15;

      const issuerDate = `${this.sanitizeText(cert.issuer)} – ${DateFormatter.formatDate(this.sanitizeText(cert.date))}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(issuerDate, xPosition, currentY);
      currentY += 15;
    });

    return currentY - yPosition;
  }

  private addLanguagesContent(
    doc: InstanceType<typeof PDFDocument>,
    languages: any[],
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): number {
    let currentY = yPosition;

    languages.forEach((lang) => {
      const languageLevel = `${this.sanitizeText(lang.language)} – ${this.sanitizeText(lang.level)}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(languageLevel, xPosition, currentY);
      currentY += 15;
    });

    return currentY - yPosition;
  }

  private addReferencesContent(
    doc: InstanceType<typeof PDFDocument>,
    references: any[],
    colors: any,
    xPosition: number,
    yPosition: number,
    columnWidth: number
  ): number {
    let currentY = yPosition;

    references.forEach((ref, index) => {
      if (index > 0) currentY += 12; // Reduced space between references

      const name = this.sanitizeText(ref.name);
      doc
        .fontSize(11)
        .fillColor(colors.black)
        .font('NotoSans-Bold')
        .text(name, xPosition, currentY);
      currentY += 15;

      const companyContact = `${this.sanitizeText(ref.company)} – ${this.sanitizeText(ref.contact)}`;
      doc
        .fontSize(10)
        .fillColor(colors.black)
        .font('NotoSans')
        .text(companyContact, xPosition, currentY);
      currentY += 20;
    });

    return currentY - yPosition;
  }
}
