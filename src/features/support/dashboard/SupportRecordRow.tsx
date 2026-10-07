'use client';

import { Dot, EntityCard, RowAction, StatusChip } from '@/features/dashboard/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import { PriceTag } from '@/features/products/price-tag';
import { nameDir, storedVariantName } from '@/features/support/support-meta';
import type { ISupporter } from '@/features/support/types';
import type { AppLocale } from '@/types';
import { formatYearMonthLocal } from '@/lib/utils';
import { CheckCircle2, Eye, EyeOff, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface SupportRecordRowProps {
  record: ISupporter;
  lang: AppLocale;
  /** This record, and not another one, has a mutation in flight. */
  busy: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onFail: () => void;
  onReopen: () => void;
  onToggleWall: () => void;
  onSaveNote: (note: string) => void;
  onDelete: () => void;
}

/**
 * One support record: who gave, through what, and what still has to be done.
 *
 * The actions are states of the record rather than a menu: confirm it, refuse it, put
 * it on the wall or keep it off. Each one carries a different glyph — a refused record
 * and a hidden one are not the same fact, and two identical eyes in one cluster would
 * ask the owner to remember which is which. The note is the owner's own line, which
 * statement the transfer was matched against, and it saves on blur or Enter so a record
 * is never left half explained.
 */
const SupportRecordRow = ({
  record,
  lang,
  busy,
  deleting,
  onConfirm,
  onFail,
  onReopen,
  onToggleWall,
  onSaveNote,
  onDelete,
}: SupportRecordRowProps) => {
  const t = useTranslations('dashboard.support.records');
  const ts = useTranslations('support');
  const tp = useTranslations('pricing');
  const [note, setNote] = useState(record.note ?? '');

  const pending = record.status === 'pending';
  const failed = record.status === 'failed';
  const onWall = record.showOnWall !== false;
  /** A supporter who declared a transfer the owner has not matched yet. */
  const declared = Boolean(record.reference) && pending;
  const display = record.anonymous ? t('anonymous') : record.name?.trim() || t('noName');
  /** What the server holds, for the "unsaved changes" test on the note field. */
  const currentNote = record.note ?? '';

  return (
    <EntityCard
      title={display}
      titleDir={nameDir(display)}
      meta={
        <>
          {ts(`modes.${record.mode}`)}
          {record.variantLabel && (
            <>
              <Dot className="mx-1.5" />
              <span dir={nameDir(record.variantLabel)}>{storedVariantName(record.variantLabel, ts, tp)}</span>
            </>
          )}
          <Dot className="mx-1.5" />
          <span className="tabular-nums">{formatYearMonthLocal(record.createdAt, lang)}</span>
        </>
      }
      actions={
        <>
          {pending ? (
            <RowAction label={t('confirm')} hint={t('confirmHint')} icon={CheckCircle2} pending={busy} onClick={onConfirm} />
          ) : (
            <RowAction label={t('markPending')} icon={RotateCcw} pending={busy} onClick={onReopen} />
          )}
          <RowAction label={t('markFailed')} icon={XCircle} disabled={failed} muted={failed} pending={busy} onClick={onFail} />
          <RowAction
            label={onWall ? t('hideFromWall') : t('showOnWall')}
            icon={onWall ? Eye : EyeOff}
            pressed={onWall}
            muted={!onWall}
            pending={busy}
            onClick={onToggleWall}
          />
          <RowAction label={t('delete')} icon={Trash2} danger pending={deleting} onClick={onDelete} />
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <PriceTag amount={record.amount} currency={record.currency} className="text-sm font-semibold" />
          <StatusChip solid={!pending && !failed}>{t(`statuses.${record.status}`)}</StatusChip>
          {!onWall && <StatusChip>{t('offWall')}</StatusChip>}
          {declared && <StatusChip>{t('declared')}</StatusChip>}
          {record.reference && (
            <bdi dir="ltr" title={record.reference} className="max-w-full truncate text-[11px] text-muted-foreground ltr:font-mono">
              {record.reference}
            </bdi>
          )}
        </div>

        {record.message && (
          <blockquote className="border-s-2 ps-3 text-xs leading-relaxed text-muted-foreground" dir="auto">
            {record.message}
          </blockquote>
        )}

        <p className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] text-muted-foreground">
          <span>{t('email')}</span>
          <bdi dir="ltr" className="min-w-0 break-all text-foreground">
            {record.email || t('noEmail')}
          </bdi>
        </p>

        {/* A private note: which statement the gift was matched against, and so on. */}
        <div className="flex gap-2 max-sm:flex-col">
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
            dir="auto"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full max-sm:w-full"
            disabled={busy || note === currentNote}
            onClick={() => onSaveNote(note)}
          >
            {busy && <Loading size="sm" className="me-2" />}
            {t('note')}
          </Button>
        </div>
      </div>
    </EntityCard>
  );
};

export default SupportRecordRow;
