import { db } from './database.service';
import { EmailService } from './email.service';
import { TurkeyTime } from '../utils/timezone';

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
    return {
      todayStart: TurkeyTime.getTodayStart(),
      tomorrowStart: TurkeyTime.getTomorrowStart(),
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
    return TurkeyTime.fromUTC(TurkeyTime.getTomorrowStart());
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

    await EmailService.sendContactMessage({
      type: data.type,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });
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

    const messagesWithTurkeyTime = messages.map((message: any) => ({
      ...message,
      createdAt: TurkeyTime.fromUTC(message.createdAt),
      updatedAt: TurkeyTime.fromUTC(message.updatedAt),
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
