export class DateFormatter {
  
  /**
   * Tarihi 'Ay Yıl' formatına çevir (basic_hr standardı)
   * Örnek: "2023-06-15" → "Jun 2023"
   */
  static formatDate(dateString: string): string {
    if (!dateString || typeof dateString !== 'string') {
      return '';
    }

    // "Present", "Current" gibi özel durumlar
    const lowerDate = dateString.toLowerCase().trim();
    if (lowerDate === 'present' || lowerDate === 'current' || lowerDate === '') {
      return 'Present';
    }
    
    try {
      // Farklı tarih formatlarını destekle
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Geçersiz tarih ise orijinalini döndür
        return dateString;
      }
      
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } catch (error) {
      // Hata durumunda orijinal string'i döndür
      return dateString;
    }
  }

  /**
   * Tarih aralığı formatla
   * Örnek: formatDateRange("2020-01", "2023-06") → "Jan 2020 – Jun 2023"
   */
  static formatDateRange(startDate: string, endDate?: string): string {
    const formattedStart = DateFormatter.formatDate(startDate);
    
    if (!endDate || endDate.trim() === '') {
      return `${formattedStart} – Present`;
    }
    
    const formattedEnd = DateFormatter.formatDate(endDate);
    return `${formattedStart} – ${formattedEnd}`;
  }

  /**
   * Graduation date için özel format
   * Eğer sadece yıl varsa "Year", tam tarih varsa "Month Year"
   */
  static formatGraduationDate(dateString: string): string {
    if (!dateString || typeof dateString !== 'string') {
      return 'Date not specified';
    }

    const trimmed = dateString.trim();
    
    // Sadece yıl formatı (örn: "2023")
    if (/^\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Normal tarih formatı
    return DateFormatter.formatDate(dateString);
  }

  /**
   * Template'ler için esnek tarih formatter
   * Farklı field'ları kontrol eder ve en uygun olanı kullanır
   */
  static formatFlexibleDate(dateObj: {
    startDate?: string;
    endDate?: string;
    graduationDate?: string;
    date?: string;
  }): string {
    // Graduation date varsa onu kullan
    if (dateObj.graduationDate) {
      return DateFormatter.formatGraduationDate(dateObj.graduationDate);
    }
    
    // Date field'ı varsa onu kullan
    if (dateObj.date) {
      return DateFormatter.formatDate(dateObj.date);
    }
    
    // Start-end date varsa range olarak format et
    if (dateObj.startDate) {
      return DateFormatter.formatDateRange(dateObj.startDate, dateObj.endDate);
    }
    
    return 'Date not specified';
  }
}