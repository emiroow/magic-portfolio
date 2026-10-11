'use client';

import { Button } from '@/components/ui/button';
import type { AppLocale } from '@/types';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface ResumeButtonProps {
  locale: AppLocale;
  /** Label rendered on the button (localized by the caller). */
  label: string;
  /**
   * Uploaded résumé file URL. When present the button saves that file; otherwise it
   * opens the résumé generated from the profile. Mirrors the schema's precedence.
   */
  uploadedUrl?: string;
  className?: string;
}

/** Derive a download filename from a stored URL, ignoring any query string. */
function fileNameFrom(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  return clean.split('/').filter(Boolean).pop() || 'resume';
}

/** Whether a stored URL points back at this site (a `/public` path) or elsewhere. */
function isSameOrigin(url: string): boolean {
  return url.startsWith('/');
}

/**
 * "Résumé", one button for both modes.
 *
 * A same-origin upload (a development `/resumes/...` path) is handed to a plain
 * `download` anchor — the browser saves it verbatim, no round-trip to corrupt. A
 * cross-origin upload (a production Blob host, where `download` is ignored) is fetched
 * and saved as a blob, with the object URL released only after the save has read it;
 * revoking it in the same tick as the click is what used to yield an empty file. If the
 * fetch is blocked, the tab falls back to opening the file directly. With no upload, the
 * button opens the generated-résumé route, which sets itself up to print straight away.
 */
export function ResumeButton({ locale, label, uploadedUrl, className }: ResumeButtonProps) {
  const [busy, setBusy] = useState(false);

  async function downloadCrossOrigin(url: string) {
    setBusy(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`status ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileNameFrom(url);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Release the blob only once the download has certainly started reading it.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setBusy(false);
    }
  }

  const onClick = () => {
    if (!uploadedUrl) {
      window.open(`/api/${locale}/resume`, '_blank', 'noopener,noreferrer');
    } else if (isSameOrigin(uploadedUrl)) {
      void downloadSameOrigin(uploadedUrl);
    } else {
      void downloadCrossOrigin(uploadedUrl);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={onClick} disabled={busy} aria-busy={busy}>
      <Download className="me-2 size-4" aria-hidden />
      {label}
    </Button>
  );
}

/** Save a same-origin file through a throwaway `download` anchor. */
function downloadSameOrigin(url: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileNameFrom(url);
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
