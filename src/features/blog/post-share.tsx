'use client';

import { Button } from '@/components/ui/button';
import { Check, Link as LinkIcon, Send, Share2, Twitter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface PostShareProps {
  title: string;
  url: string;
}

/**
 * Share row for an article: copy the canonical link plus the two networks
 * that matter for developer writing. External targets are plain links, so
 * nothing loads until a reader chooses one.
 */
export default function PostShare({ title, url }: PostShareProps) {
  const t = useTranslations('blogPost');
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Share2 className="size-3.5" aria-hidden />
        {t('share')}
      </span>

      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={copy} aria-live="polite">
        {copied ? <Check className="me-1.5 size-3.5" aria-hidden /> : <LinkIcon className="me-1.5 size-3.5" aria-hidden />}
        {copied ? t('copied') : t('copyLink')}
      </Button>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors hover:bg-foreground hover:text-background"
      >
        <Twitter className="size-3.5" aria-hidden />
        {t('shareOnX')}
      </a>

      <a
        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors hover:bg-foreground hover:text-background"
      >
        <Send className="size-3.5" aria-hidden />
        {t('shareOnTelegram')}
      </a>
    </div>
  );
}
