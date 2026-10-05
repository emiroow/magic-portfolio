'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Loading from '@/components/ui/loading';
import { PriceTag } from '@/components/products/price-tag';
import { nameDir, storedVariantName } from '@/components/support/support-meta';
import { cn, formatYearMonthLocal } from '@/lib/utils';
import type { AppLocale, ISupporter } from '@/types';
import { CheckCircle2, Eye, EyeOff, X, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface SupportRecordRowProps {
  record: ISupporter;
  lang: AppLocale;
  /** Any mutation is in flight; the row refuses a second one rather than racing it. */
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
 * The actions are states of the record rather than a menu: confirm it, refuse it,
 * put it on the wall or keep it off. The note is the owner's own line — which
 * statement the transfer was matched against — and it saves on blur or Enter so a
 * record is never left half explained.
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
  const [note, setNote] = useState(record.note ?? '');

  const completed = record.status === 'completed';
  const onWall = record.showOnWall !== false;
  /** A supporter who declared a transfer the owner has not matched yet. */
  const declared = Boolean(record.reference) && record.status === 'pending';
  const display = record.anonymous ? t('anonymous') : record.name?.trim() || t('noName');
  /** What the server holds, for the “unsaved changes” test on the note field. */
  const currentNote = record.note ?? '';

  return (
    <Card className="transition-colors hover:border-foreground/30">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-x-4 gap-y-2 p-4 sm:p-5">
        <div className="min-w-0 space-y-0.5">
          <h3 className="break-words text-sm font-semibold sm:text-base" dir={nameDir(display)}>
            {display}
          </h3>
          <p className="text-[11px] leading-snug text-muted-foreground">
            {ts(`modes.${record.mode}`)}
            {record.variantLabel && (
              <>
                <span aria-hidden className="mx-1.5">
                  ·
                </span>
                <span dir={nameDir(record.variantLabel)}>{storedVariantName(record.variantLabel, ts)}</span>
              </>
            )}
            <span aria-hidden className="mx-1.5">
              ·
            </span>
            {formatYearMonthLocal(record.createdAt, lang)}
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
            <span className="max-w-full truncate text-[11px] text-muted-foreground ltr:font-mono" dir="ltr" title={record.reference}>
              {record.reference}
            </span>
          )}
        </div>

        {record.message && (
          <blockquote className="border-s-2 ps-3 text-xs leading-relaxed text-muted-foreground" dir="auto">
            {record.message}
          </blockquote>
        )}

        <p className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] text-muted-foreground">
          <span>{t('email')}</span>
          <span className="min-w-0 break-all text-foreground" dir="ltr">
            {record.email || t('noEmail')}
          </span>
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
            className="h-9 text-xs"
            dir="auto"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 max-sm:w-full"
            disabled={busy || note === currentNote}
            onClick={() => onSaveNote(note)}
          >
            {busy ? <Loading size="sm" className="me-2" /> : null}
            {t('note')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportRecordRow;
