import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

import logger from '../config/logger';

import { FontLoader } from '../utils/fontLoader';
import { DateFormatter } from '../utils/dateFormatter';
import { shortenUrlForDisplay } from '../utils/urlShortener';
import { getSectionHeaders } from '../utils/cvSectionHeaders';

import { CVTemplateData } from '../types';

export class CVTemplateBasicHRService {
  private static instance: CVTemplateBasicHRService;

  private constructor() {}

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

  public static getInstance(): CVTemplateBasicHRService {
    if (!CVTemplateBasicHRService.instance) {
      CVTemplateBasicHRService.instance = new CVTemplateBasicHRService();
    }
    return CVTemplateBasicHRService.instance;
  }

  /**
   * Metni güvenli şekilde temizle
   */
  private sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }
    return text.trim();
  }

  async generatePDF(data: CVTemplateData): Promise<Buffer> {
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
          logger.error('PDF generation error in basic_hr template:', error);
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
    data: CVTemplateData
  ): void {
    const greenColor = '#4a7c59'; // Matching template green color
    const blackColor = '#000000';
    const headers = getSectionHeaders(data.language!);

    let yPosition = 50;

    // Add main header
    yPosition = this.addMainHeader(doc, data, yPosition, greenColor, blackColor);

    // Add sections modularly
    if (data.objective) {
      yPosition = this.addObjectiveSection(doc, data, yPosition, headers, greenColor, blackColor);
    }

    if (data.experience && data.experience.length > 0) {
      yPosition = this.addExperienceSection(doc, data, yPosition, headers, greenColor, blackColor);
    }

    if (data.education && data.education.length > 0) {
      yPosition = this.addEducationSection(doc, data, yPosition, headers, greenColor, blackColor);
    }

    if (data.version === 'turkey' && data.technicalSkills) {
      yPosition = this.addTechnicalSkillsSection(doc, data, yPosition, headers, greenColor, blackColor);
    }

    if (data.version !== 'turkey' && data.communication) {
      yPosition = this.addCommunicationSection(doc, data, yPosition, headers, greenColor, blackColor);
    }

    if (data.version !== 'turkey' && data.skills && data.skills.length > 0) {
      yPosition = this.addSkillsSection(doc, data, yPosition, headers, greenColor, blackColor);
    }

    if (data.version === 'turkey' && data.projects && data.projects.length > 0) {
      yPosition = this.addProjectsSection(doc, data, yPosition, headers, greenColor, blackColor);
    }

    if (data.version !== 'turkey' && data.leadership) {
      yPosition = this.addLeadershipSection(doc, data, yPosition, headers, greenColor, blackColor);
    }

    if (data.version === 'turkey' && data.certificates && data.certificates.length > 0) {
      yPosition = this.addCertificatesSection(doc, data, yPosition, headers, greenColor, blackColor);
    }

    if (data.version === 'turkey' && data.languages && data.languages.length > 0) {
      yPosition = this.addLanguagesSection(doc, data, yPosition, headers, greenColor, blackColor);
    }

    if (data.references && data.references.length > 0) {
      yPosition = this.addReferencesSection(doc, data, yPosition, headers, greenColor, blackColor);
    }
  }

  private addMainHeader(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    greenColor: string,
    blackColor: string
  ): number {
    // Extract names for content generation
    const firstName = this.sanitizeText(data.personalInfo.firstName);
    const lastName = this.sanitizeText(data.personalInfo.lastName);
    const fullName = `${firstName} ${lastName}`.trim();

    // Header with name - exactly like template
    doc
      .fontSize(24)
      .fillColor(greenColor)
      .font('NotoSans-Bold')
      .text(this.sanitizeText(fullName).toUpperCase(), 50, yPosition, {
        align: 'center',
        width: 495,
      });

    yPosition += 40;

    // Contact information and social links preparation
    const contactInfo = [
      this.sanitizeText(data.personalInfo.address),
      `${this.sanitizeText(data.personalInfo.city)}`,
      this.sanitizeText(data.personalInfo.phone),
      this.sanitizeText(data.personalInfo.email),
    ]
      .filter(Boolean);

    const socialLinks: Array<{
      display: string;
      url: string;
    }> = [];
    
    const socialFields = ['linkedin', 'github', 'medium'] as const;
    socialFields.forEach((field) => {
      const fieldValue = (data.personalInfo as any)[field];
      if (fieldValue) {
        try {
          const shortUrl = shortenUrlForDisplay(fieldValue);
          socialLinks.push({
            display: this.sanitizeText(shortUrl.displayText),
            url: shortUrl.fullUrl,
          });
        } catch (error) {
          logger.warn(`Failed to shorten URL for ${field}:`, error);
        }
      }
    });

    // Add website without shortening
    if (data.personalInfo.website) {
      socialLinks.push({
        display: this.sanitizeText(data.personalInfo.website),
        url: this.sanitizeText(data.personalInfo.website),
      });
    }

    // Use the smart wrapping method from stylish accounting template
    yPosition = this.renderContactInfoWithSmartWrapping(
      doc,
      contactInfo,
      socialLinks,
      50,
      yPosition,
      495,
      blackColor
    );

    return yPosition + 20;
  }

  private renderContactInfoWithSmartWrapping(
    doc: InstanceType<typeof PDFDocument>,
    contactInfoParts: string[],
    urlInfoParts: Array<{ display: string; url: string }>,
    startX: number,
    startY: number,
    maxWidth: number,
    textColor: string
  ): number {
    const fontSize = 11;
    const fontFamily = 'NotoSans';
    const lineHeight = 18; // Increased line height to prevent overlap
    let currentY = startY;

    doc.fontSize(fontSize).font(fontFamily).fillColor(textColor);

    // Combine all parts for smart wrapping
    const allParts = [...contactInfoParts, ...urlInfoParts.map(link => link.display)];

    // Group parts into lines based on available width
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentLineWidth = 0;

    for (let i = 0; i < allParts.length; i++) {
      const part = allParts[i];
      const partWidth = doc.widthOfString(part);
      const separatorWidth = i < allParts.length - 1 ? doc.widthOfString(' | ') : 0;
      const totalPartWidth = partWidth + separatorWidth;

      // Check if adding this part would exceed the line width
      if (currentLineWidth + totalPartWidth > maxWidth && currentLine.length > 0) {
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

    // Render each line with center alignment
    lines.forEach((line) => {
      // Calculate line width for centering
      const lineText = line.join(' | ');
      const lineWidth = doc.widthOfString(lineText);
      let currentX = startX + (maxWidth - lineWidth) / 2; // Center the line

      line.forEach((part, partIndex) => {
        // Draw the text part
        doc.text(part, currentX, currentY);

        // Add hyperlink if this part is a URL
        const urlInfo = urlInfoParts.find((ui) => ui.display === part);
        if (urlInfo) {
          const actualPartWidth = doc.widthOfString(part);
          doc.link(
            currentX,
            currentY - 2, // Slight adjustment for link area
            actualPartWidth,
            fontSize + 4,
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

      // Move to next line with proper spacing
      currentY += lineHeight;
    });

    // Return the Y position after the last line, minus one line height since we added it above
    return currentY - lineHeight + 15; // Add some bottom margin
  }

  private addObjectiveSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    this.addSectionHeader(
      doc,
      headers.objective,
      yPosition,
      greenColor
    );
    yPosition += 25;

    const objective = this.sanitizeText(data.objective!);
    doc
      .fontSize(11)
      .fillColor(blackColor)
      .font('NotoSans')
      .text(objective, 50, yPosition, {
        width: 495,
        align: 'justify',
        lineGap: 2,
      });

    yPosition +=
      this.calculateTextHeight(doc, objective, {
        width: 495,
        lineGap: 2,
      }) + 20;

    return yPosition;
  }

  private addExperienceSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    this.addSectionHeader(
      doc,
      headers.experience,
      yPosition,
      greenColor
    );
    yPosition += 25;

    data.experience!.forEach((exp) => {
      // Job Title - bold
      const jobTitle = this.sanitizeText(exp.jobTitle);
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans-Bold')
        .text(jobTitle, 50, yPosition);

      // Company and location - regular font
      const companyLocation = `${this.sanitizeText(exp.company)} | ${this.sanitizeText(exp.location)}`;
      doc.font('NotoSans').text(companyLocation, 50, yPosition + 15);

      // Date range - right aligned like template with formatted dates and isCurrent check
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
        const currentText = data.language === 'turkish' ? 'devam ediyor' : 'Present';
        dateRange = `${startDate} – ${currentText}`;
      } else {
        const endDate = DateFormatter.formatDate(
          this.sanitizeText(exp.endDate)
        );
        dateRange = `${startDate} – ${endDate}`;
      }
      const dateWidth = doc.widthOfString(dateRange);
      const dateStartX = 545 - dateWidth; // Position from right edge

      doc
        .fontSize(11)
        .fillColor(blackColor)
        .text(dateRange, dateStartX, yPosition + 15);

      yPosition += 35;

      // Job Description
      const description = this.sanitizeText(exp.description);
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans')
        .text(description, 50, yPosition, {
          width: 495,
          align: 'justify',
          lineGap: 2,
        });

      yPosition +=
        this.calculateTextHeight(doc, description, {
          width: 495,
          lineGap: 2,
        }) + 15;

      // Check for page break
      if (yPosition > 760) {
        doc.addPage();
        yPosition = 50;
      }
    });

    return yPosition;
  }

  private addEducationSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    this.addSectionHeader(
      doc,
      headers.education,
      yPosition,
      greenColor
    );
    yPosition += 25;

    data.education!.forEach((edu) => {
      // Degree - bold
      const degree = this.sanitizeText(edu.degree);
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans-Bold')
        .text(degree, 50, yPosition);

      // University and location - regular font
      const universityLocation = `${this.sanitizeText(edu.university)} | ${this.sanitizeText(edu.location)}`;
      doc.font('NotoSans').text(universityLocation, 50, yPosition + 15);

      // Date range - right aligned with formatted dates
      const startDate = DateFormatter.formatDate(
        this.sanitizeText(edu.startDate)
      );
      const graduationDate = DateFormatter.formatGraduationDate(
        this.sanitizeText(edu.graduationDate)
      );
      const dateRange = `${startDate} - ${graduationDate}`;
      const dateWidth = doc.widthOfString(dateRange);
      const dateStartX = 545 - dateWidth; // Position from right edge

      doc
        .fontSize(11)
        .fillColor(blackColor)
        .text(dateRange, dateStartX, yPosition + 15);

      yPosition += 35;

      // Field of Study
      if (edu.field) {
        const field = this.sanitizeText(edu.field);
        doc
          .fontSize(11)
          .fillColor(blackColor)
          .font('NotoSans')
          .text(field, 50, yPosition, {
            width: 495,
            align: 'justify',
            lineGap: 2,
          });

        yPosition +=
          this.calculateTextHeight(doc, field, {
            width: 495,
            lineGap: 2,
          }) + 10;
      }

      // Details section with additional spacing
      if (edu.details) {
        const details = this.sanitizeText(edu.details);
        doc
          .fontSize(11)
          .fillColor(blackColor)
          .font('NotoSans')
          .text(details, 50, yPosition, {
            width: 495,
            align: 'justify',
            lineGap: 2,
          });

        yPosition +=
          this.calculateTextHeight(doc, details, {
            width: 495,
            lineGap: 2,
          }) + 15;
      }

      // Check for page break
      if (yPosition > 760) {
        doc.addPage();
        yPosition = 50;
      }
    });

    return yPosition;
  }

  private addTechnicalSkillsSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 80; // Header + minimum content
    if (yPosition + sectionMinHeight > 760) {
      doc.addPage();
      yPosition = 50;
    }

    this.addSectionHeader(
      doc,
      headers.technicalSkills,
      yPosition,
      greenColor
    );
    yPosition += 25;

    const skills = data.technicalSkills!;

    if (skills.frontend && skills.frontend.length > 0) {
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans-Bold')
        .text('Frontend:', 50, yPosition);
      const frontendText = skills.frontend.join(', ');
      doc
        .font('NotoSans')
        .text(frontendText, 120, yPosition, { width: 425 });
      yPosition += 18;
    }

    if (skills.backend && skills.backend.length > 0) {
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans-Bold')
        .text('Backend:', 50, yPosition);
      const backendText = skills.backend.join(', ');
      doc
        .font('NotoSans')
        .text(backendText, 120, yPosition, { width: 425 });
      yPosition += 18;
    }

    if (skills.database && skills.database.length > 0) {
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans-Bold')
        .text('Database:', 50, yPosition);
      const databaseText = skills.database.join(', ');
      doc
        .font('NotoSans')
        .text(databaseText, 120, yPosition, { width: 425 });
      yPosition += 18;
    }

    if (skills.tools && skills.tools.length > 0) {
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans-Bold')
        .text('Tools:', 50, yPosition);
      const toolsText = skills.tools.join(', ');
      doc
        .font('NotoSans')
        .text(toolsText, 120, yPosition, { width: 425 });
      yPosition += 18;
    }

    return yPosition + 15;
  }

  private addCommunicationSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 60; // Header + minimum content
    if (yPosition + sectionMinHeight > 760) {
      doc.addPage();
      yPosition = 50;
    }

    this.addSectionHeader(
      doc,
      headers.communication,
      yPosition,
      greenColor
    );
    yPosition += 25;

    const communication = this.sanitizeText(data.communication!);
    doc
      .fontSize(11)
      .fillColor(blackColor)
      .font('NotoSans')
      .text(communication, 50, yPosition, {
        width: 495,
        align: 'justify',
        lineGap: 2,
      });

    yPosition +=
      this.calculateTextHeight(doc, communication, {
        width: 495,
        lineGap: 2,
      }) + 20;

    return yPosition;
  }

  private addSkillsSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 60; // Header + minimum content
    if (yPosition + sectionMinHeight > 760) {
      doc.addPage();
      yPosition = 50;
    }

    this.addSectionHeader(
      doc,
      headers.skills || 'SKILLS',
      yPosition,
      greenColor
    );
    yPosition += 25;

    // Calculate 3-column layout for skills
    const totalRows = Math.ceil(data.skills!.length / 3);
    const skillsHeight = totalRows * 18; // 18px per row for better spacing
    const columnSpacing = 165; // Spacing between columns (495/3 = 165)
    const startY = yPosition;

    data.skills!.forEach((skill, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const xPosition = 50 + column * columnSpacing;
      const currentYPosition = startY + row * 18;

      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans')
        .text(this.sanitizeText(skill), xPosition, currentYPosition);
    });

    yPosition = startY + skillsHeight + 20;
    return yPosition;
  }

  private addProjectsSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 80; // Header + minimum content
    if (yPosition + sectionMinHeight > 760) {
      doc.addPage();
      yPosition = 50;
    }

    this.addSectionHeader(doc, headers.projects, yPosition, greenColor);
    yPosition += 25;

    data.projects!.forEach((project) => {
      // Project name - bold
      const projectName = this.sanitizeText(project.name);
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans-Bold')
        .text(projectName, 50, yPosition);

      // Technologies - right aligned
      const technologies = this.sanitizeText(project.technologies);
      const techWidth = doc.widthOfString(technologies);
      const techStartX = 545 - techWidth;

      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans')
        .text(technologies, techStartX, yPosition);

      yPosition += 20;

      // Project description
      const description = this.sanitizeText(project.description);
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans')
        .text(description, 50, yPosition, {
          width: 495,
          align: 'justify',
          lineGap: 2,
        });

      yPosition +=
        this.calculateTextHeight(doc, description, {
          width: 495,
          lineGap: 2,
        }) + 15;

      // Check for page break
      if (yPosition > 760) {
        doc.addPage();
        yPosition = 50;
      }
    });

    return yPosition + 5;
  }

  private addLeadershipSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 60; // Header + minimum content
    if (yPosition + sectionMinHeight > 760) {
      doc.addPage();
      yPosition = 50;
    }

    this.addSectionHeader(
      doc,
      headers.leadership,
      yPosition,
      greenColor
    );
    yPosition += 25;

    const leadership = this.sanitizeText(data.leadership!);
    doc
      .fontSize(11)
      .fillColor(blackColor)
      .font('NotoSans')
      .text(leadership, 50, yPosition, {
        width: 495,
        align: 'justify',
        lineGap: 2,
      });

    yPosition +=
      this.calculateTextHeight(doc, leadership, {
        width: 495,
        lineGap: 2,
      }) + 20;

    return yPosition;
  }

  private addCertificatesSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 80; // Header + minimum content
    if (yPosition + sectionMinHeight > 760) {
      doc.addPage();
      yPosition = 50;
    }

    this.addSectionHeader(
      doc,
      headers.certificates,
      yPosition,
      greenColor
    );
    yPosition += 25;

    data.certificates!.forEach((cert) => {
      // Certificate name - bold
      const certName = this.sanitizeText(cert.name);
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans-Bold')
        .text(certName, 50, yPosition);

      // Issuer - regular font
      const issuer = this.sanitizeText(cert.issuer);
      doc.font('NotoSans').text(issuer, 50, yPosition + 15);

      // Date - right aligned
      const certDate = DateFormatter.formatDate(
        this.sanitizeText(cert.date)
      );
      const dateWidth = doc.widthOfString(certDate);
      const dateStartX = 545 - dateWidth;

      doc
        .fontSize(11)
        .fillColor(blackColor)
        .text(certDate, dateStartX, yPosition + 15);

      yPosition += 35;
    });

    return yPosition + 5;
  }

  private addLanguagesSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 60; // Header + minimum content
    if (yPosition + sectionMinHeight > 760) {
      doc.addPage();
      yPosition = 50;
    }

    this.addSectionHeader(
      doc,
      headers.languages,
      yPosition,
      greenColor
    );
    yPosition += 25;

    data.languages!.forEach((lang) => {
      // Language name - bold
      const language = this.sanitizeText(lang.language);
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans-Bold')
        .text(language, 50, yPosition);

      // Level - right aligned
      const level = this.sanitizeText(lang.level);
      const levelWidth = doc.widthOfString(level);
      const levelStartX = 545 - levelWidth;

      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans')
        .text(level, levelStartX, yPosition);

      yPosition += 22;
    });

    return yPosition + 10;
  }

  private addReferencesSection(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    yPosition: number,
    headers: any,
    greenColor: string,
    blackColor: string
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 80; // Header + at least one reference
    if (yPosition + sectionMinHeight > 760) {
      doc.addPage();
      yPosition = 50;
    }

    this.addSectionHeader(
      doc,
      headers.references,
      yPosition,
      greenColor
    );
    yPosition += 25;

    data.references!.forEach((ref) => {
      // Reference name - bold
      const name = this.sanitizeText(ref.name);
      doc
        .fontSize(11)
        .fillColor(blackColor)
        .font('NotoSans-Bold')
        .text(name, 50, yPosition);

      // Company and contact - regular font
      const companyContact = `${this.sanitizeText(ref.company)} | ${this.sanitizeText(ref.contact)}`;
      doc.font('NotoSans').text(companyContact, 50, yPosition + 15);

      yPosition += 40;
    });

    return yPosition;
  }

  private addSectionHeader(
    doc: InstanceType<typeof PDFDocument>,
    title: string,
    yPosition: number,
    greenColor: string
  ): void {
    // Section title - exactly like template
    doc
      .fontSize(11)
      .fillColor('#000000')
      .font('NotoSans-Bold')
      .text(title, 50, yPosition);

    // Calculate title width to position the line correctly
    const titleWidth = doc.widthOfString(title);
    const lineStartX = 50 + titleWidth + 10; // 10px gap after title
    const lineEndX = 545; // Right margin

    // Green underline from title end to page edge - positioned perfectly in the center of text
    const fontSize = 11;
    const lineY = yPosition + fontSize / 2 + 1; // Perfect center alignment

    doc
      .strokeColor(greenColor)
      .lineWidth(1)
      .moveTo(lineStartX, lineY)
      .lineTo(lineEndX, lineY)
      .stroke();
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
      return 20; // Return a default height
    }
  }
}