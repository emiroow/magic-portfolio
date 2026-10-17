'use client';

import { Button } from '@/components/ui/button';
import Loading from '@/components/ui/loading';
import { ModeToggle } from '@/components/mode-toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NARROW_QUERY, fitView, isNarrow, layout, type Sheets } from '@/features/profile/resume/layout-engine';
import { capturePdf, savePdfFile } from '@/features/profile/resume/pdf-export';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { ChevronDown, Download, FileDown, FileText, Printer, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppLocale } from '@/types';

/** Everything the reader says, read off the locale's messages by the page. */
export interface ResumeViewerLabels {
  docTitle: string;
  hint: string;
  controls: string;
  home: string;
  get: string;
  pdf: string;
  pdfDesc: string;
  pdfBusy: string;
  print: string;
  printDesc: string;
  theme: string;
  toOther: string;
}

/** A locale is always named in its own language and its own face, the way every switcher does it. */
const LOCALE_LABEL: Record<AppLocale, string> = { en: 'EN', fa: 'فارسی' };

/** The other one — the only destination the language half of the cluster can lead to. */
const OTHER: Record<AppLocale, AppLocale> = { en: 'fa', fa: 'en' };

interface ResumeViewerProps {
  locale: AppLocale;
  /** The name at the head of the sheet: it runs the page's running line and the file name. */
  name: string;
  /** The word for "Page" in the running line, which the engine assembles in the DOM. */
  pageWord: string;
  labels: ResumeViewerLabels;
  children: React.ReactNode;
}

/** The three nodes the engine works on, read off the rendered reader. */
function sheetsOf(root: HTMLElement | null): Sheets | null {
  const stage = root?.querySelector<HTMLElement>('.rs-stage');
  const pages = root?.querySelector<HTMLElement>('.rs-pages');
  return root && stage && pages ? { root, stage, pages } : null;
}

/** Break the flow at print geometry, then fit what that produced to the viewport. */
function relayout(root: HTMLElement | null): void {
  const sheets = sheetsOf(root);
  if (sheets) layout(sheets, isNarrow());
}

/** A file name that says whose résumé it is, in whatever script the name is written in. */
function fileNameOf(name: string, fallback: string): string {
  const slug = name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
  return `${slug || fallback}.pdf`;
}

/** One line of the Get menu: a mark, what it does, and how it does it. */
function ActionItem({
  icon,
  title,
  description,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={disabled || undefined}
      className="flex w-full items-start gap-3 rounded-md p-2.5 text-start transition-colors hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-60"
    >
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-muted-foreground">{icon}</span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

export default function ResumeViewer({ locale, name, pageWord, labels, children }: ResumeViewerProps) {
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const { resolvedTheme } = useTheme();
  const rootRef = useRef<HTMLElement | null>(null);
  const cached = useRef<Blob | null>(null);

  const attach = useCallback((node: HTMLElement | null) => {
    rootRef.current = node;
    relayout(node);
  }, []);

  useEffect(() => {
    const narrow = window.matchMedia(NARROW_QUERY);
    const refresh = () => relayout(rootRef.current);
    const rescale = () => {
      const sheets = sheetsOf(rootRef.current);
      if (sheets) fitView(sheets, narrow.matches);
    };

    narrow.addEventListener('change', rescale);
    window.addEventListener('resize', rescale);
    window.addEventListener('load', rescale);
    window.addEventListener('beforeprint', refresh);
    document.fonts?.ready.then(refresh, refresh);

    return () => {
      narrow.removeEventListener('change', rescale);
      window.removeEventListener('resize', rescale);
      window.removeEventListener('load', rescale);
      window.removeEventListener('beforeprint', refresh);
    };
  }, []);

  useEffect(() => {
    cached.current = null;
  }, [resolvedTheme]);

  const print = () => {
    relayout(rootRef.current);
    window.print();
  };

  const savePdf = async () => {
    if (busy) return;
    const sheets = sheetsOf(rootRef.current);
    if (!sheets) return;

    setBusy(true);
    try {
      const blob = cached.current ?? (await capturePdf(sheets));
      cached.current = blob;
      savePdfFile(blob, fileNameOf(name, labels.docTitle));
    } catch {
      window.print();
    } finally {
      fitView(sheets, isNarrow());
      setBusy(false);
    }
  };

  const pickPrint = () => {
    setMenu(false);
    print();
  };

  const pickPdf = () => {
    setMenu(false);
    void savePdf();
  };

  const otherLocale = OTHER[locale];

  return (
    <main className="rs-root" ref={attach}>
      <div className="rs-bar sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-5">
          <p className="flex min-w-0 items-center gap-2 text-sm font-bold">
            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{labels.docTitle}</span>
          </p>
          <p className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground lg:block">{labels.hint}</p>

          <div className="ms-auto flex flex-wrap items-center justify-end gap-2" role="group" aria-label={labels.controls}>
            {/* Language & Theme Pill Cluster */}
            <div className="inline-flex h-9 flex-none items-center rounded-full border border-border/80 bg-muted/70 p-[2px] shadow-2xs">
              <Link
                href="/resume"
                locale={otherLocale}
                aria-label={labels.toOther}
                className="group inline-flex h-full items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {/* Active Locale Pill */}
                <span
                  aria-hidden
                  className={cn(
                    'inline-flex h-7 min-w-8 shrink-0 items-center justify-center rounded-full bg-primary px-2.5 text-[11px] font-bold leading-none text-primary-foreground shadow-2xs transition-transform duration-150 group-active:scale-95',
                    locale === 'fa' ? 'font-fa' : 'font-en'
                  )}
                >
                  {LOCALE_LABEL[locale]}
                </span>

                {/* Inactive Locale Label */}
                <span
                  aria-hidden
                  className={cn(
                    'inline-flex h-7 shrink-0 items-center justify-center px-2.5 text-[10px] font-semibold leading-none text-muted-foreground transition-colors duration-150 group-hover:text-foreground',
                    otherLocale === 'fa' ? 'font-fa' : 'font-en'
                  )}
                >
                  {LOCALE_LABEL[otherLocale]}
                </span>
              </Link>

              {/* Vertical Hairline Divider */}
              <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />

              {/* Theme Toggle Button */}
              <ModeToggle
                aria-label={labels.theme}
                className="size-7 shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
              />
            </div>

            <Button asChild variant="ghost" size="sm" className="h-9 gap-2 rounded-full px-3 text-muted-foreground hover:text-foreground">
              <Link href="/" aria-label={labels.home}>
                <X className="size-4" aria-hidden />
                <span className="hidden sm:inline">{labels.home}</span>
              </Link>
            </Button>

            <Popover open={menu} onOpenChange={setMenu}>
              <PopoverTrigger asChild>
                <Button size="sm" className="h-8 gap-2 rounded-full px-2.5" aria-busy={busy}>
                  {busy ? <Loading size="sm" /> : <Download className="size-4" aria-hidden />}
                  <span className="hidden sm:inline">{busy ? labels.pdfBusy : labels.get}</span>
                  <ChevronDown className={cn('size-4 shrink-0 opacity-70 transition-transform duration-150', menu && 'rotate-180')} aria-hidden />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[min(19rem,calc(100vw-2rem))] p-1.5" side="bottom" align="end" sideOffset={8}>
                <ActionItem
                  icon={busy ? <Loading size="sm" /> : <FileDown className="size-4" aria-hidden />}
                  title={labels.pdf}
                  description={busy ? labels.pdfBusy : labels.pdfDesc}
                  disabled={busy}
                  onClick={pickPdf}
                />
                <ActionItem
                  icon={<Printer className="size-4" aria-hidden />}
                  title={labels.print}
                  description={labels.printDesc}
                  onClick={pickPrint}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="rs-stage">
        <div className="rs-pages" data-locale={locale} data-name={name} data-doc={labels.docTitle} data-page-word={pageWord}>
          {children}
        </div>
      </div>
    </main>
  );
}
