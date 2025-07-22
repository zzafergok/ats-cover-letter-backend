import { EmailService } from './email.service';

import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  formatMessage,
  createErrorMessage,
} from '../constants/messages';

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
      logger.info(
        formatMessage(SERVICE_MESSAGES.QUEUE.EMAIL_JOB_PROCESSING),
        job.type
      );

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
          throw new Error(
            formatMessage(SERVICE_MESSAGES.QUEUE.UNKNOWN_EMAIL_TYPE) +
              `: ${job.type}`
          );
      }

      logger.info(
        formatMessage(SERVICE_MESSAGES.QUEUE.EMAIL_JOB_COMPLETED),
        job.type
      );
    } catch (error) {
      logger.error(
        createErrorMessage(
          SERVICE_MESSAGES.QUEUE.EMAIL_JOB_FAILED,
          error as Error
        )
      );

      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        // Retry logic - Vercel'de setTimeout kullanarak basit retry
        setTimeout(() => this.processEmailJob(job), 2000 * job.attempts);
      } else {
        logger.error(
          formatMessage(SERVICE_MESSAGES.QUEUE.MAX_RETRIES_REACHED) +
            `: ${job.id}`
        );
      }
    }
  }
}

export const queueService = SimpleQueueService.getInstance();
