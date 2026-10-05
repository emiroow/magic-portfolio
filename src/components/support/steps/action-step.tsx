'use client';

import { MODE_ICONS, nameDir, variantDetail, variantInstruction } from '@/components/support/support-meta';
import { IconTile, Tag } from '@/components/support/support-tile';
import { localizedCount } from '@/lib/utils';
import type { AppLocale, IDonation, SupportVariant } from '@/types';
import { MousePointerClick } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface ActionStepProps {
  option: IDonation;
  variant?: SupportVariant;
  /** Name of where the gesture is made, spoken in the page's language. */
  destination: string;
}

/**
 * The last screen of a free gesture: what to do, and where to do it.
 *
 * Nothing is recorded and nothing is charged, so this step asks for no details and
 * leaves no trace — it simply puts the page, the one step on it and the host the
 * supporter is about to trust in front of them.
 */
export function ActionStep({ option, variant, destination }: ActionStepProps) {
  const t = useTranslations('support');
  const td = useTranslations('support.dialog');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const Icon = MODE_ICONS[option.mode];
  const host = variantDetail(variant);
  const instruction = variantInstruction(variant);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3.5">
        <IconTile icon={Icon} />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="break-words text-sm font-semibold leading-snug" dir={nameDir(destination)}>
            {destination}
          </p>
          {host && (
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span className="min-w-0 truncate" dir="ltr">
                {host}
              </span>
              <Tag>{t(`regions.${option.region}`)}</Tag>
            </p>
          )}
        </div>
      </div>

      {instruction ? (
        <p className="flex items-start gap-2.5 text-sm leading-relaxed">
          <span
            aria-hidden
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold tabular-nums"
          >
            {localizedCount(1, lang)}
          </span>
          <span className="min-w-0" dir="auto">
            {instruction}
          </span>
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">{td('actionNoInstruction', { provider: destination })}</p>
      )}

      <p className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        <MousePointerClick className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {td('actionNote')}
      </p>
    </div>
  );
}
