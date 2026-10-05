import type { AppLocale } from '@/types';

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
