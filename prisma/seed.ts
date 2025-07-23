import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

import logger from '../src/config/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Seed işlemi başlatılıyor...');

  // Admin kullanıcı
  const adminPassword = await bcrypt.hash('test123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@atscv.com' },
    update: {},
    create: {
      email: 'admin@atscv.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isEmailVerified: true,
      phone: '05064927865',
      address: 'Boğazkale',
      city: 'Çorum',
      github: 'https://github.com/zzafergok',
      linkedin: 'https://www.linkedin.com/in/zafergok',
      portfolioWebsite: 'https://www.zafergok.dev',
      portfolioTitle: 'Portfolyo',
      aboutMe:
        'System administrator and full-stack developer with 5+ years of experience.',
      profileCompleted: true,
      avatarColor: '#EAB308',
    },
  });

  logger.info('✅ Admin kullanıcı oluşturuldu');

  // Test kullanıcıları
  const testPassword = await bcrypt.hash('test123456', 12);

  const users = await Promise.all([
    // Software Developer - Senior Level
    prisma.user.upsert({
      where: { email: 'ahmet.yilmaz@test.com' },
      update: {},
      create: {
        email: 'ahmet.yilmaz@test.com',
        password: testPassword,
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        role: 'USER',
        isEmailVerified: true,
        phone: '0555 123 4567',
        address: 'Kadıköy',
        city: 'İstanbul',
        github: 'https://github.com/ahmetyilmaz',
        linkedin: 'https://www.linkedin.com/in/ahmetyilmaz',
        portfolioWebsite: 'https://ahmetyilmaz.dev',
        portfolioTitle: 'Full Stack Developer Portfolio',
        aboutMe:
          'Passionate full-stack developer with expertise in modern web technologies. Love building scalable applications and contributing to open source projects.',
        profileCompleted: true,
        avatarColor: '#3B82F6',
      },
    }),
    // Marketing Professional - Mid Level
    prisma.user.upsert({
      where: { email: 'ayse.kaya@test.com' },
      update: {},
      create: {
        email: 'ayse.kaya@test.com',
        password: testPassword,
        firstName: 'Ayşe',
        lastName: 'Kaya',
        role: 'USER',
        isEmailVerified: true,
        phone: '0555 987 6543',
        address: 'Beşiktaş',
        city: 'İstanbul',
        linkedin: 'https://www.linkedin.com/in/aysekaya',
        portfolioTitle: 'Digital Marketing Portfolio',
        aboutMe:
          'Creative digital marketing professional with a passion for data-driven campaigns and brand storytelling. 4+ years experience in various industries.',
        profileCompleted: true,
        avatarColor: '#EC4899',
      },
    }),
    // Fresh Graduate - Entry Level
    prisma.user.upsert({
      where: { email: 'mehmet.demir@test.com' },
      update: {},
      create: {
        email: 'mehmet.demir@test.com',
        password: testPassword,
        firstName: 'Mehmet',
        lastName: 'Demir',
        role: 'USER',
        isEmailVerified: true,
        phone: '0555 456 7890',
        address: 'Çankaya',
        city: 'Ankara',
        github: 'https://github.com/mehmetdemir',
        aboutMe:
          'Recent computer engineering graduate eager to start my career in software development. Strong foundation in algorithms and data structures.',
        profileCompleted: true,
        avatarColor: '#10B981',
      },
    }),
  ]);

  logger.info('✅ Test kullanıcıları oluşturuldu');

  // Eğitim bilgileri
  await prisma.education.createMany({
    data: [
      // Ahmet Yılmaz - Software Developer
      {
        userId: users[0].id,
        schoolName: 'İstanbul Teknik Üniversitesi',
        degree: 'Lisans',
        fieldOfStudy: 'Bilgisayar Mühendisliği',
        grade: 3.45,
        gradeSystem: 'GPA_4',
        // educationType: 'LISANS',
        startYear: 2015,
        endYear: 2019,
        isCurrent: false,
        description:
          'Yazılım geliştirme ve algoritma odaklı eğitim aldım. Final projesi olarak e-ticaret platformu geliştirdim.',
      },
      {
        userId: users[0].id,
        schoolName: 'Kadıköy Anadolu Lisesi',
        degree: 'Lise Diploması',
        fieldOfStudy: 'Sayısal',
        grade: 89,
        gradeSystem: 'PERCENTAGE',
        // educationType: 'LISE',
        startYear: 2011,
        endYear: 2015,
        isCurrent: false,
      },
      // Ayşe Kaya - Marketing Professional
      {
        userId: users[1].id,
        schoolName: 'Boğaziçi Üniversitesi',
        degree: 'Lisans',
        fieldOfStudy: 'İşletme',
        grade: 3.65,
        gradeSystem: 'GPA_4',
        // educationType: 'LISANS',
        startYear: 2016,
        endYear: 2020,
        isCurrent: false,
        description:
          "Pazarlama ve dijital iletişim alanlarında uzmanlaştım. Erasmus programı ile Almanya'da bir dönem eğitim aldım.",
      },
      {
        userId: users[1].id,
        schoolName: 'Beşiktaş Atatürk Anadolu Lisesi',
        degree: 'Lise Diploması',
        fieldOfStudy: 'Eşit Ağırlık',
        grade: 92,
        gradeSystem: 'PERCENTAGE',
        // educationType: 'LISE',
        startYear: 2012,
        endYear: 2016,
        isCurrent: false,
      },
      // Mehmet Demir - Fresh Graduate
      {
        userId: users[2].id,
        schoolName: 'Orta Doğu Teknik Üniversitesi',
        degree: 'Lisans',
        fieldOfStudy: 'Bilgisayar Mühendisliği',
        grade: 3.23,
        gradeSystem: 'GPA_4',
        // educationType: 'LISANS',
        startYear: 2019,
        endYear: 2023,
        isCurrent: false,
        description:
          'Yazılım mühendisliği, veri yapıları ve makine öğrenmesi alanlarında güçlü bir temel edindim.',
      },
      {
        userId: users[2].id,
        schoolName: 'Ankara Fen Lisesi',
        degree: 'Lise Diploması',
        fieldOfStudy: 'Fen',
        grade: 94,
        gradeSystem: 'PERCENTAGE',
        // educationType: 'LISE',
        startYear: 2015,
        endYear: 2019,
        isCurrent: false,
      },
    ],
  });

  logger.info('✅ Eğitim bilgileri oluşturuldu');

  // İş deneyimleri
  await prisma.experience.createMany({
    data: [
      // Ahmet Yılmaz - Software Developer
      {
        userId: users[0].id,
        companyName: 'TechCorp Yazılım',
        position: 'Senior Full Stack Developer',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        startMonth: 3,
        startYear: 2021,
        endMonth: null,
        endYear: null,
        isCurrent: true,
        description:
          'React, Node.js ve PostgreSQL kullanarak enterprise seviye web uygulamaları geliştiriyorum. 5 kişilik development ekibinin teknik liderliğini yapıyorum.',
        achievements:
          '15+ proje başarıyla tamamladı, Code review süreçlerini optimize etti, Junior developer mentorluğu yaptı',
      },
      {
        userId: users[0].id,
        companyName: 'StartupXYZ',
        position: 'Frontend Developer',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        startMonth: 6,
        startYear: 2019,
        endMonth: 2,
        endYear: 2021,
        isCurrent: false,
        description:
          'React ve TypeScript kullanarak kullanıcı dostu web arayüzleri geliştirdim. API entegrasyonları ve state management konularında uzmanlaştım.',
        achievements:
          "UI/UX performansını %40 artırdı, Component kütüphanesi oluşturdu, Jest ile test coverage %85'e çıkardı",
      },
      {
        userId: users[0].id,
        companyName: 'FreelanceWork',
        position: 'Web Developer',
        employmentType: 'FREELANCE',
        workMode: 'REMOTE',
        startMonth: 9,
        startYear: 2018,
        endMonth: 5,
        endYear: 2019,
        isCurrent: false,
        description:
          'Küçük ve orta ölçekli işletmeler için web siteleri ve e-ticaret platformları geliştirdim.',
        achievements:
          '8 proje başarıyla tamamladı, Müşteri memnuniyeti %95, WordPress ve Shopify uzmanlaştı',
      },
      // Ayşe Kaya - Marketing Professional
      {
        userId: users[1].id,
        companyName: 'Digital Marketing Agency',
        position: 'Digital Marketing Manager',
        employmentType: 'FULL_TIME',
        workMode: 'HYBRID',
        startMonth: 1,
        startYear: 2022,
        endMonth: null,
        endYear: null,
        isCurrent: true,
        description:
          'B2B ve B2C müşteriler için dijital pazarlama stratejileri geliştiriyor ve kampanya yönetimi yapıyorum. Google Ads, Facebook Ads ve SEO alanlarında uzmanım.',
        achievements:
          'Müşteri portföyünü %60 artırdı, ROAS oranını ortalama %300 iyileştirdi, 3 kişilik marketing ekibi yönetiyor',
      },
      {
        userId: users[1].id,
        companyName: 'E-commerce Startup',
        position: 'Marketing Specialist',
        employmentType: 'FULL_TIME',
        workMode: 'ONSITE',
        startMonth: 8,
        startYear: 2020,
        endMonth: 12,
        endYear: 2021,
        isCurrent: false,
        description:
          'Sosyal medya pazarlaması, content marketing ve influencer işbirlikleri konularında çalıştım. Brand awareness kampanyaları yürüttüm.',
        achievements:
          "Instagram takipçi sayısını 10K'dan 50K'ya çıkardı, Influencer kampanyalarıyla %25 satış artışı, Content calendar süreçlerini optimize etti",
      },
      {
        userId: users[1].id,
        companyName: 'Marketing Consultancy',
        position: 'Junior Marketing Analyst',
        employmentType: 'INTERNSHIP',
        workMode: 'ONSITE',
        startMonth: 6,
        startYear: 2020,
        endMonth: 7,
        endYear: 2020,
        isCurrent: false,
        description:
          'Pazar araştırmaları, rakip analizi ve müşteri segmentasyonu konularında deneyim kazandım.',
      },
      // Mehmet Demir - Fresh Graduate
      {
        userId: users[2].id,
        companyName: 'Tech Solutions Ltd.',
        position: 'Software Development Intern',
        employmentType: 'INTERNSHIP',
        workMode: 'ONSITE',
        startMonth: 7,
        startYear: 2022,
        endMonth: 9,
        endYear: 2022,
        isCurrent: false,
        description:
          'Java Spring Boot ve Angular teknolojileri kullanarak web uygulaması geliştirme süreçlerinde yer aldım. Database tasarımı ve API development konularında deneyim kazandım.',
        achievements:
          'Intern projesi başarıyla tamamladı, Unit test yazma becerisi kazandı, Agile süreçlerini öğrendi',
      },
      {
        userId: users[2].id,
        companyName: 'University Research Lab',
        position: 'Research Assistant',
        employmentType: 'PART_TIME',
        workMode: 'ONSITE',
        startMonth: 1,
        startYear: 2022,
        endMonth: 5,
        endYear: 2023,
        isCurrent: false,
        description:
          'Makine öğrenmesi projeleri üzerinde çalıştım. Python, TensorFlow ve PyTorch kütüphanelerini kullanarak veri analizi yaptım.',
        achievements:
          "2 akademik makale yayınlandı, Conference sunumu yaptı, ML model accuracy %92'ye çıkardı",
      },
    ],
  });

  logger.info('✅ İş deneyimleri oluşturuldu');

  // Beceriler
  await prisma.skill.createMany({
    data: [
      // Ahmet Yılmaz - Software Developer Skills
      {
        userId: users[0].id,
        name: 'React',
        category: 'FRAMEWORK',
        level: 'EXPERT',
        yearsOfExperience: 4,
      },
      {
        userId: users[0].id,
        name: 'Node.js',
        category: 'FRAMEWORK',
        level: 'EXPERT',
        yearsOfExperience: 4,
      },
      {
        userId: users[0].id,
        name: 'TypeScript',
        category: 'TECHNICAL',
        level: 'ADVANCED',
        yearsOfExperience: 3,
      },
      {
        userId: users[0].id,
        name: 'PostgreSQL',
        category: 'TECHNICAL',
        level: 'ADVANCED',
        yearsOfExperience: 4,
      },
      {
        userId: users[0].id,
        name: 'Docker',
        category: 'TOOL',
        level: 'INTERMEDIATE',
        yearsOfExperience: 2,
      },
      {
        userId: users[0].id,
        name: 'AWS',
        category: 'TECHNICAL',
        level: 'INTERMEDIATE',
        yearsOfExperience: 2,
      },
      {
        userId: users[0].id,
        name: 'Git',
        category: 'TOOL',
        level: 'EXPERT',
        yearsOfExperience: 5,
      },
      {
        userId: users[0].id,
        name: 'Problem Solving',
        category: 'SOFT_SKILL',
        level: 'EXPERT',
        yearsOfExperience: 5,
      },
      {
        userId: users[0].id,
        name: 'Team Leadership',
        category: 'SOFT_SKILL',
        level: 'ADVANCED',
        yearsOfExperience: 2,
      },
      {
        userId: users[0].id,
        name: 'English',
        category: 'LANGUAGE',
        level: 'ADVANCED',
        yearsOfExperience: 10,
      },
      // Ayşe Kaya - Marketing Professional Skills
      {
        userId: users[1].id,
        name: 'Google Ads',
        category: 'TOOL',
        level: 'EXPERT',
        yearsOfExperience: 3,
      },
      {
        userId: users[1].id,
        name: 'Facebook Ads',
        category: 'TOOL',
        level: 'EXPERT',
        yearsOfExperience: 3,
      },
      {
        userId: users[1].id,
        name: 'Google Analytics',
        category: 'TOOL',
        level: 'ADVANCED',
        yearsOfExperience: 4,
      },
      {
        userId: users[1].id,
        name: 'SEO',
        category: 'TECHNICAL',
        level: 'ADVANCED',
        yearsOfExperience: 3,
      },
      {
        userId: users[1].id,
        name: 'Content Marketing',
        category: 'TECHNICAL',
        level: 'EXPERT',
        yearsOfExperience: 4,
      },
      {
        userId: users[1].id,
        name: 'Social Media Marketing',
        category: 'TECHNICAL',
        level: 'EXPERT',
        yearsOfExperience: 4,
      },
      {
        userId: users[1].id,
        name: 'Project Management',
        category: 'SOFT_SKILL',
        level: 'ADVANCED',
        yearsOfExperience: 2,
      },
      {
        userId: users[1].id,
        name: 'Creative Thinking',
        category: 'SOFT_SKILL',
        level: 'EXPERT',
        yearsOfExperience: 5,
      },
      {
        userId: users[1].id,
        name: 'English',
        category: 'LANGUAGE',
        level: 'ADVANCED',
        yearsOfExperience: 8,
      },
      {
        userId: users[1].id,
        name: 'German',
        category: 'LANGUAGE',
        level: 'INTERMEDIATE',
        yearsOfExperience: 2,
      },
      // Mehmet Demir - Fresh Graduate Skills
      {
        userId: users[2].id,
        name: 'Java',
        category: 'TECHNICAL',
        level: 'INTERMEDIATE',
        yearsOfExperience: 2,
      },
      {
        userId: users[2].id,
        name: 'Python',
        category: 'TECHNICAL',
        level: 'INTERMEDIATE',
        yearsOfExperience: 2,
      },
      {
        userId: users[2].id,
        name: 'Spring Boot',
        category: 'FRAMEWORK',
        level: 'BEGINNER',
        yearsOfExperience: 1,
      },
      {
        userId: users[2].id,
        name: 'Angular',
        category: 'FRAMEWORK',
        level: 'BEGINNER',
        yearsOfExperience: 1,
      },
      {
        userId: users[2].id,
        name: 'MySQL',
        category: 'TECHNICAL',
        level: 'INTERMEDIATE',
        yearsOfExperience: 2,
      },
      {
        userId: users[2].id,
        name: 'Machine Learning',
        category: 'TECHNICAL',
        level: 'BEGINNER',
        yearsOfExperience: 1,
      },
      {
        userId: users[2].id,
        name: 'Git',
        category: 'TOOL',
        level: 'INTERMEDIATE',
        yearsOfExperience: 2,
      },
      {
        userId: users[2].id,
        name: 'Quick Learning',
        category: 'SOFT_SKILL',
        level: 'ADVANCED',
        yearsOfExperience: 3,
      },
      {
        userId: users[2].id,
        name: 'Analytical Thinking',
        category: 'SOFT_SKILL',
        level: 'ADVANCED',
        yearsOfExperience: 3,
      },
      {
        userId: users[2].id,
        name: 'English',
        category: 'LANGUAGE',
        level: 'INTERMEDIATE',
        yearsOfExperience: 6,
      },
    ],
  });

  logger.info('✅ Beceriler oluşturuldu');

  // Kurslar
  await prisma.course.createMany({
    data: [
      // Ahmet Yılmaz
      {
        userId: users[0].id,
        courseName: 'Advanced React Patterns',
        provider: 'Udemy',
        duration: '20 hours',
        startMonth: 1,
        startYear: 2023,
        endMonth: 2,
        endYear: 2023,
      },
      {
        userId: users[0].id,
        courseName: 'AWS Solutions Architect',
        provider: 'AWS Training',
        duration: '40 hours',
        startMonth: 9,
        startYear: 2022,
        endMonth: 11,
        endYear: 2022,
      },
      // Ayşe Kaya
      {
        userId: users[1].id,
        courseName: 'Google Ads Certification',
        provider: 'Google Skillshop',
        duration: '15 hours',
        startMonth: 3,
        startYear: 2021,
        endMonth: 3,
        endYear: 2021,
      },
      {
        userId: users[1].id,
        courseName: 'Digital Marketing Strategy',
        provider: 'Coursera',
        duration: '30 hours',
        startMonth: 6,
        startYear: 2020,
        endMonth: 8,
        endYear: 2020,
      },
      // Mehmet Demir
      {
        userId: users[2].id,
        courseName: 'Machine Learning with Python',
        provider: 'edX',
        duration: '60 hours',
        startMonth: 1,
        startYear: 2022,
        endMonth: 4,
        endYear: 2022,
      },
      {
        userId: users[2].id,
        courseName: 'Full Stack Web Development',
        provider: 'freeCodeCamp',
        duration: '80 hours',
        startMonth: 9,
        startYear: 2021,
        endMonth: 1,
        endYear: 2022,
      },
    ],
  });

  logger.info('✅ Kurslar oluşturuldu');

  // Sertifikalar
  await prisma.certificate.createMany({
    data: [
      // Ahmet Yılmaz
      {
        userId: users[0].id,
        certificateName: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        issueMonth: 12,
        issueYear: 2022,
        expiryMonth: 12,
        expiryYear: 2025,
        credentialId: 'AWS-SA-2022-456789',
        credentialUrl: 'https://aws.amazon.com/verification',
      },
      {
        userId: users[0].id,
        certificateName: 'MongoDB Certified Developer',
        issuer: 'MongoDB Inc.',
        issueMonth: 8,
        issueYear: 2021,
        expiryMonth: 8,
        expiryYear: 2024,
        credentialId: 'MONGO-DEV-2021-123456',
        credentialUrl: 'https://university.mongodb.com/certification',
      },
      // Ayşe Kaya
      {
        userId: users[1].id,
        certificateName: 'Google Analytics Certified',
        issuer: 'Google',
        issueMonth: 4,
        issueYear: 2021,
        expiryMonth: 4,
        expiryYear: 2024,
        credentialId: 'GA-CERT-2021-789012',
        credentialUrl: 'https://skillshop.google.com/certificate',
      },
      {
        userId: users[1].id,
        certificateName: 'Facebook Blueprint Certification',
        issuer: 'Meta',
        issueMonth: 6,
        issueYear: 2021,
        expiryMonth: 6,
        expiryYear: 2024,
        credentialId: 'FB-BLUE-2021-345678',
        credentialUrl: 'https://www.facebook.com/business/learn/certification',
      },
      // Mehmet Demir
      {
        userId: users[2].id,
        certificateName: 'Oracle Certified Associate Java',
        issuer: 'Oracle',
        issueMonth: 5,
        issueYear: 2022,
        expiryMonth: null,
        expiryYear: null,
        credentialId: 'OCA-JAVA-2022-901234',
        credentialUrl: 'https://education.oracle.com/certification',
      },
    ],
  });

  logger.info('✅ Sertifikalar oluşturuldu');

  // Hobiler
  await prisma.hobby.createMany({
    data: [
      // Ahmet Yılmaz
      {
        userId: users[0].id,
        name: 'Open Source Contributions',
        description: 'GitHub üzerinde çeşitli projelere katkıda bulunuyorum',
      },
      {
        userId: users[0].id,
        name: 'Gaming',
        description: 'Strategy ve RPG oyunları oynuyorum',
      },
      {
        userId: users[0].id,
        name: 'Photography',
        description: 'Doğa ve şehir fotoğrafçılığı ile ilgileniyorum',
      },
      {
        userId: users[0].id,
        name: 'Reading Tech Blogs',
        description: 'Teknoloji trendlerini takip ediyorum',
      },
      // Ayşe Kaya
      {
        userId: users[1].id,
        name: 'Content Creation',
        description: 'Blog yazarlığı ve sosyal medya içerik üretimi yapıyorum',
      },
      {
        userId: users[1].id,
        name: 'Travel',
        description: 'Yeni kültürler keşfetmeyi ve seyahat etmeyi seviyorum',
      },
      {
        userId: users[1].id,
        name: 'Fitness',
        description: 'Yoga ve pilates ile ilgileniyorum',
      },
      {
        userId: users[1].id,
        name: 'Cooking',
        description: 'Yeni tarifler deneyip yemek yapmayı seviyorum',
      },
      // Mehmet Demir
      {
        userId: users[2].id,
        name: 'Competitive Programming',
        description: 'Algoritma yarışmalarına katılıyorum',
      },
      {
        userId: users[2].id,
        name: 'Basketball',
        description: 'Üniversite takımında basketbol oynuyorum',
      },
      {
        userId: users[2].id,
        name: 'Music',
        description: 'Gitar çalıyor ve müzik prodüksiyonu yapıyorum',
      },
      {
        userId: users[2].id,
        name: 'Learning New Technologies',
        description: 'Yeni programlama dilleri ve frameworkler öğreniyorum',
      },
    ],
  });

  logger.info('✅ Hobiler oluşturuldu');

  // CV Yüklemeleri
  await prisma.cvUpload.createMany({
    data: [
      {
        userId: users[0].id,
        fileName: 'ahmet_yilmaz_cv.pdf',
        originalName: 'ahmet_yilmaz_cv.pdf',
        fileUrl: '/uploads/ahmet_yilmaz_cv.pdf',
        extractedText:
          'Ahmet Yılmaz - Senior Full Stack Developer\nExperience: 4+ years in web development\nSkills: React, Node.js, TypeScript, PostgreSQL...',
        extractedData: JSON.stringify({
          personalInfo: {
            name: 'Ahmet Yılmaz',
            email: 'ahmet.yilmaz@test.com',
            phone: '0555 123 4567',
          },
          skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          experience: [
            {
              company: 'TechCorp Yazılım',
              position: 'Senior Full Stack Developer',
              duration: '2021-Present',
            },
          ],
        }),
        markdownContent:
          '# Ahmet Yılmaz\n## Senior Full Stack Developer\n\n**Email:** ahmet.yilmaz@test.com\n**Phone:** 0555 123 4567\n\n### Experience\n- **TechCorp Yazılım** - Senior Full Stack Developer (2021-Present)',
      },
      {
        userId: users[1].id,
        fileName: 'ayse_kaya_cv.pdf',
        originalName: 'ayse_kaya_cv.pdf',
        fileUrl: '/uploads/ayse_kaya_cv.pdf',
        extractedText:
          'Ayşe Kaya - Digital Marketing Manager\nExperience: 4+ years in digital marketing\nSkills: Google Ads, Facebook Ads, SEO, Content Marketing...',
        extractedData: JSON.stringify({
          personalInfo: {
            name: 'Ayşe Kaya',
            email: 'ayse.kaya@test.com',
            phone: '0555 987 6543',
          },
          skills: ['Google Ads', 'Facebook Ads', 'SEO', 'Content Marketing'],
          experience: [
            {
              company: 'Digital Marketing Agency',
              position: 'Digital Marketing Manager',
              duration: '2022-Present',
            },
          ],
        }),
        markdownContent:
          '# Ayşe Kaya\n## Digital Marketing Manager\n\n**Email:** ayse.kaya@test.com\n**Phone:** 0555 987 6543\n\n### Experience\n- **Digital Marketing Agency** - Digital Marketing Manager (2022-Present)',
      },
    ],
  });

  logger.info('✅ CV yüklemeleri oluşturuldu');

  // Kayıtlı CV'ler
  await prisma.savedCv.createMany({
    data: [
      {
        userId: users[0].id,
        title: 'Senior Developer CV - ATS Optimized',
        content: JSON.stringify({
          personalInfo: {
            name: 'Ahmet Yılmaz',
            email: 'ahmet.yilmaz@test.com',
            phone: '+90 555 123 4567',
            address: 'Kadıköy, İstanbul',
            github: 'https://github.com/ahmetyilmaz',
            linkedin: 'https://www.linkedin.com/in/ahmetyilmaz',
          },
          summary:
            'Senior Full Stack Developer with 4+ years of experience in building scalable web applications using modern technologies.',
          experience: [
            {
              title: 'Senior Full Stack Developer',
              company: 'TechCorp Yazılım',
              duration: '2021 - Present',
              achievements: [
                'Led development of 15+ projects',
                'Optimized code review processes',
                'Mentored junior developers',
              ],
            },
            {
              title: 'Frontend Developer',
              company: 'StartupXYZ',
              duration: '2019 - 2021',
              achievements: [
                'Improved UI/UX performance by 40%',
                'Built component library',
                'Increased test coverage to 85%',
              ],
            },
          ],
          skills: [
            'React',
            'Node.js',
            'TypeScript',
            'PostgreSQL',
            'Docker',
            'AWS',
          ],
          education: [
            {
              degree: 'Bachelor of Computer Engineering',
              school: 'İstanbul Teknik Üniversitesi',
              year: '2015-2019',
              gpa: '3.45/4.0',
            },
          ],
        }),
        cvType: 'ATS_OPTIMIZED',
      },
      {
        userId: users[1].id,
        title: 'Marketing Manager CV - Creative',
        content: JSON.stringify({
          personalInfo: {
            name: 'Ayşe Kaya',
            email: 'ayse.kaya@test.com',
            phone: '+90 555 987 6543',
            address: 'Beşiktaş, İstanbul',
            linkedin: 'https://www.linkedin.com/in/aysekaya',
          },
          summary:
            'Creative Digital Marketing Professional with 4+ years of experience in data-driven campaigns and brand storytelling.',
          experience: [
            {
              title: 'Digital Marketing Manager',
              company: 'Digital Marketing Agency',
              duration: '2022 - Present',
              achievements: [
                'Increased client portfolio by 60%',
                'Improved ROAS by 300%',
                'Manages team of 3 marketers',
              ],
            },
            {
              title: 'Marketing Specialist',
              company: 'E-commerce Startup',
              duration: '2020 - 2021',
              achievements: [
                'Grew Instagram from 10K to 50K followers',
                '25% sales increase through influencer campaigns',
              ],
            },
          ],
          skills: [
            'Google Ads',
            'Facebook Ads',
            'SEO',
            'Content Marketing',
            'Analytics',
            'Project Management',
          ],
          education: [
            {
              degree: 'Bachelor of Business Administration',
              school: 'Boğaziçi Üniversitesi',
              year: '2016-2020',
              gpa: '3.65/4.0',
            },
          ],
        }),
        cvType: 'CREATIVE',
      },
      {
        userId: users[2].id,
        title: 'Junior Developer CV - Technical',
        content: JSON.stringify({
          personalInfo: {
            name: 'Mehmet Demir',
            email: 'mehmet.demir@test.com',
            phone: '+90 555 456 7890',
            address: 'Çankaya, Ankara',
            github: 'https://github.com/mehmetdemir',
          },
          summary:
            'Recent Computer Engineering graduate with strong foundation in algorithms and data structures, eager to start career in software development.',
          experience: [
            {
              title: 'Software Development Intern',
              company: 'Tech Solutions Ltd.',
              duration: 'July 2022 - September 2022',
              achievements: [
                'Successfully completed intern project',
                'Learned unit testing practices',
                'Gained experience in Agile processes',
              ],
            },
            {
              title: 'Research Assistant',
              company: 'University Research Lab',
              duration: 'January 2022 - May 2023',
              achievements: [
                'Published 2 academic papers',
                'Presented at conference',
                'Achieved 92% ML model accuracy',
              ],
            },
          ],
          skills: [
            'Java',
            'Python',
            'Spring Boot',
            'Angular',
            'MySQL',
            'Machine Learning',
            'Git',
          ],
          education: [
            {
              degree: 'Bachelor of Computer Engineering',
              school: 'Orta Doğu Teknik Üniversitesi',
              year: '2019-2023',
              gpa: '3.23/4.0',
            },
          ],
        }),
        cvType: 'TECHNICAL',
      },
    ],
  });

  logger.info("✅ Kayıtlı CV'ler oluşturuldu");

  // Cover Letter Basic örnekleri - Requires cvUploadId so skipping for now
  /*
  await prisma.coverLetterBasic.createMany({
    data: [
      {
        userId: users[0].id,
        positionTitle: 'Senior Full Stack Developer',
        companyName: 'TechInnovate Solutions',
        jobDescription: 'We are looking for a Senior Full Stack Developer to join our team. You will be responsible for developing scalable web applications using React, Node.js, and cloud technologies.',
        language: 'TURKISH',
        generatedContent: 'Sayın Yetkili,\n\nTechInnovate Solutions\'da Senior Full Stack Developer pozisyonu için başvurumu sunuyorum. 4+ yıllık deneyimim ve React, Node.js teknolojilerindeki uzmanlığımla ekibinize değer katacağımı düşünüyorum.\n\nMevcut pozisyonumda 15+ proje başarıyla tamamladım ve junior developer mentorluğu yaptım. Ölçeklenebilir web uygulamaları geliştirme konusundaki tecrübem, iş ilanınızda belirtilen gereksinimlerin tam olarak eşleşiyor.\n\nSaygılarımla,\nAhmet Yılmaz',
        updatedContent: null,
      },
      {
        userId: users[1].id,
        positionTitle: 'Digital Marketing Manager',
        companyName: 'Creative Brand Agency',
        jobDescription: 'Join our creative team as Digital Marketing Manager. Lead digital campaigns, manage social media strategies, and work with top brands to create impactful marketing solutions.',
        language: 'TURKISH',
        generatedContent: 'Sayın Yetkili,\n\nCreative Brand Agency\'de Digital Marketing Manager pozisyonu için başvurumu iletiyorum. 4+ yıllık dijital pazarlama deneyimim ve yaratıcı kampanya yönetimi konusundaki başarılarımla ekibinize katkı sağlayacağımı düşünüyorum.\n\nMevcut pozisyonumda müşteri portföyünü %60 artırdım ve ROAS oranını ortalama %300 iyileştirdim. Sosyal medya stratejileri ve marka bilinirliği kampanyaları konusundaki uzmanlığım, iş ilanınızda aradığınız profille örtüşüyor.\n\nSaygılarımla,\nAyşe Kaya',
        updatedContent: null,
      },
      {
        userId: users[2].id,
        positionTitle: 'Junior Software Developer',
        companyName: 'StartupTech Inc.',
        jobDescription: 'We are hiring a Junior Software Developer to work on innovative projects. Fresh graduates with strong programming skills and eagerness to learn are welcome.',
        language: 'ENGLISH',
        generatedContent: 'Dear Hiring Manager,\n\nI am writing to express my interest in the Junior Software Developer position at StartupTech Inc. As a recent Computer Engineering graduate with a strong foundation in programming and a passion for innovative technologies, I am excited about the opportunity to contribute to your team.\n\nDuring my internship and research assistant roles, I gained hands-on experience with Java, Python, and machine learning technologies. My academic projects and research work demonstrate my ability to learn quickly and solve complex problems.\n\nI am eager to bring my enthusiasm and fresh perspective to your innovative projects.\n\nSincerely,\nMehmet Demir',
        updatedContent: null,
      },
    ],
  });

  */
  // logger.info('✅ Cover Letter Basic kayıtları oluşturuldu');

  // Cover Letter Detailed örnekleri - Requires cvUploadId so skipping for now
  /*
  await prisma.coverLetterDetailed.createMany({
    data: [
      {
        userId: users[0].id,
        positionTitle: 'Tech Lead',
        companyName: 'Innovation Labs',
        jobDescription: 'We are seeking a Tech Lead to guide our development team and drive technical innovation. Lead architectural decisions, mentor developers, and shape our technology strategy.',
        whyPosition: 'Bu pozisyon, teknik liderlik becerilerimi geliştirmek ve yenilikçi projelerde yer almak için mükemmel bir fırsat. 4+ yıllık deneyimimle birlikte mentorluk yaptığım tecrübeler, bu role hazır olduğumu gösteriyor.',
        whyCompany: 'Innovation Labs\'ın teknoloji alanındaki öncü yaklaşımı ve inovasyona olan bağlılığı beni çok etkiliyor. Şirketin open source projelere katkısı ve developer community\'ye verdiği destekten etkilendim.',
        workMotivation: 'Teknik mükemmeliyeti hedefleyen ekiplerde çalışmak ve genç yetenekleri yönlendirmek beni motive ediyor. Karmaşık problemleri çözmek ve ölçeklenebilir sistemler inşa etmek tutkusum.',
        language: 'TURKISH',
        generatedContent: 'Sayın Yetkili,\n\nInnovation Labs\'da Tech Lead pozisyonu için başvurumu sunuyorum.\n\nBu pozisyonu seçmemin nedeni, teknik liderlik becilerimi geliştirmek ve yenilikçi projelerde yer almaktır. 4+ yıllık deneyimimle birlikte mentorluk yaptığım tecrübeler, bu role hazır olduğumu gösteriyor.\n\nInnovation Labs\'ı tercih etmemin sebebi, şirketin teknoloji alanındaki öncü yaklaşımı ve inovasyona olan bağlılığıdır. Open source projelere katkınız ve developer community\'ye verdiğiniz destek beni çok etkiledi.\n\nBeni motive eden faktörler, teknik mükemmeliyeti hedefleyen ekiplerde çalışmak ve genç yetenekleri yönlendirmektir. Karmaşık problemleri çözmek ve ölçeklenebilir sistemler inşa etmek benim tutkumdur.\n\nSaygılarımla,\nAhmet Yılmaz',
      },
      {
        userId: users[1].id,
        positionTitle: 'Marketing Director',
        companyName: 'Global Brands Corp',
        jobDescription: 'Lead our marketing organization and develop comprehensive marketing strategies for global brands. Drive brand growth, oversee campaigns, and build high-performing marketing teams.',
        whyPosition: 'Marketing Director pozisyonu, stratejik düşünce becerilerimi ve liderlik deneyimimi birleştirerek kariyer hedeflerime ulaşmam için ideal bir adım. Global markaların büyümesine katkı sağlamak istiyorum.',
        whyCompany: 'Global Brands Corp\'un uluslararası pazardaki güçlü konumu ve sürdürülebilirlik odaklı marka stratejileri beni cezbediyor. Şirketin çeşitlilik ve kapsayıcılık değerlerine olan bağlılığını takdir ediyorum.',
        workMotivation: 'Yaratıcı kampanyalar geliştirmek, data-driven kararlar almak ve yüksek performanslı ekipler kurmak beni motive ediyor. Markaların hikayesini tüketicilerle buluşturmak konusunda tutkuluyum.',
        language: 'TURKISH',
        generatedContent: 'Sayın Yetkili,\n\nGlobal Brands Corp\'da Marketing Director pozisyonu için başvurumu iletiyorum.\n\nBu pozisyonu tercih etmemin nedeni, stratejik düşünce becerilerimi ve liderlik deneyimimi birleştirerek kariyer hedeflerime ulaşmamdır. Global markaların büyümesine katkı sağlamak istiyorum.\n\nGlobal Brands Corp\'u seçmemin sebebi, şirketin uluslararası pazardaki güçlü konumu ve sürdürülebilirlik odaklı marka stratejileridir. Çeşitlilik ve kapsayıcılık değerlerine olan bağlılığınızı takdir ediyorum.\n\nBeni motive eden unsurlar yaratıcı kampanyalar geliştirmek, data-driven kararlar almak ve yüksek performanslı ekipler kurmaktır. Markaların hikayesini tüketicilerle buluşturmak konusunda tutkuluyum.\n\nSaygılarımla,\nAyşe Kaya',
      },
    ],
  });

  */
  // logger.info('✅ Cover Letter Detailed kayıtları oluşturuldu');

  // Özet Bilgi
  const userCount = await prisma.user.count();
  const educationCount = await prisma.education.count();
  const experienceCount = await prisma.experience.count();
  const skillCount = await prisma.skill.count();
  const courseCount = await prisma.course.count();
  const certificateCount = await prisma.certificate.count();
  const hobbyCount = await prisma.hobby.count();
  const cvUploadCount = await prisma.cvUpload.count();
  const savedCvCount = await prisma.savedCv.count();
  // const coverLetterBasicCount = await prisma.coverLetterBasic.count();
  // const coverLetterDetailedCount = await prisma.coverLetterDetailed.count();

  logger.info('\n📊 Seed işlemi tamamlandı! Oluşturulan veriler:');
  logger.info(`👥 Kullanıcılar: ${userCount}`);
  logger.info(`🎓 Eğitim Kayıtları: ${educationCount}`);
  logger.info(`💼 İş Deneyimleri: ${experienceCount}`);
  logger.info(`🛠️ Beceriler: ${skillCount}`);
  logger.info(`📚 Kurslar: ${courseCount}`);
  logger.info(`🏆 Sertifikalar: ${certificateCount}`);
  logger.info(`🎯 Hobiler: ${hobbyCount}`);
  logger.info(`📄 CV Yüklemeleri: ${cvUploadCount}`);
  logger.info(`💾 Kayıtlı CV'ler: ${savedCvCount}`);
  // logger.info(`✉️ Basic Cover Letters: ${coverLetterBasicCount}`);
  // logger.info(`📝 Detailed Cover Letters: ${coverLetterDetailedCount}`);

  logger.info('\n🔑 Test kullanıcı bilgileri:');
  logger.info('Admin: admin@atscv.com / test123456');
  logger.info('Senior Developer: ahmet.yilmaz@test.com / test123456');
  logger.info('Marketing Manager: ayse.kaya@test.com / test123456');
  logger.info('Fresh Graduate: mehmet.demir@test.com / test123456');

  logger.info('\n✨ Tüm servisler için kapsamlı dummy data oluşturuldu!');
}

main()
  .catch((e) => {
    logger.error('❌ Seed işlemi başarısız:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
