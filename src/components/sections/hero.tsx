import BlurFade from '@/components/magicui/blur-fade';
import { eyebrowClass } from '@/components/sections/section-header';
import { Button } from '@/components/ui/button';
import { isOptimizableImage } from '@/lib/utils';
import { HandHeart, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { IProfile } from '@/types';

interface HeroProps {
  profile: IProfile;
  /** Eyebrow line rendered above the name. */
  greeting: string;
  /** Label for the mailto shortcut; the button is hidden without it. */
  emailLabel?: string;
  /** Label for the support shortcut; hidden without it. */
  supportLabel?: string;
  /** Localized `/support` page the support button leads to. */
  supportHref?: string;
  /** Base delay for the entrance stagger. */
  delay?: number;
}

/**
 * Intro block: eyebrow greeting, name (`<h1>` — the only one on the page),
 * role, summary and portrait. Stacks portrait-first on small screens and sits
 * side by side from `sm`. The portrait is the LCP element, so it is preloaded
 * and never waits on JavaScript.
 *
 * The two shortcuts under the summary are the only actions above the fold: one
 * to `/support`, one to the mail client.
 */
export function Hero({ profile, greeting, emailLabel, supportLabel, supportHref, delay = 0 }: HeroProps) {
  const name = profile.fullName?.trim() || profile.name?.trim() || '';
  const monogram = (name || '?').charAt(0);
  const avatar = profile.avatarUrl;
  const mailto = profile.email && emailLabel ? `mailto:${profile.email}` : undefined;
  const support = supportLabel && supportHref ? { label: supportLabel, href: supportHref } : undefined;

  return (
    <section id="hero" aria-labelledby="hero-heading">
      <div className="flex flex-col-reverse items-start gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
        <div className="min-w-0 flex-1">
          <BlurFade delay={delay}>
            <p className={eyebrowClass}>{greeting}</p>
          </BlurFade>

          <BlurFade delay={delay + 0.06}>
            <h1 id="hero-heading" className="mt-3 text-3xl font-bold leading-[1.15] ltr:tracking-tight sm:text-4xl xl:text-5xl">
              {name}
            </h1>
          </BlurFade>

          {profile.jobTitle && (
            <BlurFade delay={delay + 0.12}>
              <p className="mt-4 flex items-center gap-3 text-sm font-medium sm:text-base">
                <span aria-hidden className="h-px w-8 shrink-0 bg-foreground/30" />
                {profile.jobTitle}
              </p>
            </BlurFade>
          )}

          {profile.summary && (
            <BlurFade delay={delay + 0.18}>
              <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">{profile.summary}</p>
            </BlurFade>
          )}

          {(mailto || support) && (
            <BlurFade delay={delay + 0.24}>
              {/* Two shortcuts, one row: the support one leads and is filled, the
                  written one follows as an outline. */}
              <div className="mt-7 flex flex-wrap gap-2.5">
                {support && (
                  <Button asChild size="sm" className="rounded-full px-5">
                    <Link href={support.href}>
                      <HandHeart className="me-2 size-4" aria-hidden />
                      {support.label}
                    </Link>
                  </Button>
                )}
                {mailto && (
                  <Button asChild variant="outline" size="sm" className="rounded-full px-5">
                    <a href={mailto}>
                      <Mail className="me-2 size-4" aria-hidden />
                      {emailLabel}
                    </a>
                  </Button>
                )}
              </div>
            </BlurFade>
          )}
        </div>

        <BlurFade delay={delay + 0.1} className="shrink-0">
          <div className="group relative size-24 overflow-hidden rounded-full border shadow-sm sm:size-28 lg:size-32">
            {avatar ? (
              isOptimizableImage(avatar) ? (
                <Image
                  src={avatar}
                  alt={name}
                  width={256}
                  height={256}
                  priority
                  sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                  className="size-full object-cover grayscale transition-[filter] duration-500 group-hover:grayscale-0"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={name}
                  width={256}
                  height={256}
                  decoding="async"
                  className="size-full object-cover grayscale transition-[filter] duration-500 group-hover:grayscale-0"
                />
              )
            ) : (
              <span className="flex size-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">{monogram}</span>
            )}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
