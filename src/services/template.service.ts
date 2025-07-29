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

export interface UserInfo {
  firstName: string;
  lastName: string;
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
    request: CreateCoverLetterFromTemplateRequest,
    userInfo: UserInfo
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
        .replace(/\[COMPANY_NAME\]/g, request.companyName)
        .replace(/\[İsim\]/g, `${userInfo.firstName} ${userInfo.lastName}`)
        .replace(/\[Name\]/g, `${userInfo.firstName} ${userInfo.lastName}`);

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

[COMPANY_NAME] bünyesindeki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Risk yönetimi alanındaki uzmanlığım ve analitik düşünce yapım ile şirketinizin risk profilinin değerlendirilmesi ve yönetilmesine katkı sağlayabileceğimi düşünüyorum.

Kredi riski, piyasa riski ve operasyonel risk analizi konularında deneyim sahibiyim. Statistiksel analiz araçları, Monte Carlo simülasyonları ve risk modelleme tekniklerini kullanma konusunda yetkinliğim bulunmaktadır.

[WHY_POSITION]

Özellikle [WHY_COMPANY] yaklaşımı benim profesyonel hedeflerimle uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Regulasyon uygunluğu, risk raporlaması ve portföy analizi konularındaki deneyimlerimle ekibinizin risk yönetimi kapasitesine katkı sağlayabilirim.

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
      // Doctor Templates
      {
        title: 'Pratisyen Hekim',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] sağlık kuruluşundaki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Tıp alanındaki eğitimim ve hasta bakımına olan tutkum ile kaliteli sağlık hizmeti sunma misyonunuza katkı sağlayabileceğimi düşünüyorum.

Tıp fakültesi mezunu olarak pratisyen hekimlik alanında tecrübe sahibiyim. Hasta muayenesi, tanı koyma ve tedavi planlaması konularında yetkinliğim bulunmaktadır. Ayrıca hasta iletişimi ve empati konularında da güçlüyüm.

[WHY_POSITION]

[WHY_COMPANY] Bu değerler benim meslek anlayışımla örtüştüğü için ekibinizin bir parçası olmak istiyorum.

[ADDITIONAL_SKILLS]

Sürekli öğrenmeye açık yaklaşımım, takım çalışmasına yatkınlığım ve hasta memnuniyeti odaklı çalışma tarzımla hizmet kalitenize katkı sağlayabilirim.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'DOCTOR',
        language: 'TURKISH',
        industry: 'HEALTHCARE',
        description: 'Pratisyen hekim pozisyonları için şablon',
        sortOrder: 21,
      },
      {
        title: 'Specialist Doctor',
        content: `Dear Hiring Manager,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my medical education and passion for patient care, I am confident I can contribute to your mission of providing high-quality healthcare services.

As a medical school graduate, I have experience in my specialty area with expertise in patient examination, diagnosis, and treatment planning. I also have strong skills in patient communication and empathy, which are essential for providing compassionate care.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] and believe these values align with my professional philosophy, making me eager to join your team.

[ADDITIONAL_SKILLS]

My commitment to continuous learning, teamwork orientation, and patient satisfaction-focused approach will contribute to your service quality.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'DOCTOR',
        language: 'ENGLISH',
        industry: 'HEALTHCARE',
        description: 'Specialist doctor position template',
        sortOrder: 22,
      },
      // Nurse Templates
      {
        title: 'Hemşire',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] sağlık kuruluşundaki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Hemşirelik alanındaki eğitimim ve hasta bakımına olan özveri ile kaliteli sağlık hizmeti sunma vizyonunuza destek olmak istiyorum.

Hemşirelik fakültesi mezunu olarak hasta bakımı, ilaç uygulaması ve tıbbi prosedürler konularında deneyim sahibiyim. Hasta güvenliği, enfeksiyon kontrolü ve hasta eğitimi alanlarında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

Özellikle [WHY_COMPANY] felsefesi benim değerlerimle uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Compassionate bakım yaklaşımım, dikkatli gözlem becerim ve acil durumlarda sakin kalabilme yeteneğimle hasta bakım kalitesine katkı sağlayabilirim.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'NURSE',
        language: 'TURKISH',
        industry: 'HEALTHCARE',
        description: 'Hemşire pozisyonları için şablon',
        sortOrder: 23,
      },
      {
        title: 'Registered Nurse',
        content: `Dear Hiring Team,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my nursing education and dedication to patient care, I want to support your vision of providing high-quality healthcare services.

As a nursing school graduate, I have experience in patient care, medication administration, and medical procedures. I also have expertise in patient safety, infection control, and patient education.

[WHY_POSITION]

I am particularly attracted to [WHY_COMPANY] philosophy as it aligns with my values, making me eager to work in this position.

[ADDITIONAL_SKILLS]

My compassionate care approach, careful observation skills, and ability to remain calm in emergency situations will contribute to the quality of patient care.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'NURSE',
        language: 'ENGLISH',
        industry: 'HEALTHCARE',
        description: 'Registered nurse position template',
        sortOrder: 24,
      },
      // Healthcare Administrator Templates
      {
        title: 'Sağlık Yöneticisi',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] sağlık kuruluşundaki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Sağlık yönetimi alanındaki eğitimim ve operasyonel yönetim deneyimim ile kuruluşunuzun verimli işleyişine katkı sağlayabileceğimi düşünüyorum.

Sağlık kurumlarında operasyonel yönetim, kalite kontrol ve süreç optimizasyonu konularında deneyim sahibiyim. Hasta memnuniyeti, maliyet kontrolü ve personel yönetimi alanlarında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

[WHY_COMPANY] Bu vizyon benim profesyonel hedeflerimle uyumlu olduğu için ekibinizin bir parçası olmak istiyorum.

[ADDITIONAL_SKILLS]

Stratejik planlama, proje yönetimi ve liderlik becerilerimle kuruluşunuzun büyüme hedeflerine destek olabilirim.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'HEALTHCARE_ADMINISTRATOR',
        language: 'TURKISH',
        industry: 'HEALTHCARE',
        description: 'Sağlık yöneticisi pozisyonları için şablon',
        sortOrder: 25,
      },
      {
        title: 'Healthcare Administrator',
        content: `Dear Hiring Manager,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my education in healthcare management and operational management experience, I believe I can contribute to the efficient operation of your organization.

I have experience in operational management, quality control, and process optimization in healthcare institutions. I also have expertise in patient satisfaction, cost control, and personnel management.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] vision as it aligns with my professional goals, making me eager to be part of your team.

[ADDITIONAL_SKILLS]

With my strategic planning, project management, and leadership skills, I can support your organization's growth objectives.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'HEALTHCARE_ADMINISTRATOR',
        language: 'ENGLISH',
        industry: 'HEALTHCARE',
        description: 'Healthcare administrator position template',
        sortOrder: 26,
      },
      // Pharmacist Templates
      {
        title: 'Eczacı',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] eczane/sağlık kuruluşundaki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Eczacılık alanındaki eğitimim ve ilaç bilgim ile hasta sağlığına katkı sağlayacak kaliteli hizmet sunmaya odaklanmak istiyorum.

Eczacılık fakültesi mezunu olarak ilaç hazırlama, hasta danışmanlığı ve ilaç etkileşimleri konularında deneyim sahibiyim. Farmakokinetik, farmakodi namik ve klinik eczacılık alanlarında da bilgiye sahibim.

[WHY_POSITION]

Özellikle [WHY_COMPANY] yaklaşımı benim meslek etiğimle uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Hasta iletişimi, dikkatli çalışma alışkanlığım ve sürekli öğrenme konusundaki tutkumla hizmet kalitenize değer katacağımı düşünüyorum.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'PHARMACIST',
        language: 'TURKISH',
        industry: 'HEALTHCARE',
        description: 'Eczacı pozisyonları için şablon',
        sortOrder: 27,
      },
      {
        title: 'Clinical Pharmacist',
        content: `Dear Hiring Team,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my pharmacy education and drug knowledge, I want to focus on providing quality service that contributes to patient health.

As a pharmacy school graduate, I have experience in drug preparation, patient counseling, and drug interactions. I also have knowledge in pharmacokinetics, pharmacodynamics, and clinical pharmacy.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] approach as it aligns with my professional ethics, making me eager to work in this position.

[ADDITIONAL_SKILLS]

With my patient communication skills, meticulous work habits, and passion for continuous learning, I believe I can add value to your service quality.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'PHARMACIST',
        language: 'ENGLISH',
        industry: 'HEALTHCARE',
        description: 'Clinical pharmacist position template',
        sortOrder: 28,
      },
    ];
  }

  private getEducationTemplates(): any[] {
    return [
      // Teacher Templates
      {
        title: 'Öğretmen',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] eğitim kurumundaki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Eğitim alanındaki tutkum ve öğrenci gelişimine olan inancım ile kuruluşunuzun eğitim misyonuna katkı sağlayabileceğimi düşünüyorum.

Eğitim fakültesi mezunu olarak sınıf yönetimi, ders planlaması ve öğrenci değerlendirmesi konularında deneyim sahibiyim. Modern öğretim yöntemleri, teknoloji entegrasyonu ve bireysel öğrenme yaklaşımları konularında da bilgiye sahibim.

[WHY_POSITION]

[WHY_COMPANY] Bu vizyon benim eğitim felsefemle uyumlu olduğu için ekibinizin bir parçası olmak istiyorum.

[ADDITIONAL_SKILLS]

Yaratıcı öğretim yaklaşımlarım, sabırlı ve anlayışlı kişiliğim ve sürekli gelişime açık olmam ile öğrenci başarısına katkı sağlayabilirim.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'TEACHER',
        language: 'TURKISH',
        industry: 'EDUCATION',
        description: 'Öğretmen pozisyonları için şablon',
        sortOrder: 29,
      },
      {
        title: 'Elementary Teacher',
        content: `Dear Hiring Manager,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my passion for education and belief in student development, I believe I can contribute to your institution's educational mission.

As an education school graduate, I have experience in classroom management, lesson planning, and student assessment. I also have knowledge in modern teaching methods, technology integration, and individualized learning approaches.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] vision as it aligns with my educational philosophy, making me eager to be part of your team.

[ADDITIONAL_SKILLS]

With my creative teaching approaches, patient and understanding personality, and openness to continuous improvement, I can contribute to student success.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'TEACHER',
        language: 'ENGLISH',
        industry: 'EDUCATION',
        description: 'Elementary teacher position template',
        sortOrder: 30,
      },
      // Academic Researcher Templates
      {
        title: 'Akademik Araştırmacı',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] üniversitesi/araştırma kurumundaki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Akademik araştırma alanındaki deneyimim ve bilimsel yayınlarım ile kuruluşunuzun araştırma kapasitesine katkı sağlayabileceğimi düşünüyorum.

Doktora derecesi ve post-doc deneyimim ile birlikte, bilimsel makale yazımı, araştırma projesi yönetimi ve veri analizi konularında yetkinliğim bulunmaktadır. Ulusal ve uluslararası konferanslarda sunum yapma deneyimim de mevcuttur.

[WHY_POSITION]

Özellikle [WHY_COMPANY] araştırma yaklaşımı benim akademik hedeflerimle uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Interdisipliner çalışma kabiliyetim, proje finansmanı elde etme deneyimim ve genç araştırmacıları mentörlük etme becerimle akademik topluluğunuza değer katacağımı düşünüyorum.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'ACADEMIC_RESEARCHER',
        language: 'TURKISH',
        industry: 'EDUCATION',
        description: 'Akademik araştırmacı pozisyonları için şablon',
        sortOrder: 31,
      },
      {
        title: 'Research Scientist',
        content: `Dear Hiring Team,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME] university/research institution. With my experience in academic research and scientific publications, I believe I can contribute to your organization's research capacity.

With my PhD degree and post-doc experience, I have expertise in scientific writing, research project management, and data analysis. I also have experience presenting at national and international conferences.

[WHY_POSITION]

I am particularly attracted to [WHY_COMPANY] research approach as it aligns with my academic goals, making me eager to work in this position.

[ADDITIONAL_SKILLS]

With my interdisciplinary work ability, experience in obtaining project funding, and skill in mentoring young researchers, I believe I can add value to your academic community.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'ACADEMIC_RESEARCHER',
        language: 'ENGLISH',
        industry: 'EDUCATION',
        description: 'Research scientist position template',
        sortOrder: 32,
      },
      // Education Administrator Templates
      {
        title: 'Eğitim Yöneticisi',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] eğitim kurumundaki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Eğitim yönetimi alanındaki deneyimim ve liderlik becerilerim ile kuruluşunuzun eğitim kalitesinin artırılmasına katkı sağlayabileceğimi düşünüyorum.

Eğitim kurumlarında operasyonel yönetim, müfredat geliştirme ve öğretmen koordinasyonu konularında deneyim sahibiyim. Eğitim planlaması, kalite güvencesi ve paydaş yönetimi alanlarında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

[WHY_COMPANY] Bu misyon benim eğitim vizyonumla uyumlu olduğu için ekibinizin bir parçası olmak istiyorum.

[ADDITIONAL_SKILLS]

Stratejik düşünme kabiliyetim, ekip yönetimi becerim ve eğitim kalitesi odaklı yaklaşımımla kuruluşunuzun hedeflerine destek olabilirim.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'EDUCATION_ADMINISTRATOR',
        language: 'TURKISH',
        industry: 'EDUCATION',
        description: 'Eğitim yöneticisi pozisyonları için şablon',
        sortOrder: 33,
      },
      {
        title: 'Education Administrator',
        content: `Dear Hiring Manager,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME] educational institution. With my experience in education management and leadership skills, I believe I can contribute to improving the educational quality of your organization.

I have experience in operational management, curriculum development, and teacher coordination in educational institutions. I also have expertise in education planning, quality assurance, and stakeholder management.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] mission as it aligns with my educational vision, making me eager to be part of your team.

[ADDITIONAL_SKILLS]

With my strategic thinking ability, team management skills, and education quality-focused approach, I can support your organization's objectives.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'EDUCATION_ADMINISTRATOR',
        language: 'ENGLISH',
        industry: 'EDUCATION',
        description: 'Education administrator position template',
        sortOrder: 34,
      },
      // School Counselor Templates
      {
        title: 'Okul Danışmanı',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] eğitim kurumundaki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Rehberlik ve psikolojik danışmanlık alanındaki eğitimim ve öğrenci gelişimine olan tutkum ile öğrencilerinizin akademik ve kişisel gelişimlerine destek olmak istiyorum.

Psikolojik danışmanlık ve rehberlik alanında lisans/yüksek lisans derecesi ile birlikte, öğrenci danışmanlığı, kriz müdahalesi ve grup çalışmaları konularında deneyim sahibiyim. Aile danışmanlığı ve kariyer rehberliği alanlarında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

Özellikle [WHY_COMPANY] felsefesi benim değerlerimle uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Empati yeteneğim, dinleme becerim ve çözüm odaklı yaklaşımımla öğrenci memnuniyeti ve başarısına katkı sağlayabilirim.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'SCHOOL_COUNSELOR',
        language: 'TURKISH',
        industry: 'EDUCATION',
        description: 'Okul danışmanı pozisyonları için şablon',
        sortOrder: 35,
      },
      {
        title: 'School Counselor',
        content: `Dear Hiring Team,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME] educational institution. With my education in guidance and psychological counseling and passion for student development, I want to support your students' academic and personal growth.

With my bachelor's/master's degree in psychological counseling and guidance, I have experience in student counseling, crisis intervention, and group work. I also have expertise in family counseling and career guidance.

[WHY_POSITION]

I am particularly attracted to [WHY_COMPANY] philosophy as it aligns with my values, making me eager to work in this position.

[ADDITIONAL_SKILLS]

With my empathy ability, listening skills, and solution-focused approach, I can contribute to student satisfaction and success.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'SCHOOL_COUNSELOR',
        language: 'ENGLISH',
        industry: 'EDUCATION',
        description: 'School counselor position template',
        sortOrder: 36,
      },
    ];
  }

  private getMarketingTemplates(): any[] {
    return [
      // Marketing Manager Templates
      {
        title: 'Pazarlama Müdürü',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Pazarlama alanındaki deneyimim ve stratejik düşünce yapım ile marka bilinirliğinizin artırılması ve satış hedeflerinize ulaşılmasına katkı sağlayabileceğimi düşünüyorum.

Pazarlama stratejisi geliştirme, marka yönetimi ve dijital pazarlama konularında 5+ yıllık deneyimim bulunmaktadır. Sosyal medya pazarlaması, içerik üretimi ve kampanya yönetimi alanlarında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

[WHY_COMPANY] Bu vizyon benim profesyonel hedeflerimle uyumlu olduğu için ekibinizin bir parçası olmak istiyorum.

[ADDITIONAL_SKILLS]

Yaratıcı problem çözme becerilerim, analitik düşünce yapım ve takım liderliği deneyimimle pazarlama departmanınızın başarısına katkı sağlayabilirim.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'MARKETING_MANAGER',
        language: 'TURKISH',
        industry: 'MARKETING',
        description: 'Pazarlama müdürü pozisyonları için şablon',
        sortOrder: 37,
      },
      {
        title: 'Marketing Manager',
        content: `Dear Hiring Manager,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my experience in marketing and strategic thinking, I believe I can contribute to increasing your brand awareness and achieving your sales targets.

I have 5+ years of experience in developing marketing strategies, brand management, and digital marketing. I also have expertise in social media marketing, content creation, and campaign management.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] vision as it aligns with my professional goals, making me eager to be part of your team.

[ADDITIONAL_SKILLS]

With my creative problem-solving skills, analytical thinking, and team leadership experience, I can contribute to the success of your marketing department.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'MARKETING_MANAGER',
        language: 'ENGLISH',
        industry: 'MARKETING',
        description: 'Marketing manager position template',
        sortOrder: 38,
      },
      // Digital Marketing Specialist Templates
      {
        title: 'Dijital Pazarlama Uzmanı',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Dijital pazarlama alanındaki uzmanlığım ve online platformlardaki deneyimim ile dijital varlığınızın güçlendirilmesine katkı sağlayabileceğimi düşünüyorum.

Google Ads, Facebook Ads, SEO/SEM ve e-mail marketing konularında deneyim sahibiyim. Web analitik araçları, sosyal medya yönetimi ve içerik pazarlaması alanlarında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

Özellikle [WHY_COMPANY] dijital dönüşüm yaklaşımı benim uzmanlık alanımla uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

Veri odaklı karar alma becerim, yaratıcı kampanya tasarlama yeteneğim ve sürekli öğrenme konusundaki tutkumla dijital pazarlama stratejilerinize değer katacağımı düşünüyorum.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'DIGITAL_MARKETING_SPECIALIST',
        language: 'TURKISH',
        industry: 'MARKETING',
        description: 'Dijital pazarlama uzmanı pozisyonları için şablon',
        sortOrder: 39,
      },
      {
        title: 'Digital Marketing Specialist',
        content: `Dear Hiring Team,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my expertise in digital marketing and experience on online platforms, I believe I can contribute to strengthening your digital presence.

I have experience in Google Ads, Facebook Ads, SEO/SEM, and email marketing. I also have expertise in web analytics tools, social media management, and content marketing.

[WHY_POSITION]

I am particularly attracted to [WHY_COMPANY] digital transformation approach as it aligns with my area of expertise, making me eager to work in this position.

[ADDITIONAL_SKILLS]

With my data-driven decision-making skills, creative campaign design ability, and passion for continuous learning, I believe I can add value to your digital marketing strategies.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'DIGITAL_MARKETING_SPECIALIST',
        language: 'ENGLISH',
        industry: 'MARKETING',
        description: 'Digital marketing specialist position template',
        sortOrder: 40,
      },
      // Content Creator Templates
      {
        title: 'İçerik Üreticisi',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Yaratıcı yazım becerilerim ve içerik üretimi konusundaki deneyimim ile marka hikayelendirmenize ve hedef kitlenizle güçlü bağlar kurmanıza katkı sağlayabileceğimi düşünüyorum.

Blog yazımı, sosyal medya içeriği, video script yazımı ve SEO odaklı içerik üretimi konularında deneyim sahibiyim. Görsel tasarım araçları, video editing ve sosyal medya yönetimi alanlarında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

[WHY_COMPANY] Bu yaratıcı vizyon benim içerik üretim yaklaşımımla uyumlu olduğu için ekibinizin bir parçası olmak istiyorum.

[ADDITIONAL_SKILLS]

Yaratıcı düşünce yapım, trend takibi kabiliyetim ve engagement odaklı içerik üretme becerimle marka iletişiminize değer katacağımı düşünüyorum.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'CONTENT_CREATOR',
        language: 'TURKISH',
        industry: 'MARKETING',
        description: 'İçerik üreticisi pozisyonları için şablon',
        sortOrder: 41,
      },
      {
        title: 'Content Creator',
        content: `Dear Hiring Manager,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my creative writing skills and experience in content creation, I believe I can contribute to your brand storytelling and building strong connections with your target audience.

I have experience in blog writing, social media content, video script writing, and SEO-focused content creation. I also have expertise in visual design tools, video editing, and social media management.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] creative vision as it aligns with my content creation approach, making me eager to be part of your team.

[ADDITIONAL_SKILLS]

With my creative thinking, trend-following ability, and engagement-focused content creation skills, I believe I can add value to your brand communication.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'CONTENT_CREATOR',
        language: 'ENGLISH',
        industry: 'MARKETING',
        description: 'Content creator position template',
        sortOrder: 42,
      },
      // Social Media Manager Templates
      {
        title: 'Sosyal Medya Uzmanı',
        content: `Sayın İnsan Kaynakları Ekibi,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunmak istiyorum. Sosyal medya platformlarındaki deneyimim ve topluluk yönetimi konusundaki becerilerim ile online varlığınızın güçlendirilmesine katkı sağlayabileceğimi düşünüyorum.

Instagram, Facebook, Twitter, LinkedIn ve TikTok platformlarında içerik yönetimi ve topluluk moderasyonu konularında deneyim sahibiyim. Sosyal medya analitik araçları, influencer marketing ve sosyal medya reklamcılığı alanlarında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

Özellikle [WHY_COMPANY] sosyal medya stratejisi benim deneyim alanımla uyumlu olduğu için bu pozisyonda çalışmak istiyorum.

[ADDITIONAL_SKILLS]

İletişim becerilerim, crisis management yeteneğim ve topluluk oluşturma konusundaki başarımla marka imajınıza pozitif katkı sağlayabilirim.

Değerlendirmeniz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'SOCIAL_MEDIA_MANAGER',
        language: 'TURKISH',
        industry: 'MARKETING',
        description: 'Sosyal medya uzmanı pozisyonları için şablon',
        sortOrder: 43,
      },
      {
        title: 'Social Media Manager',
        content: `Dear Hiring Team,

I am excited to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my experience on social media platforms and community management skills, I believe I can contribute to strengthening your online presence.

I have experience in content management and community moderation on Instagram, Facebook, Twitter, LinkedIn, and TikTok platforms. I also have expertise in social media analytics tools, influencer marketing, and social media advertising.

[WHY_POSITION]

I am particularly attracted to [WHY_COMPANY] social media strategy as it aligns with my area of experience, making me eager to work in this position.

[ADDITIONAL_SKILLS]

With my communication skills, crisis management ability, and success in community building, I can make a positive contribution to your brand image.

Thank you for considering my application.

Best regards,
[Name]`,
        category: 'SOCIAL_MEDIA_MANAGER',
        language: 'ENGLISH',
        industry: 'MARKETING',
        description: 'Social media manager position template',
        sortOrder: 44,
      },
      // Brand Manager Templates
      {
        title: 'Marka Müdürü',
        content: `Sayın İnsan Kaynakları Müdürü,

[COMPANY_NAME] şirketindeki [POSITION_TITLE] pozisyonu için başvuruda bulunuyorum. Marka yönetimi alanındaki deneyimim ve stratejik pazarlama bilgim ile marka değerinizin artırılması ve pazar konumunuzun güçlendirilmesine katkı sağlayabileceğimi düşünüyorum.

Marka stratejisi geliştirme, pazarlama iletişimi ve marka kimlik yönetimi konularında deneyim sahibiyim. Pazar araştırması, rekabet analizi ve marka performans ölçümü alanlarında da yetkinliğim bulunmaktadır.

[WHY_POSITION]

[WHY_COMPANY] Bu vizyon benim marka yönetimi felsefemle uyumlu olduğu için ekibinizin bir parçası olmak istiyorum.

[ADDITIONAL_SKILLS]

Stratejik düşünce yapım, yaratıcı problem çözme becerim ve marka odaklı yaklaşımımla şirketinizin uzun vadeli hedeflerine destek olabilirim.

İlginiz için teşekkür ederim.

Saygılarımla,
[İsim]`,
        category: 'BRAND_MANAGER',
        language: 'TURKISH',
        industry: 'MARKETING',
        description: 'Marka müdürü pozisyonları için şablon',
        sortOrder: 45,
      },
      {
        title: 'Brand Manager',
        content: `Dear Hiring Manager,

I am writing to apply for the [POSITION_TITLE] position at [COMPANY_NAME]. With my experience in brand management and strategic marketing knowledge, I believe I can contribute to increasing your brand value and strengthening your market position.

I have experience in developing brand strategies, marketing communications, and brand identity management. I also have expertise in market research, competitive analysis, and brand performance measurement.

[WHY_POSITION]

I am particularly drawn to [WHY_COMPANY] vision as it aligns with my brand management philosophy, making me eager to be part of your team.

[ADDITIONAL_SKILLS]

With my strategic thinking, creative problem-solving skills, and brand-focused approach, I can support your company's long-term objectives.

Thank you for your consideration.

Best regards,
[Name]`,
        category: 'BRAND_MANAGER',
        language: 'ENGLISH',
        industry: 'MARKETING',
        description: 'Brand manager position template',
        sortOrder: 46,
      },
    ];
  }
}