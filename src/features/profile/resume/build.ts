import { LANGUAGE_LEVELS } from '@/constants/global';
import { MAX_RESUME_CERTIFICATES } from '@/features/certificate/constants';
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

/** A credential that does not lapse, per locale. Kept short: the rail is narrow. */
const NO_EXPIRY: Record<AppLocale, string> = { en: 'No expiry', fa: 'بدون انقضا' };

/**
 * How much of each section the sheet carries. The bounds are the document's own — they
 * are what keeps a profile that outgrew a page reading as a résumé rather than as a
 * data dump — so they live in one place instead of scattered through the builders.
 */
const LIMITS = {
  experience: 3,
  bullets: 4,
  bulletChars: 170,
  projects: 3,
  projectTech: 6,
  projectLinks: 2,
  projectChars: 150,
  education: 3,
  certificates: MAX_RESUME_CERTIFICATES,
  skills: 18,
  languages: 6,
  socials: 3,
  summaryChars: 480,
  /** What a search result renders before it truncates on its own. */
  descriptionChars: 155,
} as const;

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

/** Trim on a word boundary so one over-long line never dominates a narrow column. */
function clip(text: string | undefined, max: number): string | undefined {
  const value = text?.trim();
  if (!value) return undefined;
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const edge = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf('٬'), 0);
  return `${cut.slice(0, edge > 0 ? edge : max)}…`;
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
  return out.slice(0, LIMITS.projectLinks);
}

function experienceOf(works: IWork[], locale: AppLocale): ResumeExperience[] {
  return works.slice(0, LIMITS.experience).map(work => ({
    role: work.title?.trim() || '',
    company: work.company?.trim() || '',
    location: work.location?.trim() || undefined,
    period: period(work.start, work.end, locale),
    bullets: bulletsOf(work.description)
      .slice(0, LIMITS.bullets)
      .map(bullet => clip(bullet, LIMITS.bulletChars) ?? bullet),
  }));
}

function educationOf(educations: PortfolioData['educations'], locale: AppLocale): ResumeEducation[] {
  return educations.slice(0, LIMITS.education).map(edu => ({
    degree: edu.degree?.trim() || undefined,
    school: edu.school?.trim() || undefined,
    period: period(edu.start, edu.end, locale),
  }));
}

/**
 * The credentials the sheet carries: the ones the owner marked for the résumé lead,
 * and the newest of the rest fill whatever room is left. `sort` is stable, so inside
 * each group the database order — most recently issued first — is kept, and an owner
 * who marks more than the sheet holds still gets their own picks printed.
 */
function certificatesOf(certificates: PortfolioData['certificates'], locale: AppLocale): ResumeCertificate[] {
  return certificates
    .filter(certificate => certificate.title?.trim())
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, LIMITS.certificates)
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
    .slice(0, LIMITS.languages)
    .map(language => ({ name: language.name.trim(), level: language.level }));
}

/**
 * The opening paragraph: the summary, else the first block of the long-form bio.
 * Shared with the page's metadata, so what a search result says and what the sheet
 * opens with can never drift apart.
 */
export function resumeSummary(profile?: Pick<IProfile, 'summary' | 'description'> | null): string | undefined {
  const summary = profile?.summary?.trim();
  if (summary) return clip(summary, LIMITS.summaryChars);
  const first = profile?.description?.split(/\n\s*\n/).find(block => block.trim());
  return clip(
    first
      ?.replace(/[#*_>`-]/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
    LIMITS.summaryChars
  );
}

/**
 * The one sentence a search result or a link preview shows.
 *
 * Cut to the length the crawlers actually render rather than truncated with an ellipsis
 * they append themselves, and shared by `<meta>`, Open Graph, Twitter and the JSON-LD —
 * four places a reader may compare against each other.
 */
export function seoDescription(text?: string): string {
  const value = text?.replace(/\s+/g, ' ').trim();
  if (!value) return '';
  if (value.length <= LIMITS.descriptionChars) return value;
  const edge = value.lastIndexOf(' ', LIMITS.descriptionChars);
  return `${value.slice(0, edge > 0 ? edge : LIMITS.descriptionChars).replace(/[,;:.]$/, '')}…`;
}

/**
 * Shape the loaded data into a résumé, or `null` when there is no profile to head it.
 * Sections are bounded (roles, projects, study, credentials, skills) and long lines
 * clipped to keep the document tight; when the flow still outgrows a sheet, the layout
 * turns to a further column or page rather than squeezing the type.
 */
export function buildResume(data: PortfolioData, locale: AppLocale): ResumeModel | null {
  const { profile, socials, skills, projects } = data;
  if (!profile) return null;

  const contacts: ResumeContact[] = [];
  if (profile.email) contacts.push({ value: profile.email, href: `mailto:${profile.email}`, icon: 'mail' });
  if (profile.tel) contacts.push({ value: profile.tel, href: `tel:${toDialNumber(profile.tel)}`, icon: 'phone' });
  const socialContacts = socials
    .map(social => ({ social, href: safeHref(social.url) }))
    .filter((entry): entry is { social: PortfolioData['socials'][number]; href: string } => entry.href !== undefined)
    .slice(0, LIMITS.socials);
  for (const { social, href } of socialContacts) {
    contacts.push({
      value: social.name?.trim() || formatSocialHandle(href),
      href,
      icon: social.icon?.toLowerCase() || 'link',
    });
  }

  const selected = [...projects.filter(project => project.active)]
    .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    .slice(0, LIMITS.projects);

  return {
    locale,
    name: profile.fullName?.trim() || profile.name?.trim() || '',
    role: profile.jobTitle?.trim() || '',
    contacts,
    summary: resumeSummary(profile),
    experience: experienceOf(data.works, locale),
    projects: selected.map(project => ({
      title: project.title,
      description: clip(project.description, LIMITS.projectChars),
      period: project.dates?.trim() || undefined,
      technologies: (project.technologies ?? []).filter(Boolean).slice(0, LIMITS.projectTech),
      links: linksOf(project),
    })),
    skills: skills
      .map(skill => skill.name)
      .filter(Boolean)
      .slice(0, LIMITS.skills),
    education: educationOf(data.educations, locale),
    certificates: certificatesOf(data.certificates, locale),
    languages: languagesOf(profile),
  };
}
