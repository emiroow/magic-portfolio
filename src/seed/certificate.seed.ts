import { certificateModel } from '@/features/certificate/model';
import { withBothLangs, type Content, type Localized, type Persona, type PersonaId } from '@/seed/personas/types';
import type { ICertificate } from '@/features/certificate/types';

/**
 * Credentials for the demo identities.
 *
 * Authored here rather than inside each persona module: a certificate list is a
 * property of the career, not of the person telling it, so the four identities share
 * one file and a new persona inherits the set written for its role. A persona that
 * does want its own simply declares `certificates` and this file steps aside.
 *
 * The dates follow the rest of the seed: Gregorian on the English site, Jalali on the
 * Persian one, always the same month. Issuers are real bodies — the credentials are
 * not, and every verification link points at a placeholder that resolves nowhere.
 *
 * Each set deliberately mixes the states the dashboard and the résumé have to render:
 * credentials marked for the sheet and ones that are not, open-ended ones and ones
 * that lapse, and at least one that already has, so the "expired" mark is visible
 * without anyone having to invent a record to see it.
 */

/** Placeholder verification page: a real issuer, an invented credential record. */
const verify = (credentialId: string) => `https://credentials.example.com/verify/${credentialId}`;

/** One credential, with the fields a seed always fills spelled out. */
type SeedCertificate = Content<ICertificate>;

/** The same list authored once per locale, index for index. */
type CertificateSet = Localized<SeedCertificate>;

/** Front-end engineer · design systems: browser platform, accessibility, the cloud it ships to. */
const frontend: CertificateSet = {
  en: [
    {
      title: 'Meta Front-End Developer Professional Certificate',
      issuer: 'Meta',
      href: verify('META-FE-8842-1174'),
      logoUrl: '',
      credentialId: 'META-FE-8842-1174',
      issueDate: '2021/06',
      expirationDate: '',
      featured: true,
      description:
        'Seven-course track on React, version control and front-end testing. The capstone was a component library published behind visual-regression gates — the same shape Prism took two years later.',
    },
    {
      title: 'Certified Professional in Accessibility Core Competencies (CPACC)',
      issuer: 'IAAP',
      href: verify('IAAP-CPACC-40219'),
      logoUrl: '',
      credentialId: 'IAAP-CPACC-40219',
      issueDate: '2024/04',
      expirationDate: '2027/04',
      featured: true,
      description:
        'Body-of-knowledge credential covering WCAG 2.1, assistive technology and the organisational side of running an accessibility programme. Renewed every three years.',
    },
    {
      title: 'AWS Certified Cloud Practitioner',
      issuer: 'Amazon Web Services',
      href: verify('AWS-CCP-7J2K9X'),
      logoUrl: '',
      credentialId: 'AWS-CCP-7J2K9X',
      issueDate: '2024/02',
      expirationDate: '2027/02',
      featured: true,
      description:
        'Foundational cloud credential: the cost, security and deployment model behind the infrastructure Prism publishes to, so a build pipeline is a thing I can argue about rather than wait for.',
    },
    {
      title: 'Professional Scrum Developer I',
      issuer: 'Scrum.org',
      href: verify('PSD-I-118432'),
      logoUrl: '',
      credentialId: 'PSD-I-118432',
      issueDate: '2022/09',
      expirationDate: '',
      featured: false,
      description: 'Definition of done, continuous integration and the engineering practices a two-week increment actually needs.',
    },
    {
      title: 'Google Mobile Sites Certification',
      issuer: 'Google',
      href: '',
      logoUrl: '',
      credentialId: 'GMS-2020-551033',
      issueDate: '2020/05',
      expirationDate: '2022/05',
      featured: false,
      description:
        'A retired programme on responsive layouts and mobile page speed. Kept on the record because the Core Web Vitals work that followed came straight out of it.',
    },
  ],
  fa: [
    {
      title: 'گواهی حرفه‌ای توسعه‌دهندهٔ فرانت‌اند متا',
      issuer: 'Meta',
      href: verify('META-FE-8842-1174'),
      logoUrl: '',
      credentialId: 'META-FE-8842-1174',
      issueDate: '1400/03',
      expirationDate: '',
      featured: true,
      description:
        'دورهٔ هفت‌مرحله‌ای دربارهٔ React، کنترل نسخه و تست فرانت‌اند. پروژهٔ پایانی‌اش یک کتابخانهٔ کامپوننت بود که پشت دروازه‌های visual-regression منتشر می‌شد — همان شکلی که دو سال بعد Prism گرفت.',
    },
    {
      title: 'متخصص معتبر در شایستگی‌های بنیادین دسترس‌پذیری (CPACC)',
      issuer: 'IAAP',
      href: verify('IAAP-CPACC-40219'),
      logoUrl: '',
      credentialId: 'IAAP-CPACC-40219',
      issueDate: '1403/01',
      expirationDate: '1406/01',
      featured: true,
      description:
        'گواهیِ مبتنی بر پیکرهٔ دانش که WCAG 2.1، فناوری‌های کمکی و سمت سازمانیِ ادارهٔ یک برنامهٔ دسترس‌پذیری را پوشش می‌دهد. هر سه سال تمدید می‌شود.',
    },
    {
      title: 'گواهی AWS Cloud Practitioner',
      issuer: 'Amazon Web Services',
      href: verify('AWS-CCP-7J2K9X'),
      logoUrl: '',
      credentialId: 'AWS-CCP-7J2K9X',
      issueDate: '1402/11',
      expirationDate: '1405/11',
      featured: true,
      description:
        'گواهی پایهٔ ابری: مدل هزینه، امنیت و استقرارِ همان زیرساختی که Prism رویش منتشر می‌شود؛ تا دربارهٔ خط لولهٔ ساخت استدلال کنم، نه اینکه منتظرش بمانم.',
    },
    {
      title: 'توسعه‌دهندهٔ حرفه‌ای اسکرام I',
      issuer: 'Scrum.org',
      href: verify('PSD-I-118432'),
      logoUrl: '',
      credentialId: 'PSD-I-118432',
      issueDate: '1401/06',
      expirationDate: '',
      featured: false,
      description: 'تعریف «انجام‌شده»، یکپارچه‌سازی مداوم و همان شیوه‌های مهندسی که یک افزایش دو هفته‌ای واقعاً لازم دارد.',
    },
    {
      title: 'گواهی سایت‌های موبایل گوگل',
      issuer: 'Google',
      href: '',
      logoUrl: '',
      credentialId: 'GMS-2020-551033',
      issueDate: '1399/02',
      expirationDate: '1401/02',
      featured: false,
      description:
        'برنامه‌ای که دیگر برگزار نمی‌شود و دربارهٔ چیدمان واکنش‌گرا و سرعت صفحهٔ موبایل بود. نگه داشته‌ام چون کارِ Core Web Vitals که بعدش آمد، از دلِ همان درآمد.',
    },
  ],
};

/** Back-end engineer · payments & event pipelines: orchestration, cloud architecture, the queue. */
const backend: CertificateSet = {
  en: [
    {
      title: 'Certified Kubernetes Administrator (CKA)',
      issuer: 'Cloud Native Computing Foundation',
      href: verify('CKA-2023-114807'),
      logoUrl: '',
      credentialId: 'CKA-2023-114807',
      issueDate: '2023/11',
      expirationDate: '2026/11',
      featured: true,
      description:
        'Hands-on exam at a live cluster: scheduling, networking, storage, and recovering a node that has stopped reporting. Valid for three years, with a renewal exam before the window closes.',
    },
    {
      title: 'AWS Certified Solutions Architect – Associate',
      issuer: 'Amazon Web Services',
      href: verify('AWS-SAA-2K9X774'),
      logoUrl: '',
      credentialId: 'AWS-SAA-2K9X774',
      issueDate: '2024/06',
      expirationDate: '2027/06',
      featured: true,
      description:
        'Cost-aware, highly available design across compute, storage and networking. The settlement service runs on the multi-AZ pattern this exam insists on.',
    },
    {
      title: 'Confluent Certified Developer for Apache Kafka',
      issuer: 'Confluent',
      href: verify('CCDAK-88140'),
      logoUrl: '',
      credentialId: 'CCDAK-88140',
      issueDate: '2021/09',
      expirationDate: '',
      featured: true,
      description:
        'Producer and consumer semantics, partition keys, exactly-once processing and the schema-registry discipline that keeps a redelivered event from being counted twice.',
    },
    {
      title: 'PostgreSQL Associate Certification',
      issuer: 'EnterpriseDB',
      href: verify('EDB-PG14-30921'),
      logoUrl: '',
      credentialId: 'EDB-PG14-30921',
      issueDate: '2022/03',
      expirationDate: '',
      featured: false,
      description: 'Query planning, isolation levels, logical replication and reading an EXPLAIN plan without guessing.',
    },
    {
      title: 'HashiCorp Certified: Terraform Associate',
      issuer: 'HashiCorp',
      href: '',
      logoUrl: '',
      credentialId: 'TFA-002-55187',
      issueDate: '2020/10',
      expirationDate: '2022/10',
      featured: false,
      description: 'Lapsed and not renewed — the platform team took infrastructure over, and my own Terraform work stayed at the module level.',
    },
  ],
  fa: [
    {
      title: 'مدیر معتبر کوبرنتیز (CKA)',
      issuer: 'Cloud Native Computing Foundation',
      href: verify('CKA-2023-114807'),
      logoUrl: '',
      credentialId: 'CKA-2023-114807',
      issueDate: '1402/08',
      expirationDate: '1405/08',
      featured: true,
      description:
        'آزمون عملی روی یک کلاستر زنده: زمان‌بندی، شبکه، ذخیره‌سازی و بازیابی نودی که از گزارش‌دادن افتاده. سه سال اعتبار دارد و پیش از بسته‌شدنِ همان پنجره، آزمون تمدید دارد.',
    },
    {
      title: 'معمار معتبر راهکارهای AWS — سطح Associate',
      issuer: 'Amazon Web Services',
      href: verify('AWS-SAA-2K9X774'),
      logoUrl: '',
      credentialId: 'AWS-SAA-2K9X774',
      issueDate: '1403/03',
      expirationDate: '1406/03',
      featured: true,
      description:
        'طراحی پرهزینه‌آگاه و دسترس‌پذیر روی محاسبات، ذخیره‌سازی و شبکه. سرویس تسویهٔ ما روی همان الگوی چند-AZ می‌چرخد که این آزمون اصرار دارد.',
    },
    {
      title: 'توسعه‌دهندهٔ معتبر کانفلوئنت برای Apache Kafka',
      issuer: 'Confluent',
      href: verify('CCDAK-88140'),
      logoUrl: '',
      credentialId: 'CCDAK-88140',
      issueDate: '1400/06',
      expirationDate: '',
      featured: true,
      description:
        'معنای producer و consumer، کلیدهای پارتیشن، پردازش exactly-once و همان انضباط schema registry که نمی‌گذارد یک رویدادِ دوباره ارسال‌شده دو بار شمرده شود.',
    },
    {
      title: 'گواهی Associate پایگاه‌دادهٔ PostgreSQL',
      issuer: 'EnterpriseDB',
      href: verify('EDB-PG14-30921'),
      logoUrl: '',
      credentialId: 'EDB-PG14-30921',
      issueDate: '1400/12',
      expirationDate: '',
      featured: false,
      description: 'برنامه‌ریزی پرس‌وجو، سطح‌های جداسازی، تکثیر منطقی و خواندنِ یک EXPLAIN بدون حدس زدن.',
    },
    {
      title: 'معتبرِ هشی‌کورپ: Terraform Associate',
      issuer: 'HashiCorp',
      href: '',
      logoUrl: '',
      credentialId: 'TFA-002-55187',
      issueDate: '1399/07',
      expirationDate: '1401/07',
      featured: false,
      description: 'منقضی شده و تمدیدش نکرده‌ام — زیرساخت را تیم پلتفرم به عهده گرفت و کارِ ترافرمِ خودم در سطح همان ماژول‌ها ماند.',
    },
  ],
};

/** Full stack developer · product teams: the platform it deploys to, and how a team agrees to ship. */
const fullstack: CertificateSet = {
  en: [
    {
      title: 'Microsoft Certified: Azure Developer Associate',
      issuer: 'Microsoft',
      href: verify('AZ-204-90312'),
      logoUrl: '',
      credentialId: 'AZ-204-90312',
      issueDate: '2024/03',
      expirationDate: '2027/03',
      featured: true,
      description:
        'Compute, storage, messaging and the auth wiring behind a production deployment. Enough of the platform to argue about the bill, which is most of what "full stack" turns out to mean.',
    },
    {
      title: 'Professional Scrum Master I',
      issuer: 'Scrum.org',
      href: verify('PSM-I-207744'),
      logoUrl: '',
      credentialId: 'PSM-I-207744',
      issueDate: '2021/11',
      expirationDate: '',
      featured: true,
      description:
        'Taken on a small team where the same person wrote the migration and the interface, and the only question that mattered was how the two of us agreed on what was done.',
    },
    {
      title: 'MongoDB Associate Developer',
      issuer: 'MongoDB',
      href: verify('MDB-AD-64210'),
      logoUrl: '',
      credentialId: 'MDB-AD-64210',
      issueDate: '2022/06',
      expirationDate: '',
      featured: true,
      description: 'Aggregation pipelines, index selection and the schema decisions that are cheap in week one and expensive in year two.',
    },
    {
      title: 'HashiCorp Certified: Terraform Associate (003)',
      issuer: 'HashiCorp',
      href: verify('TFA-003-11807'),
      logoUrl: '',
      credentialId: 'TFA-003-11807',
      issueDate: '2025/10',
      expirationDate: '2027/10',
      featured: false,
      description: 'Modules, state, workspaces and drift. I write the infrastructure for my own projects; a platform team writes everyone else’s.',
    },
    {
      title: 'Google Cloud Associate Cloud Engineer',
      issuer: 'Google Cloud',
      href: '',
      logoUrl: '',
      credentialId: 'GCP-ACE-33190',
      issueDate: '2020/09',
      expirationDate: '2023/09',
      featured: false,
      description:
        'Lapsed and left alone — the work moved to Azure and then to a managed host, and re-sitting it for its own sake never made the shortlist.',
    },
  ],
  fa: [
    {
      title: 'معتبرِ مایکروسافت: Azure Developer Associate',
      issuer: 'Microsoft',
      href: verify('AZ-204-90312'),
      logoUrl: '',
      credentialId: 'AZ-204-90312',
      issueDate: '1402/12',
      expirationDate: '1405/12',
      featured: true,
      description:
        'محاسبات، ذخیره‌سازی، پیام‌رسانی و سیم‌کشیِ احراز هویت پشت یک استقرار واقعی. آن‌قدر از پلتفرم که بشود دربارهٔ صورتحساب استدلال کرد — که به‌گمانم بیشترِ معنای «فول‌استک» همین باشد.',
    },
    {
      title: 'اسکرام مستر حرفه‌ای I',
      issuer: 'Scrum.org',
      href: verify('PSM-I-207744'),
      logoUrl: '',
      credentialId: 'PSM-I-207744',
      issueDate: '1400/08',
      expirationDate: '',
      featured: true,
      description:
        'روی تیم کوچکی گرفتم که همان یک نفر هم مایگریشن را می‌نوشت و هم رابط را؛ و تنها پرسشِ مهم این بود که ما دو نفر چطور بر سرِ «انجام‌شده» توافق کنیم.',
    },
    {
      title: 'توسعه‌دهندهٔ همکار MongoDB',
      issuer: 'MongoDB',
      href: verify('MDB-AD-64210'),
      logoUrl: '',
      credentialId: 'MDB-AD-64210',
      issueDate: '1401/03',
      expirationDate: '',
      featured: true,
      description: 'خط لوله‌های aggregation، انتخاب ایندکس و همان تصمیم‌های اسکیما که در هفتهٔ اول ارزان و در سال دوم گران‌اند.',
    },
    {
      title: 'معتبرِ هشی‌کورپ: Terraform Associate (003)',
      issuer: 'HashiCorp',
      href: verify('TFA-003-11807'),
      logoUrl: '',
      credentialId: 'TFA-003-11807',
      issueDate: '1404/07',
      expirationDate: '1406/07',
      featured: false,
      description: 'ماژول، state، workspace و drift. زیرساخت پروژه‌های خودم را می‌نویسم؛ زیرساخت بقیه را یک تیم پلتفرم.',
    },
    {
      title: 'مهندس ابری همکار Google Cloud',
      issuer: 'Google Cloud',
      href: '',
      logoUrl: '',
      credentialId: 'GCP-ACE-33190',
      issueDate: '1399/06',
      expirationDate: '1402/06',
      featured: false,
      description:
        'منقضی شده و رهایش کرده‌ام — کار به Azure رفت و بعد به یک میزبان مدیریت‌شده؛ نشستنِ دوبارهٔ آزمون، فقط برای خودش، هیچ‌وقت در فهرست جا نگرفت.',
    },
  ],
};

/** Product designer · interfaces, systems & motion: research craft, systems thinking, an expired analyst credential. */
const designer: CertificateSet = {
  en: [
    {
      title: 'Nielsen Norman Group UX Certification',
      issuer: 'Nielsen Norman Group',
      href: verify('NN-G-UX-4471'),
      logoUrl: '',
      credentialId: 'NN-G-UX-4471',
      issueDate: '2021/03',
      expirationDate: '',
      featured: true,
      description:
        'Five specialty tracks — interaction design, research, information architecture — completed in person, with the exam taken on the last day of a very long week.',
    },
    {
      title: 'Google UX Design Professional Certificate',
      issuer: 'Google',
      href: verify('G-UXD-88213'),
      logoUrl: '',
      credentialId: 'G-UXD-88213',
      issueDate: '2022/07',
      expirationDate: '',
      featured: true,
      description:
        'Taken while teaching, to see the material a newcomer meets first. Half of it I argued with; the research methods half is what I now hand juniors.',
    },
    {
      title: 'UX Research Certificate',
      issuer: 'Interaction Design Foundation',
      href: verify('IDF-UXR-90127'),
      logoUrl: '',
      credentialId: 'IDF-UXR-90127',
      issueDate: '2023/05',
      expirationDate: '',
      featured: true,
      description:
        'Study design, participant recruitment and analysis sized to the decision in front of you — which is the whole argument for research a product team can afford.',
    },
    {
      title: 'Advanced UI Animation Certificate',
      issuer: 'School of Motion',
      href: verify('SOM-UIA-2290'),
      logoUrl: '',
      credentialId: 'SOM-UIA-2290',
      issueDate: '2024/01',
      expirationDate: '',
      featured: false,
      description:
        'Easing, staging and timing as craft rather than decoration. Everything useful in it now lives in the motion tokens Havva Health ships.',
    },
    {
      title: 'Certified Usability Analyst (CUA)',
      issuer: 'Human Factors International',
      href: '',
      logoUrl: '',
      credentialId: 'CUA-2019-55310',
      issueDate: '2019/10',
      expirationDate: '2022/10',
      featured: false,
      description:
        'Lapsed. Expert-review methodology is still how I read an interface, but the certification assumes a lab and a budget my current work does not have.',
    },
  ],
  fa: [
    {
      title: 'گواهی تجربهٔ کاربری گروه نیلسن نورمن',
      issuer: 'Nielsen Norman Group',
      href: verify('NN-G-UX-4471'),
      logoUrl: '',
      credentialId: 'NN-G-UX-4471',
      issueDate: '1399/12',
      expirationDate: '',
      featured: true,
      description: 'پنج مسیر تخصصی — طراحی تعامل، پژوهش و معماری اطلاعات — به‌صورت حضوری؛ با آزمونی که آخرین روزِ یک هفتهٔ خیلی طولانی برگزار شد.',
    },
    {
      title: 'گواهی حرفه‌ای طراحی تجربهٔ کاربری گوگل',
      issuer: 'Google',
      href: verify('G-UXD-88213'),
      logoUrl: '',
      credentialId: 'G-UXD-88213',
      issueDate: '1401/04',
      expirationDate: '',
      featured: true,
      description:
        'هم‌زمان با تدریس گذراندمش، تا ببینم تازه‌وارد اول با چه چیزی روبه‌رو می‌شود. با نیمی‌اش بحث داشتم؛ نیمهٔ روش‌های پژوهش همان چیزی است که حالا به تازه‌واردها می‌دهم.',
    },
    {
      title: 'گواهی پژوهش تجربهٔ کاربری',
      issuer: 'Interaction Design Foundation',
      href: verify('IDF-UXR-90127'),
      logoUrl: '',
      credentialId: 'IDF-UXR-90127',
      issueDate: '1402/02',
      expirationDate: '',
      featured: true,
      description:
        'طراحی مطالعه، جذب شرکت‌کننده و تحلیلِ هم‌اندازهٔ همان تصمیمی که پیش رو دارید — که کلِ استدلالِ پژوهشِ مقرون‌به‌صرفه برای یک تیم محصول است.',
    },
    {
      title: 'گواهی انیمیشن پیشرفتهٔ رابط کاربری',
      issuer: 'School of Motion',
      href: verify('SOM-UIA-2290'),
      logoUrl: '',
      credentialId: 'SOM-UIA-2290',
      issueDate: '1402/10',
      expirationDate: '',
      featured: false,
      description: 'محو شدن، صحنه‌بندی و زمان‌بندی به‌عنوان مهارت، نه تزئین. هرچه‌اش به کار آمد، حالا در توکن‌های حرکتیِ «حوّا هلث» هست.',
    },
    {
      title: 'تحلیل‌گر معتبر کاربردپذیری (CUA)',
      issuer: 'Human Factors International',
      href: '',
      logoUrl: '',
      credentialId: 'CUA-2019-55310',
      issueDate: '1398/07',
      expirationDate: '1401/07',
      featured: false,
      description:
        'منقضی شده. روش‌شناسی بازبینی متخصص هنوز همان چیزی است که با آن یک رابط را می‌خوانم، ولی این گواهی یک آزمایشگاه و بودجه‌ای فرض می‌کند که کارِ امروزم ندارد.',
    },
  ],
};

/** The credential set written for each shipped identity, keyed by the id `--persona=` selects. */
export const CERTIFICATES: Record<PersonaId, CertificateSet> = { frontend, backend, fullstack, designer };

/**
 * Insert the persona's credentials, both locales at once.
 *
 * A persona that authors its own `certificates` wins; the rest take the set written for
 * their career above. Returns the inserted count for the seed summary line.
 */
export const seedCertificateData = async (persona: Persona) => {
  const inserted = await certificateModel.insertMany(withBothLangs(persona.certificates ?? CERTIFICATES[persona.id]));
  return inserted.length;
};
