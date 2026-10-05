'use client';

import { CopyRow, DetailLine, NetworkName, SummaryLine } from '@/components/support/steps/step-parts';
import { groupCardNumber, groupIban, nameDir, shortenAddress, variantLabel } from '@/components/support/support-meta';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { IDonation, SupportCheckoutResult, SupportVariant } from '@/types';

interface PaymentStepProps {
  variant?: SupportVariant;
  /** Name of what the supporter is paying into, spoken in the page's language. */
  destination: string;
  result: SupportCheckoutResult;
  amount: number;
  currency: IDonation['currency'];
  reference: string;
  onReference: (value: string) => void;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
}

/**
 * What the chosen rail asks for, once the gift is recorded.
 *
 * One shape per outcome, so a supporter is never given two instructions for the same
 * money: a hand-off to another site, a gateway that has already taken the tab, or the
 * details of a transfer they make themselves.
 */
export function PaymentStep({ variant, destination, result, amount, currency, reference, onReference, copiedKey, onCopy }: PaymentStepProps) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');

  if (result.kind === 'redirect') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center" role="status">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">{td('doneRedirect', { provider: destination })}</p>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{t('modeNotes.gateway', { provider: destination })}</p>
      </div>
    );
  }

  if (result.kind === 'external') {
    return (
      <div className="space-y-4">
        <SummaryLine label={td('total')} amount={amount} currency={currency} />
        <p className="text-sm leading-relaxed text-muted-foreground">{t('modeNotes.platform', { provider: destination })}</p>
        <p className="text-xs leading-relaxed text-muted-foreground/80">{td('doneExternal')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SummaryLine label={td('total')} amount={amount} currency={currency} />

      {result.instruction === 'card' ? (
        <div className="space-y-3 rounded-lg border p-3.5">
          <div className="space-y-1">
            <p className="text-sm font-semibold">{td('cardTitle')}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{t('modeNotes.card')}</p>
          </div>

          {result.card?.number && (
            <CopyRow
              copyKey="card"
              label={td('cardNumber')}
              value={groupCardNumber(result.card.number)}
              raw={result.card.number}
              onCopy={onCopy}
              copied={copiedKey === 'card'}
            />
          )}
          {result.card?.iban && (
            <CopyRow
              copyKey="iban"
              label={td('iban')}
              value={groupIban(result.card.iban)}
              raw={result.card.iban}
              onCopy={onCopy}
              copied={copiedKey === 'iban'}
            />
          )}
          {result.card?.holder && (
            <DetailLine label={td('cardHolder')}>
              <span dir="auto">{result.card.holder}</span>
            </DetailLine>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border p-3.5">
          <div className="space-y-1">
            <p className="text-sm font-semibold">{td('cryptoTitle')}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{t('modeNotes.crypto')}</p>
          </div>

          {variantLabel(variant, t) && (
            <DetailLine label={td('asset')}>
              <span dir={nameDir(variantLabel(variant, t))}>{variantLabel(variant, t)}</span>
            </DetailLine>
          )}
          {result.crypto?.network && (
            <DetailLine label={td('network')}>
              <NetworkName network={result.crypto.network} />
            </DetailLine>
          )}
          {result.crypto?.address && (
            <CopyRow
              copyKey="address"
              label={td('cryptoAddress')}
              value={shortenAddress(result.crypto.address)}
              raw={result.crypto.address}
              onCopy={onCopy}
              copied={copiedKey === 'address'}
            />
          )}
          <p role="alert" className="text-xs leading-relaxed text-destructive">
            {td('networkWarning')}
          </p>
        </div>
      )}

      {result.qr && (
        <figure className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.qr}
            alt={result.instruction === 'card' ? td('qrCard') : td('qrCrypto')}
            width={208}
            height={208}
            className="size-52 rounded-xl border bg-white p-2"
          />
          <figcaption className="text-[11px] text-muted-foreground">{td('qrHint')}</figcaption>
        </figure>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">{td('referenceLabel')}</span>
        <Input
          value={reference}
          onChange={event => onReference(event.target.value)}
          placeholder={td('referencePlaceholder')}
          maxLength={120}
          dir="auto"
        />
        <span className="text-xs leading-relaxed text-muted-foreground/80">{td('referenceHint')}</span>
      </label>
    </div>
  );
}
