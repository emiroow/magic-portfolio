'use client';

import { Field } from '@/components/ui/field';
import ImageCropperDialog from '@/components/ui/image-cropper';
import Loading from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { GalleryImage, ImageLightbox } from '@/components/image-gallery';
import { ACCEPTED_IMAGE_TYPES } from '@/features/dashboard/components/ImageField';
import { cn, cleanImageUrl, localizedCount } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Expand, ImagePlus, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';

interface GalleryFieldProps {
  label: string;
  /** Alt text for every stored image; the record's own title is the honest choice. */
  alt: string;
  /** Ordered image paths. The first entry is the cover. */
  value: string[];
  /** Called with the whole next list: this control owns the order, not the caller. */
  onChange: (next: string[]) => void;
  /** Uploads one cropped file and resolves with the path to store. */
  upload: (file: File) => Promise<string>;
  max: number;
  aspect: number;
  outputSize: number;
  /** Box of one tile, e.g. `h-20 w-28`. */
  frameClassName?: string;
  error?: string;
  hint?: string;
}

/** Swap two neighbours without mutating the caller's array. */
function moved(list: string[], from: number, to: number): string[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * A record's whole set of images as one control: pick, crop, order, preview, remove.
 *
 * `ImageField` handles the single-cover case that the avatar, the logo and the
 * certificate still are. Here the order carries meaning — entry one is the cover every
 * card and social card reads — so the tiles are numbered, and the arrows that set that
 * order sit under each one rather than behind a hover, where a keyboard or a touch
 * would never find them.
 *
 * Picking several files at once is allowed and cropped one at a time: one queue, one
 * cropper, one upload in flight. That keeps a six-file add from firing six concurrent
 * uploads against a five-megabyte limit, and it means the frame that is spinning is
 * always the one the owner is looking at. Object URLs are revoked as each crop is
 * consumed, so a cancelled picker leaks nothing.
 */
export function GalleryField({
  label,
  alt,
  value,
  onChange,
  upload,
  max,
  aspect,
  outputSize,
  frameClassName = 'h-20 w-28 rounded-lg',
  error,
  hint,
}: GalleryFieldProps) {
  const t = useTranslations('dashboard.gallery');
  const td = useTranslations('dashboard');
  const tcrop = useTranslations('dashboard.crop');
  const tg = useTranslations('gallery');
  const locale = useLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';
  const controlId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  /** Cropped-out previews waiting for their turn in the dialog. */
  const [queue, setQueue] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  /** Which stored tile is being looked at full size, or none. */
  const [preview, setPreview] = useState<number | null>(null);

  const counter = (index: number) => tg('counter', { current: localizedCount(index + 1, lang), total: localizedCount(value.length, lang) });

  // Read at the moment an upload lands, so two queued adds cannot overwrite
  // each other with the list as it looked when the dialog first opened.
  const valueRef = useRef(value);
  valueRef.current = value;

  // The unmount cleanup must see the URLs still alive at the end, not the ones
  // from the render that registered the effect.
  const queueRef = useRef<string[]>([]);
  const writeQueue = (next: string[]) => {
    queueRef.current = next;
    setQueue(next);
  };

  useEffect(
    () => () => {
      queueRef.current.forEach(url => URL.revokeObjectURL(url));
    },
    []
  );

  const full = value.length >= max;
  const open = queue.length > 0 && !busy;

  /** Drop the head of the queue: cropped away, or cancelled. */
  const advance = () => {
    const [done, ...rest] = queueRef.current;
    if (done) URL.revokeObjectURL(done);
    writeQueue(rest);
  };

  const pick = (files: FileList | null) => {
    setNotice(null);
    const picked = Array.from(files ?? []);
    if (picked.length === 0) return;

    const room = Math.max(max - value.length, 0);
    if (room === 0) {
      setNotice(t('limitReached', { count: localizedCount(max, lang) }));
      return;
    }

    const fitting = picked.slice(0, room);
    if (fitting.length < picked.length) setNotice(t('trimmed', { count: localizedCount(room, lang) }));
    writeQueue([...queueRef.current, ...fitting.map(file => URL.createObjectURL(file))]);
    // Re-opened on every pick, so the same file chosen twice still starts a crop.
    if (fileRef.current) fileRef.current.value = '';
  };

  const cropOne = async (file: File) => {
    setBusy(true);
    try {
      const url = cleanImageUrl(await upload(file));
      onChange([...valueRef.current, url]);
      // A good add retires the complaint that came before it.
      setNotice(null);
    } catch {
      setNotice(t('uploadFailed'));
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (index: number) => onChange(value.filter((_, position) => position !== index));

  return (
    <Field label={label} id={controlId} error={error} hint={hint}>
      {/* A refused add is the same kind of news as a validation failure, but it is
          transient: it says what just happened rather than what is wrong with the
          stored value, so it gets its own live line instead of the field's error. */}
      {notice && !error && (
        <p role="status" className="text-xs leading-relaxed text-muted-foreground">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-3">
        <ul className="flex flex-wrap gap-3">
          {value.map((url, index) => (
            <li key={`${url}-${index}`} className="space-y-1.5">
              {/* The tile is the preview: an owner judges a picture at full size before
                  agreeing to make it the cover. */}
              <button
                type="button"
                onClick={() => setPreview(index)}
                aria-label={tg('expand', { at: counter(index) })}
                className={cn('group relative block overflow-hidden border bg-muted/20 transition-colors hover:border-foreground', frameClassName)}
              >
                <GalleryImage src={url} alt={alt} sizes="160px" />

                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center bg-background/55 text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <Expand className="size-5" />
                </span>

                {index === 0 && (
                  <span className="absolute start-1 top-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] font-medium shadow-sm">
                    {t('cover')}
                  </span>
                )}
              </button>

              <div className="flex items-center justify-between gap-0.5">
                <span className="w-6 text-center text-[11px] tabular-nums text-muted-foreground">{localizedCount(index + 1, lang)}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  aria-label={t('moveEarlier')}
                  title={t('moveEarlier')}
                  disabled={index === 0 || busy}
                  onClick={() => onChange(moved(value, index, index - 1))}
                >
                  <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  aria-label={t('moveLater')}
                  title={t('moveLater')}
                  disabled={index === value.length - 1 || busy}
                  onClick={() => onChange(moved(value, index, index + 1))}
                >
                  <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  aria-label={t('remove')}
                  title={t('remove')}
                  disabled={busy}
                  onClick={() => removeAt(index)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {/* One frame per pending pick, so the queue the owner built is visible while
            the cropper works through it one at a time. */}
        {queue.map((src, index) => (
          <div key={src} className="space-y-1.5">
            <div className={cn('relative overflow-hidden border border-dashed bg-muted/20', frameClassName, index > 0 && 'opacity-50')} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
              {index === 0 && (
                <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                  {busy ? <Loading size="sm" /> : <ImagePlus className="size-5 animate-pulse text-muted-foreground/70" />}
                </span>
              )}
            </div>
            <p className="text-center text-[11px] leading-7 text-muted-foreground">
              {busy ? t('uploading') : index === 0 ? t('readyToCrop') : t('queued', { count: localizedCount(index, lang) })}
            </p>
          </div>
        ))}

        <Button
          id={controlId}
          type="button"
          variant="outline"
          className={cn('flex-col gap-1 border-dashed font-normal text-muted-foreground hover:text-foreground', frameClassName)}
          onClick={() => fileRef.current?.click()}
          disabled={busy || full}
          title={full ? t('limitReached', { count: localizedCount(max, lang) }) : t('add')}
        >
          <ImagePlus className="size-5" aria-hidden />
          {t('add')}
        </Button>
      </div>

      <p className="text-xs tabular-nums text-muted-foreground/80">
        {t('count', { current: localizedCount(value.length, lang), total: localizedCount(max, lang) })}
      </p>

      <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES} multiple className="hidden" onChange={event => pick(event.target.files)} />

      {open && (
        <ImageCropperDialog
          open
          onOpenChange={next => {
            if (!next) advance();
          }}
          src={queue[0] ?? null}
          aspect={aspect}
          outputSize={outputSize}
          labels={{ title: tcrop('title'), apply: tcrop('apply'), cancel: td('cancel'), zoom: tcrop('zoom'), move: tcrop('move') }}
          onCropped={cropOne}
        />
      )}

      {/* The same full-screen view the public page gives a reader, so what the owner
          approved at that size is what the site will show. */}
      {preview !== null && preview < value.length && (
        <ImageLightbox
          open
          onOpenChange={next => {
            if (!next) setPreview(null);
          }}
          images={value}
          index={preview}
          alt={alt}
          counter={counter(preview)}
          onStep={by => setPreview(current => (current === null ? 0 : (current + by + value.length) % value.length))}
          onJump={setPreview}
        />
      )}
    </Field>
  );
}
