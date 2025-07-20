// src/workers/cvWorker.ts
import { cvProcessingQueue } from '../config/queue';
import {
  extractCvContent,
  convertToMarkdown,
} from '../services/cvService.service';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

cvProcessingQueue.process(async (job) => {
  const { filePath, cvUploadId } = job.data;

  try {
    const extractedText = await extractCvContent(filePath);
    const markdownContent = await convertToMarkdown(extractedText);

    await prisma.cvUpload.update({
      where: { id: cvUploadId },
      data: {
        markdownContent,
        processingStatus: 'COMPLETED',
      },
    });

    logger.info(`CV işleme tamamlandı: ${cvUploadId}`);
  } catch (error) {
    await prisma.cvUpload.update({
      where: { id: cvUploadId },
      data: {
        processingStatus: 'FAILED',
      },
    });

    logger.error('CV işleme hatası:', error);
    throw error;
  }
});
