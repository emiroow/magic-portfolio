'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import { EmptyState, ErrorState, LoadingRows, SectionShell } from '@/components/dashboard/shared';
import { FilterChip } from '@/components/ui/filter-chip';
import { PriceTag } from '@/components/products/price-tag';
import { SUPPORTER_STATUSES } from '@/constants/global';
import useSupporters from '@/hooks/dashboard/useSupporters';
import { cn, formatYearMonthLocal, localizedCount } from '@/lib/utils';
import type { AppLocale, ISupporter, SupporterStatus } from '@/types';
import { CheckCircle2, Eye, EyeOff, ExternalLink, Search, X, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';

/**
 * Supporters: every gift a visitor started, in every state.
 *
 * Card-to-card and crypto transfers arrive as `pending` — the site cannot see the
 * bank — so this is where the owner matches a reference against a statement and
 * confirms it. Confirming is what puts a name on the public wall.
 */
const Supporters = () => {
  const t = useTranslations('dashboard.supporters');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const { supporters, isPending, isError, error, refetchSupporters, update, removeSupporter, deleting, setStatus, toggleWall, saveNote } =
    useSupporters();

  const [query, setQuery] = useState('');
  const [status, setStatusFilter] = useState<SupporterStatus | 'all'>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (supporters ?? []).filter(record => {
      if (status !== 'all' && record.status !== status) return false;
      if (!needle) return true;
      return [record.name, record.email, record.message, record.donationTitle, record.reference]
        .filter(Boolean)
        .some(field => String(field).toLowerCase().includes(needle));
    });
  }, [supporters, query, status]);

  const pendingCount = (supporters ?? []).filter(record => record.status === 'pending').length;

  return (
    <SectionShell
      title={t('title')}
      action={
        <Link
          href={`/${locale}/support`}
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-full border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          {t('openSupport')}
        </Link>
      }
    >
      {/* Search and status chips sit above the list, like every other archive. */}
      {supporters && supporters.length > 0 && (
        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="h-9 rounded-full border-transparent bg-muted/50 ps-8 pe-8 text-sm shadow-none transition-colors hover:bg-muted"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={t('clearSearch')}
                  className="absolute end-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3" aria-hidden />
                </button>
              )}
            </div>
            {pendingCount > 0 && (
              <p aria-live="polite" className="ms-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                {t('totalPending', { count: localizedCount(pendingCount, lang) })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('statusFilter')}>
            <FilterChip active={status === 'all'} onClick={() => setStatusFilter('all')}>
              {t('all')}
            </FilterChip>
            {SUPPORTER_STATUSES.map(value => (
              <FilterChip key={value} active={status === value} onClick={() => setStatusFilter(status === value ? 'all' : value)}>
                {t(`statuses.${value}`)}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      {isPending ? (
        <LoadingRows />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchSupporters()} />
      ) : rows.length > 0 ? (
        <div className="space-y-4">
          {rows.map(record => (
            <SupporterRow
              // The note is part of the key, so a saved or refreshed note remounts
              // the row with the stored value instead of a stale local draft.
              key={`${record._id}-${record.note ?? ''}`}
              record={record}
              lang={lang}
              busy={update.isPending}
              onConfirm={() => setStatus(record, 'completed')}
              onFail={() => setStatus(record, 'failed')}
              onReopen={() => setStatus(record, 'pending')}
              onToggleWall={() => toggleWall(record)}
              onSaveNote={note => saveNote(record, note)}
              onDelete={() => setConfirmId(record._id!)}
              deleting={deleting}
            />
          ))}
        </div>
      ) : (
        <EmptyState text={supporters && supporters.length ? t('noResults') : t('empty')} />
      )}

      <ConfirmDialog
        open={Boolean(confirmId)}
        onOpenChange={open => !open && setConfirmId(null)}
        itemName={rows.find(record => record._id === confirmId)?.name || rows.find(record => record._id === confirmId)?.donationTitle || ''}
        onConfirm={() => {
          if (confirmId) removeSupporter(confirmId);
          setConfirmId(null);
        }}
      />
    </SectionShell>
  );
};

/** One support record: who gave, through what, and what still has to be done. */
function SupporterRow({
  record,
  lang,
  busy,
  onConfirm,
  onFail,
  onReopen,
  onToggleWall,
  onSaveNote,
  onDelete,
  deleting,
}: {
  record: ISupporter;
  lang: AppLocale;
  busy: boolean;
  onConfirm: () => void;
  onFail: () => void;
  onReopen: () => void;
  onToggleWall: () => void;
  onSaveNote: (note: string) => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const t = useTranslations('dashboard.supporters');
  const ts = useTranslations('support');
  const locale = useLocale();
  const [note, setNote] = useState(record.note ?? '');

  const completed = record.status === 'completed';
  const onWall = record.showOnWall !== false;
  const declared = Boolean(record.reference) && record.status === 'pending';
  const display = record.anonymous ? t('anonymous') : record.name?.trim() || t('noName');
  /** What the server holds, for the “unsaved changes” test on the note field. */
  const currentNote = record.note ?? '';

  return (
    <Card className="transition-colors hover:border-foreground/30">
      <CardHeader className="flex-row items-center justify-between space-y-0 p-4 sm:p-5">
        <div className="min-w-0 space-y-0.5">
          <h3 className="truncate text-sm font-semibold sm:text-base" dir="auto">
            {display}
          </h3>
          <p className="truncate text-[11px] text-muted-foreground">
            {record.donationTitle ? `${record.donationTitle} · ` : ''}
            {ts(`modes.${record.mode}`)} · {formatYearMonthLocal(record.createdAt, lang)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {record.status === 'pending' ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-foreground"
              onClick={onConfirm}
              disabled={busy}
              aria-label={t('confirm')}
              title={t('confirmHint')}
            >
              <CheckCircle2 className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={onReopen}
              disabled={busy}
              aria-label={t('markPending')}
              title={t('markPending')}
            >
              <Eye className="size-4" aria-hidden />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={onFail}
            disabled={busy || record.status === 'failed'}
            aria-label={t('markFailed')}
            title={t('markFailed')}
          >
            <XCircle className="size-4" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={cn('size-8', !onWall && 'text-muted-foreground')}
            onClick={onToggleWall}
            disabled={busy}
            aria-pressed={onWall}
            aria-label={onWall ? t('hideFromWall') : t('showOnWall')}
            title={onWall ? t('hideFromWall') : t('showOnWall')}
          >
            {onWall ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 hover:text-destructive"
            onClick={onDelete}
            disabled={deleting}
            aria-label={t('delete')}
          >
            {deleting ? <Loading size="sm" /> : <X className="size-4" aria-hidden />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <PriceTag amount={record.amount} currency={record.currency} className="text-sm font-semibold" />

          <Badge variant={completed ? 'default' : 'outline'} className="text-[10px]">
            {t(`statuses.${record.status}`)}
          </Badge>

          {!onWall && (
            <Badge variant="outline" className="text-[10px]">
              {t('offWall')}
            </Badge>
          )}

          {declared && (
            <Badge variant="outline" className="text-[10px]">
              {t('declared')}
            </Badge>
          )}

          {record.reference && (
            <span className="truncate text-[11px] text-muted-foreground ltr:font-mono" dir="ltr" title={record.reference}>
              {record.reference}
            </span>
          )}
        </div>

        {record.message && (
          <blockquote className="border-s-2 ps-3 text-xs leading-relaxed text-muted-foreground" dir="auto">
            {record.message}
          </blockquote>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span>
            {t('email')}
            <span className="ms-1 text-foreground" dir="ltr">
              {record.email || t('noEmail')}
            </span>
          </span>
          <Link href={`/${locale}/support`} target="_blank" className="underline underline-offset-4 transition-opacity hover:opacity-70">
            {t('openSupport')}
          </Link>
        </div>

        {/* A private note: which statement the gift was matched against, and so on. */}
        <div className="flex gap-2">
          <Input
            value={note}
            onChange={event => setNote(event.target.value)}
            onBlur={() => note !== currentNote && onSaveNote(note)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onSaveNote(note);
              }
            }}
            placeholder={t('notePlaceholder')}
            aria-label={t('note')}
            maxLength={280}
            className="h-9 text-xs"
            dir="auto"
          />
          <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={busy || note === currentNote} onClick={() => onSaveNote(note)}>
            {busy ? <Loading size="sm" className="me-2" /> : null}
            {t('note')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default Supporters;
