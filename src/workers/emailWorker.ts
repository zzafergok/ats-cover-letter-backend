// src/workers/emailWorker.ts
import { emailQueue } from '../config/queue';
import { EmailService } from '../services/email.service';
import logger from '../config/logger';

emailQueue.process(async (job) => {
  const { type, data } = job.data;

  try {
    switch (type) {
      case 'verification':
        await EmailService.sendEmailVerification(
          data.email,
          data.token,
          data.name
        );
        break;
      case 'passwordReset':
        await EmailService.sendPasswordResetEmail(data.email, data.token);
        break;
      case 'contact':
        await EmailService.sendContactMessage(data);
        break;
      default:
        throw new Error(`Bilinmeyen email tipi: ${type}`);
    }

    logger.info(`Email gönderildi: ${type} - ${data.email}`);
  } catch (error) {
    logger.error('Email gönderme hatası:', error);
    throw error;
  }
});
