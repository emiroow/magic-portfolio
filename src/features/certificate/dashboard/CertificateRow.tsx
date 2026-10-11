'use client';

import { Dot, EntityCard, RowAction, StatusChip } from '@/features/dashboard/components';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { certificatePeriod, isExpired } from '@/features/certificate/format';
import type { ICertificate } from '@/features/certificate/types';
import type { AppLocale } from '@/types';
import { ExternalLink, FileBadge, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CertificateRowProps {
  certificate: ICertificate;
  lang: AppLocale;
  /** Copy used when a credential does not lapse. */
  noExpirationLabel: string;
  onEdit: (certificate: ICertificate) => void;
  onDelete: (certificate: ICertificate) => void;
  onToggleResume: (certificate: ICertificate) => void;
  /** This record, and not another one, is busy. */
  deleting: boolean;
  togglingResume: boolean;
}

/**
 * Dashboard list item for a single credential.
 *
 * The résumé flag is a row control rather than a field buried in the panel: it is the
 * one thing an owner adjusts while looking at the list as a whole, deciding which of
 * their credentials the printed sheet carries. A lapsed credential says so here too,
 * because that is exactly the moment an owner wants to notice it.
 */
const CertificateRow = ({
  certificate,
  lang,
  noExpirationLabel,
  onEdit,
  onDelete,
  onToggleResume,
  deleting,
  togglingResume,
}: CertificateRowProps) => {
  const t = useTranslations('dashboard.certificate');
  const initial = (certificate.issuer || certificate.title || '?').charAt(0);
  const credentialId = certificate.credentialId?.trim();
  const expired = isExpired(certificate, lang);
  const onResume = certificate.featured === true;

  const body = certificate.description || credentialId || expired;

  return (
    <EntityCard
      title={certificate.title ?? ''}
      meta={
        (certificate.issuer || certificate.issueDate) && (
          <>
            {certificate.issuer && <span>{certificate.issuer}</span>}
            {certificate.issuer && certificate.issueDate && <Dot className="mx-1.5" />}
            {certificate.issueDate && <span className="tabular-nums">{certificatePeriod(certificate, lang, noExpirationLabel)}</span>}
          </>
        )
      }
      leading={
        <Avatar className="size-9 shrink-0 border">
          {certificate.logoUrl && <AvatarImage src={certificate.logoUrl} alt={certificate.issuer ?? ''} className="object-contain" />}
          <AvatarFallback className="bg-transparent text-xs font-semibold text-muted-foreground">{initial}</AvatarFallback>
        </Avatar>
      }
      actions={
        <>
          <RowAction
            label={onResume ? t('removeFromResume') : t('addToResume')}
            hint={t('resumeHint')}
            icon={FileBadge}
            iconClassName={onResume ? 'fill-current' : undefined}
            pressed={onResume}
            pending={togglingResume}
            onClick={() => onToggleResume(certificate)}
          />
          {certificate.href && <RowAction label={t('verify')} icon={ExternalLink} href={certificate.href} />}
          <RowAction label={t('edit')} icon={Pencil} onClick={() => onEdit(certificate)} />
          <RowAction label={t('delete')} icon={Trash2} danger pending={deleting} onClick={() => onDelete(certificate)} />
        </>
      }
    >
      {body && (
        <div className="space-y-3">
          {certificate.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{certificate.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {onResume && <StatusChip solid>{t('resumeBadge')}</StatusChip>}
            {expired && <StatusChip alert>{t('expiredBadge')}</StatusChip>}
            {credentialId && (
              <span className="text-[11px] text-muted-foreground">
                {t('credentialId')} <bdi dir="ltr">{credentialId}</bdi>
              </span>
            )}
          </div>
        </div>
      )}
    </EntityCard>
  );
};

export default CertificateRow;
