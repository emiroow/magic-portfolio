import BlurFade from '@/components/magicui/blur-fade';
import { SectionMark, type SectionMarkKey } from '@/components/section-mark';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Small-caps eyebrow line shared by every section and page header.
 * Tracking and the monospace face are LTR-only: letter-spacing breaks the
 * joining of Persian glyphs, so RTL keeps the default script metrics.
 */
export const eyebrowClass = 'text-[11px] font-medium uppercase text-muted-foreground ltr:font-mono ltr:tracking-[0.18em] rtl:tracking-normal';

/** Heading fields every section accepts, forwarded straight to the header. */
export interface SectionHeadingProps {
  /** Localized ordinal rendered before the label (e.g. `01` / `۰۱`). */
  index?: string;
  /** Eyebrow label above the title. */
  label?: string;
  /** Main heading. */
  title: string;
  /** Supporting sentence under the title. */
  description?: string;
  /** Trailing metadata aligned to the end of the eyebrow row (item count). */
  meta?: string;
}

/**
 * `default` is the site's single header language. `spine` adds the section's own
 * glyph on a fading rail at the inline-start; internal pages opt in, the home
 * page never does.
 */
export type SectionHeaderVariant = 'default' | 'spine';

interface SectionHeaderProps extends SectionHeadingProps {
  /** Trailing control aligned to the end of the title row. */
  action?: ReactNode;
  /** Pages use `h1`; home sections use `h2`. */
  as?: 'h1' | 'h2';
  /** Heading id for `aria-labelledby` and in-page anchors. */
  id?: string;
  className?: string;
  titleClassName?: string;
  /** Stagger offset for the entrance animation. */
  delay?: number;
  /** Header treatment; see `SectionHeaderVariant`. */
  variant?: SectionHeaderVariant;
  /** Section the spine glyph belongs to; required for `variant="spine"`. */
  mark?: SectionMarkKey;
}

/**
 * The site's single header language: eyebrow (ordinal + label + meta),
 * bold title, optional description and a hairline that fades out toward
 * the end of the reading direction.
 */
export function SectionHeader({
  index,
  label,
  title,
  description,
  meta,
  action,
  as: Tag = 'h2',
  id,
  className,
  titleClassName,
  delay = 0,
  variant = 'default',
  mark,
}: SectionHeaderProps) {
  const hasEyebrow = Boolean(index || label || meta);
  const spineMark = variant === 'spine' ? mark : undefined;

  const fields = (
    <>
      {hasEyebrow && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {index && (
              <span aria-hidden className="text-[11px] tabular-nums text-muted-foreground/70 ltr:font-mono">
                {index}
              </span>
            )}
            {index && label && <span aria-hidden className="h-px w-5 shrink-0 bg-border" />}
            {label && <p className={cn(eyebrowClass, 'truncate')}>{label}</p>}
          </div>
          {meta && <p className="shrink-0 text-[11px] tabular-nums text-muted-foreground ltr:font-mono">{meta}</p>}
        </div>
      )}

      <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-2', hasEyebrow && 'mt-3')}>
        <Tag id={id} className={cn('text-2xl font-bold leading-tight ltr:tracking-tight sm:text-3xl', titleClassName)}>
          {title}
        </Tag>
        {action}
      </div>

      {description && <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>}

      <div aria-hidden className="rule-fade mt-6" />
    </>
  );

  return (
    <BlurFade delay={delay}>
      {spineMark ? (
        <header className={cn('mb-7 flex items-stretch gap-4 sm:gap-5', className)}>
          {/* Rail: the glyph opens the block and the hairline carries it down,
              fading before the content ends. Vertical, so RTL needs no mirror. */}
          <div aria-hidden className="flex w-7 shrink-0 flex-col items-center gap-3 sm:w-8">
            <SectionMark mark={spineMark} className="size-5 text-muted-foreground" />
            <span className="w-px flex-1 bg-gradient-to-b from-border to-transparent" />
          </div>
          <div className="min-w-0 flex-1">{fields}</div>
        </header>
      ) : (
        <header className={cn('mb-7', className)}>{fields}</header>
      )}
    </BlurFade>
  );
}
