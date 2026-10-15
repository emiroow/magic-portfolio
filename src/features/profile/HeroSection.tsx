import BlurFade from '@/components/magicui/blur-fade';
import { GalleryImage } from '@/components/gallery-image';
import { eyebrowClass } from '@/components/section-header';
import { Button } from '@/components/ui/button';
import { ResumeButton } from '@/features/profile/resume/button';
import { HandHeart, Mail } from 'lucide-react';
import Link from 'next/link';
import type { IProfile } from '@/features/profile/types';
import type { AppLocale } from '@/types';

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
  /**
   * The "Résumé" shortcut. Always offered when present: with an uploaded file it saves
   * that file, without one it opens the résumé generated from the profile.
   */
  resume?: { locale: AppLocale; uploadedUrl?: string; label: string };
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
export function Hero({ profile, greeting, emailLabel, supportLabel, supportHref, resume, delay = 0 }: HeroProps) {
  const name = profile.fullName?.trim() || profile.name?.trim() || '';
  const monogram = (name || '?').charAt(0);
  const avatar = profile.avatarUrl;
  const mailto = profile.email && emailLabel ? `mailto:${profile.email}` : undefined;
  const support = supportLabel && supportHref ? { label: supportLabel, href: supportHref } : undefined;

  return (
    <section id="hero" aria-labelledby="hero-heading">
      <div className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1">
          <BlurFade delay={delay}>
            <p className={eyebrowClass}>{greeting}</p>
          </BlurFade>

          <BlurFade delay={delay + 0.06}>
            <h1 id="hero-heading" className="mt-2.5 text-2xl font-bold leading-[1.15] ltr:tracking-tight sm:text-3xl xl:text-4xl">
              {name}
            </h1>
          </BlurFade>

          {profile.jobTitle && (
            <BlurFade delay={delay + 0.12}>
              <p className="mt-3 flex items-center gap-3 text-sm font-medium sm:text-base">
                <span aria-hidden className="h-px w-8 shrink-0 bg-foreground/30" />
                {profile.jobTitle}
              </p>
            </BlurFade>
          )}

          {profile.summary && (
            <BlurFade delay={delay + 0.18}>
              <p className="mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">{profile.summary}</p>
            </BlurFade>
          )}

          {(mailto || support || resume) && (
            <BlurFade delay={delay + 0.24}>
              {/* Shortcuts, one row: the support one leads and is filled, the written
                  and résumé ones follow as outlines. */}
              <div className="mt-6 flex flex-wrap gap-2.5">
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
                {resume && (
                  <ResumeButton
                    locale={resume.locale}
                    label={resume.label}
                    uploadedUrl={resume.uploadedUrl}
                    className="rounded-full px-5"
                  />
                )}
              </div>
            </BlurFade>
          )}
        </div>

        <BlurFade delay={delay + 0.1} className="shrink-0">
          <div className="group relative size-20 overflow-hidden rounded-full border shadow-sm sm:size-24 lg:size-28">
            {avatar ? (
              <GalleryImage
                src={avatar}
                alt={name}
                priority
                sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 112px"
                className="grayscale transition-[filter] duration-500 group-hover:grayscale-0"
              />
            ) : (
              <span className="flex size-full items-center justify-center bg-muted text-xl font-bold text-muted-foreground">{monogram}</span>
            )}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
