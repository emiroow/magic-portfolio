'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import React from 'react';

interface ResumeCardProps {
  logoUrl?: string;
  altText?: string;
  title?: string;
  subtitle?: string;
  href?: string;
  badges?: readonly string[];
  period?: string;
  /** Extra trailing segment on the meta line (e.g. the work location). */
  meta?: string;
  description?: string;
}

/** Absolute URLs open in a new tab; internal ones navigate in place. */
const isExternal = (href: string) => /^https?:\/\//i.test(href);

/**
 * Hairline dot separating segments of the meta line.
 * The same token the dashboard's `Chips.Dot` uses; it cannot be imported from there
 * (shared components never reach into a feature), and `text-border` was one shade too
 * faint to read as a separator on the light ground.
 */
const Dot = () => (
  <span aria-hidden className="text-muted-foreground/60">
    ·
  </span>
);

/**
 * One public timeline entry (work / education).
 *
 * Title on the first line, role · period · place on the second, so no element floats
 * to the opposite edge of the row. The description is disclosed through an explicit
 * toggle (CSS height transition, no animation runtime) so an entry can link out *and*
 * expand.
 *
 * The type ramp and the emphasis tokens are the ones the project card declares — 14px
 * title, 12px supporting prose, `foreground/30` on hover, an inverted bordered pill for
 * the interactive element — and they are deliberately not stepped up at `sm`, because a
 * second scale is what made these two sections look like neighbours rather than family.
 *
 * The dashboard lists its own records with `ResumeRow` instead: these are entries a
 * visitor reads, not records an owner edits.
 */
export const ResumeCard = ({ logoUrl, altText, title, subtitle, href, badges, period, meta, description }: ResumeCardProps) => {
  const t = useTranslations();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const headingId = React.useId();

  return (
    <article className="group flex w-full flex-col px-4 py-4 transition-colors hover:bg-muted/40 focus-within:bg-muted/40 sm:px-5">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* The gutter is always reserved so rows stay aligned without a logo. */}
        <Avatar className="size-9 shrink-0 border transition-colors group-hover:border-foreground/30 sm:size-11">
          {logoUrl && (
            <AvatarImage
              src={logoUrl}
              alt={altText ?? ''}
              className="object-contain grayscale transition-[filter] duration-500 group-hover:grayscale-0"
            />
          )}
          <AvatarFallback className="bg-transparent text-xs font-semibold text-muted-foreground">
            {(altText || title || '?').charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 grow">
          <h3 id={headingId} className="min-w-0 break-words text-sm font-semibold leading-snug">
            {href ? (
              <Link
                href={href}
                {...(isExternal(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="decoration-muted-foreground/50 underline-offset-2 transition-colors hover:underline"
              >
                {title}
                {isExternal(href) && <ExternalLink className="ms-1 inline-block size-3 align-baseline text-muted-foreground" aria-hidden />}
              </Link>
            ) : (
              title
            )}
            {badges && badges.length > 0 && (
              <span className="ms-2 inline-flex flex-wrap gap-1 align-middle">
                {badges.map(badge => (
                  <Badge key={badge} variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                    {badge}
                  </Badge>
                ))}
              </span>
            )}
          </h3>

          {(subtitle || period || meta) && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {subtitle && <span className="min-w-0 break-words">{subtitle}</span>}
              {subtitle && (period || meta) && <Dot />}
              {period && <span className="shrink-0 tabular-nums whitespace-nowrap">{period}</span>}
              {period && meta && <Dot />}
              {meta && <span className="min-w-0 break-words">{meta}</span>}
            </p>
          )}
        </div>

        {description && (
          <button
            type="button"
            onClick={() => setIsExpanded(value => !value)}
            aria-expanded={isExpanded}
            aria-controls={`${headingId}-panel`}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-foreground hover:text-background',
              isExpanded && 'text-foreground'
            )}
          >
            {/* The word carries the affordance; the chevron carries the state. */}
            <span className="hidden sm:inline">{t('details')}</span>
            <ChevronDown className={cn('size-3 transition-transform duration-300', isExpanded && 'rotate-180')} aria-hidden />
          </button>
        )}
      </div>

      {description && (
        <div id={`${headingId}-panel`} role="region" aria-labelledby={headingId} inert={!isExpanded} data-open={isExpanded} className="disclosure">
          <div>
            <p className="whitespace-pre-line ps-12 pt-3 text-xs leading-relaxed text-muted-foreground sm:ps-[60px]">{description}</p>
          </div>
        </div>
      )}
    </article>
  );
};
