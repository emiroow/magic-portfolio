'use client';

import { Dot } from '@/features/dashboard/components/Chips';
import { EntityCard } from '@/features/dashboard/components/EntityCard';
import { RowAction } from '@/features/dashboard/components/RowAction';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ResumeRowProps {
  logoUrl?: string;
  /** Also the source of the initial shown when there is no logo. */
  altText?: string;
  title?: string;
  subtitle?: string;
  href?: string;
  period?: string;
  /** Trailing segment of the meta line, e.g. the workplace's city. */
  meta?: string;
  description?: string;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * A school or a job, in the dashboard's list grammar.
 *
 * These two archives used to render the public timeline card inside a divided stack,
 * which made them the only sections that did not look like the other seven. They are
 * records the owner edits, not entries a visitor reads, so they wear the same card,
 * the same leading mark, the same meta line and the same action cluster as everything
 * else — and the description is clamped into the body instead of hidden behind a
 * disclosure, because here it is a field being checked rather than prose being read.
 */
export function ResumeRow({ logoUrl, altText, title, subtitle, href, period, meta, description, onEdit, onDelete }: ResumeRowProps) {
  const t = useTranslations('dashboard');
  const initial = (altText || title || '?').charAt(0);

  return (
    <EntityCard
      title={title ?? ''}
      meta={
        (subtitle || period || meta) && (
          <>
            {subtitle && <span>{subtitle}</span>}
            {subtitle && (period || meta) && <Dot className="mx-1.5" />}
            {period && <span className="tabular-nums">{period}</span>}
            {period && meta && <Dot className="mx-1.5" />}
            {meta && <span>{meta}</span>}
          </>
        )
      }
      leading={
        <Avatar className="size-9 shrink-0 border">
          {logoUrl && <AvatarImage src={logoUrl} alt={altText ?? ''} className="object-contain" />}
          <AvatarFallback className="bg-transparent text-xs font-semibold text-muted-foreground">{initial}</AvatarFallback>
        </Avatar>
      }
      actions={
        <>
          {href && <RowAction label={t('openLink')} icon={ExternalLink} href={href} />}
          <RowAction label={t('edit')} icon={Pencil} onClick={onEdit} />
          <RowAction label={t('delete')} icon={Trash2} danger onClick={onDelete} />
        </>
      }
    >
      {description && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>}
    </EntityCard>
  );
}
