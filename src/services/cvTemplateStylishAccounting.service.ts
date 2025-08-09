import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

import logger from '../config/logger';

import { FontLoader } from '../utils/fontLoader';
import { DateFormatter } from '../utils/dateFormatter';
import { shortenUrlForDisplay } from '../utils/urlShortener';
import { getSectionHeaders } from '../utils/cvSectionHeaders';

import { CVTemplateData } from '../types';

export class CVTemplateStylishAccountingService {
  private static instance: CVTemplateStylishAccountingService;

  private constructor() {}

  public static getInstance(): CVTemplateStylishAccountingService {
    if (!CVTemplateStylishAccountingService.instance) {
      CVTemplateStylishAccountingService.instance =
        new CVTemplateStylishAccountingService();
    }
    return CVTemplateStylishAccountingService.instance;
  }

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

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const stream = new PassThrough();

        doc.pipe(stream);

        try {
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', (error) => {
            logger.error('PDF generation stream error:', error);
            reject(error);
          });

          this.generateContent(doc, data);

          doc.end();
        } catch (error) {
          logger.error(
            'PDF generation error in stylish accounting template:',
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
    data: CVTemplateData
  ): void {
    // Define colors and get section headers - Preserving Stylish Accounting green
    const colors = {
      text: '#275e46', // RGB(39,94,70) converted to hex - text color
      line: '#55b88d', // RGB(85,184,141) converted to hex - line color
      background: '#dcf0e8', // RGB(220,240,232) converted to hex
      grey: '#666666',
    };
    const headers = getSectionHeaders(data.language!);

    // Calculate text row width (4/5 of line width)
    const lineWidth = 495; // From 50 to 545 (495px)
    const textRowWidth = (lineWidth * 4) / 5; // 396px

    // Set page background color
    doc
      .rect(0, 0, 595.28, 841.89) // A4 page dimensions in points
      .fillColor(colors.background)
      .fill();

    let yPosition = 50;

    // Add header section
    yPosition = this.addHeader(doc, data, colors, textRowWidth, yPosition);

    // Add objective section (no header, directly under personal info)
    if (data.objective) {
      yPosition = this.addObjective(
        doc,
        data.objective,
        colors,
        textRowWidth,
        yPosition
      );
    }

    // Add separator line
    yPosition = this.addSeparatorLine(doc, colors.line, yPosition);

    // Add experience section
    if (data.experience && data.experience.length > 0) {
      yPosition = this.addExperience(
        doc,
        data.experience,
        headers.experience,
        colors,
        textRowWidth,
        yPosition
      );
    }

    // Add education section
    if (data.education && data.education.length > 0) {
      yPosition = this.addEducation(
        doc,
        data.education,
        headers.education,
        colors,
        textRowWidth,
        yPosition
      );
    }

    // Add technical skills section (Turkey version)
    if (data.version === 'turkey' && data.technicalSkills) {
      yPosition = this.addTechnicalSkills(
        doc,
        data.technicalSkills,
        headers.technicalSkills,
        colors,
        textRowWidth,
        yPosition
      );
    }

    // Add skills section (Global version)
    if (
      data.version !== 'turkey' &&
      (data as any).skills &&
      Array.isArray((data as any).skills)
    ) {
      yPosition = this.addSkills(
        doc,
        (data as any).skills,
        colors,
        textRowWidth,
        yPosition
      );
    }

    // Add communication section (Global version only)
    if (data.version !== 'turkey' && data.communication) {
      yPosition = this.addCommunication(
        doc,
        data.communication,
        headers.communication,
        colors,
        textRowWidth,
        yPosition
      );
    }

    // Add projects section (Turkey version)
    if (
      data.version === 'turkey' &&
      data.projects &&
      data.projects.length > 0
    ) {
      yPosition = this.addProjects(
        doc,
        data.projects,
        headers.projects,
        colors,
        textRowWidth,
        yPosition
      );
    }

    // Add leadership section (Global version only)
    if (data.version !== 'turkey' && data.leadership) {
      yPosition = this.addLeadership(
        doc,
        data.leadership,
        headers.leadership,
        colors,
        textRowWidth,
        yPosition
      );
    }

    // Add certificates section (Turkey version)
    if (
      data.version === 'turkey' &&
      data.certificates &&
      data.certificates.length > 0
    ) {
      yPosition = this.addCertificates(
        doc,
        data.certificates,
        headers.certificates,
        colors,
        textRowWidth,
        yPosition
      );
    }

    // Add languages section (Turkey version)
    if (
      data.version === 'turkey' &&
      data.languages &&
      data.languages.length > 0
    ) {
      yPosition = this.addLanguages(
        doc,
        data.languages,
        headers.languages,
        colors,
        textRowWidth,
        yPosition
      );
    }

    // Add references section
    if (data.references && data.references.length > 0) {
      this.addReferences(
        doc,
        data.references,
        headers.references,
        colors,
        textRowWidth,
        yPosition
      );
    }
  }

  private addHeader(
    doc: InstanceType<typeof PDFDocument>,
    data: CVTemplateData,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    // Header with name - Stylish Accounting style with larger font (increased by 2pt)
    doc
      .fontSize(32)
      .fillColor(colors.text)
      .font('NotoSans-Bold')
      .text(
        `${this.sanitizeText(data.personalInfo.firstName)} ${this.sanitizeText(data.personalInfo.lastName)}`.toUpperCase(),
        50,
        yPosition
      );

    yPosition += 45;

    // Contact information - pipe-separated and bold
    const contactInfoParts = [];

    if (data.personalInfo.address && data.personalInfo.city) {
      contactInfoParts.push(
        `${this.sanitizeText(data.personalInfo.address)}, ${this.sanitizeText(data.personalInfo.city)}`
      );
    }
    if (data.personalInfo.phone) {
      contactInfoParts.push(this.sanitizeText(data.personalInfo.phone));
    }
    if (data.personalInfo.email) {
      contactInfoParts.push(this.sanitizeText(data.personalInfo.email));
    }
    // Process social media URLs with professional shortening
    const urlInfoParts: Array<{
      display: string;
      url: string;
      platform: string;
    }> = [];
    const socialFields = ['linkedin', 'github', 'medium'] as const;

    socialFields.forEach((field) => {
      const fieldValue = (data.personalInfo as any)[field];
      if (fieldValue) {
        try {
          const shortUrl = shortenUrlForDisplay(fieldValue);
          urlInfoParts.push({
            display: this.sanitizeText(shortUrl.displayText),
            url: shortUrl.fullUrl,
            platform: shortUrl.platform || 'unknown',
          });
        } catch (error) {
          logger.warn(`Invalid ${field} URL format: ${fieldValue}`, { error });
          // Fallback to original URL for display if shortening fails
          urlInfoParts.push({
            display: this.sanitizeText(fieldValue),
            url: fieldValue,
            platform: 'fallback',
          });
        }
      }
    });

    // Handle website field separately (no shortening applied)
    if ((data.personalInfo as any).website) {
      contactInfoParts.push(
        this.sanitizeText((data.personalInfo as any).website)
      );
    }

    // Add URL display texts to contact info
    urlInfoParts.forEach((urlInfo) => {
      contactInfoParts.push(urlInfo.display);
    });

    const contactInfoParts_filtered = contactInfoParts.filter(Boolean);

    // Smart line wrapping for contact info at pipe separators
    // Use same width as separator lines (50 to 545 = 495px width)
    const lineWidth = 495;
    yPosition = this.renderContactInfoWithSmartWrapping(
      doc,
      contactInfoParts_filtered,
      urlInfoParts,
      yPosition,
      lineWidth,
      colors.text
    );

    yPosition += 20;

    return yPosition;
  }

  /**
   * Renders contact info with smart line wrapping at pipe separators
   * @private
   */
  private renderContactInfoWithSmartWrapping(
    doc: InstanceType<typeof PDFDocument>,
    contactInfoParts: string[],
    urlInfoParts: Array<{ display: string; url: string; platform: string }>,
    startY: number,
    maxWidth: number,
    textColor: string
  ): number {
    const fontSize = 11;
    const fontFamily = 'NotoSans-Bold';
    const lineHeight = 15;
    let currentX = 50;
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

    // Render each line
    lines.forEach((line, lineIndex) => {
      currentX = 50;

      line.forEach((part, partIndex) => {
        // Draw the text part
        doc.text(part, currentX, currentY);

        // Add hyperlink if this part is a URL
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

        currentX += doc.widthOfString(part);

        // Add separator if not the last part in this line
        if (partIndex < line.length - 1) {
          doc.text(' | ', currentX, currentY);
          currentX += doc.widthOfString(' | ');
        }
      });

      // Move to next line if not the last line
      if (lineIndex < lines.length - 1) {
        currentY += lineHeight;
      }
    });

    return currentY;
  }

  private addObjective(
    doc: InstanceType<typeof PDFDocument>,
    objective: string,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    // Add objective text under personal info (no header, reduced spacing)
    yPosition += 5; // Total spacing now 25px (20 + 5)

    const objectiveText = this.sanitizeText(objective);
    doc
      .fontSize(11)
      .fillColor(colors.text)
      .font('NotoSans')
      .text(objectiveText, 50, yPosition, {
        width: textRowWidth,
        align: 'justify',
        lineGap: 2,
      });

    yPosition +=
      this.calculateTextHeight(doc, objectiveText, {
        width: textRowWidth,
        lineGap: 2,
      }) + 20;

    return yPosition;
  }

  private addSeparatorLine(
    doc: InstanceType<typeof PDFDocument>,
    lineColor: string,
    yPosition: number
  ): number {
    // Green separator line - Stylish Accounting signature design
    doc
      .strokeColor(lineColor)
      .lineWidth(2)
      .moveTo(50, yPosition)
      .lineTo(545, yPosition)
      .stroke();

    yPosition += 25;

    return yPosition;
  }

  private addExperience(
    doc: InstanceType<typeof PDFDocument>,
    experience: any[],
    header: string,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    this.addSectionHeader(doc, header, yPosition, colors.text);
    yPosition += 25;

    experience.forEach((exp) => {
      // Job Title - bold
      const jobTitle = this.sanitizeText(exp.jobTitle);
      doc
        .fontSize(12)
        .fillColor(colors.text)
        .font('NotoSans-Bold')
        .text(jobTitle, 50, yPosition);

      // Company and location - regular font (1pt smaller)
      const companyLocation = `${this.sanitizeText(exp.company)} | ${this.sanitizeText(exp.location)}`;
      doc
        .fontSize(11)
        .font('NotoSans')
        .text(companyLocation, 50, yPosition + 15);

      // Date range - right aligned with formatted dates and current job handling
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
        // Handle current position
        dateRange = `${startDate} – Present`;
      } else {
        const endDate = DateFormatter.formatDateLong(
          this.sanitizeText(exp.endDate)
        );
        dateRange = `${startDate} – ${endDate}`;
      }

      const dateWidth = doc.widthOfString(dateRange);
      const dateStartX = 545 - dateWidth;

      doc
        .fontSize(10)
        .fillColor(colors.grey)
        .text(dateRange, dateStartX, yPosition + 15);

      yPosition += 35;

      // Job Description
      const description = this.sanitizeText(exp.description);
      doc
        .fontSize(11)
        .fillColor(colors.text)
        .font('NotoSans')
        .text(description, 50, yPosition, {
          width: textRowWidth,
          align: 'justify',
          lineGap: 2,
        });

      yPosition +=
        this.calculateTextHeight(doc, description, {
          width: textRowWidth,
          lineGap: 2,
        }) + 15;

      // Check for page break
      if (yPosition > 720) {
        doc.addPage();
        // Set background color for new page
        doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
        yPosition = 50;
      }
    });

    // Add separator line after experience
    yPosition = this.addSeparatorLine(doc, colors.line, yPosition);

    return yPosition;
  }

  private addEducation(
    doc: InstanceType<typeof PDFDocument>,
    education: any[],
    header: string,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    this.addSectionHeader(doc, header, yPosition, colors.text);
    yPosition += 25;

    education.forEach((edu) => {
      // Degree - bold
      const degree = this.sanitizeText(edu.degree);
      doc
        .fontSize(12)
        .fillColor(colors.text)
        .font('NotoSans-Bold')
        .text(degree, 50, yPosition);

      // University and location - regular font (1pt smaller)
      const universityLocation = `${this.sanitizeText(edu.university)} | ${this.sanitizeText(edu.location)}`;
      doc
        .fontSize(11)
        .font('NotoSans')
        .text(universityLocation, 50, yPosition + 15);

      // Education date range - right aligned with long format (startDate - endDate)
      let dateRange = '';
      if (edu.startDate) {
        const startDate = DateFormatter.formatDateLong(
          this.sanitizeText(edu.startDate)
        );
        const endDate = DateFormatter.formatDateLong(
          this.sanitizeText(edu.graduationDate)
        );
        dateRange = `${startDate} – ${endDate}`;
      } else {
        // If no start date, show only graduation date in long format
        dateRange = DateFormatter.formatDateLong(
          this.sanitizeText(edu.graduationDate)
        );
      }

      const gradDateWidth = doc.widthOfString(dateRange);
      const gradDateStartX = 545 - gradDateWidth;

      doc
        .fontSize(10)
        .fillColor(colors.grey)
        .text(dateRange, gradDateStartX, yPosition + 15);

      yPosition += 35;

      if (edu.details) {
        const details = this.sanitizeText(edu.details);
        doc
          .fontSize(11)
          .fillColor(colors.text)
          .font('NotoSans')
          .text(details, 50, yPosition, {
            width: textRowWidth,
            align: 'justify',
            lineGap: 2,
          });

        yPosition +=
          this.calculateTextHeight(doc, details, {
            width: textRowWidth,
            lineGap: 2,
          }) + 15;
      }

      // Check for page break
      if (yPosition > 720) {
        doc.addPage();
        // Set background color for new page
        doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
        yPosition = 50;
      }
    });

    // Add separator line after education
    yPosition = this.addSeparatorLine(doc, colors.line, yPosition);

    return yPosition;
  }

  private addTechnicalSkills(
    doc: InstanceType<typeof PDFDocument>,
    technicalSkills: any,
    header: string,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 80;
    if (yPosition + sectionMinHeight > 720) {
      doc.addPage();
      // Set background color for new page
      doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
      yPosition = 50;
    }

    this.addSectionHeader(doc, header, yPosition, colors.text);
    yPosition += 25;

    const skills = technicalSkills;
    const skillsArray: string[] = [];
    const totalWidth = 495; // Same as separator lines (50 to 545)
    const columnWidth = totalWidth / 2; // 247.5px per column
    const dotSize = 3;
    const dotSpacing = 16;

    if (skills.frontend && skills.frontend.length > 0) {
      skills.frontend.forEach((skill: string) => skillsArray.push(skill));
    }
    if (skills.backend && skills.backend.length > 0) {
      skills.backend.forEach((skill: string) => skillsArray.push(skill));
    }
    if (skills.database && skills.database.length > 0) {
      skills.database.forEach((skill: string) => skillsArray.push(skill));
    }
    if (skills.tools && skills.tools.length > 0) {
      skills.tools.forEach((skill: string) => skillsArray.push(skill));
    }

    // Display skills in 2 columns with proper spacing
    let currentYPos = yPosition;

    for (let i = 0; i < skillsArray.length; i += 2) {
      // Check if we need a new page for this row
      if (currentYPos + 25 > 720) {
        doc.addPage();
        doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
        currentYPos = 50;
      }

      // First column skill
      const skill1 = skillsArray[i];
      if (skill1) {
        // Draw dot for first column
        doc
          .fillColor(colors.line)
          .circle(50 + dotSize, currentYPos + 6, dotSize)
          .fill();

        // Draw skill text for first column
        const availableTextWidth = columnWidth - dotSize - dotSpacing - 6;
        doc
          .fontSize(11)
          .fillColor(colors.text)
          .font('NotoSans')
          .text(skill1, 50 + dotSize + dotSpacing + 3, currentYPos, {
            width: availableTextWidth,
          });
      }

      // Second column skill (if exists)
      const skill2 = skillsArray[i + 1];
      if (skill2) {
        // Draw dot for second column
        doc
          .fillColor(colors.line)
          .circle(50 + columnWidth + dotSize, currentYPos + 6, dotSize)
          .fill();

        // Draw skill text for second column
        const availableTextWidth = columnWidth - dotSize - dotSpacing - 6;
        doc
          .fontSize(11)
          .fillColor(colors.text)
          .font('NotoSans')
          .text(
            skill2,
            50 + columnWidth + dotSize + dotSpacing + 3,
            currentYPos,
            {
              width: availableTextWidth,
            }
          );
      }

      currentYPos += 18; // Move to next row
    }

    yPosition = currentYPos;
    yPosition += 15;

    // Add separator line after technical skills
    yPosition = this.addSeparatorLine(doc, colors.line, yPosition);

    return yPosition;
  }

  private addSkills(
    doc: InstanceType<typeof PDFDocument>,
    skills: string[],
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 80;
    if (yPosition + sectionMinHeight > 720) {
      doc.addPage();
      // Set background color for new page
      doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
      yPosition = 50;
    }

    this.addSectionHeader(doc, 'SKILLS', yPosition, colors.text);
    yPosition += 35;

    const skillsArray = skills;
    const columnWidth = textRowWidth / 2; // Half of text row width for each column
    const dotSize = 3;
    const dotSpacing = 16; // Changed from 4px to 16px

    // Display skills in 2 columns
    skillsArray.forEach((skill: string, index: number) => {
      const isFirstColumn = index % 2 === 0;
      const xPosition = isFirstColumn ? 50 : 50 + textRowWidth / 2; // Second column starts at middle of text area
      const currentY = yPosition + Math.floor(index / 2) * 18;

      // Draw dot
      doc
        .fillColor(colors.line)
        .circle(xPosition + dotSize, currentY + 6, dotSize)
        .fill();

      // Draw skill text
      doc
        .fontSize(11)
        .fillColor(colors.text)
        .font('NotoSans')
        .text(skill, xPosition + dotSize + dotSpacing + 3, currentY, {
          width: columnWidth,
        });
    });

    yPosition += Math.ceil(skillsArray.length / 2) * 18;
    yPosition += 15;

    // Add separator line after skills
    yPosition = this.addSeparatorLine(doc, colors.line, yPosition);

    return yPosition;
  }

  private addCommunication(
    doc: InstanceType<typeof PDFDocument>,
    communication: string,
    header: string,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 60;
    if (yPosition + sectionMinHeight > 720) {
      doc.addPage();
      // Set background color for new page
      doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
      yPosition = 50;
    }

    this.addSectionHeader(doc, header, yPosition, colors.text);
    yPosition += 25;

    const communicationText = this.sanitizeText(communication);
    doc
      .fontSize(11)
      .fillColor(colors.text)
      .font('NotoSans')
      .text(communicationText, 50, yPosition, {
        width: textRowWidth,
        align: 'justify',
        lineGap: 2,
      });

    yPosition +=
      this.calculateTextHeight(doc, communicationText, {
        width: textRowWidth,
        lineGap: 2,
      }) + 20;

    // Add separator line after communication
    yPosition = this.addSeparatorLine(doc, colors.line, yPosition);

    return yPosition;
  }

  private addProjects(
    doc: InstanceType<typeof PDFDocument>,
    projects: any[],
    header: string,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 80;
    if (yPosition + sectionMinHeight > 720) {
      doc.addPage();
      // Set background color for new page
      doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
      yPosition = 50;
    }

    this.addSectionHeader(doc, header, yPosition, colors.text);
    yPosition += 25;

    projects.forEach((project) => {
      // Project name - bold
      const projectName = this.sanitizeText(project.name);
      doc
        .fontSize(11)
        .fillColor(colors.text)
        .font('NotoSans-Bold')
        .text(projectName, 50, yPosition);

      // Technologies - right aligned
      const technologies = this.sanitizeText(project.technologies);
      const techWidth = doc.widthOfString(technologies);
      const techStartX = 545 - techWidth;

      doc
        .fontSize(10)
        .fillColor(colors.text)
        .font('NotoSans')
        .text(technologies, techStartX, yPosition);

      yPosition += 20;

      // Project description
      const description = this.sanitizeText(project.description);
      doc
        .fontSize(11)
        .fillColor(colors.text)
        .font('NotoSans')
        .text(description, 50, yPosition, {
          width: textRowWidth,
          align: 'justify',
          lineGap: 2,
        });

      yPosition +=
        this.calculateTextHeight(doc, description, {
          width: textRowWidth,
          lineGap: 2,
        }) + 15;

      // Check for page break
      if (yPosition > 720) {
        doc.addPage();
        // Set background color for new page
        doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
        yPosition = 50;
      }
    });

    // Add separator line after projects
    yPosition = this.addSeparatorLine(doc, colors.line, yPosition);

    return yPosition;
  }

  private addLeadership(
    doc: InstanceType<typeof PDFDocument>,
    leadership: string,
    header: string,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 60;
    if (yPosition + sectionMinHeight > 720) {
      doc.addPage();
      // Set background color for new page
      doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
      yPosition = 50;
    }

    this.addSectionHeader(doc, header, yPosition, colors.text);
    yPosition += 25;

    const leadershipText = this.sanitizeText(leadership);
    doc
      .fontSize(11)
      .fillColor(colors.text)
      .font('NotoSans')
      .text(leadershipText, 50, yPosition, {
        width: textRowWidth,
        align: 'justify',
        lineGap: 2,
      });

    yPosition +=
      this.calculateTextHeight(doc, leadershipText, {
        width: textRowWidth,
        lineGap: 2,
      }) + 20;

    // Add separator line after leadership
    yPosition = this.addSeparatorLine(doc, colors.line, yPosition);

    return yPosition;
  }

  private addCertificates(
    doc: InstanceType<typeof PDFDocument>,
    certificates: any[],
    header: string,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 80;
    if (yPosition + sectionMinHeight > 720) {
      doc.addPage();
      // Set background color for new page
      doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
      yPosition = 50;
    }

    this.addSectionHeader(doc, header, yPosition, colors.text);
    yPosition += 25;

    certificates.forEach((cert) => {
      // Certificate name - bold
      const certName = this.sanitizeText(cert.name);
      doc
        .fontSize(11)
        .fillColor(colors.text)
        .font('NotoSans-Bold')
        .text(certName, 50, yPosition);

      // Issuer - regular font
      const issuer = this.sanitizeText(cert.issuer);
      doc.font('NotoSans').text(issuer, 50, yPosition + 15);

      // Date - right aligned
      const certDate = DateFormatter.formatDateLong(
        this.sanitizeText(cert.date)
      );
      const dateWidth = doc.widthOfString(certDate);
      const dateStartX = 545 - dateWidth;

      doc
        .fontSize(10)
        .fillColor(colors.text)
        .text(certDate, dateStartX, yPosition + 15);

      yPosition += 35;
    });

    // Add separator line after certificates
    yPosition = this.addSeparatorLine(doc, colors.line, yPosition);

    return yPosition;
  }

  private addLanguages(
    doc: InstanceType<typeof PDFDocument>,
    languages: any[],
    header: string,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 60;
    if (yPosition + sectionMinHeight > 720) {
      doc.addPage();
      // Set background color for new page
      doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
      yPosition = 50;
    }

    this.addSectionHeader(doc, header, yPosition, colors.text);
    yPosition += 25;

    languages.forEach((lang) => {
      // Language name - bold
      const language = this.sanitizeText(lang.language);
      doc
        .fontSize(11)
        .fillColor(colors.text)
        .font('NotoSans-Bold')
        .text(language, 50, yPosition);

      // Level - right aligned
      const level = this.sanitizeText(lang.level);
      const levelWidth = doc.widthOfString(level);
      const levelStartX = 545 - levelWidth;

      doc
        .fontSize(10)
        .fillColor(colors.text)
        .font('NotoSans')
        .text(level, levelStartX, yPosition);

      yPosition += 22;
    });

    // Add separator line after languages
    yPosition = this.addSeparatorLine(doc, colors.line, yPosition);

    return yPosition;
  }

  private addReferences(
    doc: InstanceType<typeof PDFDocument>,
    references: any[],
    header: string,
    colors: any,
    textRowWidth: number,
    yPosition: number
  ): number {
    // Check if section fits on current page
    const sectionMinHeight = 80;
    if (yPosition + sectionMinHeight > 720) {
      doc.addPage();
      // Set background color for new page
      doc.rect(0, 0, 595.28, 841.89).fillColor(colors.background).fill();
      yPosition = 50;
    }

    this.addSectionHeader(doc, header, yPosition, colors.text);
    yPosition += 25;

    references.forEach((ref) => {
      // Reference name - bold
      const name = this.sanitizeText(ref.name);
      doc
        .fontSize(11)
        .fillColor(colors.text)
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
    textColor: string
  ): void {
    // Section title - Stylish Accounting style with larger font
    doc
      .fontSize(16)
      .fillColor(textColor)
      .font('NotoSans-Bold')
      .text(title, 50, yPosition);
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
