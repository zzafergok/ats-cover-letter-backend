import { Resend } from 'resend';

export class EmailService {
  private static resend = new Resend(process.env.RESEND_API_KEY);

  public static async sendEmailVerification(
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

      if (!process.env.FRONTEND_URL) {
        throw new Error(
          'EMAIL_002: URL konfigürasyon hatası - Frontend URL tanımlanmamış'
        );
      }

      const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;

      await this.resend.emails.send({
        from: 'Kanban System <noreply@starkon-kanban.com>',
        to: [email],
        subject: 'Email Adresinizi Doğrulayın',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: #10b981; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">Hoş Geldiniz!</h2>
          </div>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; padding: 30px;">
            <div style="margin-bottom: 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Merhaba <strong>${userName}</strong>,
              </p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 15px 0 0 0;">
                Kanban System ailesine katıldığınız için teşekkür ederiz! Hesabınızı aktifleştirmek ve tüm özelliklerden faydalanmaya başlamak için email adresinizi doğrulamanız gerekiyor.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                Email Adresimi Doğrula
              </a>
            </div>
            
            <div style="margin: 25px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #10b981;">
              <p style="color: #475569; font-size: 13px; margin: 0; line-height: 1.4;">
                <strong>Hesabınızı doğruladıktan sonra:</strong>
              </p>
              <ul style="color: #6b7280; font-size: 13px; margin: 8px 0 0 20px; line-height: 1.5;">
                <li>Projelerinizi oluşturabilir ve yönetebilirsiniz</li>
                <li>Takım arkadaşlarınızla işbirliği yapabilirsiniz</li>
                <li>Tüm premium özelliklere erişim kazanırsınız</li>
              </ul>
            </div>
            
            <div style="margin: 25px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <p style="color: #475569; font-size: 13px; margin: 0; line-height: 1.4;">
                <strong>Buton çalışmıyor mu?</strong> Aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:
              </p>
              <p style="color: #3b82f6; font-size: 12px; margin: 8px 0 0 0; word-break: break-all;">
                ${verifyUrl}
              </p>
            </div>
            
            <div style="margin: 25px 0; padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.4;">
                <strong>Önemli:</strong> Bu doğrulama bağlantısı 30 dakika içinde geçerliliğini yitirecektir. Eğer bu hesabı siz oluşturmadıysanız, bu email'i görmezden gelebilirsiniz.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Bu otomatik bir email'dir, lütfen yanıtlamayın.
              </p>
            </div>
          </div>
        </div>
      `,
      });

      console.log('Email doğrulama gönderildi:', {
        recipient: email,
        userName,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Email doğrulama gönderim hatası:', error);
      throw new Error('EMAIL_005: Email doğrulama gönderme başarısız');
    }
  }

  public static async sendPasswordResetEmail(
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

      const result = await this.resend.emails.send({
        from: 'Kanban System <noreply@starkon-kanban.com>',
        to: [email],
        subject: 'Şifre Sıfırlama Talebi',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: #3b82f6; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">Şifre Sıfırlama Talebi</h2>
          </div>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; padding: 30px;">
            <div style="margin-bottom: 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">Merhaba,</p>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 15px 0 0 0;">
                Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak güvenli bir şekilde yeni şifrenizi belirleyebilirsiniz.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">
                Şifremi Sıfırla
              </a>
            </div>
            
            <div style="margin: 25px 0; padding: 15px; background: #f8fafc; border-radius: 6px; border-left: 4px solid #3b82f6;">
              <p style="color: #475569; font-size: 13px; margin: 0; line-height: 1.4;">
                <strong>Buton çalışmıyor mu?</strong> Aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:
              </p>
              <p style="color: #3b82f6; font-size: 12px; margin: 8px 0 0 0; word-break: break-all;">${resetUrl}</p>
            </div>
            
            <div style="margin: 25px 0; padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.4;">
                <strong>Güvenlik Uyarısı:</strong> Bu link 1 saat içinde geçerliliğini yitireceğaktir. Eğer bu talebi siz yapmadıysanız, lütfen bu email'i görmezden gelin.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">Bu otomatik bir email'dir, lütfen yanıtlamayın.</p>
            </div>
          </div>
        </div>
      `,
      });

      console.log('Şifre sıfırlama email gönderim başarılı:', {
        emailId: result.data?.id,
        recipient: email,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Resend şifre sıfırlama email hatası:', error);
      throw new Error('EMAIL_004: Şifre sıfırlama email gönderme başarısız');
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
      if (!process.env.RESEND_API_KEY) {
        throw new Error(
          'EMAIL_001: Resend konfigürasyon hatası - API key eksik'
        );
      }

      const emailSubject = `[${data.type === 'CONTACT' ? 'İLETİŞİM' : 'DESTEK'}] ${data.subject}`;
      const formattedDate = new Date().toLocaleString('tr-TR', {
        timeZone: 'Europe/Istanbul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const headerColor = data.type === 'CONTACT' ? '#6366f1' : '#f59e0b';
      const headerIcon = data.type === 'CONTACT' ? '📧' : '🛠️';
      const headerTitle =
        data.type === 'CONTACT' ? 'Yeni İletişim Mesajı' : 'Yeni Destek Talebi';

      await this.resend.emails.send({
        from: 'Kanban System <noreply@starkon-kanban.com>',
        to: [process.env.ADMIN_EMAIL || 'admin@starkon-kanban.com'],
        subject: emailSubject,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: ${headerColor}; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">
              ${headerIcon} ${headerTitle}
            </h2>
          </div>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; padding: 30px;">
            <div style="margin-bottom: 20px;">
              <h3 style="color: #374151; font-size: 16px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #f3f4f6;">
                📋 Mesaj Detayları
              </h3>
            </div>
            
            <div style="margin-bottom: 15px;">
              <span style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Gönderen</span>
              <p style="color: #374151; font-size: 15px; margin: 5px 0 0 0; font-weight: 500;">${data.name}</p>
            </div>
            
            <div style="margin-bottom: 15px;">
              <span style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">E-posta</span>
              <p style="color: #374151; font-size: 15px; margin: 5px 0 0 0;">
                <a href="mailto:${data.email}" style="color: #3b82f6; text-decoration: none;">${data.email}</a>
              </p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <span style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Konu</span>
              <p style="color: #374151; font-size: 15px; margin: 5px 0 0 0; font-weight: 500;">${data.subject}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <span style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Mesaj İçeriği</span>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 8px; border-left: 4px solid ${headerColor};">
                <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.message}</p>
              </div>
            </div>
            
            <div style="margin: 25px 0; padding: 15px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #0ea5e9;">
              <p style="color: #0c4a6e; font-size: 13px; margin: 0; line-height: 1.4;">
                <strong>💡 Hızlı Eylemler:</strong> Gönderene <a href="mailto:${data.email}?subject=Re: ${data.subject}" style="color: #0ea5e9; text-decoration: none;">doğrudan yanıt verebilir</a> veya bu mesajı takip sistemine aktarabilirsiniz.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div style="color: #6b7280; font-size: 12px;">
                  <strong>Gönderim Zamanı:</strong> ${formattedDate} (Türkiye Saati)
                </div>
                <div style="color: #6b7280; font-size: 12px;">
                  <strong>Tip:</strong> ${data.type === 'CONTACT' ? 'İletişim' : 'Destek Talebi'}
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Bu mesaj Kanban System iletişim formu aracılığıyla gönderilmiştir.
              </p>
            </div>
          </div>
        </div>
      `,
      });

      console.log('İletişim mesajı gönderildi:', {
        type: data.type,
        senderEmail: data.email,
        subject: data.subject,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('İletişim mesajı gönderim hatası:', error);
      throw new Error('EMAIL_006: İletişim mesajı gönderme başarısız');
    }
  }
}
