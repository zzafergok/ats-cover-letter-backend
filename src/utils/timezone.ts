/**
 * Turkey Timezone Utilities
 * Turkey is UTC+3 (no daylight saving since 2016)
 */

export class TurkeyTime {
  private static readonly TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds

  /**
   * Get current date and time in Turkey timezone
   */
  static now(): Date {
    const utc = new Date();
    return new Date(utc.getTime() + this.TURKEY_OFFSET_MS);
  }

  /**
   * Convert UTC date to Turkey timezone
   */
  static fromUTC(utcDate: Date): Date {
    return new Date(utcDate.getTime() + this.TURKEY_OFFSET_MS);
  }

  /**
   * Convert Turkey time to UTC
   */
  static toUTC(turkeyDate: Date): Date {
    return new Date(turkeyDate.getTime() - this.TURKEY_OFFSET_MS);
  }

  /**
   * Get formatted date string in Turkish locale
   */
  static formatDate(date?: Date): string {
    const turkeyDate = date ? this.fromUTC(date) : this.now();
    return turkeyDate.toLocaleDateString('tr-TR');
  }

  /**
   * Get formatted date string with full month name
   */
  static formatDateLong(date?: Date): string {
    const turkeyDate = date ? this.fromUTC(date) : this.now();
    return turkeyDate.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get formatted datetime string
   */
  static formatDateTime(date?: Date): string {
    const turkeyDate = date ? this.fromUTC(date) : this.now();
    return turkeyDate.toLocaleString('tr-TR');
  }

  /**
   * Get start of today in Turkey timezone (as UTC for database)
   */
  static getTodayStart(): Date {
    const turkeyNow = this.now();
    const todayStart = new Date(turkeyNow);
    todayStart.setHours(0, 0, 0, 0);
    return this.toUTC(todayStart);
  }

  /**
   * Get start of tomorrow in Turkey timezone (as UTC for database)
   */
  static getTomorrowStart(): Date {
    const turkeyNow = this.now();
    const tomorrowStart = new Date(turkeyNow);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    return this.toUTC(tomorrowStart);
  }

  /**
   * Get Turkey timezone info
   */
  static getTimezoneInfo(): { offset: string; name: string } {
    return {
      offset: '+03:00',
      name: 'Turkey Time (TRT)'
    };
  }
}