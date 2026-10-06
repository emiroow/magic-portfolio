'use client';

import { IconTile, Tag } from '@/features/support/support-tile';
import { SupportPrice } from '@/features/support/support-price';
import { MODE_ICONS, nameDir, variantDetail, variantLabel } from '@/features/support/support-meta';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Loading from '@/components/ui/loading';
import { cn, documentKey, localizedCount } from '@/lib/utils';
import { usableVariants } from '@/features/support/variants';
import type { AppLocale } from '@/types';
import type { IDonation } from '@/features/support/types';
import { ExternalLink, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

interface SupportOptionRowProps {
  method: IDonation;
  onEdit: (method: IDonation) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  onToggleActive: (method: IDonation) => void;
  togglingActive: boolean;
}

/**
 * Dashboard list item for one support method: what it costs, where the money lands,
 * and whether it can actually be paid into. An empty destination list is the one
 * mistake a method can make, so it is said here rather than at checkout.
 */
const SupportOptionRow = ({ method, onEdit, onDelete, isDeleting, onToggleActive, togglingActive }: SupportOptionRowProps) => {
  const t = useTranslations('dashboard.support.options');
  const ts = useTranslations('support');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';
  const [confirmOpen, setConfirmOpen] = useState(false);

  const Icon = MODE_ICONS[method.mode];
  const key = documentKey(method);
  const published = method.active !== false;
  const destinations = usableVariants(method);
  const named = destinations.map(variant => variantLabel(variant, ts) || variantDetail(variant) || variant.key);

  const href = `/${locale}/support${key ? `?option=${encodeURIComponent(key)}` : ''}`;

  return (
    <Card className="transition-colors hover:border-foreground/30">
      <CardHeader className="flex-row items-center justify-between space-y-0 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <IconTile icon={Icon} />
          <div className="min-w-0 space-y-0.5">
            <h3 className="break-words text-sm font-semibold sm:text-base" dir={nameDir(method.title)}>
              {method.title}
            </h3>
            <p className="truncate text-[11px] text-muted-foreground">
              {ts(`modes.${method.mode}`)}
              <span aria-hidden className="mx-1.5">
                ·
              </span>
              {ts(`regions.${method.region}`)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => onToggleActive(method)}
            disabled={togglingActive}
            aria-pressed={published}
            aria-label={published ? t('unpublish') : t('publish')}
            title={published ? t('unpublish') : t('publish')}
          >
            {togglingActive ? <Loading size="sm" /> : published ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
          </Button>
          <Link
            href={href}
            target="_blank"
            aria-label={t('viewSupport')}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}
          >
            <ExternalLink className="size-4" aria-hidden />
          </Link>
          <Button size="icon" variant="ghost" className="size-8" onClick={() => onEdit(method)} aria-label={t('edit')}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            aria-label={t('delete')}
          >
            {isDeleting ? <Loading size="sm" /> : <Trash2 className="size-4" aria-hidden />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
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

          <Badge variant={published ? 'default' : 'outline'} className="text-[10px]">
            {published ? t('active') : t('disabled')}
          </Badge>

          {destinations.length === 0 && (
            <Badge variant="outline" className="border-destructive/40 text-[10px] text-destructive">
              {t('railIncomplete')}
            </Badge>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        itemName={method.title}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete(method._id!);
        }}
      />
    </Card>
  );
};

export default SupportOptionRow;
