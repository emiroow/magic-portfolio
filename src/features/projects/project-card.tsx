import { iconDecider } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CARD_IMAGE_SIZES, IMAGE_SPECS } from '@/constants/imageSpecs';
import { cn, isOptimizableImage } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Markdown from 'react-markdown';

interface ProjectCardProps {
  title: string;
  /** External product URL (demo, live site, repository home). */
  href?: string;
  /** In-app project page; when present the whole card is clickable. */
  detailHref?: string;
  description: string;
  dates: string;
  tags: readonly string[];
  image?: string;
  links?: readonly { icon: string; type: string; href: string }[];
  /** Label for the external-visit chip. */
  liveLabel?: string;
  className?: string;
  /** Cover is the LCP element of the first card on the page. */
  priority?: boolean;
  /** Layout width of one card, so the browser never downloads a wider
   * variant than the grid can show. */
  sizes?: string;
  /** Heading level of the title; the archive uses `h2` under its own `h1`. */
  headingLevel?: 'h2' | 'h3';
}

/**
 * Portfolio project card. The title carries a stretched link to the project
 * page so the whole surface is clickable, while the resource chips stay
 * independently focusable above it. Cover images render in grayscale to
 * protect the monochrome palette and regain colour on hover.
 *
 * The measure is fixed: one cover, a three-line summary and the chips pinned to
 * the bottom, so a three-column grid stays visually even.
 */
export function ProjectCard({
  title,
  href,
  detailHref,
  description,
  dates,
  tags,
  image,
  links,
  liveLabel,
  className,
  priority = false,
  sizes = CARD_IMAGE_SIZES,
  headingLevel: Heading = 'h3',
}: ProjectCardProps) {
  const cover = image && isOptimizableImage(image) ? image : undefined;
  const chips = [...(links ?? [])];
  if (href && !chips.some(link => link.href === href)) {
    chips.unshift({ type: liveLabel || 'Live', href, icon: 'website' });
  }
  const hasTags = Boolean(tags && tags.length > 0);

  return (
    <Card className={cn('group relative flex h-full flex-col overflow-hidden p-0 transition-colors hover:border-foreground/30', className)}>
      <div className={cn('relative w-full overflow-hidden border-b bg-muted', IMAGE_SPECS.project.aspectClass)}>
        {cover ? (
          <Image
            src={cover}
            alt={title}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover object-top grayscale transition-[filter] duration-500 group-hover:grayscale-0"
          />
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={title} loading="lazy" decoding="async" className="size-full object-cover grayscale" />
        ) : (
          // Deterministic monogram keeps the grid aligned without an image.
          <span aria-hidden className="flex size-full items-center justify-center text-3xl font-bold text-muted-foreground/40">
            {title.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex grow flex-col p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Heading className="min-w-0 text-sm font-semibold leading-snug">
            {detailHref ? (
              <Link
                href={detailHref}
                className="decoration-muted-foreground/50 underline-offset-2 transition-colors after:absolute after:inset-0 after:content-[''] hover:underline"
              >
                {title}
              </Link>
            ) : href ? (
              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="decoration-muted-foreground/50 underline-offset-2 transition-colors after:absolute after:inset-0 after:content-[''] hover:underline"
              >
                {title}
              </Link>
            ) : (
              title
            )}
          </Heading>
          {Boolean(dates) && <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{dates}</span>}
        </div>

        <Markdown className="prose prose-neutral mt-2 line-clamp-3 max-w-full text-pretty text-xs leading-relaxed text-muted-foreground dark:prose-invert prose-p:my-0">
          {description}
        </Markdown>

        {/* One block pinned to the bottom, so cards of different text length
            still land their chips on the same line. */}
        {(hasTags || chips.length > 0) && (
          <div className="mt-auto flex flex-col gap-2.5 pt-4">
            {hasTags && (
              <ul className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <li key={tag}>
                    <Badge variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                      {tag}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}

            {chips.length > 0 && (
              <div className="relative z-10 flex flex-wrap items-center gap-1.5 border-t pt-3">
                {chips.map((link, idx) => (
                  <Link
                    key={`${link.type}-${idx}`}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors hover:bg-foreground hover:text-background"
                  >
                    {iconDecider(link.icon, 'size-3')}
                    {link.type}
                    <ArrowUpRight className="size-2.5 opacity-60 rtl:-scale-x-100" aria-hidden />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
