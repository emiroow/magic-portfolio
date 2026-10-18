import { LANGUAGE_LEVELS } from '@/constants/global';
import { certificatePeriod } from '@/features/certificate/format';
import type { PortfolioData } from '@/features/portfolio/queries';
import { formatSocialHandle, formatYearMonthLocal, linkHost, toDialNumber } from '@/lib/utils';
import type { AppLocale, LanguageLevel } from '@/types';
import type { IProfile } from '@/features/profile/types';
import type { IProject } from '@/features/projects/types';
import type { IWork } from '@/features/experience/types';

/**
 * The résumé as data, not as a page.
 *
 * `buildResume` reads the same loaded portfolio the home page renders — profile,
 * career, projects, toolkit, education, credentials — and shapes it into the sections
 * a printed résumé carries. It knows nothing about HTML or fonts; `document.tsx` owns
 * the look.
 *
 * Keeping the two apart is what lets the visitor's download, the dashboard preview and
 * the print sheet all come from one honest source.
 *
 * Every valid record is emitted whole — no arbitrary caps, no text truncation. When the
 * content outgrows a single A4 sheet the layout engine paginates across columns and
 * pages rather than the builder discarding data.
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

/** A credential earned, with the span it is valid for. */
export interface ResumeCertificate {
  title: string;
  issuer?: string;
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
  certificates: ResumeCertificate[];
  languages: ResumeLanguage[];
}

/** Present-tense word for an open-ended role, per locale. */
const PRESENT: Record<AppLocale, string> = { en: 'Present', fa: 'تاکنون' };

/** A credential that does not lapse, per locale. */
const NO_EXPIRY: Record<AppLocale, string> = { en: 'No expiry', fa: 'بدون انقضا' };

/**
 * The only bound the builder applies: what a search-result description renders before
 * the crawler truncates on its own. This is an SEO concern, not a display concern —
 * the sheet itself carries every word.
 */
const SEO_DESCRIPTION_CHARS = 155;

/**
 * The schemes the résumé is willing to turn into a clickable link.
 *
 * Social and project URLs clear their schemas' `z.string().url()`, but that only proves a
 * string parses — `javascript:`, `data:` and `vbscript:` all satisfy it, and interpolated
 * into an `href` they execute in the visitor's browser. So every outward link is checked
 * against this allowlist here, where untrusted stored data first enters the résumé model:
 * an unsafe scheme is dropped, and `document.tsx` can then trust each `href` it renders.
 * Ordinary http(s), mailto and tel links — everything a real contact or project uses —
 * pass untouched.
 */
const SAFE_LINK_SCHEME = /^(?:https?:|mailto:|tel:)/i;

/** The URL when it is safe to link, else `undefined`. */
function safeHref(value: string | undefined): string | undefined {
  const href = value?.trim();
  return href && SAFE_LINK_SCHEME.test(href) ? href : undefined;
}

/**
 * The owner's uploaded file, when the stored value is one this site may hand over.
 *
 * The write-time schema limits `resumeUrl` to a same-origin path or an absolute http(s)
 * URL, and the value is read straight out of the database here — so it is checked against
 * the same shapes again rather than trusted. Anything else, notably a protocol-relative
 * `//host`, would send the reader off-site and is ignored, leaving the generated résumé
 * to be composed instead. `layout.tsx` asks this before anything streams.
 */
export function uploadedResumeFile(profile?: Pick<IProfile, 'resumeUrl'> | null): string | undefined {
  const url = profile?.resumeUrl?.trim();
  if (!url) return undefined;
  return (url.startsWith('/') && !url.startsWith('//')) || /^https?:\/\//i.test(url) ? url : undefined;
}

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
    .map(line =>
      line
        .replace(/^\s*[•\-*]\s*/, '')
        .replace(/\*\*/g, '')
        .trim()
    )
    .filter(Boolean);
}

/** Normalise whitespace without truncating content. */
function clean(text: string | undefined): string | undefined {
  const value = text?.trim();
  return value || undefined;
}

/** A project's outward links, labelled by host so they read the same in both languages. */
function linksOf(project: IProject): { label: string; href: string }[] {
  const seen = new Set<string>();
  const out: { label: string; href: string }[] = [];
  for (const link of project.links ?? []) {
    const href = safeHref(link.href);
    if (!href || seen.has(href)) continue;
    seen.add(href);
    out.push({ label: linkHost(href) || link.type || 'link', href });
  }
  if (!out.length) {
    const href = safeHref(project.href);
    if (href) out.push({ label: linkHost(href) || 'link', href });
  }
  return out;
}

function experienceOf(works: IWork[], locale: AppLocale): ResumeExperience[] {
  return works.map(work => ({
    role: work.title?.trim() || '',
    company: work.company?.trim() || '',
    location: work.location?.trim() || undefined,
    period: period(work.start, work.end, locale),
    bullets: bulletsOf(work.description),
  }));
}

function educationOf(educations: PortfolioData['educations'], locale: AppLocale): ResumeEducation[] {
  return educations.map(edu => ({
    degree: edu.degree?.trim() || undefined,
    school: edu.school?.trim() || undefined,
    period: period(edu.start, edu.end, locale),
  }));
}

/**
 * All valid credentials, with the owner's featured picks sorted first.
 * `sort` is stable, so inside each group the database order — most recently
 * issued first — is kept.
 */
function certificatesOf(certificates: PortfolioData['certificates'], locale: AppLocale): ResumeCertificate[] {
  return certificates
    .filter(certificate => certificate.title?.trim())
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .map(certificate => ({
      title: certificate.title?.trim() || '',
      issuer: certificate.issuer?.trim() || undefined,
      period: certificatePeriod(certificate, locale, NO_EXPIRY[locale]) || undefined,
    }));
}

/** A spoken language row, dropping unnamed entries and validating the level. */
function languagesOf(profile: NonNullable<PortfolioData['profile']>): ResumeLanguage[] {
  return (profile.languages ?? [])
    .filter(language => language.name?.trim() && (LANGUAGE_LEVELS as readonly string[]).includes(language.level))
    .map(language => ({ name: language.name.trim(), level: language.level }));
}

/**
 * The opening paragraph: the summary, else the first block of the long-form bio.
 * Shared with the page's metadata, so what a search result says and what the sheet
 * opens with can never drift apart. No truncation — the layout engine paginates.
 */
export function resumeSummary(profile?: Pick<IProfile, 'summary' | 'description'> | null): string | undefined {
  const summary = profile?.summary?.trim();
  if (summary) return summary;
  const first = profile?.description?.split(/\n\s*\n/).find(block => block.trim());
  return clean(
    first
      ?.replace(/[#*_>`-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * The one sentence a search result or a link preview shows.
 *
 * Cut to the length the crawlers actually render rather than truncated with an ellipsis
 * they append themselves, and shared by `<meta>`, Open Graph, Twitter and the JSON-LD —
 * four places a reader may compare against each other. This is the only place content is
 * shortened, and it affects metadata only — never the rendered sheet.
 */
export function seoDescription(text?: string): string {
  const value = text?.replace(/\s+/g, ' ').trim();
  if (!value) return '';
  if (value.length <= SEO_DESCRIPTION_CHARS) return value;
  const edge = value.lastIndexOf(' ', SEO_DESCRIPTION_CHARS);
  return `${value.slice(0, edge > 0 ? edge : SEO_DESCRIPTION_CHARS).replace(/[,;:.]$/, '')}…`;
}

/**
 * Shape the loaded data into a résumé, or `null` when there is no profile to head it.
 * Every valid record is emitted in full — no caps, no truncation. When the flow outgrows
 * a sheet, the layout engine paginates across columns and pages.
 */
export function buildResume(data: PortfolioData, locale: AppLocale): ResumeModel | null {
  const { profile, socials, skills, projects } = data;
  if (!profile) return null;

  const contacts: ResumeContact[] = [];
  if (profile.email) contacts.push({ value: profile.email, href: `mailto:${profile.email}`, icon: 'mail' });
  if (profile.tel) contacts.push({ value: profile.tel, href: `tel:${toDialNumber(profile.tel)}`, icon: 'phone' });
  const socialContacts = socials
    .map(social => ({ social, href: safeHref(social.url) }))
    .filter((entry): entry is { social: PortfolioData['socials'][number]; href: string } => entry.href !== undefined);
  for (const { social, href } of socialContacts) {
    contacts.push({
      value: social.name?.trim() || formatSocialHandle(href),
      href,
      icon: social.icon?.toLowerCase() || 'link',
    });
  }

  const selected = [...projects.filter(project => project.active)]
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));

  return {
    locale,
    name: profile.fullName?.trim() || profile.name?.trim() || '',
    role: profile.jobTitle?.trim() || '',
    contacts,
    summary: resumeSummary(profile),
    experience: experienceOf(data.works, locale),
    projects: selected.map(project => ({
      title: project.title,
      description: clean(project.description),
      period: project.dates?.trim() || undefined,
      technologies: (project.technologies ?? []).filter(Boolean),
      links: linksOf(project),
    })),
    skills: skills
      .map(skill => skill.name)
      .filter(Boolean),
    education: educationOf(data.educations, locale),
    certificates: certificatesOf(data.certificates, locale),
    languages: languagesOf(profile),
  };
}
