'use client';

import { ContactTileContent, contactTileClass } from '@/features/profile/contact-tile';
import { cn } from '@/lib/utils';
import { Check, Copy, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CopyEmailProps {
  email: string;
  /** Channel label rendered above the address. */
  label: string;
  className?: string;
}

/** Email tile: one click copies the address, confirmed inline and by toast. */
export function CopyEmail({ email, label, className }: CopyEmailProps) {
  const t = useTranslations('sections.contact');
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success(t('copied'));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Insecure context or a denied permission — say so instead of failing silently.
      toast.error(t('copyFailed'));
    }
  }, [email, t]);

  return (
    <button type="button" onClick={onCopy} className={cn(contactTileClass, className)} aria-label={`${t('copyEmail')}: ${email}`}>
      <ContactTileContent
        icon={<Mail className="size-4" />}
        label={label}
        value={email}
        trailing={copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      />
    </button>
  );
}
