import { ogImageFor, site } from '@/lib/seo';
import type { ResumeModel } from '@/features/profile/resume/build';
import type { AppLocale, LanguageLevel } from '@/types';

/**
 * The résumé as a page: a standalone, print-ready HTML document.
 *
 * Served straight from the resume route, outside the app shell, so a visitor can save
 * it as a PDF with the site's own fonts already loaded. `build.ts` decides what the
 * résumé says; this file decides how it looks and that it lands on one page.
 *
 * The layout is the form recruiters expect — a header band (name, headline, iconed
 * contact run), a full-width summary, then a two-column body that flows in priority
 * order: experience leads, followed by skills, projects, education and languages. The
 * palette mirrors the app's own neutral light/dark tokens (so it reads as the same
 * product) with a single restrained accent for the headline, company and links.
 *
 * One page is a hard requirement: the sheet is a fixed A4 box and a small script scales
 * the content down (never up) until it fits, so the print/PDF is always exactly one page
 * however much the profile carries.
 */

/** Section headings and chrome, bilingual: there is no i18n provider in a bare route. */
const TEXT: Record<AppLocale, {
  docTitle: string;
  save: string;
  close: string;
  hint: string;
  switchLanguage: string;
  switchTheme: string;
  empty: string;
  emptyHint: string;
  summary: string;
  experience: string;
  projects: string;
  skills: string;
  education: string;
  languages: string;
}> = {
  en: {
    docTitle: 'Resume',
    save: 'Save as PDF',
    close: 'Close',
    hint: 'Choose “Save as PDF” in the print dialog.',
    switchLanguage: 'Switch language',
    switchTheme: 'Switch theme',
    empty: 'No resume is available yet.',
    emptyHint: 'The profile this resume is built from has not been published.',
    summary: 'Summary',
    experience: 'Work Experience',
    projects: 'Projects',
    skills: 'Skills',
    education: 'Education',
    languages: 'Languages',
  },
  fa: {
    docTitle: 'رزومه',
    save: 'ذخیره PDF',
    close: 'بستن',
    hint: 'در پنجره چاپ، «Save as PDF» را انتخاب کنید.',
    switchLanguage: 'تغییر زبان',
    switchTheme: 'تغییر پوسته',
    empty: 'هنوز رزومه‌ای در دسترس نیست.',
    emptyHint: 'پروفایلی که این رزومه از آن ساخته می‌شود منتشر نشده است.',
    summary: 'خلاصه',
    experience: 'سوابق شغلی',
    projects: 'پروژه‌ها',
    skills: 'مهارت‌ها',
    education: 'تحصیلات',
    languages: 'زبان‌ها',
  },
};

/** Proficiency labels per locale, keyed by the same levels the dashboard edits. */
const LEVEL_LABELS: Record<AppLocale, Record<LanguageLevel, string>> = {
  en: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', fluent: 'Fluent', native: 'Native' },
  fa: { beginner: 'مبتدی', intermediate: 'متوسط', advanced: 'پیشرفته', fluent: 'روان', native: 'بومی' },
};

/** Escape a value for safe interpolation into HTML text or an attribute. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Inline glyphs (12–14px, currentColor) so the header and meta lines read at a glance. */
const ICON: Record<string, string> = {
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5c0-.6.4-1 1-1h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L18 14l4 1.5V18c0 .6-.4 1-1 1A16 16 0 0 1 4 5Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z"/><circle cx="12" cy="11" r="2"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a4 4 0 0 0 6 .5l2.5-2.5a4 4 0 0 0-5.7-5.7L11.5 6.6"/><path d="M14 11a4 4 0 0 0-6-.5L5.5 13a4 4 0 0 0 5.7 5.7l1.3-1.3"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.6 2 12.3c0 4.5 2.9 8.4 6.8 9.7.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.3-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5.1 0-1.1.4-2 1-2.8-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.8 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.7 1 2.8 0 4-2.4 4.8-4.6 5.1.3.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.3 10.3 0 0 0 22 12.3C22 6.6 17.5 2 12 2Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21H17.6v-5.1c0-1.22-.02-2.78-1.9-2.78-1.9 0-2.2 1.32-2.2 2.68V21H9z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.6L22 21h-6.2l-4.3-5.6L6.3 21H3.3l7-8.1L2.5 3H9l3.9 5.2L17.5 3Zm-1.1 16h1.7L7.7 4.8H5.9L16.4 19Z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.6L22 21h-6.2l-4.3-5.6L6.3 21H3.3l7-8.1L2.5 3H9l3.9 5.2L17.5 3Zm-1.1 16h1.7L7.7 4.8H5.9L16.4 19Z"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.6 20c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.1 13.3l-4.8-1.5c-1-.3-1-1 .2-1.5l18.8-7.2c.9-.3 1.6.2 1.3 1.4Z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm5.3 14c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a11 11 0 0 1-5.9-5.2c-.4-.8-.6-1.6-.4-2.2.1-.4.6-1.1 1-1.2.3-.2.8-.1 1 .3l.6 1.3c.1.3 0 .5-.2.7l-.4.5c-.1.2-.2.3 0 .6.5.9 1.5 1.7 2.5 2 .3.1.5 0 .6-.2l.5-.6c.2-.2.4-.3.7-.1l1.4.7c.3.2.4.4.3.7Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.3-.4-4.8a2.5 2.5 0 0 0-1.8-1.8C19.2 5 12 5 12 5s-7.2 0-8.8.4A2.5 2.5 0 0 0 1.4 7.2C1 8.7 1 12 1 12s0 3.3.4 4.8a2.5 2.5 0 0 0 1.8 1.8C4.8 19 12 19 12 19s7.2 0 8.8-.4a2.5 2.5 0 0 0 1.8-1.8C23 15.3 23 12 23 12ZM10 15V9l5 3-5 3Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
};

/** Resolve an icon key to a glyph, falling back to a link for anything unknown. */
function glyph(key: string): string {
  return ICON[key] ?? ICON.link;
}

/** Self-hosted faces, referenced from `/public/fonts` (served in dev and prod alike). */
const FONTS = `
  @font-face { font-family: 'Roboto'; src: url('/fonts/Roboto-Regular.ttf') format('truetype'); font-weight: 400; font-display: swap; }
  @font-face { font-family: 'Roboto'; src: url('/fonts/Roboto-Bold.ttf') format('truetype'); font-weight: 700; font-display: swap; }
  @font-face { font-family: 'Estedad'; src: url('/fonts/Estedad-Regular.ttf') format('truetype'); font-weight: 400; font-display: swap; }
`;

/**
 * The sheet is a fixed A4 canvas (794 × 1122 CSS px = 210 × 297 mm at 96 dpi). The
 * two columns live inside it and the whole content is scaled to fit, so print is one page.
 */
const STYLE = `
  :root {
    color-scheme: light;
    --stage-bg:#f5f5f5; --page-bg:#ffffff; --ink:#0a0a0a; --accent:#2b6cb0; --muted:#666666; --line:#e5e5e5; --body:#171717;
    --icon:#737373; --rule:#0a0a0a; --shadow:0 6px 24px rgba(0,0,0,.08);
    --tb-bg:rgba(255,255,255,.9); --tb-border:#e5e5e5; --tb-fg:#525252;
    --b1-bg:#0a0a0a; --b1-fg:#fafafa; --b1-hover:#262626;
    --b2-fg:#171717; --b2-hover:#f0f0f0;
  }
  html[data-theme='dark'] {
    color-scheme: dark;
    --stage-bg:#0a0a0a; --page-bg:#0f0f0f; --ink:#f5f5f5; --accent:#7fb2e5; --muted:#a6a6a6; --line:#2b2b2b; --body:#d4d4d4;
    --icon:#a6a6a6; --rule:#f5f5f5; --shadow:0 6px 24px rgba(0,0,0,.6);
    --tb-bg:rgba(10,10,10,.9); --tb-border:#2b2b2b; --tb-fg:#d4d4d4;
    --b1-bg:#f5f5f5; --b1-fg:#0a0a0a; --b1-hover:#e0e0e0;
    --b2-fg:#e5e5e5; --b2-hover:#262626;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: var(--stage-bg); color: var(--body);
    font-family: 'Roboto', system-ui, -apple-system, sans-serif;
    font-size: 14px; line-height: 1.4;
    -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
  }
  html[dir='rtl'] body { font-family: 'Estedad', system-ui, sans-serif; line-height: 1.7; }

  .toolbar {
    position: sticky; top: 0; z-index: 10;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 20px; background: var(--tb-bg);
    backdrop-filter: saturate(180%) blur(6px); border-bottom: 1px solid var(--tb-border);
  }
  .toolbar__hint { font-size: 13px; font-weight: 500; color: var(--tb-fg); }
  .toolbar__actions { display: flex; align-items: center; gap: 8px; }
  .btn {
    appearance: none; cursor: pointer; font: inherit; font-size: 13px; font-weight: 500;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none;
    height: 34px; padding: 0 14px; border-radius: 999px; border: 1px solid transparent;
    transition: background-color .15s ease, color .15s ease;
  }
  .btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .btn--primary { background: var(--b1-bg); color: var(--b1-fg); }
  .btn--primary:hover { background: var(--b1-hover); }
  .btn--ghost { background: transparent; color: var(--b2-fg); }
  .btn--ghost:hover { background: var(--b2-hover); }
  .btn--icon { width: 34px; padding: 0; }
  .btn svg { width: 16px; height: 16px; display: block; }
  .ico-sun { display: none; }
  .ico-moon { display: block; }
  html[data-theme='dark'] .ico-sun { display: block; }
  html[data-theme='dark'] .ico-moon { display: none; }

  .stage { display: flex; justify-content: center; padding: 28px 0 64px; overflow: hidden; }
  .page {
    width: 794px; height: 1122px; flex: none;
    padding: 42px 46px; background: var(--page-bg); overflow: hidden;
    box-shadow: var(--shadow);
    transform-origin: top center;
  }
  .content { transform-origin: top center; }

  /* Header band */
  .head__name { margin: 0; font-size: 30px; font-weight: 700; color: var(--ink); line-height: 1.05; }
  html[dir='ltr'] .head__name { text-transform: uppercase; letter-spacing: .015em; }
  .head__title { margin: 3px 0 0; font-size: 15px; font-weight: 600; color: var(--accent); }
  .head__contacts { margin: 11px 0 0; display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 12px; color: var(--muted); }
  .head__c { display: inline-flex; align-items: center; gap: 5px; }
  .head__c svg { width: 13px; height: 13px; flex: none; color: var(--icon); }
  .head__c a { color: inherit; text-decoration: none; }
  .head__rule { height: 2px; background: var(--rule); border: 0; margin: 14px 0 0; }

  /* Summary banner: full width, sits above the flowing columns */
  .sec--summary { margin-top: 16px; }
  .summary { margin: 0; font-size: 12.5px; line-height: 1.5; color: var(--body); text-align: justify; }
  html[dir='rtl'] .summary { text-align: right; }

  /* Flowing body: sections fill column one top-to-bottom, then continue in column two,
     so a short experience never leaves a dead gap. Balance keeps the two even. */
  .flow { column-count: 2; column-fill: balance; column-gap: 30px; margin-top: 18px; }
  .flow > .sec { break-inside: avoid; }
  .flow > .sec--exp { break-inside: auto; }
  .xp { break-inside: avoid; }

  .sh { margin: 0 0 9px; padding-bottom: 4px; border-bottom: 1px solid var(--line); font-size: 11px; font-weight: 700; color: var(--muted); break-after: avoid; }
  html[dir='ltr'] .sh { text-transform: uppercase; letter-spacing: .08em; }
  html[dir='rtl'] .sh { font-size: 13px; }
  .sec { margin-bottom: 16px; }
  .sec:last-child { margin-bottom: 0; }

  /* Experience */
  .xp { margin-bottom: 12px; }
  .xp:last-child { margin-bottom: 0; }
  .xp__role { font-size: 13.5px; font-weight: 700; color: var(--ink); }
  .xp__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 14px; margin-top: 1px; font-size: 12px; color: var(--muted); }
  .xp__org { color: var(--accent); font-weight: 600; margin-inline-end: auto; }
  .xp__m { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
  .xp__m svg { width: 12px; height: 12px; color: var(--icon); }
  .xp__list { margin: 5px 0 0; padding-inline-start: 15px; }
  .xp__list li { font-size: 12px; line-height: 1.42; color: var(--body); margin: 2px 0; }

  /* Capability sections: skills, languages, education, projects */
  .sk { margin: 0; font-size: 12px; line-height: 1.75; color: var(--body); }
  .langs { list-style: none; margin: 0; padding: 0; }
  .lang { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; padding: 2px 0; font-size: 12px; }
  .lang__name { color: var(--ink); font-weight: 600; }
  .lang__lvl { color: var(--muted); white-space: nowrap; }
  .ed { margin-bottom: 10px; }
  .ed:last-child { margin-bottom: 0; }
  .ed__deg { font-size: 12.5px; font-weight: 700; color: var(--ink); }
  .ed__school { font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 1px; }
  .ed__meta { font-size: 11.5px; color: var(--muted); margin-top: 2px; display: flex; flex-wrap: wrap; gap: 2px 12px; }
  .ed__m { display: inline-flex; align-items: center; gap: 4px; }
  .ed__m svg { width: 12px; height: 12px; color: var(--icon); }
  .pj { margin-bottom: 10px; }
  .pj:last-child { margin-bottom: 0; }
  .pj__title { font-size: 12.5px; font-weight: 700; color: var(--ink); }
  .pj__desc { font-size: 11.5px; color: var(--muted); margin-top: 1px; }
  .pj__tech { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .pj__link { font-size: 11px; margin-top: 1px; }
  .pj__link a { color: var(--accent); text-decoration: none; }

  .empty { text-align: center; padding: 80px 0; }
  .empty__title { margin: 0 0 8px; font-size: 18px; font-weight: 700; color: var(--ink); }
  .empty__hint { margin: 0; color: var(--muted); font-size: 14px; }

  /* Narrow screens: one readable column, no fixed-A4 scaling */
  @media screen and (max-width: 819px) {
    .stage { padding: 0; display: block; }
    .page { width: auto; height: auto; max-width: 640px; margin: 0 auto; padding: 28px 22px; box-shadow: none; overflow: visible; transform: none !important; }
    .content { transform: none !important; }
    .flow { column-count: 1; }
  }

  @page { size: A4; margin: 0; }
  @media print {
    /* Printing is always on the light palette — a résumé goes on white paper. */
    :root, html[data-theme='dark'] {
      color-scheme: light;
      --stage-bg:#ffffff; --page-bg:#ffffff; --ink:#0a0a0a; --accent:#2b6cb0; --muted:#666666; --line:#e5e5e5; --body:#171717;
      --icon:#737373; --rule:#0a0a0a; --shadow:none;
    }
    body { background: #fff; }
    .toolbar { display: none !important; }
    .stage { padding: 0 !important; height: auto !important; display: block !important; overflow: visible !important; }
    .page { width: 794px !important; height: 1122px !important; max-width: none !important; margin: 0 !important; padding: 42px 46px !important; box-shadow: none !important; overflow: hidden !important; transform: none !important; }
    .flow { column-count: 2 !important; }
    a { color: inherit !important; text-decoration: none !important; }
    .xp__org, .ed__school, .head__title, .pj__link a { color: var(--accent) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

/** The interactive toolbar plus the engine that scales the sheet onto a single page. */
function toolbar(locale: AppLocale): string {
  const t = TEXT[locale];
  const other = locale === 'fa' ? 'en' : 'fa';
  const otherLabel = other === 'fa' ? 'فا' : 'EN';
  const sun = '<svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const moon = '<svg class="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  return `
    <div class="toolbar" role="toolbar" aria-label="${esc(t.docTitle)}">
      <span class="toolbar__hint">${esc(t.hint)}</span>
      <span class="toolbar__actions">
        <a class="btn btn--ghost" href="/api/${other}/resume" lang="${other}" dir="${other === 'fa' ? 'rtl' : 'ltr'}" aria-label="${esc(t.switchLanguage)}">${otherLabel}</a>
        <button type="button" class="btn btn--ghost btn--icon" id="theme" aria-label="${esc(t.switchTheme)}">${sun}${moon}</button>
        <button type="button" class="btn btn--ghost" id="close">${esc(t.close)}</button>
        <button type="button" class="btn btn--primary" id="print">${esc(t.save)}</button>
      </span>
    </div>
    <script>
      (function () {
        var page = document.getElementById('page');
        var content = document.getElementById('content');
        var stage = document.getElementById('stage');
        var root = document.documentElement;
        var PAGE_W = 794, PAGE_H = 1122;
        var narrow = window.matchMedia('(max-width: 819px)');

        // Shrink the A4 content (never enlarge) until it fits one page, then scale the
        // whole sheet down to the viewport width for the on-screen preview.
        function fitA4() {
          if (!page || !content) return;
          content.style.transform = 'none';
          var cs = getComputedStyle(page);
          var innerH = PAGE_H - (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom));
          var naturalH = content.scrollHeight;
          var s = naturalH > innerH ? innerH / naturalH : 1;
          content.style.transform = s < 1 ? 'scale(' + s + ')' : 'none';
          var ps = Math.min(1, (window.innerWidth - 32) / PAGE_W);
          page.style.transform = ps < 1 ? 'scale(' + ps + ')' : 'none';
          if (stage) stage.style.height = PAGE_H * ps + 'px';
        }

        // On narrow screens the sheet is a plain single column (CSS handles it), so any
        // transform is cleared; otherwise it is the scaled A4 page.
        function layout() {
          if (narrow.matches) {
            content.style.transform = '';
            page.style.transform = '';
            if (stage) stage.style.height = '';
          } else {
            fitA4();
          }
        }

        // Printing always uses the A4 two-column sheet, so force the fit first even if
        // the screen was showing the single-column reading layout.
        function preparePrint() {
          if (page) page.style.transform = 'none';
          fitA4();
        }

        function doPrint() { window.print(); }

        document.getElementById('print').addEventListener('click', function () { preparePrint(); doPrint(); });
        document.getElementById('close').addEventListener('click', function () {
          if (window.opener) { window.close(); } else { history.length > 1 ? history.back() : (window.location.href = '/'); }
        });
        var themeBtn = document.getElementById('theme');
        if (themeBtn) themeBtn.addEventListener('click', function () {
          var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
          root.setAttribute('data-theme', next);
          try { localStorage.setItem('resume-theme', next); } catch (e) {}
        });
        window.addEventListener('resize', layout);
        window.addEventListener('load', layout);
        window.addEventListener('beforeprint', preparePrint);
        if (narrow.addEventListener) narrow.addEventListener('change', layout);
        else if (narrow.addListener) narrow.addListener(layout);
        if (document.fonts && document.fonts.ready) { document.fonts.ready.then(layout); }
      })();
    </script>`;
}

/** Metadata the document's <head> carries for search engines and link previews. */
interface Head {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  robots: string;
  jsonLd?: string;
}

/** Runs before paint so the chosen theme never flashes on load. */
const THEME_INIT =
  "(function(){try{var t=localStorage.getItem('resume-theme');if(t!=='dark'&&t!=='light'){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();";

/** The full <head>: charset, viewport, SEO meta, Open Graph / Twitter, hreflang and JSON-LD. */
function headHtml(locale: AppLocale, h: Head): string {
  const other = locale === 'fa' ? 'en' : 'fa';
  const lines: string[] = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${esc(h.title)}</title>`,
    `<meta name="description" content="${esc(h.description)}" />`,
    `<meta name="robots" content="${esc(h.robots)}" />`,
    '<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />',
    '<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />',
  ];
  if (h.canonical) {
    const enUrl = h.canonical.replace(`/api/${locale}/`, '/api/en/');
    const faUrl = h.canonical.replace(`/api/${locale}/`, '/api/fa/');
    lines.push(`<link rel="canonical" href="${esc(h.canonical)}" />`);
    lines.push(`<link rel="alternate" hreflang="en" href="${esc(enUrl)}" />`);
    lines.push(`<link rel="alternate" hreflang="fa" href="${esc(faUrl)}" />`);
    lines.push(`<link rel="alternate" hreflang="x-default" href="${esc(enUrl)}" />`);
  }
  lines.push('<meta property="og:type" content="profile" />');
  lines.push(`<meta property="og:title" content="${esc(h.title)}" />`);
  lines.push(`<meta property="og:description" content="${esc(h.description)}" />`);
  lines.push(`<meta property="og:locale" content="${locale === 'fa' ? 'fa_IR' : 'en_US'}" />`);
  lines.push(`<meta property="og:locale:alternate" content="${other === 'fa' ? 'fa_IR' : 'en_US'}" />`);
  if (h.canonical) lines.push(`<meta property="og:url" content="${esc(h.canonical)}" />`);
  if (h.ogImage) lines.push(`<meta property="og:image" content="${esc(h.ogImage)}" />`);
  lines.push('<meta name="twitter:card" content="summary" />');
  lines.push(`<meta name="twitter:title" content="${esc(h.title)}" />`);
  lines.push(`<meta name="twitter:description" content="${esc(h.description)}" />`);
  if (h.ogImage) lines.push(`<meta name="twitter:image" content="${esc(h.ogImage)}" />`);
  // Escape `<` so a name containing `</script>` can never break out of the JSON-LD block.
  if (h.jsonLd) lines.push(`<script type="application/ld+json">${h.jsonLd.replace(/</g, '\\u003c')}</script>`);
  return lines.join('\n    ');
}

/** Wrap the body in a full document: theme, direction, lang, SEO head and the sheet. */
function page(locale: AppLocale, head: Head, bodyInner: string): string {
  const dir = locale === 'fa' ? 'rtl' : 'ltr';
  return `<!doctype html>
<html lang="${locale}" dir="${dir}" data-theme="light">
  <head>
    <script>${THEME_INIT}</script>
    ${headHtml(locale, head)}
    <style>${FONTS}${STYLE}</style>
  </head>
  <body>
    ${toolbar(locale)}
    <div class="stage" id="stage">
      <div class="page" id="page">
        <div class="content" id="content">
${bodyInner}
        </div>
      </div>
    </div>
  </body>
</html>`;
}

/** The header band: name, headline and an iconed contact run. */
function headerHtml(model: ResumeModel): string {
  const chips = model.contacts.map(contact => {
    const inner = contact.href
      ? `<a href="${esc(contact.href)}"${contact.href.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''} dir="ltr">${esc(contact.value)}</a>`
      : `<span dir="ltr">${esc(contact.value)}</span>`;
    return `<span class="head__c">${glyph(contact.icon)}${inner}</span>`;
  });
  return `          <header>
            <h1 class="head__name">${esc(model.name)}</h1>
            ${model.role ? `<p class="head__title">${esc(model.role)}</p>` : ''}
            ${chips.length ? `<div class="head__contacts">${chips.join('')}</div>` : ''}
            <hr class="head__rule" />
          </header>`;
}

/** A titled block: heading + body, only emitted when the caller passes content. */
function section(title: string, inner: string, extraClass = ''): string {
  return inner ? `          <section class="sec${extraClass ? ` ${extraClass}` : ''}"><h2 class="sh">${esc(title)}</h2>\n${inner}\n          </section>` : '';
}

function experienceHtml(model: ResumeModel): string {
  return model.experience
    .map(
      item => `            <div class="xp">
              <div class="xp__role">${esc(item.role)}</div>
              <div class="xp__meta">
                ${item.company ? `<span class="xp__org">${esc(item.company)}</span>` : ''}
                ${item.period ? `<span class="xp__m" dir="ltr">${ICON.calendar}${esc(item.period)}</span>` : ''}
                ${item.location ? `<span class="xp__m">${ICON.pin}${esc(item.location)}</span>` : ''}
              </div>
              ${item.bullets.length ? `<ul class="xp__list">${item.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
            </div>`
    )
    .join('\n');
}

function educationHtml(model: ResumeModel): string {
  return model.education
    .map(
      edu => `            <div class="ed">
              ${edu.degree ? `<div class="ed__deg">${esc(edu.degree)}</div>` : ''}
              ${edu.school ? `<div class="ed__school">${esc(edu.school)}</div>` : ''}
              ${edu.period ? `<div class="ed__meta"><span class="ed__m" dir="ltr">${ICON.calendar}${esc(edu.period)}</span></div>` : ''}
            </div>`
    )
    .join('\n');
}

/** One language per row: name on the leading edge, the level word on the other. */
function languagesHtml(model: ResumeModel): string {
  return model.languages
    .map(language => {
      const label = LEVEL_LABELS[model.locale][language.level] ?? '';
      return `            <li class="lang">
              <span class="lang__name">${esc(language.name)}</span>
              <span class="lang__lvl">${esc(label)}</span>
            </li>`;
    })
    .join('\n');
}

/** A project card: title, blurb, stack and any live/source links. */
function projectsHtml(model: ResumeModel): string {
  return model.projects
    .map(
      project => `            <div class="pj">
              <div class="pj__title">${esc(project.title)}</div>
              ${project.description ? `<div class="pj__desc">${esc(project.description)}</div>` : ''}
              ${project.technologies.length ? `<div class="pj__tech">${esc(project.technologies.join(' · '))}</div>` : ''}
              ${project.links.length ? `<div class="pj__link">${project.links.map(l => `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer" dir="ltr">${esc(l.label)}</a>`).join('  ·  ')}</div>` : ''}
            </div>`
    )
    .join('\n');
}

/** Render a composed résumé as a complete, printable, single-page HTML document. */
export function renderResumeHtml(model: ResumeModel): string {
  const t = TEXT[model.locale];

  const summary = model.summary ? `          <section class="sec sec--summary"><h2 class="sh">${esc(t.summary)}</h2>
            <p class="summary">${esc(model.summary)}</p>
          </section>` : '';

  // Source order drives the column flow: experience leads and fills column one, the
  // rest follow in priority order (skills, projects, education, languages) and balance
  // into column two, so a short experience never leaves a dead gap.
  const flow = [
    section(t.experience, experienceHtml(model), 'sec--exp'),
    section(t.skills, model.skills.length ? `            <p class="sk">${esc(model.skills.join(', '))}</p>` : ''),
    section(t.projects, projectsHtml(model)),
    section(t.education, educationHtml(model)),
    section(t.languages, model.languages.length ? `          <ul class="langs">
${languagesHtml(model)}
          </ul>` : ''),
  ]
    .filter(Boolean)
    .join('\n');

  const body = `${headerHtml(model)}
${summary}
          <div class="flow">
${flow}
          </div>`;

  const title = `${model.name} — ${t.docTitle}`;
  const canonical = site ? `${site}/api/${model.locale}/resume` : undefined;
  const description = (model.summary || `${model.name}${model.role ? ` — ${model.role}` : ''}`).replace(/\s+/g, ' ').trim().slice(0, 200);
  const ogImage = site ? ogImageFor(title, model.locale) : undefined;
  const sameAs = model.contacts.map(c => c.href).filter((href): href is string => typeof href === 'string' && /^https?:\/\//.test(href));
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: model.name,
    jobTitle: model.role || undefined,
    description,
    url: canonical,
    sameAs: sameAs.length ? sameAs : undefined,
  });
  const head: Head = { title, description, canonical, ogImage, robots: 'index, follow, max-image-preview:large', jsonLd };

  return page(model.locale, head, body);
}

/** A quiet stand-in when there is no profile to build a résumé from. */
export function renderResumeUnavailable(locale: AppLocale): string {
  const t = TEXT[locale];
  const inner = `          <div class="empty">
            <p class="empty__title">${esc(t.empty)}</p>
            <p class="empty__hint">${esc(t.emptyHint)}</p>
          </div>`;
  const head: Head = { title: `${t.docTitle}`, description: t.emptyHint, robots: 'noindex' };
  return page(locale, head, inner);
}
