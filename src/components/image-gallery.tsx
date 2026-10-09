'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn, isOptimizableImage, localizedCount } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';

interface ImageGalleryProps {
  /** Ordered image paths; an empty list renders nothing at all. */
  images: string[];
  /** Alt text of the record, so a screen reader names the picture it is on. */
  alt: string;
  /** Aspect utility of the hero, e.g. `aspect-[16/9]`. */
  aspectClass?: string;
  /** Layout width of the hero, so the browser never fetches a wider variant than the column. */
  sizes?: string;
  className?: string;
}

interface GalleryImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  contain?: boolean;
}

/**
 * A stored image, optimized when it came from this site's own storage.
 *
 * A pasted external URL — or a seeded demo cover — cannot go through `next/image`
 * without a domain allowlisted at build time, so it degrades to a plain `img`
 * instead of throwing on a record the owner can see perfectly well.
 *
 * Exported for the dashboard tiles, which show the very same pictures.
 */
export function GalleryImage({ src, alt, className, sizes, priority, contain }: GalleryImageProps) {
  const fit = contain ? 'object-contain' : 'object-cover';

  if (!isOptimizableImage(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={priority ? undefined : 'lazy'} decoding="async" className={cn('size-full', fit, className)} />;
  }

  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn(fit, className)} />;
}

/**
 * A record's pictures, from none to many.
 *
 * Three shapes, one component: no image renders nothing, so a page that never had a
 * cover keeps the layout it always had; one image is the plain figure it was before,
 * still clickable; several add the controls that only make sense with a set — a
 * counter, the arrows, and the strip that says how many there are and where you are.
 *
 * The strip picks the hero rather than scrolling a carousel, so the page stays one
 * column tall and every step is a button a keyboard can reach. The hero opens the
 * same picture full-screen, where the arrows keep working with the key that points
 * the way the reader's language reads.
 */
export function ImageGallery({
  images,
  alt,
  aspectClass = 'aspect-[16/9]',
  sizes = '(max-width: 1023px) 100vw, 848px',
  className,
}: ImageGalleryProps) {
  const t = useTranslations('gallery');
  const locale = useLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);

  /** Counter as readable text: `3 of 8`, `۳ از ۸` — in the locale's own digits. */
  const counter = (index: number) => t('counter', { current: localizedCount(index + 1, lang), total: localizedCount(images.length, lang) });

  if (images.length === 0) return null;

  // A record can be re-saved between renders; never point past the last image.
  const index = Math.min(active, images.length - 1);
  const many = images.length > 1;
  const step = (by: number) => setActive(current => (current + by + images.length) % images.length);

  return (
    <>
      <figure className={cn('space-y-3', className)}>
        <div className={cn('group relative overflow-hidden rounded-xl border bg-card shadow-sm', aspectClass)}>
          <GalleryImage src={images[index]} alt={alt} sizes={sizes} priority />

          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label={t('expand', { at: counter(index) })}
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            {/* Promised on hover rather than painted over the picture, which is the
                thing the reader came for. */}
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full border bg-background/85 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <Expand className="size-4" />
            </span>
          </button>

          {many && (
            <>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/45 to-transparent pb-2.5 pt-8">
                <span className="rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-medium tabular-nums shadow-sm">{counter(index)}</span>
              </span>

              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t('previous')}
                className="absolute start-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/85 text-foreground shadow-sm transition-colors hover:bg-background"
              >
                <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t('next')}
                className="absolute end-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/85 text-foreground shadow-sm transition-colors hover:bg-background"
              >
                <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
              </button>
            </>
          )}
        </div>

        {many && (
          <figcaption>
            <ul className="flex gap-2 overflow-x-auto pb-1" aria-label={t('list')}>
              {images.map((src, position) => (
                <li key={`${src}-${position}`}>
                  <button
                    type="button"
                    onClick={() => setActive(position)}
                    aria-label={t('pick', { at: counter(position) })}
                    aria-current={position === index}
                    className={cn(
                      'relative block h-14 w-24 overflow-hidden rounded-lg border transition-opacity',
                      position === index ? 'border-foreground' : 'border-border opacity-60 hover:opacity-100'
                    )}
                  >
                    <GalleryImage src={src} alt="" sizes="96px" />
                  </button>
                </li>
              ))}
            </ul>
          </figcaption>
        )}
      </figure>

      <ImageLightbox
        open={expanded}
        onOpenChange={setExpanded}
        images={images}
        index={index}
        alt={alt}
        counter={counter(index)}
        onStep={step}
        onJump={setActive}
      />
    </>
  );
}

interface LightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  index: number;
  alt: string;
  counter: string;
  onStep: (by: number) => void;
  onJump: (index: number) => void;
  /** Aspect utility of the sheet, so a dashboard preview matches the record's own crop. */
  aspectClass?: string;
}

/**
 * Full-screen view of one gallery, stepped by key as well as by pointer.
 *
 * Exported because the dashboard edits these same pictures and an owner needs to see
 * one at real size before committing to it as the cover.
 */
export function ImageLightbox({ open, onOpenChange, images, index, alt, counter, onStep, onJump, aspectClass = 'aspect-[16/9]' }: LightboxProps) {
  const t = useTranslations('gallery');

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // The arrows point the way the reader's language reads: in Persian, back is right.
    const rtl = document.documentElement.dir === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === forward) {
      event.preventDefault();
      onStep(1);
    } else if (event.key === backward) {
      event.preventDefault();
      onStep(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      onJump(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      onJump(images.length - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* A transparent sheet on a darker overlay: the picture is the dialog, so the
          frame must not compete with it. */}
      <DialogContent
        className="max-w-[min(1120px,96vw)] gap-0 border-0 bg-transparent p-0 shadow-none [&>button]:bg-background/85 [&>button]:text-foreground [&>button]:opacity-100"
        onKeyDown={onKeyDown}
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">{counter}</DialogDescription>

        <div className={cn('relative mx-auto w-full max-h-[78dvh] overflow-hidden rounded-xl', aspectClass)}>
          <GalleryImage src={images[index]} alt={alt} contain sizes="96vw" priority />
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label={t('previous')}
              className="flex size-9 items-center justify-center rounded-full border bg-background/85 text-foreground transition-colors hover:bg-background"
            >
              <ChevronLeft className="size-4 rtl:-scale-x-100" aria-hidden />
            </button>
            <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-medium tabular-nums">{counter}</span>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label={t('next')}
              className="flex size-9 items-center justify-center rounded-full border bg-background/85 text-foreground transition-colors hover:bg-background"
            >
              <ChevronRight className="size-4 rtl:-scale-x-100" aria-hidden />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
