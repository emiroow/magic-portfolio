'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

/**
 * Localized toast helpers used by all dashboard mutation hooks so every
 * success/failure message follows the active language.
 */
export function useToastMessages() {
  const t = useTranslations('dashboard');

  return {
    ok: () => toast.success(t('successMessage')),
    fail: () => toast.error(t('errorMessage')),
    warn: (message: string) => toast.error(message),
  };
}
