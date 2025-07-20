import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed işlemi başlatılıyor...');

  // Admin kullanıcı
  const adminPassword = await bcrypt.hash('test123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@atscv.com' },
    update: {},
    create: {
      email: 'admin@atscv.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin kullanıcı oluşturuldu');

  // Test kullanıcıları
  const testPassword = await bcrypt.hash('test123456', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ahmet.yilmaz@test.com' },
      update: {},
      create: {
        email: 'ahmet.yilmaz@test.com',
        password: testPassword,
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        role: 'USER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ayse.kaya@test.com' },
      update: {},
      create: {
        email: 'ayse.kaya@test.com',
        password: testPassword,
        firstName: 'Ayşe',
        lastName: 'Kaya',
        role: 'USER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'mehmet.demir@test.com' },
      update: {},
      create: {
        email: 'mehmet.demir@test.com',
        password: testPassword,
        firstName: 'Mehmet',
        lastName: 'Demir',
        role: 'USER',
      },
    }),
  ]);

  console.log('✅ Test kullanıcıları oluşturuldu');

  // CV Yüklemeleri
  await prisma.cvUpload.createMany({
    data: [
      {
        userId: users[0].id,
        fileName: 'ahmet_yilmaz_cv.pdf',
        originalName: 'ahmet_yilmaz_cv.pdf',
        fileUrl: '/uploads/ahmet_yilmaz_cv.pdf',
        extractedText: 'Ahmet Yılmaz - Senior Software Developer...',
        processingStatus: 'COMPLETED',
      },
      {
        userId: users[1].id,
        fileName: 'ayse_kaya_cv.pdf',
        originalName: 'ayse_kaya_cv.pdf',
        fileUrl: '/uploads/ayse_kaya_cv.pdf',
        extractedText: 'Ayşe Kaya - Marketing Manager...',
        processingStatus: 'COMPLETED',
      },
    ],
  });

  console.log('✅ CV yüklemeleri oluşturuldu');

  // Kayıtlı CV'ler
  await prisma.savedCv.createMany({
    data: [
      {
        userId: users[0].id,
        title: 'Software Developer CV',
        content: JSON.stringify({
          personalInfo: {
            name: 'Ahmet Yılmaz',
            email: 'ahmet.yilmaz@test.com',
            phone: '+90 555 123 4567',
          },
          experience: [
            {
              title: 'Senior Software Developer',
              company: 'Tech Corp',
              duration: '2020 - Present',
            },
          ],
        }),
        cvType: 'TECHNICAL',
      },
      {
        userId: users[1].id,
        title: 'Marketing Manager CV',
        content: JSON.stringify({
          personalInfo: {
            name: 'Ayşe Kaya',
            email: 'ayse.kaya@test.com',
            phone: '+90 555 987 6543',
          },
          experience: [
            {
              title: 'Marketing Manager',
              company: 'Global Marketing Inc',
              duration: '2019 - Present',
            },
          ],
        }),
        cvType: 'CREATIVE',
      },
    ],
  });

  console.log("✅ Kayıtlı CV'ler oluşturuldu");

  // Cover Letter örnekleri (enum'a göre güncellenmiş)
  await prisma.coverLetter.createMany({
    data: [
      {
        userId: users[0].id,
        title: 'Başvuru - Software Developer',
        content: 'Sayın Yetkili, yazılım geliştirme alanındaki tecrübemle...',
        coverLetterType: 'TECHNICAL',
        positionTitle: 'Senior Software Developer',
        companyName: 'Tech Corp',
        category: 'SOFTWARE_DEVELOPER',
      },
      {
        userId: users[1].id,
        title: 'Başvuru - Marketing Specialist',
        content:
          'Pazarlama stratejilerindeki başarılarımı sizinle paylaşmak isterim...',
        coverLetterType: 'PROFESSIONAL',
        positionTitle: 'Marketing Manager',
        companyName: 'Global Marketing Inc',
        category: 'MARKETING_SPECIALIST',
      },
      {
        userId: users[2].id,
        title: 'Başvuru - Junior Tester',
        content:
          'Yazılım test alanında kariyerime sizinle başlamak istiyorum...',
        coverLetterType: 'ENTRY_LEVEL',
        positionTitle: 'Junior QA Tester',
        companyName: 'StartUp QA',
        category: 'QUALITY_ASSURANCE',
      },
    ],
  });

  console.log('✅ Cover Letter kayıtları oluşturuldu');

  // Özet Bilgi
  const userCount = await prisma.user.count();
  const cvUploadCount = await prisma.cvUpload.count();
  const savedCvCount = await prisma.savedCv.count();
  const coverLetterCount = await prisma.coverLetter.count();

  console.log('\n📊 Seed işlemi tamamlandı! Oluşturulan veriler:');
  console.log(`👥 Kullanıcılar: ${userCount}`);
  console.log(`📄 CV Yüklemeleri: ${cvUploadCount}`);
  console.log(`💾 Kayıtlı CV'ler: ${savedCvCount}`);
  console.log(`✉️ Cover Letters: ${coverLetterCount}`);

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
