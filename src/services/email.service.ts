import { Resend } from 'resend';

import logger from '../config/logger';
import { SERVICE_MESSAGES, formatMessage, createErrorMessage } from '../constants/messages';

export class EmailService {
  private static resend = new Resend(process.env.RESEND_API_KEY);

  public static async sendEmailVerification(
    email: string,
    verifyToken: string,
    userName: string
  ): Promise<void> {
    try {
      await this.sendEmailVerificationDirect(email, verifyToken, userName);
      logger.info(formatMessage(SERVICE_MESSAGES.EMAIL.VERIFICATION_SENT, email));
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.EMAIL.VERIFICATION_SEND_FAILED, error as Error));
      throw new Error(formatMessage(SERVICE_MESSAGES.EMAIL.VERIFICATION_SEND_FAILED));
    }
  }

  public static async sendEmailVerificationDirect(
    email: string,
    _verifyToken: string,
    userName: string
  ): Promise<void> {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error(
          'EMAIL_001: Resend konfigürasyon hatası - API key eksik'
        );
      }

      await this.resend.emails.send({
        from: 'Kanban System <noreply@starkon-kanban.com>',
        to: [email],
        subject: 'Email Adresinizi Doğrulayın',
        html: `[Mevcut HTML template aynı kalacak]`,
      });

      logger.info(formatMessage(SERVICE_MESSAGES.EMAIL.VERIFICATION_SENT), {
        recipient: email,
        userName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.EMAIL.VERIFICATION_SEND_FAILED, error as Error));
      throw new Error(formatMessage(SERVICE_MESSAGES.EMAIL.VERIFICATION_SEND_FAILED));
    }
  }

  public static async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    try {
      await this.sendPasswordResetEmailDirect(email, resetToken);
      logger.info(formatMessage(SERVICE_MESSAGES.EMAIL.PASSWORD_RESET_SENT), email);
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.EMAIL.PASSWORD_RESET_SEND_FAILED, error as Error));
      throw new Error(formatMessage(SERVICE_MESSAGES.EMAIL.PASSWORD_RESET_SEND_FAILED));
    }
  }

  public static async sendContactMessage(data: {
    type: 'CONTACT' | 'SUPPORT';
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    try {
      await this.sendContactMessageDirect(data);
      logger.info(formatMessage(SERVICE_MESSAGES.EMAIL.CONTACT_MESSAGE_SENT), data.email);
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.EMAIL.CONTACT_MESSAGE_SEND_FAILED, error as Error));
      throw new Error(formatMessage(SERVICE_MESSAGES.EMAIL.CONTACT_MESSAGE_SEND_FAILED));
    }
  }

  public static async sendPasswordResetEmailDirect(
    email: string,
    resetToken: string
  ): Promise<void> {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error(
          'EMAIL_001: Resend konfigürasyon hatası - API key eksik'
        );
      }

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await this.resend.emails.send({
        from: 'ATS CV System <noreply@atscv.com>',
        to: [email],
        subject: 'Şifre Sıfırlama Talebi',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Şifre Sıfırlama</h2>
            <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Şifremi Sıfırla</a>
            <p>Bu bağlantı 1 saat geçerlidir.</p>
            <p>Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
          </div>
        `,
      });

      logger.info(formatMessage(SERVICE_MESSAGES.EMAIL.PASSWORD_RESET_SENT), email);
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.EMAIL.PASSWORD_RESET_SEND_FAILED, error as Error));
      throw new Error(formatMessage(SERVICE_MESSAGES.EMAIL.PASSWORD_RESET_SEND_FAILED));
    }
  }

  public static async sendContactMessageDirect(data: {
    type: 'CONTACT' | 'SUPPORT';
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error(
          'EMAIL_001: Resend konfigürasyon hatası - API key eksik'
        );
      }

      await this.resend.emails.send({
        from: 'ATS CV System <noreply@atscv.com>',
        to: [process.env.ADMIN_EMAIL || 'admin@atscv.com'],
        replyTo: data.email,
        subject: `[${data.type}] ${data.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${data.type === 'CONTACT' ? 'İletişim Formu' : 'Destek Talebi'}</h2>
            <p><strong>Gönderen:</strong> ${data.name} (${data.email})</p>
            <p><strong>Konu:</strong> ${data.subject}</p>
            <hr />
            <p>${data.message.replace(/\n/g, '<br>')}</p>
          </div>
        `,
      });

      logger.info(formatMessage(SERVICE_MESSAGES.EMAIL.CONTACT_MESSAGE_SENT), data.email);
    } catch (error) {
      logger.error(createErrorMessage(SERVICE_MESSAGES.EMAIL.CONTACT_MESSAGE_SEND_FAILED, error as Error));
      throw new Error(formatMessage(SERVICE_MESSAGES.EMAIL.CONTACT_MESSAGE_SEND_FAILED));
    }
  }
}
