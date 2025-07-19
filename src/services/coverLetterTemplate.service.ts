import { db } from './database.service';

export interface CoverLetterTemplate {
  id: string;
  category: string;
  title: string;
  content: string;
  placeholders: string[];
  isActive: boolean;
}

export interface GenerateCoverLetterData {
  templateId: string;
  companyName: string;
  positionTitle: string;
  applicantName: string;
  applicantEmail: string;
  contactPerson?: string;
  specificSkills?: string[];
  additionalInfo?: string;
}

export class CoverLetterTemplateService {
  private static instance: CoverLetterTemplateService;

  public static getInstance(): CoverLetterTemplateService {
    if (!CoverLetterTemplateService.instance) {
      CoverLetterTemplateService.instance = new CoverLetterTemplateService();
    }
    return CoverLetterTemplateService.instance;
  }

  public async initializeTemplates(): Promise<void> {
    const existingTemplates = await db.coverLetterTemplate.count();

    if (existingTemplates === 0) {
      await this.seedTemplates();
    }
  }

  private async seedTemplates(): Promise<void> {
    const templates = [
      {
        category: 'WEB_DEVELOPER',
        title: 'Web Developer Pozisyonu',
        content: `Sayın {{contactPerson}},

{{companyName}} şirketindeki {{positionTitle}} pozisyonuna olan ilgimi belirtmek ve başvurumu sunmak istiyorum. {{experienceYears}} yıllık yazılım geliştirme deneyimim ve {{primaryTechnology}} ekosistemindeki derin bilgim ile takımınıza değerli katkılar sağlayabileceğime inanıyorum.

Mevcut pozisyonumda {{currentCompany}}'de {{currentRole}} olarak çalışırken, {{primaryTechnology}} ve {{secondaryTechnology}} kullanarak kurumsal seviyede web uygulamaları geliştirdim. Özellikle {{specialization}} konularında elde ettiğim başarılar, {{companyName}}'ın inovatif projelerine uygun bir profil sergilediğimi göstermektedir. {{technicalSkills}} deneyimlerim, kod kalitesi ve sürdürülebilirlik açısından takımınıza katkı sağlayacaktır.

{{companyName}}'ın teknoloji sektöründeki yenilikçi yaklaşımı ve modern web teknolojilerine olan odağı, kariyer hedeflerimle mükemmel bir uyum göstermektedir. Takım çalışmasına yatkınlığım, problem çözme becerilerim ve sürekli öğrenme motivasyonum ile şirketinizin başarısına katkıda bulunmak için sabırsızlanıyorum.

Görüşme imkanı verebilirseniz çok memnun olurum. Vaktinizi ayırdığınız için teşekkür ederim.

Saygılarımla,
{{applicantName}}
{{applicantEmail}}`,
        placeholders: [
          'contactPerson',
          'companyName',
          'positionTitle',
          'experienceYears',
          'primaryTechnology',
          'currentCompany',
          'currentRole',
          'secondaryTechnology',
          'specialization',
          'technicalSkills',
          'applicantName',
          'applicantEmail',
        ],
      },
      {
        category: 'ACCOUNT_EXECUTIVE',
        title: 'Account Executive Pozisyonu',
        content: `Sayın {{contactPerson}},

{{companyName}} şirketindeki {{positionTitle}} pozisyonuna başvurmak istiyorum. {{experienceYears}} yıllık {{industryType}} sektöründe satış deneyimim ve kanıtlanmış başarılarım ile şirketinizin satış hedeflerine ulaşmasında stratejik katkılar sağlayabilirim.

Mevcut pozisyonumda {{currentCompany}}'de {{currentRole}} olarak çalışırken, {{achievement}} başarısını elde ettim ve {{clientManagement}} konularında uzmanlaştım. {{salesSkills}} deneyimim, {{companyName}}'ın müşteri portföyünü büyütmek için ideal bir background sunmaktadır. {{specificResults}} ile şirketinizin satış operasyonlarını güçlendirmek için hazır bulunuyorum.

{{companyName}}'ın {{industryType}} sektöründeki güçlü konumu ve büyüme odaklı stratejisi, satış kariyerimde yeni bir aşamaya geçmek için ideal bir fırsat sunmaktadır. {{personalStrengths}} ile şirketinizin satış hedeflerini aşmanıza yardımcı olmak istiyorum.

Katkılarımı detaylarıyla paylaşabileceğim bir görüşme fırsatı için sabırsızlanıyorum. İlginiz için teşekkür ederim.

Saygılarımla,
{{applicantName}}
{{applicantEmail}}`,
        placeholders: [
          'contactPerson',
          'companyName',
          'positionTitle',
          'experienceYears',
          'industryType',
          'currentCompany',
          'currentRole',
          'achievement',
          'clientManagement',
          'salesSkills',
          'specificResults',
          'personalStrengths',
          'applicantName',
          'applicantEmail',
        ],
      },
      {
        category: 'ACCOUNT_MANAGER',
        title: 'Account Manager Pozisyonu',
        content: `Sayın İnsan Kaynakları Uzmanı,

{{companyName}} şirketindeki {{positionTitle}} pozisyonuna olan ilgimi ve niteliklerimi belirtmek için yazıyorum. {{experienceYears}} yıllık account management deneyimim ve {{totalExperience}} yıllık genel satış deneyimim ile müşteri ilişkileri oluşturma ve {{industryFocus}} sektöründe müşterilerle çalışma konusunda heyecanlıyım.

Account management ve satış alanındaki deneyimim, iletişim, müzakere ve problem çözme becerileri aracılığıyla kişiler arası ilişkiler kurma ve sürdürme konusunda bana beceri ve deneyim sağladı. Son şirketimde {{clientPortfolio}} müşteri hesabı portföyünü yönettim ve geçen yıl {{retentionRate}} müşteri tutma oranı elde ettim, bakımım altındaki müşterilerden {{feedbackScore}} olumlu geri bildirim aldım.

{{companyName}}'deki Account Manager rolünün gerekliliklerini karşılama ve aşma becerim konusundaki deneyimim ve tutkum beni bu pozisyon için güçlü bir aday yapıyor. Sahada geçirdiğim süre hakkında ek bilgi sağlamak için sizinle görüşmeyi dört gözle bekliyorum. Pazartesi'den Cumartesi'ye kadar {{phoneNumber}} numarasından bana ulaşabilirsiniz.

Saygılarımla,
{{applicantName}}`,
        placeholders: [
          'companyName',
          'positionTitle',
          'experienceYears',
          'totalExperience',
          'industryFocus',
          'clientPortfolio',
          'retentionRate',
          'feedbackScore',
          'phoneNumber',
          'applicantName',
        ],
      },
      {
        category: 'ACCOUNTING_MANAGER',
        title: 'Accounting Manager Pozisyonu',
        content: `Sayın İnsan Kaynakları Uzmanı,

Adım {{applicantName}} ve {{companyName}} şirketindeki {{positionTitle}} pozisyonuna olan ilgimi belirtmek istiyorum. Mali kayıtları tutma konusunda {{experienceYears}} yıllık deneyime sahip kendini adamış bir muhasebe profesyoneli olarak, uyumluluk, detaylara dikkat ve problem çözme becerilerimin bu pozisyon için mükemmel bir aday olduğuma inanıyorum. Her zaman sayılarla takıntılı oldum ve uzmanlığımı organizasyonunuza katkıda bulunmak için kullanmak istiyorum.

Kariyerimin büyük bir kısmını kurumsal muhasebe yaparak ve {{standards}} standartlarına uyarak geçirdim. Ayrıca eleştirel düşünme, problem çözme ve ne kadar büyük olursa olsun zorlukların üstesinden gelme konusunda oldukça yetkinim. Örneğin, işe başladıktan sonra {{previousCompany}} için rutin bir iç denetim yaparken, mevzuat uyumluluğunda önemli bir tutarsızlık fark ettim. Şirketin varlıklarını ve çıkarlarını korumak için derhal şirketin yönetici ekibini bilgilendirdim ve bir çözüm önerdim.

Muhasebenin teknik yönlerine ek olarak, kişiler arası iletişimde de başarılıyım. {{currentCompany}}'deki mevcut Account Manager rolümde, {{teamSize}} genç muhasebe profesyonelinden oluşan bir ekibi eğitiyorum, danışmanlık yapıyorum ve yönlendiriyorum. Bu sürede, personele yararlı kaynaklar ve destek sağlamak ve şirket politikalarına ve prosedürlerine uymalarını sağlamak için {{trainingPrograms}} yeni eğitim girişimi tasarlayıp uyguladım.

Alandaki resmi eğitimim ve deneyimim, liderlik ve dürüstlüğe olan bağlılığımla birleşerek, {{companyName}}'a büyük bir varlık olabileceğime inanıyorum. Muhasebe uzmanlığımı kullanarak yöneticilere ve organizasyonunuzdaki diğer kilit paydaşlara değerli rehberlik sağlamaktan onur duyarım. Herhangi bir sorunuz varsa lütfen benimle iletişime geçmekten çekinmeyin. Sizden haber almayı dört gözle bekliyorum. Vaktinizi ayırdığınız ve değerlendirmeniz için teşekkür ederim.

Saygılarımla,
{{applicantName}}`,
        placeholders: [
          'applicantName',
          'companyName',
          'positionTitle',
          'experienceYears',
          'standards',
          'previousCompany',
          'currentCompany',
          'teamSize',
          'trainingPrograms',
        ],
      },
      {
        category: 'DATA_ANALYST',
        title: 'Data Analyst Pozisyonu',
        content: `Sayın İnsan Kaynakları Uzmanı,

{{companyName}} şirketindeki {{positionTitle}} rolü için bu başvuruyu sunmaktan heyecan duyuyorum. Eğitimim, becerilerim ve {{positionType}} olarak deneyimlerimin kombinasyonunun organizasyona önemli bir fayda sağlayabileceğine ve bu rol için mükemmel bir uyum olabileceğime inanıyorum.

Son {{experienceYears}} yılda {{currentCompany}}'de {{positionType}} olarak çalışarak, bu organizasyonda kalıcı bir miras bıraktım. İlk olarak, veri toplama ve analiz programlarını güncelledim, bu da verileri daha verimli işlemelerine olanak sağladı. Bu, tahminlerinin genel doğruluğunu {{accuracyImprovement}} artırdı. Daha sonra, {{dataProcessing}} miktarını işleyebilecek nitelikli {{positionType}} ekibi bulmalarına yardımcı oldum.

{{currentCompany}}'deki zamanımdan önce, {{education}} alanında {{degree}} derecemi aldım, bu da verilere bakma, kalıplarını bulma ve çalışmalarımda ve erken kariyerimde başarılı olma becerilerini verdi. Bunlar organizasyonunuza getirmek istediğim beceriler, rakiplerinizden daha hızlı veri analizi yaparak ve tahminlerinizin doğruluğunu artırarak misyonunuza yardımcı olmak.

Başvuru materyallerimi değerlendirdiğiniz için teşekkür ederim. Yakında sizinle bir görüşme planlamaktan memnuniyet duyarım.

Saygılarımla,
{{applicantName}}`,
        placeholders: [
          'companyName',
          'positionTitle',
          'positionType',
          'experienceYears',
          'currentCompany',
          'accuracyImprovement',
          'dataProcessing',
          'education',
          'degree',
          'applicantName',
        ],
      },
      {
        category: 'PROJECT_MANAGER',
        title: 'Project Manager Pozisyonu',
        content: `Sayın Yetkili,

{{companyName}} şirketindeki {{positionTitle}} pozisyonuna olan ilgimi belirtmek ve başvurumu sunmak istiyorum. Teknoloji projelerinde edindiğim deneyimler ve proje yönetimi metodolojilerindeki yetkinliklerim ile şirketinizin başarılı proje teslimatlarına katkıda bulunabilirim.

Önceki deneyimlerimde {{methodologies}} metodolojilerini kullanarak çapraz fonksiyonel takımları yönettim ve karmaşık {{projectType}} projelerini zamanında ve bütçe dahilinde teslim ettim. {{managementSkills}} konularındaki becerilerim, {{companyName}}'in hızla gelişen proje portföyünü etkin bir şekilde yönetmeme imkan sağlayacaktır.

{{companyName}}'in {{companyFocus}} yaklaşımı ve {{industrySector}} sektöründeki öncü konumu, proje yönetimi kariyerimde yeni zorluklar aramanın ideal zemini olarak görüyorum. {{personalStrengths}} konularındaki deneyimlerimle şirketinizin {{companyGoals}} hedeflerine destek olmak istiyorum.

Deneyimlerimi ve vizyonumu paylaşabileceğim bir görüşme imkanı için teşekkür ederim.

Saygılarımla,
{{applicantName}}
{{applicantEmail}}`,
        placeholders: [
          'companyName',
          'positionTitle',
          'methodologies',
          'projectType',
          'managementSkills',
          'companyFocus',
          'industrySector',
          'personalStrengths',
          'companyGoals',
          'applicantName',
          'applicantEmail',
        ],
      },
    ];

    for (const template of templates) {
      await db.coverLetterTemplate.create({
        data: {
          ...template,
          isActive: true,
        },
      });
    }
  }

  public async getAllTemplates(): Promise<CoverLetterTemplate[]> {
    return await db.coverLetterTemplate.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });
  }

  public async getTemplateById(
    id: string
  ): Promise<CoverLetterTemplate | null> {
    return await db.coverLetterTemplate.findUnique({
      where: { id, isActive: true },
    });
  }

  public async getTemplatesByCategory(
    category: string
  ): Promise<CoverLetterTemplate[]> {
    return await db.coverLetterTemplate.findMany({
      where: { category, isActive: true },
      orderBy: { title: 'asc' },
    });
  }

  public generateCoverLetter(
    template: CoverLetterTemplate,
    data: GenerateCoverLetterData
  ): string {
    let content = template.content;

    // Temel placeholder'ları doldur
    content = content.replace(/\{\{companyName\}\}/g, data.companyName);
    content = content.replace(/\{\{positionTitle\}\}/g, data.positionTitle);
    content = content.replace(/\{\{applicantName\}\}/g, data.applicantName);
    content = content.replace(/\{\{applicantEmail\}\}/g, data.applicantEmail);

    if (data.contactPerson) {
      content = content.replace(/\{\{contactPerson\}\}/g, data.contactPerson);
    } else {
      content = content.replace(
        /\{\{contactPerson\}\}/g,
        'İnsan Kaynakları Uzmanı'
      );
    }

    // Diğer boş placeholder'ları varsayılan değerlerle doldur
    content = this.fillDefaultPlaceholders(content, data);

    return content;
  }

  private fillDefaultPlaceholders(
    content: string,
    data: GenerateCoverLetterData
  ): string {
    const defaultValues: Record<string, string> = {
      experienceYears: '5',
      primaryTechnology: 'React',
      secondaryTechnology: 'Node.js',
      currentCompany: 'mevcut şirketimde',
      currentRole: 'Senior Developer',
      specialization:
        'kullanıcı deneyimi optimizasyonu ve performans iyileştirme',
      technicalSkills: 'Modern web teknolojileri ve best practices',
      industryType: 'teknoloji',
      achievement: '%35 ROI artışı',
      clientManagement: 'müşteri ilişkileri yönetimi',
      salesSkills: 'Satış stratejileri ve müzakere',
      specificResults: 'Kanıtlanmış satış başarıları',
      personalStrengths:
        'Analitik düşünce yapım, yaratıcı çözümler ve sürekli öğrenme motivasyonum',
      totalExperience: '8',
      industryFocus: 'B2B teknoloji',
      clientPortfolio: '20',
      retentionRate: '%85',
      feedbackScore: '%92',
      phoneNumber: 'iletişim bilgilerimden',
      standards: 'GAAP ve sektör',
      previousCompany: 'önceki şirketimde',
      teamSize: '10',
      trainingPrograms: '23',
      positionType: 'Analyst',
      accuracyImprovement: '%30',
      dataProcessing: 'büyük veri setlerini',
      education: 'veri bilimi',
      degree: 'Lisans',
      methodologies: 'Agile ve Scrum',
      projectType: 'yazılım geliştirme',
      managementSkills:
        'Stakeholder yönetimi, risk analizi ve süreç optimizasyonu',
      companyFocus: 'inovasyon odaklı',
      industrySector: 'teknoloji',
      companyGoals: 'operasyonel mükemmellik',
    };

    // Specific skills'i ekle
    if (data.specificSkills && data.specificSkills.length > 0) {
      content = content.replace(
        /\{\{technicalSkills\}\}/g,
        data.specificSkills.join(', ')
      );
    }

    // Additional info'yu ekle
    if (data.additionalInfo) {
      content = content.replace(/\{\{specialization\}\}/g, data.additionalInfo);
    }

    // Boş kalan placeholder'ları varsayılan değerlerle doldur
    for (const [placeholder, defaultValue] of Object.entries(defaultValues)) {
      const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
      content = content.replace(regex, defaultValue);
    }

    return content;
  }

  public async createTemplate(
    templateData: Omit<CoverLetterTemplate, 'id'>
  ): Promise<CoverLetterTemplate> {
    return await db.coverLetterTemplate.create({
      data: templateData,
    });
  }

  public async updateTemplate(
    id: string,
    templateData: Partial<CoverLetterTemplate>
  ): Promise<CoverLetterTemplate> {
    return await db.coverLetterTemplate.update({
      where: { id },
      data: templateData,
    });
  }

  public async deactivateTemplate(id: string): Promise<void> {
    await db.coverLetterTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
