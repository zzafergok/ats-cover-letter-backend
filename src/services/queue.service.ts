import { EmailService } from './email.service';

import logger from '../config/logger';

interface QueueJob {
  id: string;
  type: string;
  data: any;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}

class SimpleQueueService {
  private static instance: SimpleQueueService;
  private processingJobs: Map<string, QueueJob> = new Map();

  public static getInstance(): SimpleQueueService {
    if (!SimpleQueueService.instance) {
      SimpleQueueService.instance = new SimpleQueueService();
    }
    return SimpleQueueService.instance;
  }

  async addEmailJob(type: string, data: any): Promise<void> {
    const jobId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job: QueueJob = {
      id: jobId,
      type,
      data,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    // Vercel'de background job çalıştıramayacağımız için direkt işliyoruz
    await this.processEmailJob(job);
  }

  private async processEmailJob(job: QueueJob): Promise<void> {
    try {
      logger.info(`Email job işleniyor: ${job.type}`);

      switch (job.type) {
        case 'verification':
          await EmailService.sendEmailVerificationDirect(
            job.data.email,
            job.data.token,
            job.data.name
          );
          break;
        case 'passwordReset':
          await EmailService.sendPasswordResetEmailDirect(
            job.data.email,
            job.data.token
          );
          break;
        case 'contact':
          await EmailService.sendContactMessageDirect(job.data);
          break;
        default:
          throw new Error(`Bilinmeyen email tipi: ${job.type}`);
      }

      logger.info(`Email job tamamlandı: ${job.type}`);
    } catch (error) {
      logger.error('Email job işleme hatası:', error);

      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        // Retry logic - Vercel'de setTimeout kullanarak basit retry
        setTimeout(() => this.processEmailJob(job), 2000 * job.attempts);
      } else {
        logger.error(`Email job ${job.id} maksimum deneme sayısına ulaştı`);
      }
    }
  }
}

export const queueService = SimpleQueueService.getInstance();
