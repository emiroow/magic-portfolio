/** Shared domain types mirroring `src/models` schemas and API payloads. */

/** Locales supported by the site. */
export type AppLocale = 'fa' | 'en';

/**
 * Currencies a product price can be expressed in. The codes mirror
 * `PRODUCT_CURRENCIES` in `src/constants/global.ts`, which is the runtime list
 * the dashboard form and the API validator read from.
 */
export type ProductCurrency = 'toman' | 'rial' | 'usd' | 'eur' | 'tether';

/** External link attached to a project (demo, source, docs, ...). */
export interface IProjectLink {
  type: string;
  href: string;
  icon: string;
}

/** Site owner profile (one document per locale). */
export interface IProfile {
  _id?: string;
  name: string;
  fullName: string;
  jobTitle: string;
  description?: string;
  summary?: string;
  avatarUrl?: string;
  tel?: string;
  email?: string;
  lang: AppLocale;
}

/** Portfolio project shown on the home page and its details page. */
export interface IProject {
  _id?: string;
  title: string;
  /** URL segment for `/projects/[slug]`; falls back to `_id` when absent. */
  slug?: string;
  href: string;
  dates: string;
  active: boolean;
  /** Picked for the home page section; `active` still controls visibility. */
  featured?: boolean;
  description: string;
  /** Long-form Markdown body rendered on the details page. */
  details?: string;
  technologies: string[];
  links: IProjectLink[];
  image: string;
  lang: AppLocale;
}

/** Commercial product offered in the `/products` catalogue. */
export interface IProduct {
  _id?: string;
  title: string;
  /** URL segment for `/products/[slug]`; falls back to `_id` when absent. */
  slug?: string;
  /** Short summary shown on the catalogue card. */
  description: string;
  /** Long-form Markdown body rendered on the product page. */
  details?: string;
  image?: string;
  /** Single grouping label used by the catalogue filter. */
  category?: string;
  /** "What you get" bullets listed on the card and the product page. */
  features: string[];
  /** Amount in whole units of `currency`; `0` is rendered as "Free". */
  price: number;
  currency: ProductCurrency;
  /** `false` keeps the product public but marks it as not purchasable. */
  available: boolean;
  /** Checkout or sales page. */
  href?: string;
  /** `false` keeps the product out of every public surface. */
  active: boolean;
  /** Picked for the home page section; `active` still controls visibility. */
  featured?: boolean;
  lang: AppLocale;
  createdAt?: string;
  updatedAt?: string;
}

/** Skill badge. */
export interface ISkill {
  _id?: string;
  name: string;
  lang: AppLocale;
}

/** Social media profile. */
export interface ISocial {
  _id?: string;
  name: string;
  url: string;
  icon: string;
  lang: AppLocale;
}

/** Professional work experience entry. */
export interface IWork {
  _id?: string;
  company?: string;
  href?: string;
  location?: string;
  title?: string;
  logoUrl?: string;
  /** ISO date or `YYYY/MM` string. */
  start?: string;
  /** ISO date or `YYYY/MM` string; empty means "present". */
  end?: string;
  description?: string;
  lang: AppLocale;
}

/** Education entry. */
export interface IEducation {
  _id?: string;
  school?: string;
  href?: string;
  degree?: string;
  logoUrl?: string;
  /** ISO date or `YYYY/MM` string. */
  start?: string;
  /** ISO date or `YYYY/MM` string. */
  end?: string;
  lang: AppLocale;
}

/** Blog post stored in MongoDB; `content` is Markdown. */
export interface IBlog {
  _id?: string;
  title: string;
  summary?: string;
  content?: string;
  slug: string;
  /** Cover image shown on the list, the article header and social cards. */
  image?: string;
  /** Free-form labels used for filtering and related posts. */
  tags?: string[];
  /** `false` keeps a post out of every public surface (legacy docs: published). */
  published?: boolean;
  /** Picked for the home page section; `published` still controls visibility. */
  featured?: boolean;
  lang: AppLocale;
  createdAt?: string;
  updatedAt?: string;
  /** Derived from `content`; never stored. */
  readingMinutes?: number;
}

/** Aggregated payload consumed by the public site and `/api/[lang]`. */
export interface IPortfolioData {
  profile?: IProfile;
  educations: IEducation[];
  projects: IProject[];
  works: IWork[];
  socials: ISocial[];
  skills: ISkill[];
}
