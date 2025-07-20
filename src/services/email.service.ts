import { emailQueue } from '../config/queue';
import { Resend } from 'resend';
import logger from '../config/logger';
import { queueService } from './queue.service';

export class EmailService {
  private static resend = new Resend(process.env.RESEND_API_KEY);

  public static async sendEmailVerification(
    email: string,
    verifyToken: string,
    userName: string
  ): Promise<void> {
    try {
      await queueService.addEmailJob('verification', {
        email,
        token: verifyToken,
        name: userName,
      });

      logger.info(`Email doğrulama kuyruğa eklendi: ${email}`);
    } catch (error) {
      logger.error('Email kuyruğa ekleme hatası:', error);
      throw new Error('EMAIL_007: Email kuyruğa eklenemedi');
    }
  }

  public static async sendEmailVerificationDirect(
    email: string,
    verifyToken: string,
    userName: string
  ): Promise<void> {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error(
          'EMAIL_001: Resend konfigürasyon hatası - API key eksik'
        );
      }

      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;

      await this.resend.emails.send({
        from: 'Kanban System <noreply@starkon-kanban.com>',
        to: [email],
        subject: 'Email Adresinizi Doğrulayın',
        html: `[Mevcut HTML template aynı kalacak]`,
      });

      logger.info('Email doğrulama gönderildi:', {
        recipient: email,
        userName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Email doğrulama gönderim hatası:', error);
      throw new Error('EMAIL_005: Email doğrulama gönderme başarısız');
    }
  }

  public static async sendPasswordResetEmail(
    email: string,
    resetToken: string
  ): Promise<void> {
    try {
      await emailQueue.add(
        'email',
        {
          type: 'passwordReset',
          data: {
            email,
            token: resetToken,
          },
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      logger.info(`Şifre sıfırlama email kuyruğa eklendi: ${email}`);
    } catch (error) {
      logger.error('Şifre sıfırlama kuyruğa ekleme hatası:', error);
      throw new Error('EMAIL_008: Şifre sıfırlama kuyruğa eklenemedi');
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
      await emailQueue.add(
        'email',
        {
          type: 'contact',
          data,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      logger.info(`İletişim mesajı kuyruğa eklendi: ${data.email}`);
    } catch (error) {
      logger.error('İletişim mesajı kuyruğa ekleme hatası:', error);
      throw new Error('EMAIL_009: İletişim mesajı kuyruğa eklenemedi');
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

      logger.info('Şifre sıfırlama emaili gönderildi:', email);
    } catch (error) {
      logger.error('Şifre sıfırlama email hatası:', error);
      throw new Error('EMAIL_006: Şifre sıfırlama emaili gönderilemedi');
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

      logger.info('İletişim mesajı gönderildi:', data.email);
    } catch (error) {
      logger.error('İletişim mesajı gönderim hatası:', error);
      throw new Error('EMAIL_009: İletişim mesajı gönderilemedi');
    }
  }
}
