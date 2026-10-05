'use client';

import { MODE_ICONS } from '@/components/support/support-meta';
import { DONATION_MODES } from '@/constants/global';
import { handlesMoney } from '@/lib/support';
import { cn } from '@/lib/utils';
import type { DonationMode } from '@/types';
import { useTranslations } from 'next-intl';

interface SupportModePickerProps {
  value: DonationMode;
  onChange: (mode: DonationMode) => void;
}

/**
 * The choice that decides everything below it in the method form.
 *
 * Each tile says what the method will ask the supporter to do, so an owner picks the
 * way the backing travels without having to know what each one stores: the fields
 * under here change to match, and a method never carries a destination of another kind.
 */
const SupportModePicker = ({ value, onChange }: SupportModePickerProps) => {
  const t = useTranslations('dashboard.support.options');
  const ts = useTranslations('support');

  return (
    <div role="radiogroup" aria-label={t('chooseMethod')} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {DONATION_MODES.map(mode => {
        const Icon = MODE_ICONS[mode];
        const active = mode === value;

        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(mode)}
            className={cn(
              'flex min-h-11 flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-start transition-colors',
              active ? 'border-foreground bg-foreground text-background' : 'border-input bg-background hover:border-foreground/40 hover:bg-muted/40',
              // Keyboard focus on a tile that fills with the foreground would otherwise
              // disappear into it, so the ring is drawn outside the frame.
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Icon className={cn('size-4 shrink-0', !active && 'text-muted-foreground')} aria-hidden />
              <span className="min-w-0 truncate text-sm font-medium">{ts(`modes.${mode}`)}</span>
            </span>
            <span className={cn('min-w-0 text-[11px] leading-snug', active ? 'text-background/80' : 'text-muted-foreground')}>
              {t(`methodHints.${mode}`)}
            </span>
            {/* What the method will ask for, said once instead of in every field label. */}
            <span className="min-w-0 text-[11px] font-medium leading-snug opacity-70">
              {handlesMoney(mode) ? t('asksAmount') : t('asksNoAmount')}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SupportModePicker;
