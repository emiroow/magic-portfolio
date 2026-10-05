import type { AppLocale } from '@/types';

/** External link attached to a project (demo, source, docs, ...). */
export interface IProjectLink {
  type: string;
  href: string;
  icon: string;
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
