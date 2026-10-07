'use client';

import { EntityCard, RowAction, StatusChip } from '@/features/dashboard/components';
import { IconTile, Tag } from '@/features/support/support-tile';
import { SupportPrice } from '@/features/support/support-price';
import { MODE_ICONS, nameDir, variantDetail, variantLabel } from '@/features/support/support-meta';
import { usableVariants } from '@/features/support/variants';
import type { IDonation } from '@/features/support/types';
import type { AppLocale } from '@/types';
import { documentKey, localizedCount } from '@/lib/utils';
import { ExternalLink, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface SupportOptionRowProps {
  method: IDonation;
  onEdit: (method: IDonation) => void;
  onDelete: (method: IDonation) => void;
  /** This record, and not another one, is being deleted. */
  deleting: boolean;
  onToggleActive: (method: IDonation) => void;
  togglingActive: boolean;
}

/**
 * Dashboard list item for one support method: what it costs, where the money lands,
 * and whether it can actually be paid into. An empty destination list is the one
 * mistake a method can make, so it is said here rather than at checkout.
 */
const SupportOptionRow = ({ method, onEdit, onDelete, deleting, onToggleActive, togglingActive }: SupportOptionRowProps) => {
  const t = useTranslations('dashboard.support.options');
  const ts = useTranslations('support');
  const tp = useTranslations('pricing');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const Icon = MODE_ICONS[method.mode];
  const key = documentKey(method);
  const published = method.active !== false;
  const destinations = usableVariants(method);
  const named = destinations.map(variant => variantLabel(variant, ts, tp) || variantDetail(variant) || variant.key);

  return (
    <EntityCard
      title={method.title}
      titleDir={nameDir(method.title)}
      meta={
        <>
          {ts(`modes.${method.mode}`)}
          <span aria-hidden className="mx-1.5">
            ·
          </span>
          {ts(`regions.${method.region}`)}
        </>
      }
      leading={<IconTile icon={Icon} />}
      actions={
        <>
          <RowAction
            label={published ? t('unpublish') : t('publish')}
            icon={published ? Eye : EyeOff}
            pressed={published}
            pending={togglingActive}
            onClick={() => onToggleActive(method)}
          />
          <RowAction label={t('viewSupport')} icon={ExternalLink} href={`/${locale}/support${key ? `?option=${encodeURIComponent(key)}` : ''}`} />
          <RowAction label={t('edit')} icon={Pencil} onClick={() => onEdit(method)} />
          <RowAction label={t('delete')} icon={Trash2} danger pending={deleting} onClick={() => onDelete(method)} />
        </>
      }
    >
      <div className="space-y-3">
        {method.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm" dir="auto">
            {method.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* The same price line the public card draws, read through this method's own
              first destination. */}
          <SupportPrice option={method} />

          {/* Every destination the supporter will be offered, in page order. */}
          {named.length > 0 && (
            <ul className="flex min-w-0 flex-wrap gap-1.5">
              {named.slice(0, 4).map(label => (
                <li key={label}>
                  <Tag dir={nameDir(label)}>{label}</Tag>
                </li>
              ))}
              {named.length > 4 && (
                <li>
                  <Tag>{`+${localizedCount(named.length - 4, lang)}`}</Tag>
                </li>
              )}
            </ul>
          )}

          <StatusChip solid={published}>{published ? t('active') : t('disabled')}</StatusChip>

          {destinations.length === 0 && <StatusChip alert>{t('railIncomplete')}</StatusChip>}
        </div>
      </div>
    </EntityCard>
  );
};

export default SupportOptionRow;
