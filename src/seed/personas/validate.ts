import { HOME_BLOG_SLOTS } from '@/features/blog/constants';
import { HOME_PRODUCT_SLOTS } from '@/features/products/constants';
import { HOME_PROJECT_SLOTS } from '@/features/projects/constants';
import { MAX_GALLERY_IMAGES, LANGUAGE_LEVELS, MAX_LANGUAGES, PRODUCT_CURRENCIES } from '@/constants/global';
import { MAX_SOCIALS, SOCIAL_ICONS } from '@/features/socials/constants';
import { SKILL_ICONS } from '@/features/skills/constants';
import { PERSIAN_MONTHS } from '@/lib/utils';
import type { ICertificate } from '@/features/certificate/types';
import type { Content, Localized, Persona, PersonaPost, PersonaProduct, PersonaProject } from '@/seed/personas/types';

/**
 * The seed audit — the reason a demo site can be trusted to look finished.
 *
 * Persona content is authored by hand, in two languages, as parallel arrays that
 * `withBothLangs` flattens at insert time. Nothing in TypeScript can see that the third
 * Persian project is the translation of the third English one, so a missing translation, a
 * Jalali month that drifted from its Gregorian twin, an icon slug the dashboard's picker no
 * longer offers, or a featured record sitting behind `active: false` all seed cleanly and
 * only show up later as a broken demo.
 *
 * So the shape is checked before anything reaches MongoDB, in two grades:
 *
 * - **errors** abort the seed — the document set is inconsistent, unrenderable, or would put
 *   the dashboard in a state it refuses to save back.
 * - **warnings** are printed — craft rules whose violation is visible but not broken, like a
 *   Persian article that dropped the code block its English twin kept.
 *
 * `--check` runs the audit over every persona without touching a database; a normal seed runs
 * the same audit on the persona it is about to insert.
 */

/** One line of the report. */
export type SeedIssue = { level: 'error' | 'warning'; message: string };

const fail = (message: string): SeedIssue => ({ level: 'error', message });
const note = (message: string): SeedIssue => ({ level: 'warning', message });

/** A `YYYY/MM` month, the shape every timeline record stores its dates in. */
type MonthKey = string;

const GREGORIAN = /^\d{4}\/\d{2}$/;

const ENGLISH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Both locales' words for an open-ended range. */
const OPEN_ENDED = ['present', 'now', 'ongoing', 'current', 'اکنون', 'هم‌اکنون', 'هم اکنون', 'الان'];

/** Membership against a list typed narrower than `string`. */
const isListed = (catalogue: readonly string[], value?: string) => Boolean(value && catalogue.includes(value));

/**
 * The Jalali months a Gregorian month spans. Almost every month straddles two — May 2022 is
 * Ordibehesht until the 21st and Khordad after it — so a Persian field is aligned when it names
 * either of them. `Intl` owns the arithmetic, the same calendar extension the pages format with.
 */
const jalaliMonths = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: 'numeric', timeZone: 'UTC' });

const jalaliKeyOf = (date: Date): MonthKey => {
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(jalaliMonths.formatToParts(date).find(item => item.type === type)?.value ?? '');
  return `${String(part('year')).padStart(4, '0')}/${String(part('month')).padStart(2, '0')}`;
};

export function jalaliMonthsFor(ym: MonthKey): MonthKey[] {
  if (!GREGORIAN.test(ym)) return [];
  const [year, month] = ym.split('/').map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  return [...new Set([jalaliKeyOf(first), jalaliKeyOf(last)])];
}

/** How a Gregorian month should be named in Persian, spelled out for the message. */
const jalaliMonthName = (ym: MonthKey) => {
  const options = jalaliMonthsFor(ym);
  const [year, month] = ym.split('/').map(Number);
  if (!options.length) return '';
  const names = options.map(option => PERSIAN_MONTHS[Number(option.split('/')[1]) - 1]);
  return `${names.join(' or ')} ${options[0].split('/')[0]} (for ${String(month).padStart(2, '0')}/${year})`;
};

/** Persian and Arabic-Indic digits to ASCII, so one number parser serves both calendars. */
const toAsciiDigits = (text: string) => text.replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

/** The digits of a phone number, in the last ten, so `+98 912…` and `۰۹۱۲…` compare equal. */
const phoneCore = (tel: string) => toAsciiDigits(tel).replace(/\D/g, '').slice(-10);

/** `Month YYYY` in either calendar, or `null` when the text is open-ended or unreadable. */
function parseMonthYear(text: string, names: string[]): MonthKey | null {
  const normalized = toAsciiDigits(text).trim().toLowerCase();
  if (OPEN_ENDED.some(word => normalized.includes(word))) return null;

  const month = names.findIndex(name => normalized.startsWith(name.toLowerCase()));
  const year = normalized.match(/\d{4}/)?.[0];
  if (month < 0 || !year) return null;

  return `${year}/${String(month + 1).padStart(2, '0')}`;
}

/**
 * The two ends of a free-text `dates` string. Returns `null` only when the first end cannot
 * be read at all, which means the field is not a month range and has nothing to check.
 */
function parseRange(text: string, calendar: 'gregorian' | 'jalali'): { from: MonthKey; to: MonthKey } | null {
  const parts = text.split(/\s+[-–—]\s+/);
  if (parts.length !== 2) return null;

  const names = calendar === 'jalali' ? PERSIAN_MONTHS : ENGLISH_MONTHS;
  const from = parseMonthYear(parts[0], names);
  if (!from) return null;

  return { from, to: parseMonthYear(parts[1], names) ?? '' };
}

/** The Persian months each end of an English range is allowed to name. */
function jalaliRangeOptions(enText: string): { from: MonthKey[]; to: MonthKey[] } | null {
  const range = parseRange(enText, 'gregorian');
  if (!range) return null;
  return { from: jalaliMonthsFor(range.from), to: range.to ? jalaliMonthsFor(range.to) : [] };
}

/** One open-ended range must stay open-ended in the other calendar too. */
const isOpenEnded = (text: string) => OPEN_ENDED.some(word => text.toLowerCase().includes(word));

/** Counts the Markdown furniture of a body, so a translation can be compared for shape. */
function bodyShape(body: string | undefined) {
  const text = toAsciiDigits(body ?? '');
  return {
    headings: (text.match(/^##\s/gm) ?? []).length,
    codeBlocks: Math.floor((text.match(/^```/gm) ?? []).length / 2),
    tables: (text.match(/^\|\s*:?-{2,}/gm) ?? []).length,
    lists: (text.match(/^(?:[-•*]\s|\d+\.\s)/gm) ?? []).length,
  };
}

/** What two locales of one record must agree on, beyond the words. */
interface ParityRule<T> {
  /** Where the pair came from — the prefix of every message. */
  section: string;
  /** Names one index, so a message points at a record rather than a row. */
  label: (item: T, index: number) => string;
  /** Fields a translation may not change. */
  same: { key: string; pick: (item: T) => unknown }[];
  /** Reads the body whose shape is compared between the locales. */
  body?: (item: T) => string | undefined;
  /** Free-text month range, given as `[english, persian]`, that must describe the same span. */
  range?: (en: T, fa: T) => [string, string];
  /** Fields whose digits must describe the same number in the locale's own digits. */
  phone?: (item: T) => string | undefined;
}

/** Compares the two locales of one authored pair, index against index. */
function auditPair<T extends object>(pair: Localized<T>, rule: ParityRule<T>, issues: SeedIssue[]) {
  const { en, fa } = pair;

  if (en.length !== fa.length) {
    issues.push(fail(`${rule.section}: ${en.length} English record(s) but ${fa.length} Persian — every record needs both locales or neither.`));
    return;
  }

  en.forEach((english, index) => {
    const persian = fa[index];
    const at = `${rule.section} › ${rule.label(english, index)}`;

    for (const { key, pick } of rule.same) {
      const left = pick(english);
      const right = pick(persian);
      if (JSON.stringify(left) !== JSON.stringify(right)) {
        issues.push(fail(`${at}: "${key}" differs between the locales (${JSON.stringify(left)} vs ${JSON.stringify(right)}).`));
      }
    }

    if (rule.range) {
      const [enText, faText] = rule.range(english, persian);
      const options = jalaliRangeOptions(enText);
      const found = parseRange(faText, 'jalali');
      if (!options || !found) return;

      const aligned = (list: MonthKey[], value: MonthKey) => !list.length || list.includes(value);
      if (!aligned(options.from, found.from) || !aligned(options.to, found.to) || isOpenEnded(enText) !== isOpenEnded(faText)) {
        issues.push(
          fail(
            `${at}: "${faText}" is not the Jalali face of "${enText}" — expected ${options.from.join(' or ')} to ${options.to.join(' or ') || 'open'}.`
          )
        );
      }
    }

    if (rule.phone) {
      const enNumber = phoneCore(rule.phone(english) ?? '');
      const faNumber = phoneCore(rule.phone(persian) ?? '');
      if (enNumber && faNumber && enNumber !== faNumber) {
        issues.push(fail(`${at}: the two locales give different phone numbers (${enNumber} vs ${faNumber}).`));
      }
    }

    if (rule.body) {
      const enShape = bodyShape(rule.body(english));
      const faShape = bodyShape(rule.body(persian));
      const drift = (label: string, left: number, right: number) => {
        if (left !== right) issues.push(note(`${at}: the Persian body carries ${right} ${label} against ${left} in English.`));
      };
      drift('code block(s)', enShape.codeBlocks, faShape.codeBlocks);
      drift('table(s)', enShape.tables, faShape.tables);
      drift('section heading(s)', enShape.headings, faShape.headings);
      drift('list item(s)', enShape.lists, faShape.lists);
    }
  });
}

/** `createdAt` sanity for the archives that sort on it. */
function auditDates<T extends { createdAt?: string }>(section: string, list: T[], issues: SeedIssue[]) {
  const stamps = list.map(item => Date.parse(item.createdAt ?? ''));

  if (stamps.some(Number.isNaN)) {
    issues.push(fail(`${section}: every record needs an ISO "createdAt" the archive can sort on.`));
    return;
  }

  if (stamps.some(stamp => stamp > Date.now())) issues.push(note(`${section}: a record is dated in the future.`));
  if (stamps.some((stamp, index) => stamps.indexOf(stamp) !== index)) {
    issues.push(fail(`${section}: two records share one "createdAt", which makes their order in the archive a coin toss.`));
  }
  if (stamps.some((stamp, index) => index > 0 && stamp > stamps[index - 1])) {
    issues.push(note(`${section}: authored oldest-first; the lists sort newest-first, so author the order you want read.`));
  }
}

/** The cover is the first gallery picture — what the dashboard writes and the cards read. */
function auditMedia(section: string, items: { label: string; image?: string; images?: string[] }[], issues: SeedIssue[]) {
  for (const item of items) {
    const gallery = item.images ?? [];
    if (gallery.length > MAX_GALLERY_IMAGES) {
      issues.push(fail(`${section} › ${item.label}: ${gallery.length} pictures, and a record may carry ${MAX_GALLERY_IMAGES}.`));
    }
    if (gallery.length && item.image !== gallery[0]) {
      issues.push(fail(`${section} › ${item.label}: the cover is not the first gallery picture, so the card and the page disagree.`));
    }
  }
}

/** Home-row picks: capped by the slots the section has, and only worth counting when visible. */
function auditHomePicks<T extends { featured?: boolean }>(
  section: string,
  list: T[],
  slots: number,
  visible: (item: T) => boolean,
  issues: SeedIssue[]
) {
  const picks = list.filter(item => item.featured);
  if (picks.length > slots) issues.push(fail(`${section}: ${picks.length} record(s) claim a home slot, and the row has ${slots}.`));
  if (picks.some(item => !visible(item))) {
    issues.push(fail(`${section}: a featured record is not public, so it claims a home slot nothing can render.`));
  }
}

/** A slug the shared picker no longer offers renders fine but cannot be re-picked. */
function auditIcon(section: string, label: string, icon: string | undefined, catalogue: readonly string[], issues: SeedIssue[]) {
  if (icon && !isListed(catalogue, icon)) {
    issues.push(fail(`${section} › ${label}: icon "${icon}" is not in the dashboard's catalogue, so the picker drops it on the next save.`));
  }
}

function auditProfile(persona: Persona, issues: SeedIssue[]) {
  const { en, fa } = persona.profile;
  if (en.length !== 1 || fa.length !== 1) {
    issues.push(fail(`profile: a persona is one person — exactly one document per locale, found ${en.length} EN and ${fa.length} FA.`));
    return;
  }

  const owner = en[0];
  if (owner.fullName !== persona.profile.fa[0]?.fullName && !owner.fullName.startsWith(owner.name)) {
    issues.push(note('profile: `name` should be the given part of `fullName`, which is what the greeting reads.'));
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(owner.email ?? ''))
    issues.push(fail(`profile: "${owner.email}" is not an address a reader could write to.`));
  if (!phoneCore(owner.tel ?? '')) issues.push(fail('profile: no phone number for the contact section to show.'));
  if (!owner.summary) issues.push(note('profile: no summary, so the hero and the social card have one line short.'));

  const spoken = owner.languages ?? [];
  if (!spoken.length) issues.push(note('profile: no spoken languages, so the résumé prints an empty band.'));
  if (spoken.length > MAX_LANGUAGES) issues.push(fail(`profile: ${spoken.length} languages, and the résumé sheet holds ${MAX_LANGUAGES}.`));

  const ranks = spoken.map(language => LANGUAGE_LEVELS.indexOf(language.level));
  if (ranks.some(rank => rank < 0))
    issues.push(fail('profile: a language carries a level outside LANGUAGE_LEVELS, so the résumé cannot draw its dots.'));
  if (ranks.some((rank, index) => index > 0 && rank > ranks[index - 1])) {
    issues.push(note('profile: languages should run most fluent first — that is the order the dot scale reads as.'));
  }

  auditPair(
    persona.profile,
    {
      section: 'profile',
      label: () => owner.fullName,
      same: [
        { key: 'avatarUrl', pick: p => p.avatarUrl },
        { key: 'email', pick: p => p.email },
      ],
      body: p => p.description,
      phone: p => p.tel,
    },
    issues
  );

  if (!fa[0]?.fullName.trim()) issues.push(fail('profile: the Persian site has no name to greet a reader with.'));
}

function auditSocials(persona: Persona, issues: SeedIssue[]) {
  persona.socials.en.forEach(social => {
    auditIcon('socials', social.name, social.icon, SOCIAL_ICONS, issues);
    if (!/^https?:\/\/[^\s]+$/.test(social.url)) issues.push(fail(`socials › ${social.name}: "${social.url}" is not a URL a reader can be sent to.`));
  });

  if (persona.socials.en.length > MAX_SOCIALS) {
    issues.push(
      fail(
        `socials: ${persona.socials.en.length} channels, and the dashboard stops adding at ${MAX_SOCIALS} — the demo would open on a list it cannot edit.`
      )
    );
  }

  auditPair(
    persona.socials,
    {
      section: 'socials',
      label: item => item.name,
      same: [
        { key: 'url', pick: s => s.url },
        { key: 'icon', pick: s => s.icon },
      ],
    },
    issues
  );
}

function auditSkills(persona: Persona, issues: SeedIssue[]) {
  persona.skills.en.forEach(skill => {
    auditIcon('skills', skill.name, skill.icon, SKILL_ICONS, issues);
    if (!skill.name.trim()) issues.push(fail('skills: a badge without a name renders as an empty pill.'));
  });

  const ranked = persona.skills.en.filter(skill => skill.order !== undefined).map(skill => skill.order);
  if (ranked.length && ranked.length !== persona.skills.en.length) {
    issues.push(fail('skills: some badges carry an order and some do not, so the toolkit sorts by a mix of rank and alphabet.'));
  }
  if (new Set(ranked).size !== ranked.length)
    issues.push(fail('skills: two badges share one order, which makes their pair the archive shows a coin toss.'));

  auditPair(persona.skills, { section: 'skills', label: item => item.name, same: [{ key: 'icon', pick: s => s.icon }] }, issues);
}

/** Career and study records: the two locales store the same months in two calendars. */
function auditTimeline<T extends { start?: string; end?: string; href?: string }>(
  section: string,
  pair: Localized<T>,
  name: (item: T) => string,
  issues: SeedIssue[],
  options: { current?: boolean } = {}
) {
  const { en, fa } = pair;

  en.forEach((item, index) => {
    const at = `${section} › ${name(item)}`;
    if (item.start && !GREGORIAN.test(item.start)) issues.push(fail(`${at}: start "${item.start}" is not the YYYY/MM the month picker writes.`));
    if (item.end && !GREGORIAN.test(item.end)) issues.push(fail(`${at}: end "${item.end}" is not the YYYY/MM the month picker writes.`));
    if (item.start && item.end && item.end < item.start) issues.push(fail(`${at}: ends ${item.end} before it started ${item.start}.`));

    const persian = fa[index];
    if (!persian) return;

    if (item.start && persian.start && !jalaliMonthsFor(item.start).includes(persian.start)) {
      issues.push(fail(`${at}: Persian start "${persian.start}" is not the month ${item.start} falls in — expected ${jalaliMonthName(item.start)}.`));
    }

    if (item.end ? persian.end !== undefined && !jalaliMonthsFor(item.end).includes(persian.end) : Boolean(persian.end)) {
      issues.push(
        fail(
          item.end
            ? `${at}: Persian end "${persian.end}" is not the month ${item.end} falls in — expected ${jalaliMonthName(item.end)}.`
            : `${at}: the English record is current but the Persian one ends ${persian.end}, so the two sites describe different careers.`
        )
      );
    }
  });

  if (options.current) {
    const open = en.filter(item => !item.end);
    if (open.length > 1) issues.push(fail(`${section}: ${open.length} records are open-ended; only the current one may have no end.`));
    if (open.length === 1 && en.indexOf(open[0]) !== 0)
      issues.push(fail(`${section}: the current record is not first, so the newest role is not what the list leads with.`));
    if (!open.length) issues.push(note(`${section}: nothing is current — a history with no present tense reads as somebody who stopped.`));

    en.forEach((item, index) => {
      const earlier = en[index + 1];
      if (index === 0 || !earlier || !item.start || !earlier.end) return;
      if (item.start < earlier.end)
        issues.push(fail(`${section} › ${name(item)}: starts ${item.start}, inside the role before it that ran to ${earlier.end}.`));
    });
  }

  auditPair(
    pair,
    {
      section,
      label: name,
      same: [{ key: 'href', pick: item => item.href }],
    },
    issues
  );
}

function auditProjects(persona: Persona, issues: SeedIssue[]) {
  const { en } = persona.projects;

  auditPair<PersonaProject>(
    persona.projects,
    {
      section: 'projects',
      label: item => item.slug || item.title,
      same: [
        { key: 'slug', pick: p => p.slug },
        { key: 'href', pick: p => p.href },
        { key: 'createdAt', pick: p => p.createdAt },
        { key: 'active', pick: p => p.active },
        { key: 'featured', pick: p => p.featured },
        { key: 'image', pick: p => p.image },
        { key: 'images', pick: p => p.images },
        // A stack may be translated — «Usability Testing» reads better than a Latin chip on a
        // Persian page — but a translation may not add a tool or drop one.
        { key: 'technologies (count)', pick: p => p.technologies.length },
        { key: 'links', pick: p => (p.links ?? []).map(link => `${link.icon} ${link.href}`) },
      ],
      body: p => p.details,
      range: (project, persian) => [project.dates, persian.dates],
    },
    issues
  );

  en.forEach(project => {
    const at = `projects › ${project.slug || project.title}`;
    if (!project.slug) issues.push(fail('projects: a record without a slug has no stable URL, so the archive links to an id.'));
    if (!project.description.trim()) issues.push(fail(`${at}: an empty description leaves the card and the social preview with nothing to say.`));
    if (project.description.length > 240)
      issues.push(note(`${at}: the one-line description runs ${project.description.length} characters, past what a card holds.`));
    if (!project.technologies?.length) issues.push(note(`${at}: no technologies, so the card shows an empty stack row.`));
    if (!project.links?.length) issues.push(note(`${at}: no links, so nothing on the page can be visited.`));
    if (!project.details) issues.push(note(`${at}: no case study behind the card.`));
    if (!project.active) issues.push(note(`${at}: inactive, so it is on the archive's shelf rather than in front of anyone.`));
  });

  auditDates('projects', en, issues);
  auditHomePicks('projects', en, HOME_PROJECT_SLOTS, project => project.active, issues);
  auditMedia(
    'projects',
    en.map(project => ({ label: project.slug || project.title, image: project.image, images: project.images })),
    issues
  );
}

function auditProducts(persona: Persona, issues: SeedIssue[]) {
  const pair = persona.products;
  if (!pair?.en.length) {
    issues.push(note('products: no catalogue for this persona, so `/products` leaves the dock and the home row fills from projects.'));
    return;
  }

  auditPair<PersonaProduct>(
    pair,
    {
      section: 'products',
      label: item => item.slug || item.title,
      same: [
        { key: 'slug', pick: p => p.slug },
        { key: 'href', pick: p => p.href },
        { key: 'price', pick: p => p.price },
        { key: 'currency', pick: p => p.currency },
        { key: 'available', pick: p => p.available },
        { key: 'active', pick: p => p.active },
        { key: 'featured', pick: p => p.featured },
        { key: 'image', pick: p => p.image },
        { key: 'images', pick: p => p.images },
        { key: 'features', pick: p => p.features.length },
      ],
      body: p => p.details,
    },
    issues
  );

  pair.en.forEach(product => {
    const at = `products › ${product.slug || product.title}`;
    if (!product.slug) issues.push(fail('products: a record without a slug has no stable URL.'));
    if (!isListed(PRODUCT_CURRENCIES, product.currency)) issues.push(fail(`${at}: "${product.currency}" is not a currency the shop quotes in.`));
    if (!Number.isInteger(product.price) || product.price < 0) {
      issues.push(fail(`${at}: price ${product.price} must be a whole, non-negative number of ${product.currency} units.`));
    }
    if (product.price > 0 && product.price < 1000 && (product.currency === 'toman' || product.currency === 'rial')) {
      issues.push(note(`${at}: ${product.price} ${product.currency} is a rounding error as a price.`));
    }
    if (!product.features?.length) issues.push(note(`${at}: no "what you get" list, which is the part a buyer reads.`));
    if (!product.details) issues.push(note(`${at}: no page behind the card.`));
  });

  auditHomePicks('products', pair.en, HOME_PRODUCT_SLOTS, product => product.active && product.available, issues);
  auditMedia(
    'products',
    pair.en.map(product => ({ label: product.slug || product.title, image: product.image, images: product.images })),
    issues
  );
}

function auditPosts(persona: Persona, issues: SeedIssue[]) {
  const { en } = persona.posts;

  auditPair<PersonaPost>(
    persona.posts,
    {
      section: 'posts',
      label: item => item.slug,
      same: [
        { key: 'slug', pick: p => p.slug },
        { key: 'published', pick: p => p.published },
        { key: 'featured', pick: p => p.featured },
        { key: 'createdAt', pick: p => p.createdAt },
        { key: 'updatedAt', pick: p => p.updatedAt },
        { key: 'tags', pick: p => p.tags },
        { key: 'image', pick: p => p.image },
        { key: 'images', pick: p => p.images },
      ],
      body: p => p.content,
    },
    issues
  );

  en.forEach(post => {
    const at = `posts › ${post.slug}`;
    if (!post.slug) issues.push(fail('posts: an article without a slug cannot be linked to.'));
    if (!post.summary) issues.push(note(`${at}: no summary, so the list and the social card have nothing to quote.`));
    if (!post.tags?.length) issues.push(note(`${at}: no tags, so no filter and no related post can ever find it.`));
    if (post.published && post.featured === undefined) issues.push(note(`${at}: published but neither claiming nor declining a home slot.`));
    if (post.updatedAt && Date.parse(post.updatedAt) < Date.parse(post.createdAt)) {
      issues.push(fail(`${at}: updated before it was published (${post.updatedAt} < ${post.createdAt}).`));
    }
  });

  auditDates(
    'posts',
    en.filter(post => post.published),
    issues
  );
  auditHomePicks(
    'posts',
    en.filter(post => post.published),
    HOME_BLOG_SLOTS,
    post => Boolean(post.published),
    issues
  );
  auditMedia(
    'posts',
    en.map(post => ({ label: post.slug, image: post.image, images: post.images })),
    issues
  );
}

function auditCertificates(certificates: Localized<Content<ICertificate>>, issues: SeedIssue[]) {
  if (!certificates.en.length) {
    issues.push(note('certificates: none authored, and the career set in certificate.seed.ts has no entry either.'));
    return;
  }

  auditPair(
    certificates,
    {
      section: 'certificates',
      label: item => item.credentialId || item.title || 'credential',
      same: [
        { key: 'credentialId', pick: c => c.credentialId },
        { key: 'href', pick: c => c.href },
        { key: 'featured', pick: c => c.featured },
      ],
    },
    issues
  );

  certificates.en.forEach(credential => {
    const at = `certificates › ${credential.title || credential.credentialId || 'credential'}`;
    const issued = credential.issueDate ?? '';
    const expires = credential.expirationDate ?? '';
    if (issued && !GREGORIAN.test(issued)) issues.push(fail(`${at}: issueDate "${issued}" is not YYYY/MM.`));
    if (expires && issued && expires < issued) issues.push(fail(`${at}: lapses ${expires} before it was issued ${issued}.`));
    if (!credential.featured && !credential.description)
      issues.push(note(`${at}: no description and no place on the résumé, so the credential is invisible.`));
  });

  // The Persian dates are the same months in the other calendar, so they are compared as such.
  certificates.en.forEach((credential, index) => {
    const at = `certificates › ${credential.title || credential.credentialId || 'credential'}`;
    const persian = certificates.fa[index];
    if (!persian) return;

    const issued = credential.issueDate ?? '';
    if (issued && !jalaliMonthsFor(issued).includes(persian.issueDate ?? '')) {
      issues.push(
        fail(`${at}: Persian issueDate "${persian.issueDate ?? ''}" is not the month ${issued} falls in — expected ${jalaliMonthName(issued)}.`)
      );
    }

    const expires = credential.expirationDate ?? '';
    if (expires ? !jalaliMonthsFor(expires).includes(persian.expirationDate ?? '') : Boolean(persian.expirationDate)) {
      issues.push(
        fail(
          expires
            ? `${at}: Persian expirationDate "${persian.expirationDate ?? ''}" is not the month ${expires} falls in — expected ${jalaliMonthName(expires)}.`
            : `${at}: the credential does not lapse in English but carries an expiry in Persian (${persian.expirationDate}).`
        )
      );
    }
  });
}

/**
 * Every rule above, for one persona.
 *
 * `certificates` is the list the seed will actually insert: a persona that authors its own
 * wins, otherwise the set written for its career in `certificate.seed.ts` is passed in, so
 * the audit never checks a document the database will not receive.
 */
export function validatePersona(persona: Persona, certificates?: Localized<Content<ICertificate>>): SeedIssue[] {
  const issues: SeedIssue[] = [];

  if (!persona.label.trim()) issues.push(fail('label: the seed log prints this, and an empty line is not an identity.'));

  auditProfile(persona, issues);
  auditSocials(persona, issues);
  auditSkills(persona, issues);
  auditTimeline('works', persona.works, work => work.company || work.title || 'role', issues, { current: true });
  auditTimeline('education', persona.educations, study => study.school || 'study', issues);
  auditProjects(persona, issues);
  auditProducts(persona, issues);
  auditPosts(persona, issues);
  auditCertificates(certificates ?? persona.certificates ?? { en: [], fa: [] }, issues);

  return issues;
}

/** The half of the report that has to be fixed before anything is inserted. */
export const seedErrors = (issues: SeedIssue[]) => issues.filter(issue => issue.level === 'error');

/** The report as printed lines: errors first, then the craft notes. */
export function formatIssues(personaId: string, issues: SeedIssue[]): string[] {
  if (!issues.length) return [`  ${personaId}: clean.`];

  const lines = (level: SeedIssue['level'], marker: string) =>
    issues.filter(issue => issue.level === level).map(issue => `  ${personaId} ${marker} ${issue.message}`);

  return [...lines('error', '✖'), ...lines('warning', '!')];
}
