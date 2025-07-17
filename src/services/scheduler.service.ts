import { DatabaseService } from './database.service';

export class SchedulerService {
  private static emailCleanupInterval: NodeJS.Timeout | null = null;

  public static startEmailTokenCleanup(): void {
    this.emailCleanupInterval = setInterval(
      async () => {
        console.log('Otomatik email token temizleme başlatıldı...');
        try {
          const dbService = DatabaseService.getInstance();
          await dbService.cleanupExpiredEmailTokens();
          await dbService.deleteUnverifiedUsers();
        } catch (error) {
          console.error('Email token cleanup hatası:', error);
        }
      },
      6 * 60 * 60 * 1000
    );

    console.log('Email token cleanup scheduler başlatıldı');
  }

  public static stopEmailTokenCleanup(): void {
    if (this.emailCleanupInterval) {
      clearInterval(this.emailCleanupInterval);
      this.emailCleanupInterval = null;
      console.log('Email token cleanup scheduler durduruldu');
    }
  }

  public static stopAllCleanup(): void {
    this.stopEmailTokenCleanup();
  }
}
