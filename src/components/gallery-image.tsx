import { cn, isOptimizableImage } from '@/lib/utils';
import Image from 'next/image';

export interface GalleryImageProps {
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
 * This lives in a module with no `'use client'` directive and renders no hooks, so
 * it is the one definition shared by both sides of the boundary: a server-rendered
 * card can use it without dragging a client chunk onto an archive page, and the
 * client gallery, lightbox and dashboard tiles use the very same component.
 */
export function GalleryImage({ src, alt, className, sizes, priority, contain }: GalleryImageProps) {
  const fit = contain ? 'object-contain' : 'object-cover';

  if (!isOptimizableImage(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={priority ? undefined : 'lazy'} decoding="async" className={cn('size-full', fit, className)} />;
  }

  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn(fit, className)} />;
}
