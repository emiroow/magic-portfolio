'use client';

import { AdminToolbar, CardListSkeleton, EmptyState, EntityList, ErrorState, SectionShell } from '@/features/dashboard/components';
import SupportRecordRow from '@/features/support/dashboard/SupportRecordRow';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { buttonVariants } from '@/components/ui/button';
import { useConfirmDelete } from '@/features/dashboard/hooks/useConfirmDelete';
import useSupporters from '@/features/support/hooks/useSupporters';
import { SUPPORTER_STATUSES } from '@/features/support/constants';
import { cn, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { SupporterStatus } from '@/features/support/types';
import { ExternalLink, HeartHandshake } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
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
  const td = useTranslations('dashboard');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const { supporters, isPending, isError, error, refetchSupporters, updatingId, removeSupporter, deletingId, setStatus, toggleWall, saveNote } =
    useSupporters();

  const [query, setQuery] = useState('');
  const [status, setStatusFilter] = useState<SupporterStatus | 'all'>('all');
  const confirm = useConfirmDelete(removeSupporter);

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
  const filtering = Boolean(query.trim()) || status !== 'all';

  return (
    <SectionShell
      title={t('title')}
      action={
        <Link href="/support" target="_blank" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}>
          <ExternalLink className="me-2 size-3.5" aria-hidden />
          {t('openSupport')}
        </Link>
      }
    >
      {supporters && supporters.length > 0 && (
        <AdminToolbar
          query={query}
          onQueryChange={setQuery}
          searchLabel={t('searchPlaceholder')}
          clearSearchLabel={td('clearSearch')}
          chips={[{ value: 'all', label: t('all') }, ...SUPPORTER_STATUSES.map(value => ({ value, label: t(`statuses.${value}`) }))]}
          active={status}
          onPick={value => setStatusFilter(status === value ? 'all' : (value as SupporterStatus))}
          chipsLabel={t('statusFilter')}
          meta={
            pendingCount > 0 ? <span className="tabular-nums">{t('totalPending', { count: localizedCount(pendingCount, lang) })}</span> : undefined
          }
        />
      )}

      {isPending ? (
        <CardListSkeleton media={false} />
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetchSupporters()} />
      ) : rows.length > 0 ? (
        <EntityList>
          {rows.map(record => (
            <SupportRecordRow
              // The note is part of the key, so a saved or refreshed note remounts
              // the row with the stored value instead of a stale local draft.
              key={`${record._id}-${record.note ?? ''}`}
              record={record}
              lang={lang}
              busy={updatingId === record._id}
              deleting={deletingId === record._id}
              onConfirm={() => setStatus(record, 'completed')}
              onFail={() => setStatus(record, 'failed')}
              onReopen={() => setStatus(record, 'pending')}
              onToggleWall={() => toggleWall(record)}
              onSaveNote={note => saveNote(record, note)}
              onDelete={() => confirm.request(record._id, record.name || record.donationTitle)}
            />
          ))}
        </EntityList>
      ) : (
        <EmptyState icon={HeartHandshake} text={filtering ? t('noResults') : t('empty')} />
      )}

      <ConfirmDialog {...confirm.dialogProps} />
    </SectionShell>
  );
};

export default SupportRecords;
