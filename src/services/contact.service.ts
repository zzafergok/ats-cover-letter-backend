import { db } from './database.service';
import { EmailService } from './email.service';

export interface ContactData {
  type: 'CONTACT' | 'SUPPORT';
  name: string;
  email: string;
  subject: string;
  message: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ContactService {
  private static instance: ContactService;

  public static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  private getTurkeyDayBounds(): { todayStart: Date; tomorrowStart: Date } {
    const now = new Date();
    const turkeyOffset = 3 * 60 * 60 * 1000;
    const turkeyTime = new Date(now.getTime() + turkeyOffset);

    const todayStart = new Date(turkeyTime);
    todayStart.setUTCHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    return {
      todayStart: new Date(todayStart.getTime() - turkeyOffset),
      tomorrowStart: new Date(tomorrowStart.getTime() - turkeyOffset),
    };
  }

  public async checkDailyLimit(ipAddress: string): Promise<boolean> {
    const { todayStart, tomorrowStart } = this.getTurkeyDayBounds();

    const messageCount = await db.user.count({
      where: {
        email: ipAddress,
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    });

    return messageCount < 3;
  }

  public async getRemainingMessages(ipAddress: string): Promise<number> {
    const { todayStart, tomorrowStart } = this.getTurkeyDayBounds();

    const messageCount = await db.user.count({
      where: {
        email: ipAddress,
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
    });

    return Math.max(0, 3 - messageCount);
  }

  public getNextResetTime(): Date {
    const now = new Date();
    const turkeyOffset = 3 * 60 * 60 * 1000;
    const turkeyTime = new Date(now.getTime() + turkeyOffset);

    const tomorrowStart = new Date(turkeyTime);
    tomorrowStart.setUTCHours(0, 0, 0, 0);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    return tomorrowStart;
  }

  public async sendContactMessage(data: ContactData): Promise<void> {
    if (data.ipAddress) {
      const canSend = await this.checkDailyLimit(data.ipAddress);
      if (!canSend) {
        const resetTime = this.getNextResetTime();
        const formattedResetTime = resetTime.toLocaleString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        throw new Error(
          `CONTACT_001: Günlük mesaj gönderme limitine ulaştınız (3/3). ` +
            `Limit ${formattedResetTime} saatinde sıfırlanacak.`
        );
      }
    }

    try {
      await EmailService.sendContactMessage({
        type: data.type,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
      });
    } catch (emailError) {
      throw emailError;
    }
  }

  public async getContactMessages(
    page = 1,
    limit = 20
  ): Promise<{
    messages: any[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const [messages, total] = await Promise.all([
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count(),
    ]);

    const turkeyOffset = 3 * 60 * 60 * 1000;
    const messagesWithTurkeyTime = messages.map((message: any) => ({
      ...message,
      createdAt: new Date(message.createdAt.getTime() + turkeyOffset),
      updatedAt: new Date(message.updatedAt.getTime() + turkeyOffset),
    }));

    return {
      messages: messagesWithTurkeyTime,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
