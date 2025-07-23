import logger from '../config/logger';

export interface District {
  id: string;
  name: string;
  provinceCode: string;
}

export interface Province {
  id: string;
  code: string;
  name: string;
  districts: District[];
}

export class LocationService {
  private static provinces: Province[] = [];
  private static isLoaded = false;

  private static loadProvinces(): void {
    try {
      // Complete list of Turkish provinces and districts
      const provinceData = [
        {
          code: '01',
          name: 'Adana',
          districts: ['Aladağ', 'Ceyhan', 'Çukurova', 'Feke', 'İmamoğlu', 'Karaisalı', 'Karataş', 'Kozan', 'Pozantı', 'Saimbeyli', 'Sarıçam', 'Seyhan', 'Tufanbeyli', 'Yumurtalık', 'Yüreğir']
        },
        {
          code: '02',
          name: 'Adıyaman',
          districts: ['Besni', 'Çelikhan', 'Gerger', 'Gölbaşı', 'Kahta', 'Merkez', 'Samsat', 'Sincik', 'Tut']
        },
        {
          code: '03',
          name: 'Afyonkarahisar',
          districts: ['Başmakçı', 'Bayat', 'Bolvadin', 'Çay', 'Çobanlar', 'Dazkırı', 'Dinar', 'Emirdağ', 'Evciler', 'Hocalar', 'İhsaniye', 'İscehisar', 'Kızılören', 'Merkez', 'Sandıklı', 'Sinanpaşa', 'Sultandağı', 'Şuhut']
        },
        {
          code: '04',
          name: 'Ağrı',
          districts: ['Diyadin', 'Doğubayazıt', 'Eleşkirt', 'Hamur', 'Merkez', 'Patnos', 'Taşlıçay', 'Tutak']
        },
        {
          code: '05',
          name: 'Amasya',
          districts: ['Göynücek', 'Gümüşhacıköy', 'Hamamözü', 'Merkez', 'Merzifon', 'Suluova', 'Taşova']
        },
        {
          code: '06',
          name: 'Ankara',
          districts: ['Akyurt', 'Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle']
        },
        {
          code: '07',
          name: 'Antalya',
          districts: ['Akseki', 'Aksu', 'Alanya', 'Demre', 'Döşemealtı', 'Elmalı', 'Finike', 'Gazipaşa', 'Gündoğmuş', 'İbradı', 'Kaş', 'Kemer', 'Kepez', 'Konyaaltı', 'Korkuteli', 'Kumluca', 'Manavgat', 'Muratpaşa', 'Serik']
        },
        {
          code: '08',
          name: 'Artvin',
          districts: ['Ardanuç', 'Arhavi', 'Borçka', 'Hopa', 'Merkez', 'Murgul', 'Şavşat', 'Yusufeli']
        },
        {
          code: '09',
          name: 'Aydın',
          districts: ['Bozdoğan', 'Buharkent', 'Çine', 'Didim', 'Efeler', 'Germencik', 'İncirliova', 'Karacasu', 'Karpuzlu', 'Koçarlı', 'Köşk', 'Kuşadası', 'Kuyucak', 'Nazilli', 'Söke', 'Sultanhisar', 'Yenipazar']
        },
        {
          code: '10',
          name: 'Balıkesir',
          districts: ['Altıeylül', 'Ayvalık', 'Balya', 'Bandırma', 'Bigadiç', 'Burhaniye', 'Dursunbey', 'Edremit', 'Erdek', 'Gömeç', 'Gönen', 'Havran', 'İvrindi', 'Karesi', 'Kepsut', 'Manyas', 'Marmara', 'Savaştepe', 'Sındırgı', 'Susurluk']
        },
        {
          code: '11',
          name: 'Bilecik',
          districts: ['Bozüyük', 'Gölpazarı', 'İnhisar', 'Merkez', 'Osmaneli', 'Pazaryeri', 'Söğüt', 'Yenipazar']
        },
        {
          code: '12',
          name: 'Bingöl',
          districts: ['Adaklı', 'Genç', 'Karlıova', 'Kiğı', 'Merkez', 'Solhan', 'Yayladere', 'Yedisu']
        },
        {
          code: '13',
          name: 'Bitlis',
          districts: ['Adilcevaz', 'Ahlat', 'Güroymak', 'Hizan', 'Merkez', 'Mutki', 'Tatvan']
        },
        {
          code: '14',
          name: 'Bolu',
          districts: ['Dörtdivan', 'Gerede', 'Göynük', 'Kıbrıscık', 'Mengen', 'Merkez', 'Mudurnu', 'Seben', 'Yeniçağ']
        },
        {
          code: '15',
          name: 'Burdur',
          districts: ['Ağlasun', 'Altınyayla', 'Bucak', 'Çavdır', 'Çeltikçi', 'Gölhisar', 'Karamanlı', 'Kemer', 'Merkez', 'Tefenni', 'Yeşilova']
        },
        {
          code: '16',
          name: 'Bursa',
          districts: ['Büyükorhan', 'Gemlik', 'Gürsu', 'Harmancık', 'İnegöl', 'İznik', 'Karacabey', 'Keles', 'Kestel', 'Mudanya', 'Mustafakemalpaşa', 'Nilüfer', 'Orhaneli', 'Orhangazi', 'Osmangazi', 'Yenişehir', 'Yıldırım']
        },
        {
          code: '17',
          name: 'Çanakkale',
          districts: ['Ayvacık', 'Bayramiç', 'Biga', 'Bozcaada', 'Çan', 'Eceabat', 'Ezine', 'Gelibolu', 'Gökçeada', 'Lapseki', 'Merkez', 'Yenice']
        },
        {
          code: '18',
          name: 'Çankırı',
          districts: ['Atkaracalar', 'Bayramören', 'Çerkeş', 'Eldivan', 'Ilgaz', 'Kızılırmak', 'Korgun', 'Kurşunlu', 'Merkez', 'Orta', 'Şabanözü', 'Yapraklı']
        },
        {
          code: '19',
          name: 'Çorum',
          districts: ['Alaca', 'Bayat', 'Boğazkale', 'Dodurga', 'İskilip', 'Kargı', 'Laçin', 'Mecitözü', 'Merkez', 'Oğuzlar', 'Ortaköy', 'Osmancık', 'Sungurlu', 'Uğurludağ']
        },
        {
          code: '20',
          name: 'Denizli',
          districts: ['Acıpayam', 'Babadağ', 'Baklan', 'Bekilli', 'Beyağaç', 'Bozkurt', 'Buldan', 'Çal', 'Çameli', 'Çardak', 'Çivril', 'Güney', 'Honaz', 'Kale', 'Merkezefendi', 'Pamukkale', 'Sarayköy', 'Serinhisar', 'Tavas']
        },
        {
          code: '21',
          name: 'Diyarbakır',
          districts: ['Bağlar', 'Bismil', 'Çermik', 'Çınar', 'Çüngüş', 'Dicle', 'Eğil', 'Ergani', 'Hani', 'Hazro', 'Kayapınar', 'Kocaköy', 'Kulp', 'Lice', 'Silvan', 'Sur', 'Yenişehir']
        },
        {
          code: '22',
          name: 'Edirne',
          districts: ['Enez', 'Havsa', 'İpsala', 'Keşan', 'Lalapaşa', 'Meriç', 'Merkez', 'Süloğlu', 'Uzunköprü']
        },
        {
          code: '23',
          name: 'Elâzığ',
          districts: ['Ağın', 'Alacakaya', 'Arıcak', 'Baskil', 'Karakoçan', 'Keban', 'Kovancılar', 'Maden', 'Merkez', 'Palu', 'Sivrice']
        },
        {
          code: '24',
          name: 'Erzincan',
          districts: ['Çayırlı', 'İliç', 'Kemah', 'Kemaliye', 'Merkez', 'Otlukbeli', 'Refahiye', 'Tercan', 'Üzümlü']
        },
        {
          code: '25',
          name: 'Erzurum',
          districts: ['Aşkale', 'Aziziye', 'Çat', 'Hınıs', 'Horasan', 'İspir', 'Karaçoban', 'Karayazı', 'Köprüköy', 'Narman', 'Oltu', 'Olur', 'Palandöken', 'Pasinler', 'Pazaryolu', 'Şenkaya', 'Tekman', 'Tortum', 'Uzundere', 'Yakutiye']
        },
        {
          code: '26',
          name: 'Eskişehir',
          districts: ['Alpu', 'Beylikova', 'Çifteler', 'Günyüzü', 'Han', 'İnönü', 'Mahmudiye', 'Mihalgazi', 'Mihalıççık', 'Odunpazarı', 'Sarıcakaya', 'Seyitgazi', 'Sivrihisar', 'Tepebaşı']
        },
        {
          code: '27',
          name: 'Gaziantep',
          districts: ['Araban', 'İslahiye', 'Karkamış', 'Nizip', 'Nurdağı', 'Oğuzeli', 'Şahinbey', 'Şehitkamil', 'Yavuzeli']
        },
        {
          code: '28',
          name: 'Giresun',
          districts: ['Alucra', 'Bulancak', 'Çamoluk', 'Çanakçı', 'Dereli', 'Doğankent', 'Espiye', 'Eynesil', 'Görele', 'Güce', 'Keşap', 'Merkez', 'Piraziz', 'Şebinkarahisar', 'Tirebolu', 'Yağlıdere']
        },
        {
          code: '29',
          name: 'Gümüşhane',
          districts: ['Kelkit', 'Köse', 'Kürtün', 'Merkez', 'Şiran', 'Torul']
        },
        {
          code: '30',
          name: 'Hakkâri',
          districts: ['Çukurca', 'Derecik', 'Merkez', 'Şemdinli', 'Yüksekova']
        },
        {
          code: '31',
          name: 'Hatay',
          districts: ['Altınözü', 'Antakya', 'Arsuz', 'Belen', 'Defne', 'Dörtyol', 'Erzin', 'Hassa', 'İskenderun', 'Kırıkhan', 'Kumlu', 'Payas', 'Reyhanlı', 'Samandağ', 'Yayladağı']
        },
        {
          code: '32',
          name: 'Isparta',
          districts: ['Aksu', 'Atabey', 'Eğirdir', 'Gelendost', 'Gönen', 'Keçiborlu', 'Merkez', 'Senirkent', 'Sütçüler', 'Şarkikaraağaç', 'Uluborlu', 'Yalvaç', 'Yenişarbademli']
        },
        {
          code: '33',
          name: 'Mersin',
          districts: ['Akdeniz', 'Anamur', 'Aydıncık', 'Bozyazı', 'Çamlıyayla', 'Erdemli', 'Gülnar', 'Mezitli', 'Mut', 'Silifke', 'Tarsus', 'Toroslar', 'Yenişehir']
        },
        {
          code: '34',
          name: 'İstanbul',
          districts: ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu']
        },
        {
          code: '35',
          name: 'İzmir',
          districts: ['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla']
        },
        {
          code: '36',
          name: 'Kars',
          districts: ['Akyaka', 'Arpaçay', 'Digor', 'Kağızman', 'Merkez', 'Sarıkamış', 'Selim', 'Susuz']
        },
        {
          code: '37',
          name: 'Kastamonu',
          districts: ['Abana', 'Ağlı', 'Araç', 'Azdavay', 'Bozkurt', 'Cide', 'Çatalzeytin', 'Daday', 'Devrekani', 'Doğanyurt', 'Hanönü', 'İhsangazi', 'İnebolu', 'Küre', 'Merkez', 'Pınarbaşı', 'Seydiler', 'Şenpazar', 'Taşköprü', 'Tosya']
        },
        {
          code: '38',
          name: 'Kayseri',
          districts: ['Akkışla', 'Bünyan', 'Develi', 'Felahiye', 'Hacılar', 'İncesu', 'Kocasinan', 'Melikgazi', 'Özvatan', 'Pınarbaşı', 'Sarıoğlan', 'Sarız', 'Talas', 'Tomarza', 'Yahyalı', 'Yeşilhisar']
        },
        {
          code: '39',
          name: 'Kırklareli',
          districts: ['Babaeski', 'Demirköy', 'Kofçaz', 'Lüleburgaz', 'Merkez', 'Pehlivanköy', 'Pınarhisar', 'Vize']
        },
        {
          code: '40',
          name: 'Kırşehir',
          districts: ['Akçakent', 'Akpınar', 'Boztepe', 'Çiçekdağı', 'Kaman', 'Merkez', 'Mucur']
        },
        {
          code: '41',
          name: 'Kocaeli',
          districts: ['Başiskele', 'Çayırova', 'Darıca', 'Derince', 'Dilovası', 'Gebze', 'Gölcük', 'İzmit', 'Kandıra', 'Karamürsel', 'Kartepe', 'Körfez']
        },
        {
          code: '42',
          name: 'Konya',
          districts: ['Ahırlı', 'Akören', 'Akşehir', 'Altınekin', 'Beyşehir', 'Bozkır', 'Cihanbeyli', 'Çeltik', 'Çumra', 'Derbent', 'Derebucak', 'Doğanhisar', 'Emirgazi', 'Ereğli', 'Güneysinir', 'Hadim', 'Halkapınar', 'Hüyük', 'Ilgın', 'Kadınhanı', 'Karapınar', 'Karatay', 'Kulu', 'Meram', 'Sarayönü', 'Selçuklu', 'Seydişehir', 'Taşkent', 'Tuzlukçu', 'Yalıhüyük', 'Yunak']
        },
        {
          code: '43',
          name: 'Kütahya',
          districts: ['Altıntaş', 'Aslanapa', 'Çavdarhisar', 'Domaniç', 'Dumlupınar', 'Emet', 'Gediz', 'Hisarcık', 'Merkez', 'Pazarlar', 'Simav', 'Şaphane', 'Tavşanlı']
        },
        {
          code: '44',
          name: 'Malatya',
          districts: ['Akçadağ', 'Arapgir', 'Arguvan', 'Battalgazi', 'Darende', 'Doğanşehir', 'Doğanyol', 'Hekimhan', 'Kale', 'Kuluncak', 'Pütürge', 'Yazihan', 'Yeşilyurt']
        },
        {
          code: '45',
          name: 'Manisa',
          districts: ['Ahmetli', 'Akhisar', 'Alaşehir', 'Demirci', 'Gölmarmara', 'Gördes', 'Kırkağaç', 'Köprübaşı', 'Kula', 'Salihli', 'Sarıgöl', 'Saruhanlı', 'Selendi', 'Soma', 'Şehzadeler', 'Turgutlu', 'Yunusemre']
        },
        {
          code: '46',
          name: 'Kahramanmaraş',
          districts: ['Afşin', 'Andırın', 'Çağlayancerit', 'Dulkadiroğlu', 'Elbistan', 'Ekinözü', 'Göksun', 'Nurhak', 'Onikişubat', 'Pazarcık', 'Türkoğlu']
        },
        {
          code: '47',
          name: 'Mardin',
          districts: ['Artuklu', 'Dargeçit', 'Derik', 'Kızıltepe', 'Mazıdağı', 'Midyat', 'Nusaybin', 'Ömerli', 'Savur', 'Yeşilli']
        },
        {
          code: '48',
          name: 'Muğla',
          districts: ['Bodrum', 'Dalaman', 'Datça', 'Fethiye', 'Kavaklıdere', 'Köyceğiz', 'Marmaris', 'Menteşe', 'Milas', 'Ortaca', 'Seydikemer', 'Ula', 'Yatağan']
        },
        {
          code: '49',
          name: 'Muş',
          districts: ['Bulanık', 'Hasköy', 'Korkut', 'Malazgirt', 'Merkez', 'Varto']
        },
        {
          code: '50',
          name: 'Nevşehir',
          districts: ['Acıgöl', 'Avanos', 'Derinkuyu', 'Gülşehir', 'Hacıbektaş', 'Kozaklı', 'Merkez', 'Ürgüp']
        },
        {
          code: '51',
          name: 'Niğde',
          districts: ['Altunhisar', 'Bor', 'Çamardı', 'Çiftlik', 'Merkez', 'Ulukışla']
        },
        {
          code: '52',
          name: 'Ordu',
          districts: ['Akkuş', 'Altınordu', 'Aybastı', 'Çamaş', 'Çatalpınar', 'Çaytepe', 'Fatsa', 'Gölköy', 'Gülyalı', 'Gürgentepe', 'İkizce', 'Kabadüz', 'Kabataş', 'Korgan', 'Kumru', 'Mesudiye', 'Perşembe', 'Ulubey', 'Ünye']
        },
        {
          code: '53',
          name: 'Rize',
          districts: ['Ardeşen', 'Çamlıhemşin', 'Çayeli', 'Derepazarı', 'Fındıklı', 'Güneysu', 'Hemşin', 'İkizdere', 'İyidere', 'Kalkandere', 'Merkez', 'Pazar']
        },
        {
          code: '54',
          name: 'Sakarya',
          districts: ['Adapazarı', 'Akyazı', 'Arifiye', 'Erenler', 'Ferizli', 'Geyve', 'Hendek', 'Karapürçek', 'Karasu', 'Kaynarca', 'Kocaali', 'Pamukova', 'Sapanca', 'Serdivan', 'Söğütlü', 'Taraklı']
        },
        {
          code: '55',
          name: 'Samsun',
          districts: ['19 Mayıs', 'Alaçam', 'Asarcık', 'Atakum', 'Ayvacık', 'Bafra', 'Canik', 'Çarşamba', 'Havza', 'İlkadım', 'Kavak', 'Ladik', 'Ondokuzmayıs', 'Salıpazarı', 'Tekkeköy', 'Terme', 'Vezirköprü', 'Yakakent']
        },
        {
          code: '56',
          name: 'Siirt',
          districts: ['Baykan', 'Eruh', 'Kurtalan', 'Merkez', 'Pervari', 'Şirvan', 'Tillo']
        },
        {
          code: '57',
          name: 'Sinop',
          districts: ['Ayancık', 'Boyabat', 'Dikmen', 'Durağan', 'Erfelek', 'Gerze', 'Merkez', 'Saraydüzü', 'Türkeli']
        },
        {
          code: '58',
          name: 'Sivas',
          districts: ['Akıncılar', 'Altınyayla', 'Divriği', 'Doğanşar', 'Gemerek', 'Gölova', 'Gürün', 'Hafik', 'İmranlı', 'Kangal', 'Koyulhisar', 'Merkez', 'Suşehri', 'Şarkışla', 'Ulaş', 'Yıldızeli', 'Zara']
        },
        {
          code: '59',
          name: 'Tekirdağ',
          districts: ['Çerkezköy', 'Çorlu', 'Ergene', 'Hayrabolu', 'Kapaklı', 'Malkara', 'Marmaraereğlisi', 'Muratlı', 'Saray', 'Süleymanpaşa', 'Şarköy']
        },
        {
          code: '60',
          name: 'Tokat',
          districts: ['Almus', 'Artova', 'Başçiftlik', 'Erbaa', 'Merkez', 'Niksar', 'Pazar', 'Reşadiye', 'Sulusaray', 'Turhal', 'Yeşilyurt', 'Zile']
        },
        {
          code: '61',
          name: 'Trabzon',
          districts: ['Akçaabat', 'Araklı', 'Arsin', 'Beşikdüzü', 'Çarşıbaşı', 'Çaykara', 'Dernekpazarı', 'Düzköy', 'Hayrat', 'Köprübaşı', 'Maçka', 'Of', 'Ortahisar', 'Sürmene', 'Şalpazarı', 'Tonya', 'Vakfıkebir', 'Yomra']
        },
        {
          code: '62',
          name: 'Tunceli',
          districts: ['Çemişgezek', 'Hozat', 'Mazgirt', 'Merkez', 'Nazımiye', 'Ovacık', 'Pertek', 'Pülümür']
        },
        {
          code: '63',
          name: 'Şanlıurfa',
          districts: ['Akçakale', 'Birecik', 'Bozova', 'Ceylanpınar', 'Eyyübiye', 'Halfeti', 'Haliliye', 'Harran', 'Hilvan', 'Karaköprü', 'Siverek', 'Suruç', 'Viranşehir']
        },
        {
          code: '64',
          name: 'Uşak',
          districts: ['Banaz', 'Eşme', 'Karahallı', 'Merkez', 'Sivaslı', 'Ulubey']
        },
        {
          code: '65',
          name: 'Van',
          districts: ['Bahçesaray', 'Başkale', 'Çaldıran', 'Çatak', 'Edremit', 'Erciş', 'Gevaş', 'Gürpınar', 'İpekyolu', 'Muradiye', 'Özalp', 'Saray', 'Tuşba']
        },
        {
          code: '66',
          name: 'Yozgat',
          districts: ['Akdağmadeni', 'Aydıncık', 'Boğazlıyan', 'Çandır', 'Çayıralan', 'Çekerek', 'Kadışehri', 'Merkez', 'Saraykent', 'Sarıkaya', 'Sorgun', 'Şefaatli', 'Yenifakılı', 'Yerköy']
        },
        {
          code: '67',
          name: 'Zonguldak',
          districts: ['Alaplı', 'Çaycuma', 'Devrek', 'Gökçebey', 'Kilimli', 'Kozlu', 'Merkez', 'Ereğli']
        },
        {
          code: '68',
          name: 'Aksaray',
          districts: ['Ağaçören', 'Eskil', 'Gülağaç', 'Güzelyurt', 'Merkez', 'Ortaköy', 'Sarıyahşi']
        },
        {
          code: '69',
          name: 'Bayburt',
          districts: ['Aydıntepe', 'Demirözü', 'Merkez']
        },
        {
          code: '70',
          name: 'Karaman',
          districts: ['Ayrancı', 'Başyayla', 'Ermenek', 'Kazımkarabekir', 'Merkez', 'Sarıveliler']
        },
        {
          code: '71',
          name: 'Kırıkkale',
          districts: ['Bahşılı', 'Balışeyh', 'Çelebi', 'Delice', 'Karakeçili', 'Keskin', 'Merkez', 'Sulakyurt', 'Yahşihan']
        },
        {
          code: '72',
          name: 'Batman',
          districts: ['Beşiri', 'Gercüş', 'Hasankeyf', 'Kozluk', 'Merkez', 'Sason']
        },
        {
          code: '73',
          name: 'Şırnak',
          districts: ['Beytüşşebap', 'Cizre', 'Güçlükonak', 'İdil', 'Merkez', 'Silopi', 'Uludere']
        },
        {
          code: '74',
          name: 'Bartın',
          districts: ['Amasra', 'Kurucaşile', 'Merkez', 'Ulus']
        },
        {
          code: '75',
          name: 'Ardahan',
          districts: ['Çıldır', 'Damal', 'Göle', 'Hanak', 'Merkez', 'Posof']
        },
        {
          code: '76',
          name: 'Iğdır',
          districts: ['Aralık', 'Karakoyunlu', 'Merkez', 'Tuzluca']
        },
        {
          code: '77',
          name: 'Yalova',
          districts: ['Altınova', 'Armutlu', 'Çiftlikköy', 'Çınarcık', 'Merkez', 'Termal']
        },
        {
          code: '78',
          name: 'Karabük',
          districts: ['Eflani', 'Eskipazar', 'Merkez', 'Ovacık', 'Safranbolu', 'Yenice']
        },
        {
          code: '79',
          name: 'Kilis',
          districts: ['Elbeyli', 'Merkez', 'Musabeyli', 'Polateli']
        },
        {
          code: '80',
          name: 'Osmaniye',
          districts: ['Bahçe', 'Düziçi', 'Hasanbeyli', 'Kadirli', 'Merkez', 'Sumbas', 'Toprakkale']
        },
        {
          code: '81',
          name: 'Düzce',
          districts: ['Akçakoca', 'Cumayeri', 'Çilimli', 'Gölyaka', 'Gümüşova', 'Kaynaşlı', 'Merkez', 'Yığılca']
        }
      ];

      this.provinces = provinceData.map((province, index) => ({
        id: (index + 1).toString(),
        code: province.code,
        name: province.name,
        districts: province.districts.map((district, districtIndex) => ({
          id: `${province.code}-${districtIndex + 1}`,
          name: district,
          provinceCode: province.code
        }))
      }));

      this.isLoaded = true;
      logger.info(`Loaded ${this.provinces.length} provinces with districts`);
    } catch (error) {
      logger.error('Error loading provinces and districts:', error);
      this.provinces = [];
    }
  }

  public static getAllProvinces(): Province[] {
    if (!this.isLoaded) {
      this.loadProvinces();
    }
    return this.provinces;
  }

  public static getProvinceByCode(code: string): Province | null {
    if (!this.isLoaded) {
      this.loadProvinces();
    }
    return this.provinces.find(province => province.code === code) || null;
  }

  public static getProvinceByName(name: string): Province | null {
    if (!this.isLoaded) {
      this.loadProvinces();
    }
    return this.provinces.find(province => 
      province.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  public static getDistrictsByProvinceCode(provinceCode: string): District[] {
    const province = this.getProvinceByCode(provinceCode);
    return province ? province.districts : [];
  }

  public static getDistrictsByProvinceName(provinceName: string): District[] {
    const province = this.getProvinceByName(provinceName);
    return province ? province.districts : [];
  }

  public static searchProvinces(query: string): Province[] {
    if (!this.isLoaded) {
      this.loadProvinces();
    }
    
    if (!query || query.trim().length < 2) {
      return this.provinces;
    }

    const searchTerm = query.toLowerCase().trim();
    return this.provinces.filter(province =>
      province.name.toLowerCase().includes(searchTerm) ||
      province.code.includes(searchTerm)
    );
  }

  public static searchDistricts(query: string, provinceCode?: string): District[] {
    if (!this.isLoaded) {
      this.loadProvinces();
    }

    let districts: District[] = [];
    
    if (provinceCode) {
      districts = this.getDistrictsByProvinceCode(provinceCode);
    } else {
      // Get all districts from all provinces
      districts = this.provinces.flatMap(province => province.districts);
    }

    if (!query || query.trim().length < 2) {
      return districts;
    }

    const searchTerm = query.toLowerCase().trim();
    return districts.filter(district =>
      district.name.toLowerCase().includes(searchTerm)
    );
  }

  public static getStats(): {
    totalProvinces: number;
    totalDistricts: number;
    isLoaded: boolean;
  } {
    if (!this.isLoaded) {
      this.loadProvinces();
    }

    const totalDistricts = this.provinces.reduce(
      (sum, province) => sum + province.districts.length, 
      0
    );

    return {
      totalProvinces: this.provinces.length,
      totalDistricts,
      isLoaded: this.isLoaded
    };
  }
}

export default LocationService;