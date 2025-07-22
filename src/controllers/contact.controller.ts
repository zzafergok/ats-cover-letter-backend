import { Request, Response } from 'express';

import { ContactData, ContactService } from '../services/contact.service';

import { sendError, sendSuccess, sendServerError } from '../utils/response';

import logger from '../config/logger';
import { SERVICE_MESSAGES, formatMessage, createErrorMessage, createDynamicMessage } from '../constants/messages';

export class ContactController {
  private contactService = ContactService.getInstance();

  public sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, name, email, subject, message } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      await this.contactService.sendContactMessage({
        type,
        name,
        email,
        subject,
        message,
        ipAddress,
        userAgent,
      });

      const messageType =
        type === 'CONTACT' ? 'İletişim mesajınız' : 'Destek talebiniz';
      sendSuccess(
        res,
        null,
        `${messageType} başarıyla gönderildi. En kısa sürede size dönüş yapacağız.`
      );
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.EMAIL.CONTACT_MESSAGE_SEND_FAILED, error as Error));

      if (error instanceof Error && error.message.startsWith('CONTACT_001')) {
        sendError(res, error.message, 429);
        return;
      }

      if (error instanceof Error && error.message.startsWith('EMAIL_')) {
        sendServerError(
          res,
          'CONTACT_002: Email gönderimi başarısız - Lütfen daha sonra tekrar deneyin'
        );
        return;
      }

      sendServerError(res, 'CONTACT_003: Sistem hatası - Mesaj gönderilemedi');
    }
  };

  public checkLimit = async (req: Request, res: Response): Promise<void> => {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const remaining =
        await this.contactService.getRemainingMessages(ipAddress);
      const nextReset = this.contactService.getNextResetTime();
      const turkeyResetTime = new Date(
        nextReset.getTime() + 3 * 60 * 60 * 1000
      );

      sendSuccess(res, {
        remainingMessages: remaining,
        dailyLimit: 3,
        nextResetTime: turkeyResetTime.toLocaleString('tr-TR', {
          timeZone: 'Europe/Istanbul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error));
      sendServerError(res, 'CONTACT_005: Limit bilgisi alınamadı');
    }
  };

  public getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.contactService.getContactMessages(page, limit);
      sendSuccess(res, result);
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error));
      sendServerError(res, 'CONTACT_004: Sistem hatası - Mesajlar yüklenemedi');
    }
  };

  public async sendContactMessage(data: ContactData): Promise<void> {
    if (data.ipAddress) {
      const canSend = await this.contactService.checkDailyLimit(data.ipAddress);
      if (!canSend) {
        const resetTime = this.contactService.getNextResetTime();
        const formattedResetTime = resetTime.toLocaleString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Istanbul',
        });

        throw new Error(
          createDynamicMessage(SERVICE_MESSAGES.CONTACT.DAILY_LIMIT_EXCEEDED, {
            resetTime: formattedResetTime
          }) + `. Limit ${formattedResetTime} saatinde sıfırlanacak.`
        );
      }
    }
  }
}
