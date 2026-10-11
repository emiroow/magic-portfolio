import { LANGUAGE_LEVELS } from '@/constants/global';
import type { PortfolioData } from '@/features/portfolio/queries';
import { formatSocialHandle, formatYearMonthLocal, linkHost, toDialNumber } from '@/lib/utils';
import type { AppLocale, LanguageLevel } from '@/types';
import type { IProject } from '@/features/projects/types';
import type { IWork } from '@/features/experience/types';

/**
 * The résumé as data, not as a page.
 *
 * `buildResume` reads the same loaded portfolio the home page renders — profile,
 * career, projects, toolkit, education — and shapes it into the sections a printed
 * résumé carries. It knows nothing about HTML or fonts; `document.ts` owns the look.
 * Keeping the two apart is what lets the visitor's download, the dashboard preview and
 * the print sheet all come from one honest source.
 *
 * There is no free-text override here on purpose: a résumé is structured career data,
 * so every section is derived. An owner who wants their own layout uploads a file
 * instead, and that file wins before this ever runs.
 */

/** One chip in the header's contact run. */
export interface ResumeContact {
  value: string;
  href?: string;
  /** Icon key the renderer maps to a glyph (mail, phone, or a social handle). */
  icon: string;
}

/** A dated work role with its achievement lines. */
export interface ResumeExperience {
  role: string;
  company: string;
  location?: string;
  period?: string;
  bullets: string[];
}

/** A selected project with its stack and any live/source links. */
export interface ResumeProject {
  title: string;
  description?: string;
  period?: string;
  technologies: string[];
  links: { label: string; href: string }[];
}

/** A study record. */
export interface ResumeEducation {
  degree?: string;
  school?: string;
  period?: string;
}

/** A spoken language and its proficiency, shown on the résumé as a level word. */
export interface ResumeLanguage {
  name: string;
  level: LanguageLevel;
}

/** Everything the renderer needs to lay out one résumé. */
export interface ResumeModel {
  locale: AppLocale;
  name: string;
  role: string;
  contacts: ResumeContact[];
  summary?: string;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  skills: string[];
  education: ResumeEducation[];
  languages: ResumeLanguage[];
}

/** Present-tense word for an open-ended role, per locale. */
const PRESENT: Record<AppLocale, string> = { en: 'Present', fa: 'تاکنون' };

/** Fold a `start`/`end` pair into a locale-formatted period, honouring "present". */
function period(start: string | undefined, end: string | undefined, locale: AppLocale): string | undefined {
  const from = formatYearMonthLocal(start, locale);
  const to = end ? formatYearMonthLocal(end, locale) : start ? PRESENT[locale] : '';
  if (!from && !to) return undefined;
  if (!from) return to;
  if (!to) return from;
  return `${from} — ${to}`;
}

/** Split a stored role description into clean achievement lines, dropping bullet glyphs. */
function bulletsOf(description: string | undefined): string[] {
  if (!description) return [];
  return description
    .split('\n')
    .map(line => line.replace(/^\s*[•\-*]\s*/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean);
}

/** Trim on a word boundary so an over-long line never breaks the one-page layout. */
function clip(text: string | undefined, max: number): string | undefined {
  const value = text?.trim();
  if (!value) return undefined;
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const edge = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf('\u060C'), 0);
  return `${cut.slice(0, edge > 0 ? edge : max)}…`;
}

/** A project's outward links, labelled by host so they read the same in both languages. */
function linksOf(project: IProject): { label: string; href: string }[] {
  const seen = new Set<string>();
  const out: { label: string; href: string }[] = [];
  for (const link of project.links ?? []) {
    if (!link.href || seen.has(link.href)) continue;
    seen.add(link.href);
    out.push({ label: linkHost(link.href) || link.type || 'link', href: link.href });
  }
  if (!out.length && project.href) {
    out.push({ label: linkHost(project.href) || 'link', href: project.href });
  }
  return out.slice(0, 2);
}

function experienceOf(works: IWork[], locale: AppLocale): ResumeExperience[] {
  return works.slice(0, 3).map(work => ({
    role: work.title?.trim() || '',
    company: work.company?.trim() || '',
    location: work.location?.trim() || undefined,
    period: period(work.start, work.end, locale),
    bullets: bulletsOf(work.description).slice(0, 4).map(b => clip(b, 170) ?? b),
  }));
}

function educationOf(educations: PortfolioData['educations'], locale: AppLocale): ResumeEducation[] {
  return educations.slice(0, 3).map(edu => ({
    degree: edu.degree?.trim() || undefined,
    school: edu.school?.trim() || undefined,
    period: period(edu.start, edu.end, locale),
  }));
}

/** A spoken language row, dropping unnamed entries and validating the level. */
function languagesOf(profile: NonNullable<PortfolioData['profile']>): ResumeLanguage[] {
  return (profile.languages ?? [])
    .filter(language => language.name?.trim() && (LANGUAGE_LEVELS as readonly string[]).includes(language.level))
    .slice(0, 6)
    .map(language => ({ name: language.name.trim(), level: language.level }));
}

/** The opening paragraph: the summary, else the first block of the long-form bio. */
function summaryOf(profile: NonNullable<PortfolioData['profile']>): string | undefined {
  const summary = profile.summary?.trim();
  if (summary) return clip(summary, 480);
  const first = profile.description?.split(/\n\s*\n/).find(block => block.trim());
  return clip(first?.replace(/[#*_>`-]/g, '').replace(/\s+/g, ' ').trim(), 480);
}

/**
 * Shape the loaded data into a résumé, or `null` when there is no profile to head it.
 * Sections are bounded (roles, projects, study, skills) and long lines clipped so the
 * flowing two-column sheet settles onto a single page; the print view scales any residual.
 */
export function buildResume(data: PortfolioData, locale: AppLocale): ResumeModel | null {
  const { profile, socials, skills, projects } = data;
  if (!profile) return null;

  const contacts: ResumeContact[] = [];
  if (profile.email) contacts.push({ value: profile.email, href: `mailto:${profile.email}`, icon: 'mail' });
  if (profile.tel) contacts.push({ value: profile.tel, href: `tel:${toDialNumber(profile.tel)}`, icon: 'phone' });
  for (const social of socials.filter(s => s.url).slice(0, 3)) {
    contacts.push({
      value: social.name?.trim() || formatSocialHandle(social.url),
      href: social.url,
      icon: social.icon?.toLowerCase() || 'link',
    });
  }

  const selected = [...projects.filter(project => project.active)].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))).slice(0, 3);

  return {
    locale,
    name: profile.fullName?.trim() || profile.name?.trim() || '',
    role: profile.jobTitle?.trim() || '',
    contacts,
    summary: summaryOf(profile),
    experience: experienceOf(data.works, locale),
    projects: selected.map(project => ({
      title: project.title,
      description: clip(project.description, 150),
      period: project.dates?.trim() || undefined,
      technologies: (project.technologies ?? []).filter(Boolean).slice(0, 6),
      links: linksOf(project),
    })),
    skills: skills.map(skill => skill.name).filter(Boolean).slice(0, 18),
    education: educationOf(data.educations, locale),
    languages: languagesOf(profile),
  };
}
