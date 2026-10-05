import type { AppLocale } from '@/types';
import type { IBlog } from '@/features/blog/types';
import type { IEducation } from '@/features/education/types';
import type { IProduct } from '@/features/products/types';
import type { IProfile } from '@/features/profile/types';
import type { IProject } from '@/features/projects/types';
import type { ISkill } from '@/features/skills/types';
import type { ISocial } from '@/features/socials/types';
import type { IWork } from '@/features/experience/types';

/**
 * Persona primitives for the demo content.
 *
 * A persona is one fictional professional — a front-end engineer, a back-end
 * engineer, a full stack developer, a product designer — authored end to end:
 * profile, career history, projects, toolkit, links and writing. Every seed
 * module reads from the resolved persona, so switching persona rewrites the
 * whole site consistently instead of mixing identities.
 */

/** Career identities that ship with the repository. */
export type PersonaId = 'frontend' | 'backend' | 'fullstack' | 'designer';

/** Any model field set minus the generated id and the locale discriminator. */
export type Content<T> = Omit<T, '_id' | 'lang'>;

/**
 * The same list authored once per locale. The two arrays are parallel:
 * index `n` of `fa` is the Persian version of index `n` of `en`, so the seeded
 * documents stay in the same order on both sites.
 */
export interface Localized<T> {
  en: T[];
  fa: T[];
}

/** Projects carry an explicit date: the archive and the home row sort on `createdAt`. */
export type PersonaProject = Content<IProject> & { createdAt: string };

/**
 * Products carry an optional date too; the catalogue sorts newest first and the
 * home row fills from the featured picks, so `createdAt` only orders them.
 */
export type PersonaProduct = Content<IProduct> & { createdAt?: string };

/** Posts carry their publication date (and, when revised, an update date). */
export type PersonaPost = Content<IBlog> & { createdAt: string; updatedAt?: string };

/** One selectable demo identity. */
export interface Persona {
  id: PersonaId;
  /** Printed in the seed log, e.g. `Front-end engineer (design systems)`. */
  label: string;
  profile: Localized<Content<IProfile>>;
  socials: Localized<Content<ISocial>>;
  skills: Localized<Content<ISkill>>;
  educations: Localized<Content<IEducation>>;
  works: Localized<Content<IWork>>;
  projects: Localized<PersonaProject>;
  /** Optional: a persona without products simply seeds an empty catalogue. */
  products?: Localized<PersonaProduct>;
  posts: Localized<PersonaPost>;
}

/** Expand a bilingual pair into documents stamped with their locale. */
export function withLang<T extends object>(pair: Localized<T>, locale: AppLocale): (T & { lang: AppLocale })[] {
  return pair[locale].map(item => ({ ...item, lang: locale }));
}

/** Expand a bilingual pair into one flat array holding both locales. */
export function withBothLangs<T extends object>(pair: Localized<T>) {
  return [...withLang(pair, 'en'), ...withLang(pair, 'fa')];
}

/**
 * Placeholder media. `SEED_IMAGES=false` seeds no remote URL at all, and the
 * UI falls back to its own monogram placeholders — handy offline, and a reminder
 * that every image below is throwaway demo content.
 */
const IMAGES_ENABLED = process.env.SEED_IMAGES !== 'false';

/** 16:9 cover for a project or a post. Grayscale keeps social cards inside the monochrome palette. */
export const cover = (seed: string) => (IMAGES_ENABLED ? `https://picsum.photos/seed/${seed}/1600/900?grayscale` : '');

/** Square portrait for the profile avatar. */
export const portrait = (seed: string) => (IMAGES_ENABLED ? `https://picsum.photos/seed/${seed}/512/512?grayscale` : '');

// Company and school logos stay empty on purpose: a random photo squeezed into the
// 44px gutter reads as noise, while the initial the cards already fall back to looks deliberate.

/**
 * Bulleted role description. `ResumeCard` renders the text with
 * `white-space: pre-line`, so one bullet per line needs no Markdown.
 */
export const bullets = (...lines: string[]) => lines.map(line => `• ${line}`).join('\n');
