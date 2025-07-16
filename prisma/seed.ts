import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed işlemi başlatılıyor...');

  // Mevcut verileri temizle
  await prisma.coverLetter.deleteMany();
  await prisma.savedCv.deleteMany();
  await prisma.cvUpload.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Mevcut veriler temizlendi');

  // Test kullanıcıları oluştur
  const hashedPassword = await bcrypt.hash('test123456', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@atscv.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  const testUser1 = await prisma.user.create({
    data: {
      email: 'ahmet.yilmaz@test.com',
      password: hashedPassword,
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      role: 'USER',
      isEmailVerified: true,
    },
  });

  const testUser2 = await prisma.user.create({
    data: {
      email: 'ayse.kaya@test.com',
      password: hashedPassword,
      firstName: 'Ayşe',
      lastName: 'Kaya',
      role: 'USER',
      isEmailVerified: true,
    },
  });

  const testUser3 = await prisma.user.create({
    data: {
      email: 'mehmet.demir@test.com',
      password: hashedPassword,
      firstName: 'Mehmet',
      lastName: 'Demir',
      role: 'USER',
      isEmailVerified: true,
    },
  });

  console.log('✅ Test kullanıcıları oluşturuldu');

  // Test CV yüklemeleri oluştur
  const sampleCvContent = `
# Ahmet Yılmaz

## İletişim Bilgileri
- **Telefon:** +90 532 123 45 67
- **Email:** ahmet.yilmaz@test.com
- **LinkedIn:** linkedin.com/in/ahmetyilmaz
- **GitHub:** github.com/ahmetyilmaz

## Profesyonel Özet
5 yıllık deneyime sahip full-stack yazılım geliştirici. React, Node.js ve PostgreSQL teknolojilerinde uzman. 
Agile metodolojileri ile çalışan, problem çözme odaklı bir geliştirici.

## Deneyim

### Senior Software Developer | TechCorp A.Ş. | 2021 - Günümüz
- React ve TypeScript kullanarak modern web uygulamaları geliştirme
- Node.js ve Express.js ile RESTful API tasarımı ve implementasyonu
- PostgreSQL veritabanı tasarımı ve optimizasyonu
- Git workflow süreçlerinin iyileştirilmesi
- Code review süreçlerinin yönetimi

### Software Developer | StartupXYZ | 2019 - 2021
- Vue.js ile frontend uygulamalar geliştirme
- Python Django backend geliştirme
- MySQL veritabanı yönetimi
- AWS deployment süreçleri

## Eğitim
**Bilgisayar Mühendisliği Lisans** | İstanbul Teknik Üniversitesi | 2015 - 2019

## Beceriler

### Programlama Dilleri
- JavaScript/TypeScript
- Python
- Java
- SQL

### Framework ve Kütüphaneler
- React.js
- Node.js
- Express.js
- Vue.js
- Django

### Veritabanları
- PostgreSQL
- MySQL
- MongoDB

### Araçlar ve Teknolojiler
- Git
- Docker
- AWS
- Jest
- Webpack

## Projeler

### E-ticaret Platformu
React ve Node.js kullanılarak geliştirilen full-stack e-ticaret uygulaması.
Stripe entegrasyonu, envanter yönetimi ve admin paneli.

### Task Management Tool
Vue.js ve Django ile geliştirilen proje yönetim aracı.
Real-time bildirimler, takım işbirliği özellikleri.

## Sertifikalar
- AWS Certified Developer Associate (2022)
- React Developer Certificate - Meta (2021)
`;

  const cvUpload1 = await prisma.cvUpload.create({
    data: {
      userId: testUser1.id,
      fileName: 'ahmet-yilmaz-cv.pdf',
      originalName: 'Ahmet_Yilmaz_CV.pdf',
      filePath: '/uploads/cv/sample-cv-1.pdf',
      markdownContent: sampleCvContent,
      extractedData: {
        fileType: 'pdf',
        pageCount: 2,
        wordCount: 450,
        extractionDate: new Date().toISOString(),
      },
    },
  });

  const sampleCvContent2 = `
# Ayşe Kaya

## İletişim Bilgileri
- **Telefon:** +90 533 987 65 43
- **Email:** ayse.kaya@test.com
- **LinkedIn:** linkedin.com/in/aysekaya

## Profesyonel Özet
Dijital pazarlama alanında 4 yıllık deneyime sahip uzman. SEO, SEM ve sosyal medya 
pazarlama konularında derinlemesine bilgi sahibi. Analitik düşünce yapısı ile 
kampanya performanslarını optimize etme konusunda başarılı.

## Deneyim

### Digital Marketing Specialist | MarketingPro | 2020 - Günümüz
- Google Ads ve Facebook Ads kampanya yönetimi
- SEO stratejileri geliştirme ve uygulama
- Google Analytics ile performans analizi
- İçerik pazarlama stratejileri
- E-posta pazarlama kampanyaları

### Marketing Assistant | Creative Agency | 2019 - 2020
- Sosyal medya içerik üretimi
- Influencer işbirlikleri koordinasyonu
- Pazar araştırması ve rakip analizi

## Eğitim
**İşletme Lisans** | Boğaziçi Üniversitesi | 2015 - 2019

## Beceriler
- Google Ads & Analytics
- Facebook Business Manager
- SEO/SEM
- Content Marketing
- Email Marketing
- Photoshop & Canva
- Microsoft Excel
- İngilizce (C1 seviyesi)

## Sertifikalar
- Google Ads Certified (2021)
- Google Analytics Certified (2020)
- Facebook Blueprint Certified (2021)
`;

  const cvUpload2 = await prisma.cvUpload.create({
    data: {
      userId: testUser2.id,
      fileName: 'ayse-kaya-cv.docx',
      originalName: 'Ayse_Kaya_CV.docx',
      filePath: '/uploads/cv/sample-cv-2.docx',
      markdownContent: sampleCvContent2,
      extractedData: {
        fileType: 'docx',
        pageCount: 1,
        wordCount: 320,
        extractionDate: new Date().toISOString(),
      },
    },
  });

  console.log('✅ Test CV yüklemeleri oluşturuldu');

  // Örnek kayıtlı CV'ler oluştur
  await prisma.savedCv.create({
    data: {
      userId: testUser1.id,
      title: 'Frontend Developer Pozisyonu - TechStart',
      content: `# Ahmet Yılmaz
## İletişim Bilgileri
**Telefon:** +90 532 123 45 67  
**Email:** ahmet.yilmaz@test.com  
**LinkedIn:** linkedin.com/in/ahmetyilmaz

## Profesyonel Özet
Frontend geliştirme alanında 5 yıllık deneyime sahip, React ve TypeScript konularında uzman yazılım geliştirici. Modern web uygulamaları geliştirme, kullanıcı deneyimi optimizasyonu ve performans iyileştirme konularında güçlü background.

## Deneyim
### Senior Frontend Developer | TechCorp A.Ş. | 2021 - Günümüz
- React 18 ve TypeScript kullanarak responsive web uygulamaları geliştirme
- Redux Toolkit ile state management çözümleri
- Jest ve React Testing Library ile unit test yazımı
- Webpack ve Vite build tool optimizasyonları

### Frontend Developer | StartupXYZ | 2019 - 2021
- Vue.js 3 Composition API ile SPA uygulamalar
- SCSS ve CSS-in-JS ile modern styling çözümleri
- RESTful API entegrasyonları

## Teknik Beceriler
- **Frontend:** React.js, TypeScript, Vue.js, HTML5, CSS3, SCSS
- **State Management:** Redux, Vuex, Context API
- **Testing:** Jest, React Testing Library, Cypress
- **Build Tools:** Webpack, Vite, Parcel
- **Version Control:** Git, GitHub, GitLab`,
      cvType: 'ATS_OPTIMIZED',
    },
  });

  await prisma.savedCv.create({
    data: {
      userId: testUser2.id,
      title: 'Dijital Pazarlama Uzmanı - E-ticaret Şirketi',
      content: `# Ayşe Kaya
## İletişim Bilgileri
**Telefon:** +90 533 987 65 43  
**Email:** ayse.kaya@test.com  
**LinkedIn:** linkedin.com/in/aysekaya

## Profesyonel Özet
E-ticaret sektöründe dijital pazarlama alanında 4 yıllık deneyime sahip uzman. Paid advertising, SEO ve conversion optimization konularında kanıtlanmış başarılar. ROI odaklı kampanya yönetimi ve veri analizi konularında güçlü yetkinlikler.

## Deneyim
### Digital Marketing Specialist | MarketingPro | 2020 - Günümüz
- Google Ads kampanyalarında %35 ROI artışı sağlama
- E-ticaret siteleri için SEO stratejileri ile organik trafik %120 artırma
- Facebook ve Instagram Ads ile conversion rate %25 iyileştirme
- Google Analytics 4 migration süreçlerini yönetme

## Başarılar
- E-ticaret müşterisi için yıllık satış hedefini %140 aşma
- 15+ başarılı dijital pazarlama kampanyası yönetimi
- Sosyal medya takipçi sayısını 6 ayda %200 artırma

## Teknik Yetkinlikler
- **Advertising Platforms:** Google Ads, Facebook Business Manager, LinkedIn Ads
- **Analytics:** Google Analytics 4, Google Tag Manager, Facebook Pixel
- **SEO Tools:** SEMrush, Ahrefs, Screaming Frog
- **Email Marketing:** Mailchimp, Klaviyo, SendGrid`,
      cvType: 'ATS_OPTIMIZED',
    },
  });

  console.log("✅ Örnek kayıtlı CV'ler oluşturuldu");

  // Örnek cover letter'lar oluştur
  await prisma.coverLetter.create({
    data: {
      userId: testUser1.id,
      title: 'Frontend Developer - TechStart Şirketi',
      content: `Sayın İnsan Kaynakları Uzmanı,

TechStart şirketindeki Frontend Developer pozisyonuna olan ilgimi belirtmek ve başvurumu sunmak istiyorum. 5 yıllık yazılım geliştirme deneyimim ve React ekosistemindeki derin bilgim ile takımınıza değerli katkılar sağlayabileceğime inanıyorum.

Mevcut pozisyonumda TechCorp A.Ş.'de Senior Frontend Developer olarak çalışırken, React 18 ve TypeScript kullanarak kurumsal seviyede web uygulamaları geliştirdim. Özellikle kullanıcı deneyimi optimizasyonu ve performans iyileştirme konularında elde ettiğim başarılar, TechStart'ın inovatif projelerine uygun bir profil sergilediğimi göstermektedir. Redux Toolkit ile kompleks state management çözümleri geliştirme ve Jest ile kapsamlı test yazımı deneyimlerim, kod kalitesi ve sürdürülebilirlik açısından takımınıza katkı sağlayacaktır.

TechStart'ın teknoloji sektöründeki yenilikçi yaklaşımı ve modern web teknolojilerine olan odağı, kariyer hedeflerimle mükemmel bir uyum göstermektedir. Takım çalışmasına yatkınlığım, problem çözme becerilerim ve sürekli öğrenme motivasyonum ile şirketinizin başarısına katkıda bulunmak için sabırsızlanıyorum.

Görüşme imkanı verebilirseniz çok memnun olurum. Vaktinizi ayırdığınız için teşekkür ederim.

Saygılarımla,
Ahmet Yılmaz
ahmet.yilmaz@test.com`,
      category: 'SOFTWARE_DEVELOPER',
      positionTitle: 'Frontend Developer',
      companyName: 'TechStart',
      contactPerson: 'İnsan Kaynakları Uzmanı',
      applicationDate: new Date(),
    },
  });

  await prisma.coverLetter.create({
    data: {
      userId: testUser2.id,
      title: 'Dijital Pazarlama Uzmanı - E-Commerce Plus',
      content: `Sayın Pazarlama Müdürü,

E-Commerce Plus şirketindeki Dijital Pazarlama Uzmanı pozisyonuna başvurmak istiyorum. E-ticaret sektöründe 4 yıllık dijital pazarlama deneyimim ve kanıtlanmış başarılarım ile şirketinizin online satış hedeflerine ulaşmasında stratejik katkılar sağlayabilirim.

Mevcut pozisyonumda MarketingPro'da dijital pazarlama kampanyalarını yönetirken, Google Ads kampanyalarında %35 ROI artışı sağladım ve e-ticaret müşterilerimiz için organik trafiği %120 artırdım. Facebook ve Instagram Ads platformlarında conversion rate optimizasyonu konusundaki uzmanlığım, E-Commerce Plus'ın sosyal medya satış kanallarını güçlendirmek için ideal bir deneyim sunmaktadır. Ayrıca Google Analytics 4 migration süreçlerini başarıyla yönetme deneyimim, şirketinizin veri odaklı karar alma süreçlerine destek olacaktır.

E-Commerce Plus'ın e-ticaret sektöründeki güçlü konumu ve büyüme odaklı stratejisi, dijital pazarlama kariyerimde yeni bir aşamaya geçmek için ideal bir fırsat sunmaktadır. Analitik düşünce yapım, yaratıcı kampanya geliştirme yeteneğim ve sürekli öğrenme tutkum ile şirketinizin dijital pazarlama hedeflerini aşmanıza yardımcı olmak istiyorum.

Katkılarımı detaylarıyla paylaşabileceğim bir görüşme fırsatı için sabırsızlanıyorum. İlginiz için teşekkür ederim.

Saygılarımla,
Ayşe Kaya
ayse.kaya@test.com`,
      category: 'DIGITAL_MARKETING',
      positionTitle: 'Dijital Pazarlama Uzmanı',
      companyName: 'E-Commerce Plus',
      contactPerson: 'Pazarlama Müdürü',
      applicationDate: new Date(),
    },
  });

  await prisma.coverLetter.create({
    data: {
      userId: testUser3.id,
      title: 'Proje Yöneticisi - InnovateTech',
      content: `Sayın Yetkili,

InnovateTech şirketindeki Proje Yöneticisi pozisyonuna olan ilgimi belirtmek ve başvurumu sunmak istiyorum. Teknoloji projelerinde edindiğim deneyimler ve proje yönetimi metodolojilerindeki yetkinliklerim ile şirketinizin başarılı proje teslimatlarına katkıda bulunabilirim.

Önceki deneyimlerimde Agile ve Scrum metodolojilerini kullanarak çapraz fonksiyonel takımları yönettim ve karmaşık yazılım projelerini zamanında ve bütçe dahilinde teslim ettim. Stakeholder yönetimi, risk analizi ve süreç optimizasyonu konularındaki becerilerim, InnovateTech'in hızla gelişen proje portföyünü etkin bir şekilde yönetmeme imkan sağlayacaktır.

InnovateTech'in inovasyon odaklı yaklaşımı ve teknoloji sektöründeki öncü konumu, proje yönetimi kariyerimde yeni zorluklar aramanın ideal zemini olarak görüyorum. Takım motivasyonunu artırma, süreç iyileştirme ve müşteri memnuniyeti sağlama konularındaki deneyimlerimle şirketinizin operasyonel mükemmellik hedeflerine destek olmak istiyorum.

Deneyimlerimi ve vizyonumu paylaşabileceğim bir görüşme imkanı için teşekkür ederim.

Saygılarımla,
Mehmet Demir
mehmet.demir@test.com`,
      category: 'PROJECT_MANAGER',
      positionTitle: 'Proje Yöneticisi',
      companyName: 'InnovateTech',
      applicationDate: new Date(),
    },
  });

  console.log("✅ Örnek cover letter'lar oluşturuldu");

  // İstatistik özeti
  const userCount = await prisma.user.count();
  const cvUploadCount = await prisma.cvUpload.count();
  const savedCvCount = await prisma.savedCv.count();
  const coverLetterCount = await prisma.coverLetter.count();

  console.log('\n📊 Seed işlemi tamamlandı! Oluşturulan veriler:');
  console.log(`👥 Kullanıcılar: ${userCount}`);
  console.log(`📄 CV Yüklemeleri: ${cvUploadCount}`);
  console.log(`💾 Kayıtlı CV'ler: ${savedCvCount}`);
  console.log(`✉️ Cover Letter'lar: ${coverLetterCount}`);

  console.log('\n🔑 Test kullanıcı bilgileri:');
  console.log('Admin: admin@atscv.com / test123456');
  console.log('Kullanıcı 1: ahmet.yilmaz@test.com / test123456');
  console.log('Kullanıcı 2: ayse.kaya@test.com / test123456');
  console.log('Kullanıcı 3: mehmet.demir@test.com / test123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed işlemi başarısız:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
