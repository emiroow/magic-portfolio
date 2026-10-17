'use client';

import { Button } from '@/components/ui/button';
import Loading from '@/components/ui/loading';
import { FileText, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

/** What the picker offers and what the upload route insists on. */
const ACCEPTED_DOC_TYPES =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface ResumeFieldProps {
  locale: 'fa' | 'en';
  /** Live form value: reflects an upload that has not been saved yet. */
  uploadedUrl?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

/** Last path segment of a stored URL, for a compact file label. */
function fileName(url: string): string {
  return url.split('?')[0].split('/').filter(Boolean).pop() ?? url;
}

/**
 * Résumé control inside the Profile section.
 *
 * It is deliberately not its own dashboard tab — the résumé is one more field of the
 * owner's identity, so it lives with the rest of them. Two states, plainly named: an
 * uploaded file (which the download serves), or a résumé generated from the profile.
 * The preview opens the very page a visitor is sent to, in a tab of its own.
 */
export function ResumeField({ locale, uploadedUrl, uploading, onUpload, onRemove }: ResumeFieldProps) {
  const t = useTranslations('dashboard.profile');
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{t('resume')}</p>
          <p className="mt-0.5 text-sm font-medium">{uploadedUrl ? t('resumeModeUploaded') : t('resumeModeAuto')}</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground">
          <Link href={`/${locale}/resume`} target="_blank" rel="noopener noreferrer">
            {t('resumePreview')}
          </Link>
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground/80">{t('resumeHint')}</p>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loading size="sm" className="me-2" /> : <Upload className="me-2 size-3.5" aria-hidden />}
          {uploadedUrl ? t('resumeReplace') : t('resumeUpload')}
        </Button>

        {uploadedUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            disabled={uploading}
          >
            <Trash2 className="me-2 size-3.5" aria-hidden />
            {t('resumeRemove')}
          </Button>
        )}

        {uploadedUrl && (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate" dir="ltr">
              {fileName(uploadedUrl)}
            </span>
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_DOC_TYPES}
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          if (!file) return;
          onUpload(file);
          // Reset so picking the same file again still fires a change.
          event.target.value = '';
        }}
      />
    </div>
  );
}
