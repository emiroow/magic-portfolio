import { ogImageFor, site } from '@/lib/seo';
import type { ResumeModel } from '@/features/profile/resume/build';
import type { AppLocale, LanguageLevel } from '@/types';

/**
 * The résumé as a page: a standalone, print-ready HTML document.
 *
 * Served straight from the resume route, outside the app shell, so a visitor can save
 * it as a PDF with the site's own fonts already loaded. `build.ts` decides what the
 * résumé says; this file decides how it looks and where it breaks to the next sheet.
 *
 * "Save as PDF" never opens the print dialog: the A4 sheets are captured on the client
 * and downloaded as a real file, while "Print" keeps the browser's own pipeline.
 *
 * The layout is the form recruiters expect — a header band (name, headline, iconed
 * contact run), then two equal columns that read as one continuous flow: the sections
 * fill the first column to its foot, carry on at the head of the second, and a fresh
 * A4 sheet starts only once both columns of the current one are spent. The palette
 * mirrors the app's own neutral light/dark tokens (so it reads as the same product)
 * with a single restrained accent for the headline, company and links.
 *
 * Nothing is squeezed to fake a shorter document: a small script measures every block
 * at print geometry and breaks the flow exactly where a sheet ends, so print and PDF
 * carry as many pages as the profile genuinely fills and no line is ever clipped.
 */

/** Section headings and chrome, bilingual: there is no i18n provider in a bare route. */
const TEXT: Record<
  AppLocale,
  {
    docTitle: string;
    file: string;
    close: string;
    closeHint: string;
    get: string;
    savePdf: string;
    savePdfDesc: string;
    print: string;
    printDesc: string;
    hint: string;
    actions: string;
    toOther: string;
    pageWord: string;
    switchTheme: string;
    empty: string;
    emptyHint: string;
    summary: string;
    experience: string;
    projects: string;
    skills: string;
    education: string;
    certificates: string;
    languages: string;
  }
> = {
  en: {
    docTitle: 'Resume',
    file: 'Resume',
    close: 'Close',
    closeHint: 'Close and return to the site',
    get: 'Get',
    savePdf: 'Save as PDF',
    savePdfDesc: 'Download the A4 sheet as a PDF file.',
    print: 'Print',
    printDesc: 'Send the A4 sheet to a printer.',
    hint: 'Choose “Print”, then “Save as PDF” — or use “Get” for a direct download.',
    actions: 'Resume controls',
    toOther: 'Read this résumé in Persian',
    pageWord: 'Page',
    switchTheme: 'Switch theme',
    empty: 'No resume is available yet.',
    emptyHint: 'The profile this resume is built from has not been published.',
    summary: 'Summary',
    experience: 'Work Experience',
    projects: 'Projects',
    skills: 'Skills',
    education: 'Education',
    certificates: 'Certificates',
    languages: 'Languages',
  },
  fa: {
    docTitle: 'رزومه',
    file: 'رزومه',
    close: 'بستن',
    closeHint: 'بستن و بازگشت به سایت',
    get: 'دریافت',
    savePdf: 'ذخیرهٔ PDF',
    savePdfDesc: 'دریافت برگهٔ به‌صورت فایل PDF.',
    print: 'چاپ',
    printDesc: 'فرستادن برگهٔ A4 به چاپگر.',
    hint: '«چاپ» را بزنید و «Save as PDF» انتخاب کنید — یا برای دریافت مستقیم از «دریافت» استفاده کنید.',
    actions: 'ابزارهای رزومه',
    toOther: 'خواندن این رزومه به English',
    pageWord: 'صفحه',
    switchTheme: 'تغییر پوسته',
    empty: 'هنوز رزومه‌ای در دسترس نیست.',
    emptyHint: 'پروفایلی که این رزومه از آن ساخته می‌شود منتشر نشده است.',
    summary: 'خلاصه',
    experience: 'سوابق شغلی',
    projects: 'پروژه‌ها',
    skills: 'مهارت‌ها',
    education: 'تحصیلات',
    certificates: 'گواهی‌نامه‌ها',
    languages: 'زبان‌ها',
  },
};

/** Proficiency labels per locale, keyed by the same levels the dashboard edits. */
const LEVEL_LABELS: Record<AppLocale, Record<LanguageLevel, string>> = {
  en: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', fluent: 'Fluent', native: 'Native' },
  fa: { beginner: 'مبتدی', intermediate: 'متوسط', advanced: 'پیشرفته', fluent: 'روان', native: 'بومی' },
};

/**
 * A locale is always named in its own language, the way every language switcher on
 * the web does it: EN and فارسی, never a translated English/انگلیسی pair.
 */
const LOCALE_LABEL: Record<AppLocale, string> = { en: 'EN', fa: 'فارسی' };

/** Proficiency as a five-dot meter, one filled dot per step of the same level scale. */
const LEVEL_DOTS: Record<LanguageLevel, number> = { beginner: 1, intermediate: 2, advanced: 3, fluent: 4, native: 5 };

/** Escape a value for safe interpolation into HTML text or an attribute. */
function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Inline glyphs (12–14px, currentColor) so the header and meta lines read at a glance. */
const ICON: Record<string, string> = {
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  phone:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5c0-.6.4-1 1-1h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L18 14l4 1.5V18c0 .6-.4 1-1 1A16 16 0 0 1 4 5Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z"/><circle cx="12" cy="11" r="2"/></svg>',
  calendar:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
  briefcase:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a4 4 0 0 0 6 .5l2.5-2.5a4 4 0 0 0-5.7-5.7L11.5 6.6"/><path d="M14 11a4 4 0 0 0-6-.5L5.5 13a4 4 0 0 0 5.7 5.7l1.3-1.3"/></svg>',
  globe:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></svg>',
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.6 2 12.3c0 4.5 2.9 8.4 6.8 9.7.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.3-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5.1 0-1.1.4-2 1-2.8-.1-.3-.5-1.3.1-2.7 0 0 .8-.3 2.8 1a9.3 9.3 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.7 1 2.8 0 4-2.4 4.8-4.6 5.1.3.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10.3 10.3 0 0 0 22 12.3C22 6.6 17.5 2 12 2Z"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21H17.6v-5.1c0-1.22-.02-2.78-1.9-2.78-1.9 0-2.2 1.32-2.2 2.68V21H9z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.6L22 21h-6.2l-4.3-5.6L6.3 21H3.3l7-8.1L2.5 3H9l3.9 5.2L17.5 3Zm-1.1 16h1.7L7.7 4.8H5.9L16.4 19Z"/></svg>',
  twitter:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.6L22 21h-6.2l-4.3-5.6L6.3 21H3.3l7-8.1L2.5 3H9l3.9 5.2L17.5 3Zm-1.1 16h1.7L7.7 4.8H5.9L16.4 19Z"/></svg>',
  telegram:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.6 20c-.2 1-.9 1.3-1.7.8l-4.8-3.5-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.1 13.3l-4.8-1.5c-1-.3-1-1 .2-1.5l18.8-7.2c.9-.3 1.6.2 1.3 1.4Z"/></svg>',
  whatsapp:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm5.3 14c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a11 11 0 0 1-5.9-5.2c-.4-.8-.6-1.6-.4-2.2.1-.4.6-1.1 1-1.2.3-.2.8-.1 1 .3l.6 1.3c.1.3 0 .5-.2.7l-.4.5c-.1.2-.2.3 0 .6.5.9 1.5 1.7 2.5 2 .3.1.5 0 .6-.2l.5-.6c.2-.2.4-.3.7-.1l1.4.7c.3.2.4.4.3.7Z"/></svg>',
  youtube:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.3-.4-4.8a2.5 2.5 0 0 0-1.8-1.8C19.2 5 12 5 12 5s-7.2 0-8.8.4A2.5 2.5 0 0 0 1.4 7.2C1 8.7 1 12 1 12s0 3.3.4 4.8a2.5 2.5 0 0 0 1.8 1.8C4.8 19 12 19 12 19s7.2 0 8.8-.4a2.5 2.5 0 0 0 1.8-1.8C23 15.3 23 12 23 12ZM10 15V9l5 3-5 3Z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10.5 9-7.5 9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  download:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>',
  filedown:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 11v6"/><path d="m9 14 3 3 3-3"/></svg>',
  printer:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>',
  chev: '<svg class="ico-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
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
 * Every sheet is a fixed A4 canvas (794 × 1122 CSS px = 210 × 297 mm at 96 dpi). The
 * two columns live inside it and the flow script measures at this exact geometry, so
 * a block that fits on screen is a block that fits on paper.
 */

/**
 * The light "white paper" palette, used only by `@media print`: a printed résumé always
 * goes out on white paper, whatever the viewer's theme. The on-screen snapshot behind a
 * direct PDF download deliberately does not borrow it — that file mirrors the theme the
 * visitor is actually reading in (see `html[data-pdf]` and `capturePdf`).
 */
const pdfTokens = `
    color-scheme: light;
    --stage-bg:#ffffff; --page-bg:#ffffff; --ink:#0a0a0a; --accent:#2b6cb0; --muted:#666666; --line:#e5e5e5; --body:#171717;
    --icon:#737373; --sh-rule:#9ca3af; --dot-off:#d4d4d4; --shadow:none;
  `;

const STYLE = `
  :root {
    color-scheme: light;
    --stage-bg:#f5f5f5; --page-bg:#ffffff; --ink:#0a0a0a; --accent:#2b6cb0; --muted:#666666; --line:#e5e5e5; --body:#171717;
    --icon:#737373; --sh-rule:#9ca3af; --dot-off:#d4d4d4; --shadow:0 6px 24px rgba(0,0,0,.08);
    --tb-bg:rgba(255,255,255,.92); --tb-border:#e5e5e5; --tb-fg:#525252; --tb-soft:#f1f1f2;
    --b1-bg:#0a0a0a; --b1-fg:#fafafa; --b1-hover:#262626;
    --b2-fg:#171717; --b2-hover:#f0f0f0;
    --panel-bg:#ffffff; --panel-shadow:0 12px 32px rgba(0,0,0,.16);
    /* One height for every control in the bar, so the cluster and the pills align. */
    --ctl-h:34px;
  }
  html[data-theme='dark'] {
    color-scheme: dark;
    --stage-bg:#0a0a0a; --page-bg:#0f0f0f; --ink:#f5f5f5; --accent:#7fb2e5; --muted:#a6a6a6; --line:#2b2b2b; --body:#d4d4d4;
    --icon:#a6a6a6; --sh-rule:#585858; --dot-off:#3d3d3d; --shadow:0 6px 24px rgba(0,0,0,.6);
    --tb-bg:rgba(10,10,10,.92); --tb-border:#2b2b2b; --tb-fg:#d4d4d4; --tb-soft:#1c1c1e;
    --b1-bg:#f5f5f5; --b1-fg:#0a0a0a; --b1-hover:#e0e0e0;
    --b2-fg:#e5e5e5; --b2-hover:#262626;
    --panel-bg:#161616; --panel-shadow:0 12px 32px rgba(0,0,0,.65);
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
  /* Theme swaps cross-fade instead of snapping; print never animates. */
  body, .page, .toolbar { transition: background-color .18s ease, color .18s ease; }

  .toolbar {
    position: sticky; top: 0; z-index: 10;
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px;
    padding: 10px 20px; background: var(--tb-bg);
    backdrop-filter: saturate(180%) blur(6px); border-bottom: 1px solid var(--tb-border);
  }
  .toolbar__brand { display: flex; align-items: center; gap: 10px; min-width: 0; margin-inline-end: auto; }
  .toolbar__title { display: inline-flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 700; color: var(--ink); white-space: nowrap; }
  .toolbar__title svg { width: 15px; height: 15px; color: var(--icon); }
  .toolbar__hint { font-size: 12.5px; font-weight: 500; color: var(--tb-fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .toolbar__actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 6px; }
  .btn {
    appearance: none; cursor: pointer; font: inherit; font-size: 13px; font-weight: 500;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px; text-decoration: none;
    height: var(--ctl-h); padding: 0 14px; border-radius: 999px; border: 1px solid transparent;
    transition: background-color .15s ease, color .15s ease;
  }
  .btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .btn--primary { background: var(--b1-bg); color: var(--b1-fg); }
  .btn--primary:hover { background: var(--b1-hover); }
  .btn--ghost { background: transparent; color: var(--b2-fg); }
  .btn--ghost:hover { background: var(--b2-hover); }
  .btn--icon { width: var(--ctl-h); padding: 0; }
  .btn svg { width: 16px; height: 16px; display: block; flex: none; }
  .btn .ico-chev { width: 14px; height: 14px; transition: transform .15s ease; }

  /* View controls. Language and theme share one soft cluster — the same shape as the
     site's floating dock: the locale pair with the current face filled in the inverted
     monochrome, a hairline rail, then a circular theme button. Both theme marks stay in
     the DOM and cross-fade with a slight turn, so a switch never moves the layout. */
  .cluster {
    display: inline-flex; align-items: center; gap: 2px; flex: none;
    height: var(--ctl-h); padding: 0 3px; background: var(--tb-soft);
    border: 1px solid var(--tb-border); border-radius: 999px;
  }
  /* The rail is the cluster's only joint, so it takes the sheet's rule colour rather than
     the border colour — on the soft fill the latter all but disappears. */
  .cluster__rail { width: 1px; height: 16px; margin: 0 3px; flex: none; background: var(--sh-rule); }
  .locale { display: inline-flex; align-items: center; gap: 2px; font-size: 11.5px; font-weight: 600; }
  .locale__on, .locale__go {
    display: inline-flex; align-items: center; justify-content: center; flex: none;
    height: calc(var(--ctl-h) - 8px); padding: 0 9px; border-radius: 999px; white-space: nowrap;
    text-decoration: none; transition: background-color .15s ease, color .15s ease;
  }
  .locale__on { background: var(--b1-bg); color: var(--b1-fg); }
  .locale__go { color: var(--muted); }
  .locale__go:hover { background: var(--b2-hover); color: var(--ink); }
  .locale__go:active { transform: scale(.95); }
  .locale__go:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }
  /* A Persian label inside an English document still needs the Persian face, and the
     Latin one its own — the locale switch puts both side by side in either direction. */
  [lang='fa'] { font-family: 'Estedad', system-ui, sans-serif; }
  [lang='en'] { font-family: 'Roboto', system-ui, -apple-system, sans-serif; }
  .mini {
    appearance: none; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    width: calc(var(--ctl-h) - 8px); height: calc(var(--ctl-h) - 8px); padding: 0; flex: none;
    border: 0; border-radius: 999px; background: transparent; color: var(--tb-fg);
    transition: background-color .15s ease, color .15s ease;
  }
  .mini:hover { background: var(--b2-hover); color: var(--ink); }
  .mini:active { transform: scale(.94); }
  .mini:focus-visible { outline: 2px solid var(--ink); outline-offset: 1px; }
  .theme-ico { display: inline-grid; place-items: center; }
  .theme-ico svg {
    grid-area: 1 / 1; width: 16px; height: 16px; display: block;
    transition: opacity .18s ease, transform .3s cubic-bezier(.2,.8,.2,1);
  }
  .ico-sun { opacity: 1; transform: rotate(0deg) scale(1); }
  .ico-moon { opacity: 0; transform: rotate(-90deg) scale(.4); }
  html[data-theme='dark'] .ico-sun { opacity: 0; transform: rotate(90deg) scale(.4); }
  html[data-theme='dark'] .ico-moon { opacity: 1; transform: rotate(0deg) scale(1); }

  /* Theme reveal — the site's circular switch, carried into this document so the two read
     as one gesture: the same custom properties, the same keyframes and the same length as
     the block in app/globals.css. Only the incoming theme moves; the outgoing sheet holds
     still underneath, and the browser's own cross-fade is switched off on both halves,
     because a fade over a growing circle is exactly what makes a reveal read as a flash.

     [data-reveal] is set by the script for the length of the reveal and does here what
     disableTransitionOnChange does on the site: a snapshot has to be taken of a finished
     palette, not of the colour fade above or the sun/moon turn caught half-way. */
  html[data-reveal], html[data-reveal] *, html[data-reveal] *::before, html[data-reveal] *::after { transition: none !important; }
  ::view-transition-group(root), ::view-transition-image-pair(root) { animation: none; }
  ::view-transition-old(root) { animation: none; mix-blend-mode: normal; z-index: 0; }
  ::view-transition-new(root) {
    animation: theme-reveal .45s cubic-bezier(.4, 0, .2, 1) both;
    mix-blend-mode: normal; z-index: 1;
  }
  @keyframes theme-reveal {
    from { clip-path: circle(0px at var(--theme-reveal-x, 50%) var(--theme-reveal-y, 50%)); }
    to { clip-path: circle(var(--theme-reveal-r, 150vmax) at var(--theme-reveal-x, 50%) var(--theme-reveal-y, 50%)); }
  }
  /* Reduced motion asks for the switch, not the travel; the script skips the reveal too. */
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-group(root), ::view-transition-image-pair(root), ::view-transition-new(root) { animation: none; }
  }

  /* Tooltips drawn in CSS: this is a bare route with no React, and the native title
     tooltip is slow, unstyled and outside the palette. The mark fades in under the
     control on hover and on keyboard focus, in the inverted surface the site uses. */
  [data-tip] { position: relative; }
  [data-tip]::after {
    content: attr(data-tip); position: absolute; top: calc(100% + 11px); left: 50%; z-index: 40;
    width: max-content; max-width: 230px; padding: 5px 9px; border-radius: 7px; text-align: center;
    background: var(--b1-bg); color: var(--b1-fg); font-size: 11.5px; font-weight: 500;
    line-height: 1.4; white-space: normal; pointer-events: none;
    opacity: 0; visibility: hidden; transform: translate(-50%, -3px) scale(.96); transform-origin: top center;
    transition: opacity .13s ease, transform .13s ease, visibility .13s;
  }
  [data-tip]:hover::after, [data-tip]:focus-visible::after {
    opacity: 1; visibility: visible; transform: translate(-50%, 0) scale(1); transition-delay: .12s;
  }
  /* The mark belongs to the document, not to the control it hangs under: an English
     sentence under the Persian label keeps the Latin face and LTR order, and a Persian
     sentence under the EN label keeps the Persian face and RTL order. */
  html[dir='ltr'] [data-tip]::after { direction: ltr; font-family: 'Roboto', system-ui, -apple-system, sans-serif; }
  html[dir='rtl'] [data-tip]::after { direction: rtl; font-family: 'Estedad', system-ui, sans-serif; }
  /* Home and Get carry their own label, so their tooltip only steps in once the narrow
     bar drops it — and never while the Get panel hangs in the very same space. */
  @media screen and (min-width: 561px) {
    .tip-sm::after { display: none; }
  }
  .menu[data-open='true'] .tip-sm::after { display: none; }

  /* Get dropdown: the trigger owns the state, the panel hangs off its inline end. */
  .menu { position: relative; display: inline-flex; }
  .menu[data-open='true'] .ico-chev { transform: rotate(180deg); }
  .menu__panel {
    position: absolute; top: calc(100% + 8px); inset-inline-end: 0; z-index: 30;
    display: flex; flex-direction: column; gap: 2px; min-width: 250px; padding: 6px;
    background: var(--panel-bg); border: 1px solid var(--tb-border); border-radius: 12px;
    box-shadow: var(--panel-shadow);
  }
  .menu__panel[hidden] { display: none; }
  .menu__item {
    display: flex; align-items: flex-start; gap: 9px; width: 100%; padding: 8px 10px;
    appearance: none; border: 0; border-radius: 8px; background: transparent; cursor: pointer;
    font: inherit; font-size: 13px; text-align: start; color: var(--b2-fg);
  }
  .menu__item:hover { background: var(--b2-hover); }
  .menu__item[data-busy] { cursor: progress; }
  .menu__item:focus-visible { outline: 2px solid var(--ink); outline-offset: -2px; }
  /* The glyph carries its own size: these SVGs ship with a viewBox only, so without
     this they fall back to the browser's default replaced-element box. */
  .menu__item svg { width: 16px; height: 16px; flex: none; margin-top: 2px; color: var(--icon); }
  .menu__txt { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .menu__label { font-weight: 600; color: var(--ink); }
  .menu__desc { font-size: 11.5px; line-height: 1.45; color: var(--muted); }

  .stage { display: flex; justify-content: center; padding: 28px 0 64px; overflow: hidden; }
  /* The sheets stack one under the other, the way a printed document previews; the whole
     stack scales to the viewport, never the content inside a sheet. */
  .pages { display: flex; flex-direction: column; align-items: center; gap: 28px; transform-origin: top center; }
  .page {
    width: 794px; height: 1122px; flex: none;
    padding: 42px 46px; background: var(--page-bg); overflow: hidden;
    box-shadow: var(--shadow);
  }

  /* Header band: name, headline and one iconed contact run — no rule under it. */
  .head__name { margin: 0; font-size: 32px; font-weight: 700; color: var(--ink); line-height: 1.08; }
  html[dir='ltr'] .head__name { text-transform: uppercase; letter-spacing: .01em; }
  .head__title { margin: 4px 0 0; font-size: 15.5px; font-weight: 600; color: var(--accent); }
  .head__contacts { margin: 12px 0 0; display: flex; flex-wrap: wrap; gap: 5px 18px; font-size: 12px; color: var(--muted); }
  .head__c { display: inline-flex; align-items: center; gap: 5px; }
  .head__c svg { width: 13px; height: 13px; flex: none; color: var(--icon); }
  .head__c a { color: inherit; text-decoration: none; }

  /* A summary is a paragraph, not a newspaper column: start-aligned in both directions,
     so the final line of a paragraph never stretches edge to edge. */
  .summary { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--body); text-align: start; }

  /* Two equal columns the sections flow through in strict order: the first is filled to
     its foot, the rest carries on in the second, and only then does a fresh sheet start.
     The static main/rail markup is also the honest no-script rendering of the document. */
  .flow { display: grid; grid-template-columns: 1fr 1fr; gap: 0 30px; margin-top: 20px; align-items: start; }
  .flow--single { grid-template-columns: 1fr; }
  .flow__col { min-width: 0; }

  /* A further sheet never reads as anonymous: whose it is and which page it is. */
  .cont { padding-bottom: 5px; border-bottom: 1px solid var(--sh-rule); font-size: 11px; font-weight: 600; color: var(--muted); }
  html[dir='rtl'] .cont { font-size: 12px; }

  .sh { margin: 0 0 9px; padding-bottom: 5px; border-bottom: 1px solid var(--sh-rule); font-size: 11px; font-weight: 700; color: var(--muted); }
  html[dir='ltr'] .sh { text-transform: uppercase; letter-spacing: .08em; }
  html[dir='rtl'] .sh { font-size: 13px; }
  .sec { margin-bottom: 16px; }
  .sec:last-child { margin-bottom: 0; }

  /* Experience: role and company share one line; the facts (period, location, type)
     share the next, start-aligned in both directions. Long lines wrap instead of
     overflowing the column, and each chip keeps its icon glued to unbroken text. */
  .xp { margin-bottom: 12px; }
  .xp:last-child { margin-bottom: 0; }
  .xp__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; min-width: 0; }
  .xp__role { font-size: 13.5px; font-weight: 700; color: var(--ink); }
  .xp__sep { color: var(--muted); }
  .xp__org { font-size: 13px; color: var(--accent); font-weight: 600; min-width: 0; overflow-wrap: break-word; }
  .xp__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 3px 12px; margin-top: 3px; font-size: 12px; color: var(--muted); }
  .xp__m { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
  .xp__m svg { width: 12px; height: 12px; flex: none; color: var(--icon); }
  .xp__list { margin: 5px 0 0; padding: 0; list-style: none; }
  .xp__list li { position: relative; padding-inline-start: 12px; font-size: 12px; line-height: 1.45; color: var(--body); margin: 3px 0; }
  .xp__list li::before { content: ''; position: absolute; inset-inline-start: 1px; top: .55em; width: 3px; height: 3px; border-radius: 50%; background: var(--icon); }

  /* Capability sections: skills, languages, education, certificates, projects */
  .sk { margin: 0; font-size: 12px; line-height: 1.75; color: var(--body); }
  .langs { list-style: none; margin: 0; padding: 0; }
  .lang { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 3px 0; font-size: 12px; }
  .lang__name { color: var(--ink); font-weight: 600; }
  .lang__side { display: inline-flex; align-items: center; gap: 8px; }
  .lang__lvl { color: var(--muted); white-space: nowrap; }
  .lang__dots { display: inline-flex; gap: 3px; }
  .lang__dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--dot-off); }
  .lang__dots i.on { background: var(--accent); }
  .ed { margin-bottom: 10px; }
  .ed:last-child { margin-bottom: 0; }
  .ed__deg { font-size: 12.5px; font-weight: 700; color: var(--ink); }
  .ed__school { font-size: 12px; color: var(--accent); font-weight: 600; margin-top: 1px; }
  .ed__meta { font-size: 11.5px; color: var(--muted); margin-top: 2px; display: flex; flex-wrap: wrap; gap: 2px 12px; }
  .ed__m { display: inline-flex; align-items: center; gap: 4px; }
  .ed__m svg { width: 12px; height: 12px; color: var(--icon); }
  .ct { margin-bottom: 8px; }
  .ct:last-child { margin-bottom: 0; }
  .ct__title { font-size: 12px; font-weight: 700; color: var(--ink); }
  .ct__issuer { font-size: 11.5px; color: var(--accent); font-weight: 600; margin-top: 1px; }
  .ct__meta { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .ct__m { display: inline-flex; align-items: center; gap: 4px; }
  .ct__m svg { width: 11px; height: 11px; color: var(--icon); }
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

  /* Narrow screens: one readable column, no fixed-A4 scaling; the toolbar sheds its
     hint first, then button labels, so nothing ever collides. */
  @media screen and (max-width: 860px) {
    .toolbar__hint { display: none; }
  }
  @media screen and (max-width: 819px) {
    .stage { padding: 0; display: block; }
    .pages { display: block; gap: 0; transform: none !important; }
    .page { width: auto; height: auto; max-width: 640px; margin: 0 auto; padding: 28px 22px; box-shadow: none; overflow: visible; }
    .page + .page { padding-top: 0; }
    .cont { display: none; }
    .flow { grid-template-columns: 1fr; gap: 0; }
  }
  @media screen and (max-width: 560px) {
    :root { --ctl-h:32px; }
    .toolbar { padding: 8px 12px; gap: 6px 8px; }
    .btn { padding: 0 11px; font-size: 12.5px; }
    .locale { font-size: 10.5px; }
    .locale__on, .locale__go { padding: 0 7px; }
    .hide-sm { display: none; }
    .menu__panel { min-width: 220px; }
    .head__name { font-size: 26px; }
  }

  @page { size: A4; margin: 0; }
  /* Print geometry on screen: html[data-pdf] re-asserts the fixed A4 sheets — used both by
     the download snapshot (so a phone download is the very same desktop document) and by
     the paginator (so blocks are measured at the exact width they print at). It must
     out-specify the narrow-screen rules above — hence the attribute+class selectors with
     !important. Colours are left untouched on purpose: the downloaded file follows the
     viewer's current theme. */
  html[data-pdf] .stage { padding: 0 !important; display: block !important; height: auto !important; overflow: visible !important; }
  html[data-pdf] .pages { display: block !important; gap: 0 !important; transform: none !important; }
  html[data-pdf] .page { width: 794px !important; height: 1122px !important; max-width: none !important; margin: 0 !important; padding: 42px 46px !important; box-shadow: none !important; overflow: hidden !important; }
  html[data-pdf] .page + .page { padding-top: 42px !important; }
  html[data-pdf] .cont { display: block !important; }
  html[data-pdf] .flow { grid-template-columns: 1fr 1fr !important; gap: 0 30px !important; }
  html[data-pdf] .flow--single { grid-template-columns: 1fr !important; }
  @media print {
    /* Printing is always on the light palette — a résumé goes on white paper. */
    :root, html[data-theme='dark'] {${pdfTokens}}
    * { transition: none !important; }
    body { background: #fff; }
    .toolbar { display: none !important; }
    [data-tip]::after { display: none !important; }
    .stage { padding: 0 !important; height: auto !important; display: block !important; overflow: visible !important; }
    .pages { display: block !important; gap: 0 !important; transform: none !important; }
    .page { width: 794px !important; height: 1122px !important; max-width: none !important; margin: 0 !important; padding: 42px 46px !important; box-shadow: none !important; overflow: hidden !important; break-after: page; page-break-after: always; }
    .page:last-child { break-after: auto; page-break-after: auto; }
    .flow { grid-template-columns: 1fr 1fr !important; }
    .flow--single { grid-template-columns: 1fr !important; }
    a { color: inherit !important; text-decoration: none !important; }
    .xp__org, .ed__school, .ct__issuer, .head__title, .pj__link a { color: var(--accent) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .lang__dots i { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

/**
 * The sticky viewer toolbar: brand and hint on one side; on the other a cluster that
 * keeps the two reading controls (locale, theme) together as one soft pill — the locale
 * switch shows both faces with the current one filled, so it never relies on a bare
 * abbreviation — then close and the Get menu.
 *
 * `name` is the résumé's own name, slugged into the download file name so the file
 * arriving in the visitor's folder says whose it is.
 */
function toolbar(locale: AppLocale, name?: string): string {
  const t = TEXT[locale];
  const other = locale === 'fa' ? 'en' : 'fa';
  const dirOf = (code: AppLocale) => (code === 'fa' ? 'rtl' : 'ltr');
  const base = (name || '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
  const file = `${base || t.file}.pdf`;
  const sun =
    '<svg class="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const moon =
    '<svg class="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
  return `
    <div class="toolbar">
      <div class="toolbar__brand">
        <span class="toolbar__title">${ICON.file}${esc(t.docTitle)}</span>
        <span class="toolbar__hint">${esc(t.hint)}</span>
      </div>
      <div class="toolbar__actions" role="toolbar" aria-label="${esc(t.actions)}">
        <div class="cluster">
          <span class="locale" lang="${locale}" dir="${dirOf(locale)}">
            <span class="locale__on" aria-hidden="true">${esc(LOCALE_LABEL[locale])}</span>
            <a class="locale__go" data-roving href="/api/${other}/resume" lang="${other}" dir="${dirOf(other)}" aria-label="${esc(t.toOther)}" data-tip="${esc(t.toOther)}">${esc(LOCALE_LABEL[other])}</a>
          </span>
          <span class="cluster__rail" aria-hidden="true"></span>
          <button type="button" class="mini" data-roving id="theme" aria-label="${esc(t.switchTheme)}" data-tip="${esc(t.switchTheme)}"><span class="theme-ico" aria-hidden="true">${sun}${moon}</span></button>
        </div>
        <button type="button" class="btn btn--ghost tip-sm" data-roving id="close" data-home="/${locale}" aria-label="${esc(t.closeHint)}" data-tip="${esc(t.closeHint)}">${ICON.close}<span class="hide-sm">${esc(t.close)}</span></button>
        <div class="menu" id="getmenu" data-open="false">
          <button type="button" class="btn btn--primary tip-sm" data-roving id="get" aria-haspopup="true" aria-expanded="false" aria-controls="getpanel" aria-label="${esc(t.get)}" data-tip="${esc(t.get)}">${ICON.download}<span class="hide-sm">${esc(t.get)}</span>${ICON.chev}</button>
          <div class="menu__panel" id="getpanel" role="menu" aria-label="${esc(t.get)}" hidden>
            <button type="button" class="menu__item" role="menuitem" id="dl-pdf" data-file="${esc(file)}">${ICON.filedown}<span class="menu__txt"><span class="menu__label">${esc(t.savePdf)}</span><span class="menu__desc">${esc(t.savePdfDesc)}</span></span></button>
            <button type="button" class="menu__item" role="menuitem" id="dl-print">${ICON.printer}<span class="menu__txt"><span class="menu__label">${esc(t.print)}</span><span class="menu__desc">${esc(t.printDesc)}</span></span></button>
          </div>
        </div>
      </div>
    </div>`;
}

/**
 * Toolbar behaviour plus the engine that flows the document across sheets.
 *
 * Emitted after the sheet markup in `page()`: the wiring reads its elements the moment
 * it runs, so running before the sheet existed is what once left them null.
 *
 * The paginator treats every section as one block of a single ordered flow: it fills a
 * column to its foot, continues in the next, and turns to a fresh A4 sheet only when
 * both columns are spent — measuring every block at print geometry, so nothing is
 * shrunk and nothing is clipped.
 *
 * Two ways out of the browser: "Print" keeps the native dialog, "Save as PDF" captures
 * each sheet on a lossless canvas (html2canvas) and wraps them into a multi-page vector
 * A4 document (jsPDF) that downloads straight to the visitor's files — no print
 * preview, no destination to pick. Both libraries load on first use from a pinned CDN;
 * if the capture cannot be made the item falls back to the print dialog rather than
 * failing silently.
 */
function toolbarScript(): string {
  return `
    <script>
      (function () {
        var pages = document.getElementById('pages');
        var stage = document.getElementById('stage');
        var root = document.documentElement;
        var PAGE_W = 794, PAGE_H = 1122;
        // Pinned UMD builds; loaded on demand, cached, and reused for jsPDF's own
        // html2canvas dependency so nothing is fetched twice.
        var LIB_H2C = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        var LIB_JSPDF = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';
        var narrow = window.matchMedia('(max-width: 819px)');

        // Pagination. The sections are one ordered flow: the first column of a sheet is
        // filled to its foot, the rest carries on in the second, and a fresh sheet starts
        // only when both are spent. Nothing is shrunk and nothing is clipped. Blocks are
        // measured at print geometry — html[data-pdf] pins every sheet to 794 × 1122 —
        // so a page packed on a phone screen breaks in exactly the place it prints.
        function paginate() {
          if (!pages) return;
          var first = pages.querySelector('.page');
          var head = first && first.querySelector('header');
          if (!first || !head) return;
          // The blocks in reading order, however an earlier pass distributed them.
          var blocks = [];
          Array.prototype.forEach.call(pages.querySelectorAll('.flow__col'), function (col) {
            blocks = blocks.concat(Array.prototype.slice.call(col.children));
          });
          if (!blocks.length) return;
          root.setAttribute('data-pdf', '1');
          try {
            var cs = getComputedStyle(first);
            var innerH = PAGE_H - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
            var statFlow = first.querySelector('.flow');
            var topGap = statFlow ? parseFloat(getComputedStyle(statFlow).marginTop) || 0 : 0;
            var locale = pages.getAttribute('data-locale') || 'en';
            pages.innerHTML = '';
            var col = null, second = null, onSecond = false, limit = 0, sheets = 0;
            var startSheet = function (chrome) {
              var sheetEl = document.createElement('div');
              sheetEl.className = 'page';
              sheetEl.appendChild(chrome);
              var flow = document.createElement('div');
              flow.className = 'flow';
              col = document.createElement('div'); col.className = 'flow__col';
              second = document.createElement('div'); second.className = 'flow__col';
              flow.appendChild(col); flow.appendChild(second);
              sheetEl.appendChild(flow);
              pages.appendChild(sheetEl);
              onSecond = false;
              // Everything under the column tops — the header band or the running line —
              // and the flow's own top gap is spent height.
              limit = innerH - chrome.offsetHeight - topGap;
            };
            var nextColumn = function () {
              if (onSecond) {
                sheets += 1;
                var cont = document.createElement('div');
                cont.className = 'cont';
                var label = [
                  pages.getAttribute('data-name') || '',
                  pages.getAttribute('data-doc') || '',
                  (pages.getAttribute('data-page-word') || 'Page') + ' ' + sheets.toLocaleString(locale),
                ].filter(Boolean).join(' · ');
                cont.textContent = label;
                startSheet(cont);
              } else {
                col = second;
                onSecond = true;
              }
            };
            var columnIsFresh = function () { return col.children.length === 0; };
            var place = function (node) {
              col.appendChild(node);
              // scrollHeight rounds to whole pixels; the +1 keeps that rounding from
              // bouncing a block which exactly fills the column into the next one.
              if (col.scrollHeight > limit + 1) { col.removeChild(node); return false; }
              return true;
            };
            sheets = 1;
            startSheet(head);
            blocks.forEach(function (block) {
              if (place(block)) return;
              if (!columnIsFresh()) { nextColumn(); if (place(block)) return; }
              var kids = Array.prototype.slice.call(block.children);
              if (!kids.length) { col.appendChild(block); return; }
              // A block taller than a whole column keeps flowing child by child:
              // its items break across columns instead of vanishing off the sheet.
              kids.forEach(function (kid) {
                if (place(kid)) return;
                if (!columnIsFresh()) { nextColumn(); if (place(kid)) return; }
                col.appendChild(kid);
              });
            });
          } finally {
            root.removeAttribute('data-pdf');
          }
        }

        // The stack of sheets is scaled to the viewport width for the on-screen preview;
        // on narrow screens CSS lays it out as one continuous reading column instead.
        function fitView() {
          if (!pages || !stage) return;
          if (narrow.matches) { pages.style.transform = ''; stage.style.height = ''; return; }
          pages.style.transform = 'none';
          var scs = getComputedStyle(stage);
          var pad = parseFloat(scs.paddingTop) + parseFloat(scs.paddingBottom);
          var ps = Math.min(1, (window.innerWidth - 32) / PAGE_W);
          pages.style.transform = ps < 1 ? 'scale(' + ps + ')' : 'none';
          stage.style.height = pages.offsetHeight * ps + pad + 'px';
        }

        // Printing always uses the A4 two-column sheets, so the flow is re-distributed at
        // print geometry even if the screen was showing the narrow reading layout.
        function preparePrint() {
          paginate();
          fitView();
        }

        function doPrint() { window.print(); }

        function loadScript(src) {
          return new Promise(function (resolve, reject) {
            var existing = document.querySelector('script[src="' + src + '"]');
            if (existing) { existing.addEventListener('load', resolve); existing.addEventListener('error', reject); return; }
            var tag = document.createElement('script');
            tag.src = src; tag.async = true;
            tag.onload = resolve; tag.onerror = function () { reject(new Error('blocked: ' + src)); };
            document.head.appendChild(tag);
          });
        }

        // Snapshot every sheet exactly as the desktop A4 page — never the narrow reading
        // layout — and in whatever theme the visitor is currently viewing. html[data-pdf]
        // restores the fixed boxes and the paginator has already broken the flow at them,
        // so each captured sheet becomes exactly one page of the file.
        function capturePdf() {
          return Promise.all([loadScript(LIB_H2C), loadScript(LIB_JSPDF)]).then(function () {
            var h2c = window.html2canvas;
            var JSPDF = window.jspdf && window.jspdf.jsPDF;
            if (!pages || !h2c || !JSPDF) throw new Error('no pdf engine');
            paginate();
            root.setAttribute('data-pdf', '1');
            pages.style.setProperty('transform', 'none', 'important');
            if (stage) stage.style.height = '';
            var sheets = Array.prototype.slice.call(pages.querySelectorAll('.page'));
            // Follow the sheet's own background so the canvas never fringes white in dark.
            var bg = getComputedStyle(sheets[0]).backgroundColor || '#ffffff';
            var start = (document.fonts && document.fonts.ready) || Promise.resolve();
            var run = start.then(function () {
              return sheets.reduce(function (chain, sheetEl) {
                return chain.then(function (acc) {
                  return h2c(sheetEl, { scale: 3, backgroundColor: bg, logging: false, width: PAGE_W, height: PAGE_H })
                    .then(function (canvas) { acc.push(canvas); return acc; });
                });
              }, Promise.resolve([]));
            }).then(function (canvases) { return makePdf(canvases); });
            return run.finally(function () {
              root.removeAttribute('data-pdf');
              pages.style.removeProperty('transform');
              fitView();
            });
          });
        }

        function makePdf(canvases) {
          var JSPDF = window.jspdf.jsPDF;
          var pdf = new JSPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          canvases.forEach(function (canvas, index) {
            if (index) pdf.addPage('a4', 'portrait');
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
          });
          return pdf.output('blob');
        }

        function saveBlob(blob, name) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url; a.download = name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        }

        // One generation per view: the sheet only changes with the data, so later
        // clicks download instantly from the cached file.
        var pdfBlob = null;
        var pdfBusy = false;
        function savePdf(item) {
          if (pdfBusy) return;
          pdfBusy = true;
          item.setAttribute('data-busy', '1');
          var run = pdfBlob
            ? Promise.resolve(pdfBlob)
            : capturePdf().then(function (blob) { pdfBlob = blob; return pdfBlob; });
          run.then(function (blob) {
            saveBlob(blob, item.getAttribute('data-file') || 'resume.pdf');
          }).catch(function () {
            doPrint(); // last resort — never leave the visitor with nothing
          }).then(function () {
            pdfBusy = false;
            item.removeAttribute('data-busy');
          });
        }

        // Close leaves the résumé: it shuts the popup tab when the résumé lives in one,
        // and otherwise falls back to the site's home — the tab the visitor came from when
        // the résumé was opened in a normal window. Never history.back(): a language switch
        // puts the other résumé in the history and would trap the visitor in a loop.
        var closeBtn = document.getElementById('close');
        if (closeBtn) closeBtn.addEventListener('click', function () {
          if (window.opener) { try { window.close(); } catch (e) {} }
          window.location.replace(closeBtn.getAttribute('data-home') || '/');
        });

        // The theme lives under next-themes' 'theme' key, so the résumé opens the way
        // the site was left and leaves the site the way the résumé was left.
        function applyTheme(next) {
          root.setAttribute('data-theme', next);
          var meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute('content', next === 'dark' ? '#0a0a0a' : '#ffffff');
          try { localStorage.setItem('theme', next); localStorage.removeItem('resume-theme'); } catch (e) {}
          pdfBlob = null; // a themed download must be re-captured in the new theme
        }

        // The circular reveal, aimed here and drawn by the CSS above. This document writes
        // its own attribute, so the change is already on the page when the callback returns
        // and the incoming snapshot is the new palette — no framework help needed. Engines
        // without the API and visitors who asked for reduced motion get the plain switch.
        var reveal = null;
        function revealTheme(next, event) {
          var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (reduce || typeof document.startViewTransition !== 'function') { applyTheme(next); return; }

          // A press made by the keyboard carries no position, so it is aimed at the control
          // rather than at the corner of the screen.
          var x = event.clientX, y = event.clientY;
          if (!event.detail || (x === 0 && y === 0)) {
            var box = event.currentTarget.getBoundingClientRect();
            x = box.left + box.width / 2;
            y = box.top + box.height / 2;
          }
          // Farthest corner, measured to each of its own extremes: the sheet is a wide fixed
          // canvas, and a radius aimed only at the opposite corner would leave the near ones
          // in the old palette on a big screen.
          var far = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)));
          root.style.setProperty('--theme-reveal-x', x + 'px');
          root.style.setProperty('--theme-reveal-y', y + 'px');
          root.style.setProperty('--theme-reveal-r', far + 'px');
          root.setAttribute('data-reveal', '1');

          var run = document.startViewTransition(function () { applyTheme(next); });
          // A second press cuts the running reveal short, so only the newest one may put the
          // aim back — releasing it earlier would drop an in-flight circle onto its centred
          // fallback half-way across the page.
          reveal = run;
          var done = function () {
            if (reveal !== run) return;
            reveal = null;
            root.removeAttribute('data-reveal');
            root.style.removeProperty('--theme-reveal-x');
            root.style.removeProperty('--theme-reveal-y');
            root.style.removeProperty('--theme-reveal-r');
          };
          run.finished.then(done, done);
        }

        var themeBtn = document.getElementById('theme');
        if (themeBtn) themeBtn.addEventListener('click', function (event) {
          revealTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', event);
        });

        // role="toolbar" promises arrow-key movement between its controls, so exactly one
        // of them stays in the tab order and the arrows walk that row. Movement follows the
        // reading direction: in a Persian document the row runs right to left. Marked in
        // script only — without it every control keeps its natural tab stop.
        var stops = Array.prototype.slice.call(document.querySelectorAll('.toolbar__actions [data-roving]'));
        if (stops.length > 1) {
          var backwards = root.dir === 'rtl';
          var focusStop = function (at) {
            var target = stops[((at % stops.length) + stops.length) % stops.length];
            stops.forEach(function (stop) { stop.setAttribute('tabindex', '-1'); });
            target.setAttribute('tabindex', '0');
            target.focus();
          };
          stops.forEach(function (stop, index) {
            stop.setAttribute('tabindex', index === 0 ? '0' : '-1');
            stop.addEventListener('keydown', function (event) {
              var at = stops.indexOf(document.activeElement);
              if (at < 0) return;
              if (event.key === 'ArrowRight') { event.preventDefault(); focusStop(at + (backwards ? -1 : 1)); }
              else if (event.key === 'ArrowLeft') { event.preventDefault(); focusStop(at + (backwards ? 1 : -1)); }
              else if (event.key === 'Home') { event.preventDefault(); focusStop(0); }
              else if (event.key === 'End') { event.preventDefault(); focusStop(stops.length - 1); }
            });
          });
        }

        // Get menu: one trigger, two ways out of the browser. Escape and outside
        // clicks dismiss it; the arrows walk the items like a native menu.
        var menu = document.getElementById('getmenu');
        var getBtn = document.getElementById('get');
        var panel = document.getElementById('getpanel');
        function setOpen(open) {
          menu.setAttribute('data-open', open ? 'true' : 'false');
          getBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
          panel.hidden = !open;
        }
        getBtn.addEventListener('click', function (event) { event.stopPropagation(); setOpen(panel.hidden); });
        document.addEventListener('click', function (event) { if (!panel.hidden && !menu.contains(event.target)) setOpen(false); });
        document.addEventListener('keydown', function (event) {
          if (panel.hidden) return;
          var items = panel.querySelectorAll('.menu__item');
          var at = Array.prototype.indexOf.call(items, document.activeElement);
          if (event.key === 'Escape') { setOpen(false); getBtn.focus(); }
          else if (event.key === 'ArrowDown') { event.preventDefault(); items[(at + 1) % items.length].focus(); }
          else if (event.key === 'ArrowUp') { event.preventDefault(); items[(at - 1 + items.length) % items.length].focus(); }
          else if (event.key === 'Home') { event.preventDefault(); items[0].focus(); }
          else if (event.key === 'End') { event.preventDefault(); items[items.length - 1].focus(); }
        });
        function onItem(id, run) {
          var item = document.getElementById(id);
          if (item) item.addEventListener('click', function () { setOpen(false); run(); });
        }
        onItem('dl-pdf', function () { savePdf(document.getElementById('dl-pdf')); });
        onItem('dl-print', function () { preparePrint(); doPrint(); });
        // Break the flow now, then break it again once the real faces are in: fallback
        // metrics and Estedad differ by enough to move a column foot.
        paginate();
        fitView();
        window.addEventListener('resize', fitView);
        window.addEventListener('load', fitView);
        window.addEventListener('beforeprint', preparePrint);
        if (narrow.addEventListener) narrow.addEventListener('change', fitView);
        else if (narrow.addListener) narrow.addListener(fitView);
        if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { paginate(); fitView(); }); }
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

/** Runs before paint so the chosen theme never flashes on load. Reads the site's own
 *  next-themes key first (falling back to the résumé's legacy key), resolves `system`
 *  through the OS preference, and keeps the browser chrome colour in step. */
const THEME_INIT =
  "(function(){var t;try{t=localStorage.getItem('theme')||localStorage.getItem('resume-theme');}catch(e){}if(t!=='dark'&&t!=='light'){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name=\"theme-color\"]');if(m)m.setAttribute('content',t==='dark'?'#0a0a0a':'#ffffff');})();";

/** The full <head>: charset, viewport, SEO meta, Open Graph / Twitter, hreflang and JSON-LD. */
function headHtml(locale: AppLocale, h: Head): string {
  const other = locale === 'fa' ? 'en' : 'fa';
  const lines: string[] = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${esc(h.title)}</title>`,
    `<meta name="description" content="${esc(h.description)}" />`,
    `<meta name="robots" content="${esc(h.robots)}" />`,
    '<meta name="theme-color" content="#ffffff" />',
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
function page(locale: AppLocale, head: Head, bodyInner: string, name?: string): string {
  const dir = locale === 'fa' ? 'rtl' : 'ltr';
  const t = TEXT[locale];
  return `<!doctype html>
<html lang="${locale}" dir="${dir}" data-theme="light">
  <head>
    ${headHtml(locale, head)}
    <style>${FONTS}${STYLE}</style>
    <script>${THEME_INIT}</script>
  </head>
  <body>
    ${toolbar(locale, name)}
    <div class="stage" id="stage">
      <div class="pages" id="pages" data-locale="${locale}" data-name="${esc(name || '')}" data-doc="${esc(t.docTitle)}" data-page-word="${esc(t.pageWord)}">
        <div class="page">
${bodyInner}
        </div>
      </div>
    </div>
    ${toolbarScript()}
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
          </header>`;
}

/** A titled block: heading + body, only emitted when the caller passes content. */
function section(title: string, inner: string, extraClass = ''): string {
  return inner
    ? `          <section class="sec${extraClass ? ` ${extraClass}` : ''}"><h2 class="sh">${esc(title)}</h2>\n${inner}\n          </section>`
    : '';
}

/**
 * One role: the title and company share the first line, the facts (period, location,
 * type) share the second, start-aligned in both directions. Either line wraps cleanly
 * when it outgrows the column, and a missing piece never leaves a stray separator.
 */
function experienceHtml(model: ResumeModel): string {
  return model.experience
    .map(item => {
      // `jobType` is optional in the profile schema — the chip renders only when the
      // field exists, so this stays correct whether or not `build.ts` added it.
      const jobType = (item as { jobType?: string }).jobType;
      const head = [
        item.role ? `<span class="xp__role">${esc(item.role)}</span>` : '',
        item.role && item.company ? `<span class="xp__sep" aria-hidden="true">·</span>` : '',
        item.company ? `<span class="xp__org">${esc(item.company)}</span>` : '',
      ]
        .filter(Boolean)
        .join('');
      const meta = [
        item.period ? `<span class="xp__m" dir="ltr">${ICON.calendar}${esc(item.period)}</span>` : '',
        item.location ? `<span class="xp__m">${ICON.pin}${esc(item.location)}</span>` : '',
        jobType ? `<span class="xp__m">${ICON.briefcase}${esc(jobType)}</span>` : '',
      ]
        .filter(Boolean)
        .join('');
      return `            <div class="xp">
              ${head ? `<div class="xp__head">${head}</div>` : ''}
              ${meta ? `<div class="xp__meta">${meta}</div>` : ''}
              ${item.bullets.length ? `<ul class="xp__list">${item.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
            </div>`;
    })
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

/** One credential per row: the name, the body that issued it and the span it is valid for. */
function certificatesHtml(model: ResumeModel): string {
  return model.certificates
    .map(
      certificate => `            <div class="ct">
              <div class="ct__title">${esc(certificate.title)}</div>
              ${certificate.issuer ? `<div class="ct__issuer">${esc(certificate.issuer)}</div>` : ''}
              ${certificate.period ? `<div class="ct__meta"><span class="ct__m">${ICON.calendar}${esc(certificate.period)}</span></div>` : ''}
            </div>`
    )
    .join('\n');
}

/** One language per row: name on the leading edge, the level word and its dot meter on the other. */
function languagesHtml(model: ResumeModel): string {
  return model.languages
    .map(language => {
      const label = LEVEL_LABELS[model.locale][language.level] ?? '';
      const filled = LEVEL_DOTS[language.level] ?? 0;
      const dots = [1, 2, 3, 4, 5].map(step => `<i${step <= filled ? ' class="on"' : ''}></i>`).join('');
      return `            <li class="lang">
              <span class="lang__name">${esc(language.name)}</span>
              <span class="lang__side"><span class="lang__lvl">${esc(label)}</span><span class="lang__dots" aria-hidden="true">${dots}</span></span>
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

/** Render a composed résumé as a complete, printable, paginated HTML document. */
export function renderResumeHtml(model: ResumeModel): string {
  const t = TEXT[model.locale];

  // One ordered flow, résumé-classic: the summary opens, the career and languages
  // follow, then the supporting facts. The markup writes it as the honest no-script
  // sheet — career down the leading column, supporting facts down the other — and the
  // viewer script re-breaks that very order across columns and sheets, filling both
  // columns before any page turns. A side with nothing to say is the single-column
  // document the static markup already is.
  const mainCol = [
    section(t.summary, model.summary ? `            <p class="summary">${esc(model.summary)}</p>` : ''),
    section(t.experience, experienceHtml(model)),
    section(
      t.languages,
      model.languages.length
        ? `          <ul class="langs">
${languagesHtml(model)}
          </ul>`
        : ''
    ),
  ].filter(Boolean);

  const sideCol = [
    section(t.skills, model.skills.length ? `            <p class="sk">${esc(model.skills.join(', '))}</p>` : ''),
    section(t.projects, projectsHtml(model)),
    section(t.education, educationHtml(model)),
    section(t.certificates, certificatesHtml(model)),
  ].filter(Boolean);

  const all = [...mainCol, ...sideCol];
  const flow = !all.length
    ? ''
    : mainCol.length && sideCol.length
      ? `          <div class="flow">
            <div class="flow__col">
${mainCol.join('\n')}
            </div>
            <div class="flow__col">
${sideCol.join('\n')}
            </div>
          </div>`
      : `          <div class="flow flow--single">
            <div class="flow__col">
${all.join('\n')}
            </div>
          </div>`;

  const body = `${headerHtml(model)}
${flow}`;

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

  return page(model.locale, head, body, model.name);
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
