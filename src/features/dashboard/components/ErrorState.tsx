'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/** Query failure with a way back, so a section never dead-ends. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const t = useTranslations('dashboard');

  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-destructive/40 px-6 py-14 text-center">
      <span aria-hidden className="flex size-11 items-center justify-center rounded-full border border-destructive/40">
        <AlertTriangle className="size-4 text-destructive" />
      </span>
      <p className="max-w-sm break-words text-sm leading-relaxed text-muted-foreground">{message || t('loadError')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="rounded-full">
          <RotateCw className="me-2 size-3.5" aria-hidden />
          {t('retry')}
        </Button>
      )}
    </div>
  );
}
