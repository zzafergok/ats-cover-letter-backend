import { PrismaClient, TemplateIndustry } from '@prisma/client';
import logger from '../config/logger';
import {
  SERVICE_MESSAGES,
  createErrorMessage,
} from '../constants/messages';

const prisma = new PrismaClient();

export interface TemplateRequest {
  industry?: TemplateIndustry;
  category?: string;
  language?: 'TURKISH' | 'ENGLISH';
}

export interface CreateCoverLetterFromTemplateRequest {
  templateId: string;
  positionTitle: string;
  companyName: string;
  personalizations?: {
    whyPosition?: string;
    whyCompany?: string;
    additionalSkills?: string;
  };
}

export interface TemplateResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
  industry: string;
  description?: string;
}

export class TemplateService {
  private static instance: TemplateService;

  private constructor() {}

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  async getTemplates(filters: TemplateRequest = {}): Promise<TemplateResponse[]> {
    try {
      const { industry, category, language } = filters;

      const templates = await prisma.coverLetterTemplate.findMany({
        where: {
          ...(industry && { industry }),
          ...(category && { category: category as any }),
          ...(language && { language }),
          isActive: true,
        },
        orderBy: [
          { industry: 'asc' },
          { category: 'asc' },
          { sortOrder: 'asc' },
        ],
      });

      return templates.map((template) => ({
        id: template.id,
        title: template.title,
        content: template.content,
        category: template.category,
        language: template.language,
        industry: template.industry,
        description: template.description || undefined,
      }));
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error)
      );
      throw new Error('Template listesi alınamadı');
    }
  }

  async getTemplateById(templateId: string): Promise<TemplateResponse | null> {
    try {
      const template = await prisma.coverLetterTemplate.findFirst({
        where: {
          id: templateId,
          isActive: true,
        },
      });

      if (!template) {
        return null;
      }

      return {
        id: template.id,
        title: template.title,
        content: template.content,
        category: template.category,
        language: template.language,
        industry: template.industry,
        description: template.description || undefined,
      };
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error)
      );
      throw new Error('Template bulunamadı');
    }
  }

  async createCoverLetterFromTemplate(
    request: CreateCoverLetterFromTemplateRequest
  ): Promise<string> {
    try {
      const template = await this.getTemplateById(request.templateId);
      
      if (!template) {
        throw new Error('Template bulunamadı');
      }

      let customizedContent = template.content;

      // Replace placeholders with actual values
      customizedContent = customizedContent
        .replace(/\[POSITION_TITLE\]/g, request.positionTitle)
        .replace(/\[COMPANY_NAME\]/g, request.companyName);

      // Add personalizations if provided
      if (request.personalizations) {
        const { whyPosition, whyCompany, additionalSkills } = request.personalizations;

        if (whyPosition) {
          customizedContent = customizedContent.replace(
            /\[WHY_POSITION\]/g,
            whyPosition
          );
        }

        if (whyCompany) {
          customizedContent = customizedContent.replace(
            /\[WHY_COMPANY\]/g,
            whyCompany
          );
        }

        if (additionalSkills) {
          customizedContent = customizedContent.replace(
            /\[ADDITIONAL_SKILLS\]/g,
            additionalSkills
          );
        }
      }

      // Remove any remaining placeholders
      customizedContent = customizedContent
        .replace(/\[WHY_POSITION\]/g, '')
        .replace(/\[WHY_COMPANY\]/g, '')
        .replace(/\[ADDITIONAL_SKILLS\]/g, '');

      logger.info('Cover letter created from template successfully', {
        templateId: request.templateId,
        positionTitle: request.positionTitle,
        companyName: request.companyName,
      });

      return customizedContent.trim();
    } catch (error) {
      logger.error(
        createErrorMessage(SERVICE_MESSAGES.GENERAL.FAILED, error as Error)
      );
      throw error;
    }
  }

  async getTemplatesByIndustry(industry: TemplateIndustry): Promise<TemplateResponse[]> {
    return this.getTemplates({ industry });
  }

  async getTemplatesByCategory(category: string): Promise<TemplateResponse[]> {
    return this.getTemplates({ category });
  }

  async initializeTemplates(): Promise<void> {
    try {
      // Check if templates already exist
      const existingCount = await prisma.coverLetterTemplate.count();
      
      if (existingCount > 0) {
        logger.info('Templates already initialized');
        return;
      }

      // Create templates for all industries
      const technologyTemplates = this.getTechnologyTemplates();
      const financeTemplates = this.getFinanceTemplates();
      const healthcareTemplates = this.getHealthcareTemplates();
      const educationTemplates = this.getEducationTemplates();
      const marketingTemplates = this.getMarketingTemplates();

      const allTemplates = [
        ...technologyTemplates, 
        ...financeTemplates,
        ...healthcareTemplates,
        ...educationTemplates,
        ...marketingTemplates
      ];

      // Insert templates into database
      await prisma.coverLetterTemplate.createMany({
        data: allTemplates,
      });

      logger.info(`Successfully initialized ${allTemplates.length} templates`);
    } catch (error) {
      logger.error('Failed to initialize templates', error);
      throw new Error('Template başlatma işlemi başarısız');
    }
  }

  private getTechnologyTemplates(): any[] {
    return [
      // Software Developer Templates
      {
        title: 'Genel Yazılım Geliştirici',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Yazılım geliştirme alanındaki deneyimim ve teknik becerilerimle ekibinize değer katacağımı düşünüyorum.

Son 3 yıldır çeşitli projelerde Java, Python ve JavaScript teknolojileri ile çalışıyorum. Özellikle backend sistemlerin geliştirilmesi ve API tasarımı konularında deneyim sahibiyim. Ayrıca veritabanı yönetimi ve sistem performansı optimizasyonu alanlarında da bilgiye sahibim.

[WHY_POSITION]

Şirketinizin teknoloji odaklı yaklaşımı ve inovatif projeleri beni oldukça heyecanlandırıyor. [WHY_COMPANY] Bu sebeple ekibinizin bir parçası olmak için sabırsızlanıyorum.

[ADDITIONAL_SKILLS]

Kendimi sürekli geliştiren, takım çalışmasına yatkın ve problem çözme odaklı bir yazılım geliştiricisiyim. Bu pozisyonda bilgi ve deneyimlerimi paylaşarak şirketinizin hedeflerine katkı sağlamak istiyorum.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'SOFTWARE_DEVELOPER',
        language: 'TURKISH',
        industry: 'TECHNOLOGY',
        description: 'Genel yazılım geliştirici pozisyonları için uygun şablon',
        sortOrder: 1,
      },
      {
        title: 'Software Developer Template',
        content: `Dear Hiring Manager,

I am writing to express my interest in the [POSITION_TITLE] position at [COMPANY_NAME]. With my experience in software development and technical skills, I believe I can make a valuable contribution to your team.

Over the past 3 years, I have worked on various projects using Java, Python, and JavaScript technologies. I have particular experience in backend system development and API design. I also have knowledge in database management and system performance optimization.

[WHY_POSITION]

Your company's technology-focused approach and innovative projects excite me greatly. [WHY_COMPANY] This is why I am eager to become part of your team.

[ADDITIONAL_SKILLS]

I am a continuously improving software developer who is inclined toward teamwork and problem-solving. In this position, I want to contribute to your company's goals by sharing my knowledge and experience.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'SOFTWARE_DEVELOPER',
        language: 'ENGLISH',
        industry: 'TECHNOLOGY',
        description: 'General software developer position template',
        sortOrder: 2,
      },
      {
        title: 'Deneyimli Yazılım Geliştirici',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] bünyesindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. 5+ yıllık yazılım geliştirme deneyimim ile birlikte liderlik ve mentörlük becerilerimle takımınıza katkı sağlayabileceğimi düşünüyorum.

Kariyerim boyunca enterprise düzeyde uygulamalar geliştirdim ve teknik ekipleri yönettim. Mikroservis mimarisi, cloud teknolojileri ve DevOps pratikleri konularında derin deneyim sahibiyim. Ayrıca agile metodolojiler ile çalışma konusunda da geniş tecrübem bulunmaktadır.

[WHY_POSITION]

Özellikle şirketinizin [WHY_COMPANY] vizyonu benim kişisel hedeflerimle örtüşüyor. Bu sebeple bu fırsatı değerlendirmek istiyorum.

[ADDITIONAL_SKILLS]

Teknik liderlik, ekip yönetimi ve stratejik planlama konularındaki deneyimlerimle şirketinizin büyüme hedeflerine destek olmak istiyorum.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'SOFTWARE_DEVELOPER',
        language: 'TURKISH',
        industry: 'TECHNOLOGY',
        description: 'Deneyimli yazılım geliştiriciler için şablon',
        sortOrder: 3,
      },
      // Frontend Developer Templates
      {
        title: 'Frontend Developer',
        content: `Dear Hiring Team,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. As a passionate frontend developer with expertise in modern web technologies, I am confident I can help create exceptional user experiences for your products.

My technical stack includes React, Vue.js, TypeScript, and modern CSS frameworks. I have experience in responsive design, performance optimization, and accessibility standards. I also work closely with UX/UI designers to implement pixel-perfect designs.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] and believe my skills in creating intuitive user interfaces would be valuable to your team.

[ADDITIONAL_SKILLS]

Beyond technical skills, I am passionate about user experience and always strive to create applications that are not only functional but also delightful to use.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'FRONTEND_DEVELOPER',
        language: 'ENGLISH',
        industry: 'TECHNOLOGY',
        description: 'Frontend developer position template',
        sortOrder: 4,
      },
      {
        title: 'React Developer',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. React ekosisteminde uzmanlaşmış bir frontend geliştirici olarak, modern ve kullanıcı dostu web uygulamaları geliştirme konusundaki deneyimimi paylaşmak istiyorum.

React, Redux, Next.js ve TypeScript teknolojilerinde 3+ yıllık deneyimim bulunmaktadır. Ayrıca test-driven development, component-based architecture ve state management konularında da derin bilgiye sahibim.

[WHY_POSITION]

Özellikle [WHY_COMPANY] sebebiyle şirketinizde çalışma fırsatını değerlendirmek istiyorum.

[ADDITIONAL_SKILLS]

Modern geliştirme pratikleri, performans optimizasyonu ve kullanıcı deneyimi odaklı çalışma tarzımla ekibinize katkı sağlayabilirim.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'FRONTEND_DEVELOPER',
        language: 'TURKISH',
        industry: 'TECHNOLOGY',
        description: 'React developer pozisyonları için şablon',
        sortOrder: 5,
      },
      {
        title: 'UI/UX Focused Frontend Developer',
        content: `Dear Hiring Manager,

I am writing to apply for the [POSITION_TITLE] role at [COMPANY_NAME]. As a frontend developer with a strong focus on UI/UX, I bring both technical expertise and design sensibility to create engaging web experiences.

I specialize in HTML5, CSS3, JavaScript, and modern frameworks like React and Angular. My background in design principles allows me to bridge the gap between design and development, ensuring pixel-perfect implementations that maintain excellent user experience.

[WHY_POSITION]

[WHY_COMPANY] This aligns perfectly with my passion for creating beautiful and functional user interfaces.

[ADDITIONAL_SKILLS]

I am particularly skilled in animation libraries, responsive design, and cross-browser compatibility. I also have experience with design tools like Figma and Adobe Creative Suite.

I look forward to discussing how I can contribute to your team.

Best regards,
[Name]`,
        category: 'FRONTEND_DEVELOPER',
        language: 'ENGLISH',
        industry: 'TECHNOLOGY',
        description: 'UI/UX focused frontend developer template',
        sortOrder: 6,
      },
      {
        title: 'API Developer',
        content: `Dear Hiring Manager,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. As an experienced API developer, I specialize in designing and building robust, scalable APIs that power modern applications.

My expertise includes RESTful API design, GraphQL implementation, and microservices architecture. I have worked with Node.js, Python FastAPI, and Go to build high-performance backend services. I am also experienced in API documentation, testing, and security best practices.

[WHY_POSITION]

I am particularly interested in [WHY_COMPANY] and believe my API development expertise would be valuable to your engineering team.

[ADDITIONAL_SKILLS]

I have strong skills in database optimization, caching strategies, and monitoring systems. I also have experience with API gateway implementations and rate limiting.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'BACKEND_DEVELOPER',
        language: 'ENGLISH',
        industry: 'TECHNOLOGY',
        description: 'API developer specialization template',
        sortOrder: 6.5,
      },
      // Backend Developer Templates
      {
        title: 'Backend Developer',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] bünyesindeki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Backend geliştirme alanındaki uzmanlığım ve sistem mimarisi konusundaki deneyimim ile ekibinize değer katacağımı düşünüyorum.

Node.js, Python, ve Java teknolojileri ile RESTful API'ler ve mikroservis mimarileri geliştirme konusunda 4+ yıllık deneyimim bulunmaktadır. Veritabanı tasarımı, performans optimizasyonu ve güvenlik konularında da derin bilgiye sahibim.

[WHY_POSITION]

Şirketinizin [WHY_COMPANY] yaklaşımı benim profesyonel hedeflerimle uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Cloud teknolojileri, containerization ve CI/CD süreçleri konusundaki deneyimlerimle ekibinizin teknik kapasitesine katkı sağlayabilirim.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'BACKEND_DEVELOPER',
        language: 'TURKISH',
        industry: 'TECHNOLOGY',
        description: 'Backend developer pozisyonları için şablon',
        sortOrder: 7,
      },
      {
        title: 'Senior Backend Engineer',
        content: `Dear Hiring Team,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With extensive experience in backend development and system architecture, I am confident in my ability to design and build scalable, robust systems.

My expertise includes distributed systems, microservices architecture, and high-performance databases. I have worked with technologies such as Go, Python, PostgreSQL, Redis, and Kubernetes. I also have experience in system design for high-traffic applications.

[WHY_POSITION]

I am particularly interested in [WHY_COMPANY] and believe my experience in building scalable backend systems would be valuable to your engineering team.

[ADDITIONAL_SKILLS]

I have strong skills in performance optimization, system monitoring, and ensuring high availability. I also mentor junior developers and contribute to technical decision-making.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'BACKEND_DEVELOPER',
        language: 'ENGLISH',
        industry: 'TECHNOLOGY',
        description: 'Senior backend engineer template',
        sortOrder: 8,
      },
      // Fullstack Developer Templates
      {
        title: 'Fullstack Developer',
        content: `Dear Hiring Manager,

I am writing to express my interest in the [POSITION_TITLE] position at [COMPANY_NAME]. As a fullstack developer with experience across the entire web development stack, I can contribute to both frontend and backend development efforts.

My technical skills span React, Node.js, Python, PostgreSQL, and modern deployment practices. I enjoy working on complete features from database design to user interface implementation, ensuring seamless integration between all layers of the application.

[WHY_POSITION]

[WHY_COMPANY] This versatility in both frontend and backend development makes me an ideal candidate for this role.

[ADDITIONAL_SKILLS]

I have experience with agile development practices, version control, testing frameworks, and deployment automation. I also enjoy collaborating with cross-functional teams to deliver high-quality software solutions.

I look forward to contributing to your team's success.

Best regards,
[Name]`,
        category: 'FULLSTACK_DEVELOPER',
        language: 'ENGLISH',
        industry: 'TECHNOLOGY',
        description: 'Fullstack developer position template',
        sortOrder: 9,
      },
      // Data Scientist Template
      {
        title: 'Veri Bilimci',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Veri analizi, makine öğrenmesi ve istatistiksel modelleme alanlarındaki deneyimim ile veri odaklı karar alma süreçlerinize katkı sağlayabileceğimi düşünüyorum.

Python, R, SQL ve çeşitli veri görselleştirme araçları konusunda yetkinliğim bulunmaktadır. Makine öğrenmesi algoritmaları, büyük veri analitiği ve predictive modeling alanlarında proje deneyimim mevcuttur.

[WHY_POSITION]

Özellikle [WHY_COMPANY] sebebiyle bu pozisyonda çalışma fırsatını değerlendirmek istiyorum.

[ADDITIONAL_SKILLS]

İş zekası, veri madenciliği ve yapay zeka uygulamaları konularındaki bilgi ve deneyimlerimle şirketinizin analitik kapasitesini artırabilirim.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'DATA_SCIENTIST',
        language: 'TURKISH',
        industry: 'TECHNOLOGY',
        description: 'Veri bilimci pozisyonları için şablon',
        sortOrder: 10,
      },
    ];
  }

  private getFinanceTemplates(): any[] {
    return [
      // Financial Analyst Templates
      {
        title: 'Finansal Analist',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Finans alanındaki akademik formasyonum ve analitik düşünce yapım ile şirketinizin finansal karar alma süreçlerine katkı sağlayabileceğimi düşünüyorum.

Finansal modelleme, bütçe analizi ve yatırım değerlendirmesi konularında deneyim sahibiyim. Excel, SQL ve finansal analiz araçları konusunda yetkinliğim bulunmaktadır. Ayrıca risk analizi ve performans ölçümü alanlarında da bilgiye sahibim.

[WHY_POSITION]

[WHY_COMPANY] Bu sebeple ekibinizin bir parçası olmak istiyorum.

[ADDITIONAL_SKILLS]

Detaylı analitik raporlama, trend analizi ve finansal öngörü konularındaki becerilerimle şirketinizin stratejik hedeflerine destek olabilirim.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'FINANCIAL_ANALYST',
        language: 'TURKISH',
        industry: 'FINANCE',
        description: 'Finansal analist pozisyonları için şablon',
        sortOrder: 11,
      },
      {
        title: 'Senior Financial Analyst',
        content: `Dear Hiring Team,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my strong background in financial analysis and strategic planning, I am confident I can provide valuable insights to support your business decisions.

My experience includes financial modeling, budgeting, forecasting, and variance analysis. I am proficient in advanced Excel, SQL, and financial software such as SAP and Oracle. I have also worked on M&A analysis and capital allocation projects.

[WHY_POSITION]

I am particularly attracted to [WHY_COMPANY] and believe my analytical skills would be valuable in this role.

[ADDITIONAL_SKILLS]

I have strong presentation skills and experience in communicating complex financial information to both technical and non-technical stakeholders.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'FINANCIAL_ANALYST',
        language: 'ENGLISH',
        industry: 'FINANCE',
        description: 'Senior financial analyst template',
        sortOrder: 12,
      },
      {
        title: 'Kurumsal Finansal Analist',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] bünyesindeki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Kurumsal finans alanındaki deneyimim ve analitik becerilerim ile şirketinizin finansal performansının artırılmasına katkı sağlayabileceğimi düşünüyorum.

Nakit akışı analizi, sermaye yapısı optimizasyonu ve yatırım projelerinin değerlendirilmesi konularında deneyim sahibiyim. Bloomberg Terminal, Factset ve çeşitli finansal modelleme araçları konusunda yetkinliğim bulunmaktadır.

[WHY_POSITION]

Özellikle [WHY_COMPANY] vizyonu benimle uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Risk yönetimi, finansal raporlama ve stratejik planlama konularındaki deneyimlerimle ekibinize değer katacağımı düşünüyorum.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'FINANCIAL_ANALYST',
        language: 'TURKISH',
        industry: 'FINANCE',
        description: 'Kurumsal finansal analist şablonu',
        sortOrder: 13,
      },
      // Investment Banker Templates
      {
        title: 'Investment Banking Analyst',
        content: `Dear Hiring Manager,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my strong academic background in finance and passion for investment banking, I am eager to contribute to your team's success in delivering exceptional client service.

My experience includes financial modeling, valuation analysis, and market research. I have worked on pitch books, due diligence processes, and transaction support. I am proficient in Excel, PowerPoint, and financial databases such as Capital IQ and FactSet.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] and believe this opportunity aligns perfectly with my career aspirations in investment banking.

[ADDITIONAL_SKILLS]

I have strong attention to detail, ability to work under pressure, and excellent communication skills that are essential for client-facing roles.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'INVESTMENT_BANKER',
        language: 'ENGLISH',
        industry: 'FINANCE',
        description: 'Investment banking analyst template',
        sortOrder: 14,
      },
      {
        title: 'Yatırım Bankacısı',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] bünyesindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Yatırım bankacılığı alanındaki tutkum ve finansal piyasalar konusundaki bilgim ile müşteri hizmetlerinde mükemmellik sağlayan ekibinize katkı sunmak istiyorum.

Şirket değerlemesi, M&A analizi ve sermaye piyasası işlemleri konularında deneyim sahibiyim. Pitch book hazırlama, due diligence süreçleri ve müşteri sunumları konularında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

[WHY_COMPANY] Bu sebeple kariyerimi bu alanda geliştirmek istiyorum.

[ADDITIONAL_SKILLS]

Güçlü analitik düşünce yapım, yoğun tempoda çalışabilme kabiliyetim ve müşteri odaklı yaklaşımımla ekibinize değer katacağımı düşünüyorum.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'INVESTMENT_BANKER',
        language: 'TURKISH',
        industry: 'FINANCE',
        description: 'Yatırım bankacısı pozisyonları için şablon',
        sortOrder: 15,
      },
      // Financial Advisor Templates
      {
        title: 'Finansal Danışman',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Müşteri odaklı yaklaşımım ve finansal planlama konusundaki uzmanlığım ile müşterilerinizin finansal hedeflerine ulaşmalarına yardımcı olabileceğimi düşünüyorum.

Kişisel finansal planlama, yatırım danışmanlığı ve emeklilik planlaması konularında deneyim sahibiyim. Müşteri ihtiyaçlarını analiz etme ve uygun finansal çözümler sunma konusunda başarılı bir geçmişim bulunmaktadır.

[WHY_POSITION]

Özellikle [WHY_COMPANY] vizyonu benim değerlerimle uyumlu olduğu için bu fırsatı değerlendirmek istiyorum.

[ADDITIONAL_SKILLS]

Güçlü iletişim becerilerim, empati yeteneğim ve müşteri memnuniyeti odaklı çalışma tarzımla ekibinize katkı sağlayabilirim.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'FINANCIAL_ADVISOR',
        language: 'TURKISH',
        industry: 'FINANCE',
        description: 'Finansal danışman pozisyonları için şablon',
        sortOrder: 16,
      },
      {
        title: 'Personal Financial Advisor',
        content: `Dear Hiring Team,

I am writing to express my interest in the [POSITION_TITLE] position at [COMPANY_NAME]. With my passion for helping individuals achieve their financial goals and my expertise in personal finance, I am excited about the opportunity to serve your clients.

My experience includes comprehensive financial planning, investment advisory, and retirement planning. I have successfully helped clients develop and implement strategies for wealth building, risk management, and financial security.

[WHY_POSITION]

I am particularly attracted to [WHY_COMPANY] and believe my client-focused approach would be valuable in this role.

[ADDITIONAL_SKILLS]

I have excellent interpersonal skills, strong ethical standards, and the ability to explain complex financial concepts in simple terms that clients can understand.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'FINANCIAL_ADVISOR',
        language: 'ENGLISH',
        industry: 'FINANCE',
        description: 'Personal financial advisor template',
        sortOrder: 17,
      },
      // Accounting Specialist Templates
      {
        title: 'Muhasebe Uzmanı',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Muhasebe alanındaki deneyimim ve detay odaklı çalışma tarzım ile şirketinizin finansal kayıtlarının doğru ve zamanında tutulmasına katkı sağlayabileceğimi düşünüyorum.

Genel muhasebe, maliyet muhasebesi ve finansal raporlama konularında deneyim sahibiyim. SAP, Oracle ve çeşitli muhasebe yazılımları konusunda yetkinliğim bulunmaktadır. Ayrıca vergi mevzuatı ve denetim süreçleri konularında da bilgiye sahibim.

[WHY_POSITION]

[WHY_COMPANY] Bu sebeple ekibinizin bir parçası olmak istiyorum.

[ADDITIONAL_SKILLS]

Düzenli ve sistematik çalışma alışkanlığım, problem çözme becerim ve teamwork yeteneğimle departmanınıza değer katacağımı düşünüyorum.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'ACCOUNTING_SPECIALIST',
        language: 'TURKISH',
        industry: 'FINANCE',
        description: 'Muhasebe uzmanı pozisyonları için şablon',
        sortOrder: 18,
      },
      {
        title: 'Staff Accountant',
        content: `Dear Hiring Manager,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my strong foundation in accounting principles and attention to detail, I am confident I can contribute to maintaining accurate financial records and supporting your finance team.

My experience includes accounts payable/receivable, general ledger maintenance, and financial statement preparation. I am proficient in QuickBooks, Excel, and various accounting software. I also have knowledge of GAAP principles and month-end closing procedures.

[WHY_POSITION]

I am particularly interested in [WHY_COMPANY] and believe my methodical approach to accounting would be valuable to your organization.

[ADDITIONAL_SKILLS]

I have strong organizational skills, ability to meet deadlines, and experience in working with cross-functional teams to ensure accurate financial reporting.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'ACCOUNTING_SPECIALIST',
        language: 'ENGLISH',
        industry: 'FINANCE',
        description: 'Staff accountant position template',
        sortOrder: 19,
      },
      // Risk Analyst Template
      {
        title: 'Risk Analisti',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] bünyesindeki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Risk yönetimi alanındaki uzmanlığım ve analitik düşünce yapım ile şirketinizin risk profilinin iyileştirilmesine katkı sağlayabileceğimi düşünüyorum.

Kredi riski, piyasa riski ve operasyonel risk analizi konularında deneyim sahibiyim. Risk modelleme, stres testleri ve risk raporlaması alanlarında da yetkinliğim bulunmaktadır. Ayrıca düzenleyici gereklilikler ve uyumluluk konularında da bilgiye sahibim.

[WHY_POSITION]

Özellikle [WHY_COMPANY] yaklaşımı benim profesyonel hedeflerimle uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

İstatistiksel analiz, veri madenciliği ve risk ölçüm teknikleri konusundaki deneyimlerimle risk yönetimi süreçlerinizi destekleyebilirim.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'RISK_ANALYST',
        language: 'TURKISH',
        industry: 'FINANCE',
        description: 'Risk analisti pozisyonları için şablon',
        sortOrder: 20,
      },
    ];
  }

  private getHealthcareTemplates(): any[] {
    return [
      // Nurse Templates
      {
        title: 'Registered Nurse',
        content: `Dear Hiring Manager,

I am writing to express my interest in the [POSITION_TITLE] position at [COMPANY_NAME]. As a dedicated registered nurse with a passion for patient care, I am excited about the opportunity to contribute to your healthcare team.

My experience includes medical-surgical nursing, patient assessment, medication administration, and family education. I am skilled in electronic health records, patient monitoring systems, and emergency response procedures.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] and believe my commitment to quality patient care would be valuable to your organization.

[ADDITIONAL_SKILLS]

I have excellent communication skills, ability to work under pressure, and strong attention to detail. I am also experienced in team collaboration and patient advocacy.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'NURSE',
        language: 'ENGLISH',
        industry: 'HEALTHCARE',
        description: 'Registered nurse position template',
        sortOrder: 21,
      },
      {
        title: 'Hemşire',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] hastanesindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Hasta bakımı konusundaki tutkum ve hemşirelik alanındaki deneyimim ile sağlık ekibinize katkı sağlayabileceğimi düşünüyorum.

Cerrahi hemşireliği, hasta değerlendirmesi, ilaç uygulaması ve hasta eğitimi konularında deneyim sahibiyim. Elektronik hasta kayıtları, hasta monitörizasyonu ve acil müdahale prosedürleri konusunda yetkinliğim bulunmaktadır.

[WHY_POSITION]

Özellikle [WHY_COMPANY] vizyonu benim değerlerimle uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Güçlü iletişim becerilerim, yoğun tempoda çalışabilme kabiliyetim ve detaylara dikkat etme özelliğimle ekibinize değer katacağımı düşünüyorum.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'NURSE',
        language: 'TURKISH',
        industry: 'HEALTHCARE',
        description: 'Hemşire pozisyonları için şablon',
        sortOrder: 22,
      },
      {
        title: 'ICU Nurse',
        content: `Dear Hiring Team,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my specialized experience in intensive care nursing, I am confident I can provide exceptional care to critically ill patients.

My background includes critical care monitoring, ventilator management, medication titration, and family support during difficult times. I am certified in ACLS, BLS, and have experience with various ICU equipment and protocols.

[WHY_POSITION]

I am particularly interested in [WHY_COMPANY] and believe my critical care expertise would be valuable in this challenging environment.

[ADDITIONAL_SKILLS]

I have strong clinical judgment, emotional resilience, and the ability to remain calm under pressure. I also have experience mentoring new nurses and participating in quality improvement initiatives.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'NURSE',
        language: 'ENGLISH',
        industry: 'HEALTHCARE',
        description: 'ICU nurse specialization template',
        sortOrder: 23,
      },
      // Doctor Templates
      {
        title: 'Medical Doctor',
        content: `Sayın Başhekim,

[COMPANY_NAME] hastanesindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Tıp alanındaki eğitimim ve klinik deneyimim ile hasta bakım kalitesinin artırılmasına katkı sağlayabileceğimi düşünüyorum.

Hasta muayenesi, tanı koyma, tedavi planlaması ve hasta takibi konularında deneyim sahibiyim. Modern tıbbi teknolojiler ve evidans-bazlı tıp uygulamaları konusunda da güncel bilgiye sahibim.

[WHY_POSITION]

Özellikle [WHY_COMPANY] misyonu benim mesleki değerlerimle örtüştüğü için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Multidisipliner ekip çalışması, hasta iletişimi ve sürekli mesleki gelişim konularında güçlü bir yaklaşıma sahibim.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'DOCTOR',
        language: 'TURKISH',
        industry: 'HEALTHCARE',
        description: 'Doktor pozisyonları için şablon',
        sortOrder: 24,
      },
      // Pharmacist Template
      {
        title: 'Pharmacist',
        content: `Dear Hiring Manager,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. As a licensed pharmacist with expertise in medication management and patient counseling, I am excited about the opportunity to contribute to your pharmacy team.

My experience includes prescription dispensing, drug interaction screening, immunization administration, and medication therapy management. I am knowledgeable about pharmaceutical regulations, insurance processing, and patient safety protocols.

[WHY_POSITION]

I am particularly attracted to [WHY_COMPANY] and believe my commitment to patient safety and pharmaceutical care would be valuable to your organization.

[ADDITIONAL_SKILLS]

I have excellent attention to detail, strong communication skills, and experience with pharmacy management systems. I also stay current with continuing education requirements and new pharmaceutical developments.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'PHARMACIST',
        language: 'ENGLISH',
        industry: 'HEALTHCARE',
        description: 'Pharmacist position template',
        sortOrder: 25,
      },
    ];
  }

  private getEducationTemplates(): any[] {
    return [
      // Teacher Templates
      {
        title: 'Elementary Teacher',
        content: `Dear Principal,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. As a passionate educator with experience in elementary education, I am committed to creating engaging learning environments that inspire young minds.

My background includes curriculum development, classroom management, differentiated instruction, and parent communication. I am skilled in technology integration, assessment strategies, and creating inclusive learning environments for diverse learners.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] and believe my dedication to student success would be valuable to your school community.

[ADDITIONAL_SKILLS]

I have strong organizational skills, creativity in lesson planning, and experience with special needs accommodation. I also participate actively in professional development and educational conferences.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'TEACHER',
        language: 'ENGLISH',
        industry: 'EDUCATION',
        description: 'Elementary teacher position template',
        sortOrder: 26,
      },
      {
        title: 'Öğretmen',
        content: `Sayın Okul Müdürü,

[COMPANY_NAME] okulundaki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Eğitim alanındaki tutkum ve öğrenci odaklı yaklaşımım ile okul topluluğunuza katkı sağlayabileceğimi düşünüyorum.

Müfredat geliştirme, sınıf yönetimi, farklılaştırılmış öğretim ve veli iletişimi konularında deneyim sahibiyim. Teknoloji entegrasyonu, değerlendirme stratejileri ve kapsayıcı öğrenme ortamları oluşturma konularında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

Özellikle [WHY_COMPANY] eğitim felsefesi benim değerlerimle uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Güçlü organizasyon becerilerim, ders planlamasındaki yaratıcılığım ve özel gereksinimli öğrencilerle çalışma deneyimim ile eğitim kalitenizin artırılmasına katkı sağlayabilirim.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'TEACHER',
        language: 'TURKISH',
        industry: 'EDUCATION',
        description: 'Öğretmen pozisyonları için şablon',
        sortOrder: 27,
      },
      // Academic Administrator Template
      {
        title: 'Academic Administrator',
        content: `Dear Search Committee,

I am writing to express my interest in the [POSITION_TITLE] position at [COMPANY_NAME]. With my background in educational leadership and academic administration, I am excited about the opportunity to contribute to your institution's mission.

My experience includes program development, faculty management, budget oversight, and strategic planning. I have worked on accreditation processes, curriculum design, and student success initiatives. I am also experienced in data analysis for educational improvement.

[WHY_POSITION]

I am particularly interested in [WHY_COMPANY] and believe my leadership experience would be valuable in advancing your educational goals.

[ADDITIONAL_SKILLS]

I have strong interpersonal skills, experience with educational technology systems, and a track record of successful team leadership. I also have experience in grant writing and community partnerships.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'ACADEMIC_ADMINISTRATOR',
        language: 'ENGLISH',
        industry: 'EDUCATION',
        description: 'Academic administrator template',
        sortOrder: 28,
      },
    ];
  }

  private getMarketingTemplates(): any[] {
    return [
      // Marketing Specialist Templates
      {
        title: 'Digital Marketing Specialist',
        content: `Dear Hiring Manager,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. As a digital marketing specialist with expertise in online campaigns and data-driven strategies, I am confident I can help drive your brand's digital presence.

My experience includes social media marketing, Google Ads management, SEO optimization, and email marketing campaigns. I am skilled in analytics tools like Google Analytics, Facebook Business Manager, and marketing automation platforms.

[WHY_POSITION]

I am particularly interested in [WHY_COMPANY] and believe my digital marketing expertise would be valuable in achieving your growth objectives.

[ADDITIONAL_SKILLS]

I have strong analytical skills, creativity in campaign development, and experience with A/B testing and conversion optimization. I also stay current with the latest digital marketing trends and platform updates.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'MARKETING_SPECIALIST',
        language: 'ENGLISH',
        industry: 'MARKETING',
        description: 'Digital marketing specialist template',
        sortOrder: 29,
      },
      {
        title: 'Content Marketing Manager',
        content: `Dear Hiring Team,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my passion for storytelling and expertise in content strategy, I am excited about the opportunity to build engaging brand narratives.

My background includes content strategy development, blog writing, video production, and social media content creation. I have experience with content management systems, SEO writing, and measuring content performance through various analytics tools.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] and believe my content creation skills would be valuable in strengthening your brand voice.

[ADDITIONAL_SKILLS]

I have excellent writing skills, creative vision, and experience with content calendar management. I also have knowledge of graphic design tools and basic video editing skills.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'MARKETING_SPECIALIST',
        language: 'ENGLISH',
        industry: 'MARKETING',
        description: 'Content marketing manager template',
        sortOrder: 30,
      },
    ];
  }
}