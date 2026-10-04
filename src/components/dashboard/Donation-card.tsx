'use client';

import { PriceTag } from '@/components/products/price-tag';
import { CupRow } from '@/components/support/coffee-mark';
import { MODE_ICONS, destinationKey, shortenAddress } from '@/components/support/support-meta';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Loading from '@/components/ui/loading';
import type { IDonation } from '@/types';
import { cn, documentKey, localizedCount } from '@/lib/utils';
import { ExternalLink, Eye, EyeOff, Pencil, Pin, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

interface DonationRowProps {
  option: IDonation;
  onEdit: (option: IDonation) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  /** 1-based position on the home page, or 0 when the option is not picked. */
  homePosition: number;
  /** Every slot is taken by another option, so this one cannot be picked. */
  slotsFull: boolean;
  onToggleHome: (option: IDonation) => void;
  togglingHome: boolean;
  onToggleActive: (option: IDonation) => void;
  togglingActive: boolean;
}

/**
 * Dashboard list item for one support option: what it costs, which rail it runs
 * on, and whether that rail is actually usable (a card option with no number, or
 * a gateway with no credentials, says so here rather than at checkout).
 */
const DonationRow = ({
  option,
  onEdit,
  onDelete,
  isDeleting,
  homePosition,
  slotsFull,
  onToggleHome,
  togglingHome,
  onToggleActive,
  togglingActive,
}: DonationRowProps) => {
  const t = useTranslations('dashboard.donation');
  const ts = useTranslations('support');
  const locale = useLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';
  const [confirmOpen, setConfirmOpen] = useState(false);

  const Icon = MODE_ICONS[option.mode];
  const key = documentKey(option);
  const published = option.active !== false;
  const featured = option.active && option.featured === true;
  const destination = destinationKey(option);

  /** The rail is configured: a URL for the hand-offs, digits for a transfer. */
  const usable =
    option.mode === 'referral' || option.mode === 'link'
      ? Boolean(option.href)
      : option.mode === 'card'
        ? Boolean(option.card?.number || option.card?.iban)
        : option.mode === 'crypto'
          ? Boolean(option.crypto?.address)
          : Boolean(option.gateway);

  const detail =
    option.mode === 'card'
      ? option.card?.number
        ? `•••• ${option.card.number.slice(-4)}`
        : shortenAddress(option.card?.iban)
      : option.mode === 'crypto'
        ? shortenAddress(option.crypto?.address)
        : option.href
          ? new URL(option.href).hostname.replace(/^www\./, '')
          : '';

  // A dead control is worse than no control: say why it is unavailable.
  const homeBlock = !option.active ? t('featuredNeedsPublish') : slotsFull && !featured ? t('featuredFull') : '';

  return (
    <Card className="transition-colors hover:border-foreground/30">
      <CardHeader className="flex-row items-center justify-between space-y-0 p-4 sm:p-5">
        <div className="min-w-0 space-y-0.5">
          <h3 className="truncate text-sm font-semibold sm:text-base">{option.title}</h3>
          <p className="flex min-w-0 items-center gap-1.5 truncate text-[11px] text-muted-foreground">
            <Icon className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{ts(`modes.${option.mode}`)}</span>
            {destination && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate" dir="auto">
                  {ts(`providers.${destination}`)}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            className={cn('size-8', featured && 'text-foreground')}
            onClick={() => onToggleHome(option)}
            disabled={Boolean(homeBlock) || togglingHome}
            aria-pressed={featured}
            aria-label={featured ? t('removeFromHome') : t('addToHome')}
            title={homeBlock || (featured ? t('removeFromHome') : t('addToHome'))}
          >
            {togglingHome ? <Loading size="sm" /> : <Pin className={cn('size-4', featured && 'fill-current')} aria-hidden />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => onToggleActive(option)}
            disabled={togglingActive}
            aria-pressed={published}
            aria-label={published ? t('unpublish') : t('publish')}
            title={published ? t('unpublish') : t('publish')}
          >
            {togglingActive ? <Loading size="sm" /> : published ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
          </Button>
          <Link
            href={`/${locale}/support${key ? `?option=${encodeURIComponent(key)}` : ''}`}
            target="_blank"
            aria-label={t('viewSupport')}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}
          >
            <ExternalLink className="size-4" aria-hidden />
          </Link>
          <Button size="icon" variant="ghost" className="size-8" onClick={() => onEdit(option)} aria-label={t('edit')}>
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
        {option.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm" dir="auto">
            {option.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {option.amount > 0 ? (
            <PriceTag amount={option.amount} currency={option.currency} className="text-sm font-semibold" />
          ) : (
            <Badge variant="outline" className="text-[10px]">
              {ts('anyPrice')}
            </Badge>
          )}

          <CupRow count={option.cups} />

          {detail && (
            <span className="truncate text-[11px] text-muted-foreground ltr:font-mono" dir="ltr" title={detail}>
              {detail}
            </span>
          )}

          <Badge variant={published ? 'default' : 'outline'} className="text-[10px]">
            {published ? t('active') : t('disabled')}
          </Badge>

          {featured && (
            <Badge variant="outline" className="text-[10px]">
              {t('featuredBadge')}
              {homePosition > 0 && (
                <>
                  <span aria-hidden className="text-muted-foreground">
                    ·
                  </span>
                  <span className="tabular-nums text-muted-foreground">{localizedCount(homePosition, lang)}</span>
                </>
              )}
            </Badge>
          )}

          {option.recurring && (
            <Badge variant="outline" className="text-[10px]">
              {ts('monthly')}
            </Badge>
          )}

          {!usable && (
            <Badge variant="outline" className="border-destructive/40 text-[10px] text-destructive">
              {t('gatewayMissing')}
            </Badge>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        itemName={option.title}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete(option._id!);
        }}
      />
    </Card>
  );
};

export default DonationRow;
