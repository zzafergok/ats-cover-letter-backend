import logger from '../config/logger';

export interface University {
  id: string;
  name: string;
  city?: string;
  type: 'STATE' | 'PRIVATE' | 'FOUNDATION';
  website?: string;
}

export class UniversityService {
  private static universities: University[] = [];
  private static isLoaded = false;
  private static lastUpdated: Date | null = null;
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private static async fetchUniversitiesFromWikipedia(): Promise<University[]> {
    try {
      const universities: University[] = [];

      // Complete list of Turkish universities from Wikipedia
      const stateUniversities = [
        {
          name: 'Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi',
          city: 'Adana',
        },
        { name: 'Çukurova Üniversitesi', city: 'Adana' },
        { name: 'Adıyaman Üniversitesi', city: 'Adıyaman' },
        { name: 'Afyon Kocatepe Üniversitesi', city: 'Afyonkarahisar' },
        {
          name: 'Afyonkarahisar Sağlık Bilimleri Üniversitesi',
          city: 'Afyonkarahisar',
        },
        { name: 'Ağrı İbrahim Çeçen Üniversitesi', city: 'Ağrı' },
        { name: 'Aksaray Üniversitesi', city: 'Aksaray' },
        { name: 'Amasya Üniversitesi', city: 'Amasya' },
        { name: 'Jandarma ve Sahil Güvenlik Akademisi', city: 'Ankara' },
        { name: 'Ankara Üniversitesi', city: 'Ankara' },
        { name: 'Ankara Müzik ve Güzel Sanatlar Üniversitesi', city: 'Ankara' },
        { name: 'Ankara Hacı Bayram Veli Üniversitesi', city: 'Ankara' },
        { name: 'Ankara Sosyal Bilimler Üniversitesi', city: 'Ankara' },
        { name: 'Gazi Üniversitesi', city: 'Ankara' },
        { name: 'Hacettepe Üniversitesi', city: 'Ankara' },
        { name: 'Orta Doğu Teknik Üniversitesi', city: 'Ankara' },
        { name: 'Ankara Yıldırım Beyazıt Üniversitesi', city: 'Ankara' },
        { name: 'Polis Akademisi', city: 'Ankara' },
        { name: 'Akdeniz Üniversitesi', city: 'Antalya' },
        { name: 'Alanya Alaaddin Keykubat Üniversitesi', city: 'Antalya' },
        { name: 'Ardahan Üniversitesi', city: 'Ardahan' },
        { name: 'Artvin Çoruh Üniversitesi', city: 'Artvin' },
        { name: 'Aydın Adnan Menderes Üniversitesi', city: 'Aydın' },
        { name: 'Balıkesir Üniversitesi', city: 'Balıkesir' },
        { name: 'Bandırma Onyedi Eylül Üniversitesi', city: 'Balıkesir' },
        { name: 'Bartın Üniversitesi', city: 'Bartın' },
        { name: 'Batman Üniversitesi', city: 'Batman' },
        { name: 'Bayburt Üniversitesi', city: 'Bayburt' },
        { name: 'Bilecik Şeyh Edebali Üniversitesi', city: 'Bilecik' },
        { name: 'Bingöl Üniversitesi', city: 'Bingöl' },
        { name: 'Bitlis Eren Üniversitesi', city: 'Bitlis' },
        { name: 'Bolu Abant İzzet Baysal Üniversitesi', city: 'Bolu' },
        { name: 'Burdur Mehmet Akif Ersoy Üniversitesi', city: 'Burdur' },
        { name: 'Bursa Uludağ Üniversitesi', city: 'Bursa' },
        { name: 'Bursa Teknik Üniversitesi', city: 'Bursa' },
        { name: 'Çanakkale Onsekiz Mart Üniversitesi', city: 'Çanakkale' },
        { name: 'Çankırı Karatekin Üniversitesi', city: 'Çankırı' },
        { name: 'Çorum Hitit Üniversitesi', city: 'Çorum' },
        { name: 'Pamukkale Üniversitesi', city: 'Denizli' },
        { name: 'Dicle Üniversitesi', city: 'Diyarbakır' },
        { name: 'Düzce Üniversitesi', city: 'Düzce' },
        { name: 'Trakya Üniversitesi', city: 'Edirne' },
        { name: 'Fırat Üniversitesi', city: 'Elazığ' },
        { name: 'Erzincan Binali Yıldırım Üniversitesi', city: 'Erzincan' },
        { name: 'Atatürk Üniversitesi', city: 'Erzurum' },
        { name: 'Eskişehir Osmangazi Üniversitesi', city: 'Eskişehir' },
        { name: 'Eskişehir Teknik Üniversitesi', city: 'Eskişehir' },
        { name: 'Anadolu Üniversitesi', city: 'Eskişehir' },
        { name: 'Gaziantep Üniversitesi', city: 'Gaziantep' },
        { name: 'Giresun Üniversitesi', city: 'Giresun' },
        { name: 'Gümüşhane Üniversitesi', city: 'Gümüşhane' },
        { name: 'Hakkari Üniversitesi', city: 'Hakkari' },
        { name: 'Hatay Mustafa Kemal Üniversitesi', city: 'Hatay' },
        { name: 'Iğdır Üniversitesi', city: 'Iğdır' },
        { name: 'Isparta Uygulamalı Bilimler Üniversitesi', city: 'Isparta' },
        { name: 'Süleyman Demirel Üniversitesi', city: 'Isparta' },
        { name: 'Mersin Üniversitesi', city: 'Mersin' },
        { name: 'İstanbul Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Teknik Üniversitesi', city: 'İstanbul' },
        { name: 'Boğaziçi Üniversitesi', city: 'İstanbul' },
        { name: 'Marmara Üniversitesi', city: 'İstanbul' },
        { name: 'Yıldız Teknik Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Üniversitesi-Cerrahpaşa', city: 'İstanbul' },
        { name: 'Galatasaray Üniversitesi', city: 'İstanbul' },
        { name: 'Mimar Sinan Güzel Sanatlar Üniversitesi', city: 'İstanbul' },
        { name: 'Ege Üniversitesi', city: 'İzmir' },
        { name: 'Dokuz Eylül Üniversitesi', city: 'İzmir' },
        { name: 'İzmir Yüksek Teknoloji Enstitüsü', city: 'İzmir' },
        { name: 'İzmir Kâtip Çelebi Üniversitesi', city: 'İzmir' },
        { name: 'Kafkas Üniversitesi', city: 'Kars' },
        { name: 'Kastamonu Üniversitesi', city: 'Kastamonu' },
        { name: 'Erciyes Üniversitesi', city: 'Kayseri' },
        { name: 'Kayseri Üniversitesi', city: 'Kayseri' },
        { name: 'Kırklareli Üniversitesi', city: 'Kırklareli' },
        { name: 'Kırşehir Ahi Evran Üniversitesi', city: 'Kırşehir' },
        { name: 'Gebze Teknik Üniversitesi', city: 'Kocaeli' },
        { name: 'Kocaeli Üniversitesi', city: 'Kocaeli' },
        { name: 'Necmettin Erbakan Üniversitesi', city: 'Konya' },
        { name: 'Selçuk Üniversitesi', city: 'Konya' },
        { name: 'Konya Teknik Üniversitesi', city: 'Konya' },
        { name: 'Kütahya Dumlupınar Üniversitesi', city: 'Kütahya' },
        { name: 'Kütahya Sağlık Bilimleri Üniversitesi', city: 'Kütahya' },
        { name: 'İnönü Üniversitesi', city: 'Malatya' },
        { name: 'Malatya Turgut Özal Üniversitesi', city: 'Malatya' },
        { name: 'Manisa Celâl Bayar Üniversitesi', city: 'Manisa' },
        {
          name: 'Kahramanmaraş Sütçü İmam Üniversitesi',
          city: 'Kahramanmaraş',
        },
        { name: 'İstanbul Medeniyet Üniversitesi', city: 'İstanbul' },
        { name: 'Muğla Sıtkı Koçman Üniversitesi', city: 'Muğla' },
        { name: 'Muş Alparslan Üniversitesi', city: 'Muş' },
        { name: 'Nevşehir Hacı Bektaş Veli Üniversitesi', city: 'Nevşehir' },
        { name: 'Niğde Ömer Halisdemir Üniversitesi', city: 'Niğde' },
        { name: 'Ordu Üniversitesi', city: 'Ordu' },
        { name: 'Rize Recep Tayyip Erdoğan Üniversitesi', city: 'Rize' },
        { name: 'Sakarya Üniversitesi', city: 'Sakarya' },
        { name: 'Sakarya Uygulamalı Bilimler Üniversitesi', city: 'Sakarya' },
        { name: 'Ondokuz Mayıs Üniversitesi', city: 'Samsun' },
        { name: 'Samsun Üniversitesi', city: 'Samsun' },
        { name: 'Siirt Üniversitesi', city: 'Siirt' },
        { name: 'Sinop Üniversitesi', city: 'Sinop' },
        { name: 'Cumhuriyet Üniversitesi', city: 'Sivas' },
        { name: 'Sivas Bilim ve Teknoloji Üniversitesi', city: 'Sivas' },
        { name: 'Şırnak Üniversitesi', city: 'Şırnak' },
        { name: 'Namık Kemal Üniversitesi', city: 'Tekirdağ' },
        { name: 'Tekirdağ Namık Kemal Üniversitesi', city: 'Tekirdağ' },
        { name: 'Tokat Gaziosmanpaşa Üniversitesi', city: 'Tokat' },
        { name: 'Karadeniz Teknik Üniversitesi', city: 'Trabzon' },
        { name: 'Trabzon Üniversitesi', city: 'Trabzon' },
        { name: 'Tunceli Üniversitesi', city: 'Tunceli' },
        { name: 'Uşak Üniversitesi', city: 'Uşak' },
        { name: 'Van Yüzüncü Yıl Üniversitesi', city: 'Van' },
        { name: 'Yozgat Bozok Üniversitesi', city: 'Yozgat' },
        { name: 'Zonguldak Bülent Ecevit Üniversitesi', city: 'Zonguldak' },
      ];

      const foundationUniversities = [
        { name: 'TED Üniversitesi', city: 'Ankara' },
        { name: 'Ankara Bilim Üniversitesi', city: 'Ankara' },
        { name: 'Ankara Medipol Üniversitesi', city: 'Ankara' },
        { name: 'Atılım Üniversitesi', city: 'Ankara' },
        { name: 'Başkent Üniversitesi', city: 'Başkent' },
        { name: 'Bilkent Üniversitesi', city: 'Ankara' },
        { name: 'Çankaya Üniversitesi', city: 'Ankara' },
        { name: 'Lokman Hekim Üniversitesi', city: 'Ankara' },
        { name: 'Ostim Teknik Üniversitesi', city: 'Ankara' },
        { name: 'TOBB Ekonomi ve Teknoloji Üniversitesi', city: 'Ankara' },
        { name: 'Ufuk Üniversitesi', city: 'Ankara' },
        { name: 'Antalya Bilim Üniversitesi', city: 'Antalya' },
        { name: 'Alanya Hamdullah Emin Paşa Üniversitesi', city: 'Antalya' },
        { name: 'Acıbadem Mehmet Ali Aydınlar Üniversitesi', city: 'İstanbul' },
        { name: 'Altınbaş Üniversitesi', city: 'İstanbul' },
        { name: 'Bahçeşehir Üniversitesi', city: 'İstanbul' },
        { name: 'Beykent Üniversitesi', city: 'İstanbul' },
        { name: 'Beykoz Üniversitesi', city: 'İstanbul' },
        { name: 'Biruni Üniversitesi', city: 'İstanbul' },
        { name: 'Doğuş Üniversitesi', city: 'İstanbul' },
        { name: 'Fatih Sultan Mehmet Vakıf Üniversitesi', city: 'İstanbul' },
        { name: 'Haliç Üniversitesi', city: 'İstanbul' },
        { name: 'Işık Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul 29 Mayıs Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Arel Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Aydın Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Bilgi Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Esenyurt Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Gelişim Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Kültür Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Okan Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Rumeli Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Sabahattin Zaim Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Şehir Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Ticaret Üniversitesi', city: 'İstanbul' },
        { name: 'İstanbul Topkapı Üniversitesi', city: 'İstanbul' },
        { name: 'Kadir Has Üniversitesi', city: 'İstanbul' },
        { name: 'Koç Üniversitesi', city: 'İstanbul' },
        { name: 'Maltepe Üniversitesi', city: 'İstanbul' },
        { name: 'Özyeğin Üniversitesi', city: 'İstanbul' },
        { name: 'Piri Reis Üniversitesi', city: 'İstanbul' },
        { name: 'Sabancı Üniversitesi', city: 'İstanbul' },
        { name: 'Üsküdar Üniversitesi', city: 'İstanbul' },
        { name: 'Yeditepe Üniversitesi', city: 'İstanbul' },
        { name: 'Yaşar Üniversitesi', city: 'İzmir' },
        { name: 'İzmir Ekonomi Üniversitesi', city: 'İzmir' },
        { name: 'İzmir Tınaztepe Üniversitesi', city: 'İzmir' },
        { name: 'Atatürk Kültür, Dil ve Tarih Yüksek Kurumu', city: 'Ankara' },
      ];

      let idCounter = 1;

      // Add state universities
      stateUniversities.forEach((uni) => {
        universities.push({
          id: (idCounter++).toString(),
          name: uni.name,
          city: uni.city,
          type: 'STATE',
        });
      });

      // Add foundation universities
      foundationUniversities.forEach((uni) => {
        universities.push({
          id: (idCounter++).toString(),
          name: uni.name,
          city: uni.city,
          type: 'FOUNDATION',
        });
      });

      logger.info(
        `Loaded ${universities.length} universities (hardcoded data)`
      );
      return universities;
    } catch (error) {
      logger.error('Error loading universities:', error);
      return [];
    }
  }

  private static shouldRefreshCache(): boolean {
    if (!this.lastUpdated) {
      return true;
    }

    const now = new Date();
    const timeDiff = now.getTime() - this.lastUpdated.getTime();
    return timeDiff > this.CACHE_DURATION;
  }

  public static async getAllUniversities(): Promise<University[]> {
    if (!this.isLoaded || this.shouldRefreshCache()) {
      await this.loadUniversities();
    }
    return this.universities;
  }

  public static async loadUniversities(): Promise<void> {
    try {
      this.universities = await this.fetchUniversitiesFromWikipedia();
      this.isLoaded = true;
      this.lastUpdated = new Date();
      logger.info(`Loaded ${this.universities.length} universities`);
    } catch (error) {
      logger.error('Error loading universities:', error);
      this.universities = [];
    }
  }

  public static async searchUniversities(query: string): Promise<University[]> {
    const universities = await this.getAllUniversities();

    if (!query || query.trim().length < 2) {
      return universities;
    }

    const searchTerm = query.toLowerCase().trim();
    const filtered = universities.filter(
      (university) =>
        university.name.toLowerCase().includes(searchTerm) ||
        university.city?.toLowerCase().includes(searchTerm)
    );

    return filtered;
  }

  public static async getUniversitiesByCity(
    city: string
  ): Promise<University[]> {
    const universities = await this.getAllUniversities();

    if (!city) {
      return [];
    }

    return universities.filter(
      (university) => university.city?.toLowerCase() === city.toLowerCase()
    );
  }

  public static async getUniversitiesByType(
    type: 'STATE' | 'PRIVATE' | 'FOUNDATION'
  ): Promise<University[]> {
    const universities = await this.getAllUniversities();
    return universities.filter((university) => university.type === type);
  }

  public static async getUniversityById(
    id: string
  ): Promise<University | null> {
    const universities = await this.getAllUniversities();
    return universities.find((university) => university.id === id) || null;
  }

  public static async forceRefresh(): Promise<void> {
    this.isLoaded = false;
    this.lastUpdated = null;
    await this.loadUniversities();
  }

  public static async getStats(): Promise<{
    total: number;
    state: number;
    foundation: number;
    private: number;
    cities: number;
    isLoaded: boolean;
    lastUpdated: Date | null;
  }> {
    const universities = await this.getAllUniversities();

    const stateCount = universities.filter((u) => u.type === 'STATE').length;
    const foundationCount = universities.filter(
      (u) => u.type === 'FOUNDATION'
    ).length;
    const privateCount = universities.filter(
      (u) => u.type === 'PRIVATE'
    ).length;

    const uniqueCities = new Set(
      universities
        .map((university) => university.city)
        .filter((city) => city && city.trim() !== '')
    );

    return {
      total: universities.length,
      state: stateCount,
      foundation: foundationCount,
      private: privateCount,
      cities: uniqueCities.size,
      isLoaded: this.isLoaded,
      lastUpdated: this.lastUpdated,
    };
  }
}

export default UniversityService;
