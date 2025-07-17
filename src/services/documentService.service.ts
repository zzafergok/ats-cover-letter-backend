import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export async function generatePdf(content: string): Promise<Buffer> {
  try {
    const pdf = new jsPDF();

    pdf.addFont(
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700',
      'Inter',
      'normal'
    );

    const lines = content.split('\n');
    let yPosition = 20;
    const lineHeight = 7;
    const pageHeight = pdf.internal.pageSize.height;
    const marginBottom = 20;

    for (const line of lines) {
      if (yPosition > pageHeight - marginBottom) {
        pdf.addPage();
        yPosition = 20;
      }

      if (line.startsWith('# ')) {
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line.substring(2), 20, yPosition);
        yPosition += lineHeight + 3;
      } else if (line.startsWith('## ')) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line.substring(3), 20, yPosition);
        yPosition += lineHeight + 2;
      } else if (line.startsWith('### ')) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line.substring(4), 20, yPosition);
        yPosition += lineHeight + 1;
      } else if (line.startsWith('- ')) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('• ' + line.substring(2), 25, yPosition);
        yPosition += lineHeight;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(line.substring(2, line.length - 2), 20, yPosition);
        yPosition += lineHeight;
      } else if (line.trim() !== '') {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        const splitText = pdf.splitTextToSize(line, 170);
        for (const textLine of splitText) {
          if (yPosition > pageHeight - marginBottom) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(textLine, 20, yPosition);
          yPosition += lineHeight;
        }
      } else {
        yPosition += lineHeight / 2;
      }
    }

    return Buffer.from(pdf.output('arraybuffer'));
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    throw new Error('PDF oluşturulamadı');
  }
}

export async function generateDocx(content: string): Promise<Buffer> {
  try {
    const lines = content.split('\n');
    const docChildren: Paragraph[] = [];

    for (const line of lines) {
      if (line.startsWith('# ')) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(2),
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          })
        );
      } else if (line.startsWith('## ')) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(3),
                bold: true,
                size: 24,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (line.startsWith('### ')) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(4),
                bold: true,
                size: 20,
              }),
            ],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 100, after: 50 },
          })
        );
      } else if (line.startsWith('- ')) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '• ' + line.substring(2),
                size: 20,
              }),
            ],
            spacing: { after: 50 },
            indent: { left: 720 },
          })
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(2, line.length - 2),
                bold: true,
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })
        );
      } else if (line.trim() !== '') {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })
        );
      } else {
        docChildren.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { after: 100 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    console.error('DOCX oluşturma hatası:', error);
    throw new Error('DOCX oluşturulamadı');
  }
}
