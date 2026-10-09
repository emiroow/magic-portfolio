'use client';

import { api } from '@/lib/client-api';
import { cleanImageUrl } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { useRef } from 'react';

interface GalleryOptions {
  /** Storage folder key the upload route maps to a path: `product`, `project`, `blog`. */
  type: string;
  /** Current ordered list, read from the form rather than mirrored in React state. */
  read: () => string[];
  /** Writes the whole next list back into the form. */
  write: (next: string[]) => void;
  /** Re-runs the field's validation, so a counter and an error line stay honest. */
  touch?: () => void;
}

/**
 * One record's image gallery: upload, reorder, unlink, and the deletion of files
 * that ended up unreferenced.
 *
 * The list itself lives in the form, so a feature hook keeps owning its own payload;
 * what is shared is the two-step dance around it. A dropped image is only unlinked
 * from the record here — the file stays on storage until the record actually saves,
 * because an owner who removes three shots and then closes the panel without saving
 * must not come back to a post whose pictures were deleted behind the back of a
 * cancelled edit.
 */
export function useGallery({ type, read, write, touch }: GalleryOptions) {
  const locale = useLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';

  /** Paths unlinked since the record was opened, waiting on a successful save. */
  const dropped = useRef(new Set<string>());

  const commit = (next: string[]) => {
    const cleaned = next.map(cleanImageUrl).filter(Boolean);
    const kept = new Set(cleaned);
    read()
      .map(cleanImageUrl)
      .filter(url => url && !kept.has(url))
      .forEach(url => dropped.current.add(url));

    write(cleaned);
    touch?.();
  };

  const upload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const { fileUrl } = await api.upload<{ fileUrl: string }>(`/api/${lang}/admin/upload?lang=${lang}&type=${type}`, formData);
    return cleanImageUrl(fileUrl);
  };

  /** Erase what this editing session stopped referencing. */
  const purge = async () => {
    const stillUsed = new Set(read().map(cleanImageUrl));
    const pending = [...dropped.current].filter(url => !stillUsed.has(url));
    dropped.current.clear();

    await Promise.all(
      pending.map(async url => {
        // Only a file this site uploaded can be erased: a pasted external URL, or a
        // seeded demo image, has no object in the bucket to delete.
        if (!url.startsWith('/')) return;
        const fileName = url.split('/').pop();
        if (!fileName) return;
        try {
          await api.del(`/api/${lang}/admin/upload?lang=${lang}&type=${type}&fileName=${encodeURIComponent(fileName)}`);
        } catch {
          // The record is saved; an undelt file costs disk, not the owner's work.
        }
      })
    );
  };

  /** Panel closed without saving: keep every file that is still referenced. */
  const discard = () => {
    dropped.current.clear();
  };

  return { upload, commit, purge, discard };
}
