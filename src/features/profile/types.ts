import type { AppLocale, LanguageLevel } from '@/types';

/** A spoken language and the owner's proficiency in it. */
export interface ILanguage {
  name: string;
  level: LanguageLevel;
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
  /**
   * Uploaded résumé file (PDF or DOCX). When present it is what the "Résumé" action
   * downloads, overriding the version generated from the profile. Empty or absent
   * means the résumé is composed automatically from the owner's career data.
   */
  resumeUrl?: string;
  /**
   * Spoken languages shown on the résumé, in the order the owner lists them (usually
   * most fluent first). Each carries a proficiency level the résumé draws as dots.
   */
  languages?: ILanguage[];
  lang: AppLocale;
}
