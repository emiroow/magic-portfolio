'use client';

import { EmptyState, ErrorState, LoadingRows, SectionShell } from '@/features/dashboard/shared';
import SupportRecordRow from '@/features/support/dashboard/SupportRecordRow';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FilterChip } from '@/components/ui/filter-chip';
import { Input } from '@/components/ui/input';
import { SUPPORTER_STATUSES } from '@/features/support/constants';
import useSupporters from '@/features/support/hooks/useSupporters';
import { localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { SupporterStatus } from '@/features/support/types';
import { ExternalLink, Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo, useState } from 'react';

/**
 * Support records: every act of support a visitor started, in every state.
 *
 * Card-to-card and crypto transfers arrive as `pending` — the site cannot see the
 * bank — so this is where the owner matches a reference against a statement and
 * confirms it. Confirming is what puts a name on the public wall.
 */
const SupportRecords = () => {
  const t = useTranslations('dashboard.support.records');
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
  const doomed = rows.find(record => record._id === confirmId);

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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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
                  className="absolute end-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
            <SupportRecordRow
              // The note is part of the key, so a saved or refreshed note remounts
              // the row with the stored value instead of a stale local draft.
              key={`${record._id}-${record.note ?? ''}`}
              record={record}
              lang={lang}
              busy={update.isPending}
              deleting={deleting}
              onConfirm={() => setStatus(record, 'completed')}
              onFail={() => setStatus(record, 'failed')}
              onReopen={() => setStatus(record, 'pending')}
              onToggleWall={() => toggleWall(record)}
              onSaveNote={note => saveNote(record, note)}
              onDelete={() => setConfirmId(record._id!)}
            />
          ))}
        </div>
      ) : (
        <EmptyState text={supporters && supporters.length ? t('noResults') : t('empty')} />
      )}

      <ConfirmDialog
        open={Boolean(confirmId)}
        onOpenChange={open => !open && setConfirmId(null)}
        itemName={doomed?.name || doomed?.donationTitle || ''}
        onConfirm={() => {
          if (confirmId) removeSupporter(confirmId);
          setConfirmId(null);
        }}
      />
    </SectionShell>
  );
};

export default SupportRecords;
