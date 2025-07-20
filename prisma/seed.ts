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
      isActive: true,
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
        isActive: true,
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
        isActive: true,
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
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Test kullanıcıları oluşturuldu');

  // CV Yüklemeleri
  const cvUpload1 = await prisma.cvUpload.create({
    data: {
      userId: users[0].id,
      fileName: 'ahmet_yilmaz_cv.pdf',
      fileUrl: '/uploads/ahmet_yilmaz_cv.pdf',
      extractedText: 'Ahmet Yılmaz - Senior Software Developer...',
    },
  });

  const cvUpload2 = await prisma.cvUpload.create({
    data: {
      userId: users[1].id,
      fileName: 'ayse_kaya_cv.pdf',
      fileUrl: '/uploads/ayse_kaya_cv.pdf',
      extractedText: 'Ayşe Kaya - Marketing Manager...',
    },
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
        templateId: 'modern',
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
        templateId: 'professional',
      },
    ],
  });

  console.log('✅ Kayıtlı CV\'ler oluşturuldu');

  // İstatistik özeti
  const userCount = await prisma.user.count();
  const cvUploadCount = await prisma.cvUpload.count();
  const savedCvCount = await prisma.savedCv.count();

  console.log('\n📊 Seed işlemi tamamlandı! Oluşturulan veriler:');
  console.log(\`👥 Kullanıcılar: \${userCount}\`);
  console.log(\`📄 CV Yüklemeleri: \${cvUploadCount}\`);
  console.log(\`💾 Kayıtlı CV\'ler: \${savedCvCount}\`);

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
