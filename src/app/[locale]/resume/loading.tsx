import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AppLocale } from '@/types';
import { getLocale, getTranslations } from 'next-intl/server';

/**
 * Résumé skeleton: the viewer's own control bar and one A4 sheet, drawn at the measurements
 * the live document really takes.
 *
 * The wait here is a document being composed, so the honest placeholder is that document with
 * its words still missing: the 794 × 1122 sheet with its 42/46 margins on a 28/64 stage, the
 * 30px gutter between the two flow columns, the ruled label over every section, and the 36 /
 * 36 / 32 heights the cluster, the way back and the way out occupy in the bar. The classes
 * for the bar are the viewer's own strings rather than approximations of them, so the two
 * cannot disagree about translucency or a hairline, and the swap costs no shift.
 *
 * Two rules keep this honest. `resume.css` belongs to the page, and this file replaces the
 * page rather than wrapping it, so nothing here may depend on a class it defines — every
 * measurement is spelled out again. And the sheet folds to one column at 820px because the
 * real one does, not at Tailwind's 640px: below that break the paper stops being paper, the
 * fixed height and the shadow go with it, and the same sections run single.
 */

/** One line of running text, at the width the section really leaves behind. */
const Line = ({ className }: { className?: string }) => <Skeleton className={cn('h-3 shrink-0 rounded-[2px]', className)} />;

/** A section as the sheet draws one: a short label, the hairline under it, then the body. */
function Block({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <Line className={label} />
      <Skeleton className="mt-1.5 h-px rounded-none bg-border" />
      <div className="mt-2.5 space-y-1.5">{children}</div>
    </div>
  );
}

/** One role: title and company share the first line, the period the next, the facts below them. */
function Role({ bullets }: { bullets: string[] }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <Line className="h-3.5 w-[42%]" />
        <Line className="w-[26%]" />
      </div>
      <Line className="w-[54%]" />
      <div className="space-y-[3px] pt-0.5">
        {bullets.map((width, index) => (
          <div className="flex items-start gap-1.5" key={index}>
            <span className="mt-[5px] size-[3px] shrink-0 rounded-full bg-muted-foreground/40" />
            <Skeleton className={cn('h-3 rounded-[2px]', width)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A language: the name leads, the level word and its five-dot meter follow. */
function Language({ filled }: { filled: number }) {
  return (
    <div className="flex items-center justify-between gap-2.5">
      <Line className="w-[30%]" />
      <div className="flex items-center gap-2">
        <Line className="w-[24%]" />
        <div className="flex gap-[3px]">
          {[1, 2, 3, 4, 5].map(step => (
            <span key={step} className={cn('size-[7px] shrink-0 rounded-full', step <= filled ? 'bg-muted-foreground/60' : 'bg-border')} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** The header band: the name, the headline under it, and one run of iconed contacts. */
function SheetHeader() {
  return (
    <header>
      <Skeleton className="h-[34px] w-72 rounded-[3px]" />
      <Skeleton className="mt-1 h-4 w-44 rounded-[2px]" />
      <div className="mt-3 flex flex-wrap gap-x-[18px] gap-y-[5px]">
        {['w-32', 'w-40', 'w-28', 'w-36'].map((width, index) => (
          <div className="flex items-center gap-[5px]" key={index}>
            <Skeleton className="size-[13px] shrink-0 rounded-full" />
            <Line className={width} />
          </div>
        ))}
      </div>
    </header>
  );
}

/**
 * The two widths the bar's own words decide, read off the live controls in each locale —
 * the title in its face, the download trigger beside its chevron. Everything else in the bar
 * is fixed by padding and icon boxes rather than by words: the cluster lands on 119px in
 * either language and the two collapsed controls on 40 and 60.
 */
const BAR_WIDTH = {
  en: { title: 'w-[51px]', get: 'sm:w-[86px]' },
  fa: { title: 'w-[33px]', get: 'sm:w-[103px]' },
} as const;

/** The bar exactly as `viewer.tsx` builds it, with its controls still blank. */
function BarSkeleton({ lang }: { lang: AppLocale }) {
  const width = BAR_WIDTH[lang];

  return (
    <div className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="size-4 shrink-0 rounded-[3px]" />
          <Line className={cn('h-4 shrink-0', width.title)} />
        </div>
        {/* The hint is the bar's only line that stays behind on a narrow screen. It is blanked
            to the length of its own sentence rather than to the box it sits in, which the bar
            stretches across whatever the controls leave. */}
        <Skeleton className="hidden h-3 min-w-0 flex-1 lg:block lg:max-w-md" />

        <div className="ms-auto flex flex-wrap items-center justify-end gap-2">
          {/* Language and theme share one shell, so the placeholder keeps the shell and blanks
              what is inside it rather than drawing a single block of the same width. The two
              locale halves sum to the live pair's 80px in either order. */}
          <div className="inline-flex h-9 flex-none items-center rounded-full border border-border/80 bg-muted/70 p-[2px] shadow-2xs">
            <Skeleton className="h-7 w-10 shrink-0 rounded-full bg-primary/25" />
            <Skeleton className="h-3.5 w-10 shrink-0 rounded-[2px]" />
            <span className="mx-0.5 h-4 w-px shrink-0 bg-border" />
            <Skeleton className="size-7 shrink-0 rounded-full" />
          </div>
          {/* Icon-only until `sm`, where the word appears beside it. */}
          <Skeleton className="h-9 w-10 rounded-full sm:w-[78px]" />
          <Skeleton className={cn('h-8 w-[60px] rounded-full bg-muted-foreground/25', width.get)} />
        </div>
      </div>
    </div>
  );
}

/**
 * The placeholder is one live region: a reader who cannot see it is told once what is being
 * waited for, and every shape under it is hidden — otherwise assistive technology walks a
 * document of empty sections and rules that name nothing. `role="status"` rather than an
 * `aria-label` on a bare `div`, because a name on a generic element is not one anything reads.
 */
export default async function ResumeLoading() {
  const locale = await getLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';
  const t = await getTranslations({ locale, namespace: 'resume' });

  return (
    <div role="status" aria-busy="true" className="min-h-dvh bg-muted dark:bg-background">
      <span className="sr-only">{t('loading')}</span>

      <div aria-hidden="true">
        <BarSkeleton lang={lang} />

        {/* The stage: centred, clipped, and 28px of grey above the paper exactly as the sheet
            sits there. The sheet is one A4 page in either language, which is the honest median
            and the only thing a placeholder can know before the content exists: a profile that
            runs long breaks onto a second sheet, and the reader watches the document grow. */}
        <div className="flex justify-center overflow-hidden px-0 pt-7 pb-16 max-[819px]:p-0">
          <div className="h-[1122px] w-[794px] shrink-0 overflow-hidden bg-background px-[46px] py-[42px] shadow-[0_6px_24px_rgb(0_0_0/0.08)] dark:bg-card dark:shadow-[0_6px_24px_rgb(0_0_0/0.6)] max-[819px]:h-auto max-[819px]:w-full max-[819px]:max-w-[640px] max-[819px]:overflow-visible max-[819px]:px-[22px] max-[819px]:py-[28px] max-[819px]:shadow-none dark:max-[819px]:shadow-none">
            <SheetHeader />

            {/* Both columns are filled to near the foot of the sheet, which is what a first page
                of a real career looks like — and what makes the single reading column a phone
                gets come out at the length that column really runs to. */}
            <div className="mt-5 grid grid-cols-2 gap-x-[30px] max-[819px]:grid-cols-1 max-[819px]:gap-y-4">
              <div className="min-w-0">
                <Block label="w-[24%]">
                  <Line />
                  <Line />
                  <Line />
                  <Line className="w-[86%]" />
                </Block>

                <Block label="w-[34%]">
                  {[
                    ['w-full', 'w-[92%]', 'w-4/5'],
                    ['w-full', 'w-[88%]'],
                    ['w-[96%]', 'w-[80%]', 'w-2/3'],
                    ['w-full', 'w-[70%]'],
                    ['w-[90%]', 'w-full'],
                    ['w-full', 'w-[84%]', 'w-3/5'],
                    ['w-[92%]', 'w-[76%]'],
                  ].map((bullets, index) => (
                    <Role bullets={bullets} key={index} />
                  ))}
                </Block>

                <Block label="w-[30%]">
                  {[5, 5, 4, 3, 2].map((filled, index) => (
                    <Language filled={filled} key={index} />
                  ))}
                </Block>
              </div>

              {/* The column that carries on beside it: the toolkit first, then the work and
                  the facts behind it. */}
              <div className="min-w-0">
                <Block label="w-[22%]">
                  <Line />
                  <Line />
                  <Line className="w-[94%]" />
                  <Line />
                  <Line className="w-[78%]" />
                </Block>

                <Block label="w-[26%]">
                  {[
                    ['w-[52%]', 'w-full', 'w-[38%]'],
                    ['w-[44%]', 'w-[96%]', 'w-[34%]'],
                    ['w-[58%]', 'w-[92%]', 'w-[41%]'],
                    ['w-[36%]', 'w-[88%]'],
                  ].map((entry, index) => (
                    <div className="space-y-1.5" key={index}>
                      {entry.map((width, at) => (
                        <Line className={cn(width, at === 0 && 'h-3.5')} key={at} />
                      ))}
                    </div>
                  ))}
                </Block>

                <Block label="w-[32%]">
                  {[
                    ['w-[58%]', 'w-[38%]'],
                    ['w-[49%]', 'w-[31%]'],
                    ['w-[62%]', 'w-[35%]'],
                  ].map((entry, index) => (
                    <div className="space-y-1" key={index}>
                      <Line className={cn(entry[0], 'h-3.5')} />
                      <Line className={entry[1]} />
                    </div>
                  ))}
                </Block>

                <Block label="w-[38%]">
                  {['w-[66%]', 'w-[58%]', 'w-[70%]', 'w-[52%]'].map((width, index) => (
                    <div className="space-y-1" key={index}>
                      <Line className={width} />
                      <Line className="h-2.5 w-[36%]" />
                    </div>
                  ))}
                </Block>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
