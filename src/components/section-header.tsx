import BlurFade from '@/components/magicui/blur-fade';
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
}: SectionHeaderProps) {
  const hasEyebrow = Boolean(index || label || meta);

  return (
    <BlurFade delay={delay}>
      <header className={cn('mb-7', className)}>
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
      </header>
    </BlurFade>
  );
}
