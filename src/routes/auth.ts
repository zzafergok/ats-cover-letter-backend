import { z } from 'zod';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const registerSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  firstName: z.string().min(1, 'Ad alanı zorunludur'),
  lastName: z.string().min(1, 'Soyad alanı zorunludur'),
});

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(1, 'Şifre alanı zorunludur'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Doğrulama token'ı gereklidir"),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token gereklidir'),
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = registerSchema.parse(
      req.body
    );

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kullanılmaktadır',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailVerifyToken = jwt.sign(
      { email, timestamp: Date.now() },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        emailVerifyToken,
        emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        role: true,
        createdAt: true,
      },
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerifyToken}`;

    await resend.emails.send({
      from: 'ATS CV Generator <noreply@example.com>',
      to: email,
      subject: 'Email Adresinizi Doğrulayın',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hoş Geldiniz ${firstName}!</h2>
          <p>ATS CV Generator platformuna kayıt olduğunuz için teşekkür ederiz.</p>
          <p>Hesabınızı aktif hale getirmek için aşağıdaki bağlantıya tıklayın:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
            Email Adresimi Doğrula
          </a>
          <p>Bu bağlantı 24 saat boyunca geçerlidir.</p>
          <p>Eğer bu hesabı siz oluşturmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
        </div>
      `,
    });

    return res.status(201).json({
      success: true,
      message:
        'Hesap başarıyla oluşturuldu. Email adresinize doğrulama bağlantısı gönderildi.',
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    console.error('Kayıt hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu',
    });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findFirst({
      where: {
        email: decoded.email,
        emailVerifyToken: token,
        emailVerifyExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz veya süresi dolmuş doğrulama token'ı",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    return res.json({
      success: true,
      message: 'Email adresi başarıyla doğrulandı',
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz doğrulama token'ı",
      });
    }

    console.error('Email doğrulama hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre',
      });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({
        success: false,
        message:
          'Email adresi doğrulanmamış. Lütfen önce email adresinizi doğrulayın.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre',
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const {
      password: _,
      emailVerifyToken,
      emailVerifyExpires,
      ...userResponse
    } = user;

    return res.json({
      success: true,
      message: 'Giriş başarılı',
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    console.error('Giriş hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu',
    });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz veya süresi dolmuş refresh token',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as any;
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz refresh token',
      });
    }

    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        email: tokenRecord.user.email,
        role: tokenRecord.user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Token yenileme hatası:', error);
    return res.status(401).json({
      success: false,
      message: 'Token yenilenemedi',
    });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (req.body.refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: req.body.refreshToken },
      });
    }

    res.json({
      success: true,
      message: 'Çıkış başarılı',
    });
  } catch (error) {
    console.error('Çıkış hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu',
    });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isEmailVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası oluştu',
    });
  }
});

export default router;
