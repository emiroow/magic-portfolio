import { SupportCard } from '@/components/support/support-card';
import { destinationKey } from '@/components/support/support-meta';
import BlurFade from '@/components/magicui/blur-fade';
import { SectionHeader, type SectionHeadingProps } from '@/components/sections/section-header';
import { buttonVariants } from '@/components/ui/button';
import { HOME_SUPPORTER_STRIP, HOME_SUPPORT_SLOTS } from '@/constants/global';
import { cn, documentKey, formatPrice, localizedCount } from '@/lib/utils';
import type { DonationProgress } from '@/lib/data';
import type { AppLocale, IDonation, ISupporter } from '@/types';
import { ArrowRight, Coffee } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

/** Options the home section may show; the rest live on `/support`. */
const PREVIEW_COUNT = HOME_SUPPORT_SLOTS;

interface SupportProps extends SectionHeadingProps {
  options: IDonation[];
  supporters: ISupporter[];
  progress: Record<string, DonationProgress>;
  /** Active locale, used to build the localized support link. */
  locale: string;
  lang: AppLocale;
  /** Label above the newest-cups row. */
  wallLabel: string;
  /** Label for the link to the full page. */
  viewAllLabel: string;
  delay?: number;
}

/**
 * Home-page support section, sitting right after the blog: a taste of the rails,
 * the newest cups, and one door to the full page.
 *
 * Nothing about the checkout happens here — every card deep-links into
 * `/support?option=…` so the flow lives in exactly one place.
 */
export async function Support({
  index,
  label,
  title,
  description,
  meta,
  options,
  supporters,
  progress,
  locale,
  lang,
  wallLabel,
  viewAllLabel,
  delay = 0,
}: SupportProps) {
  const t = await getTranslations({ locale, namespace: 'support' });
  const tp = await getTranslations({ locale, namespace: 'pricing' });

  const active = options.filter(option => option.active);
  if (!active.length) return null;

  const chosen = active.filter(option => option.featured);
  const preview = [...chosen, ...active.filter(option => !option.featured)].slice(0, PREVIEW_COUNT);
  const wallNames = supporters.slice(0, HOME_SUPPORTER_STRIP);

  return (
    <section id="support" aria-labelledby="support-heading">
      <SectionHeader
        index={index}
        label={label}
        title={title}
        description={description}
        meta={meta}
        id="support-heading"
        delay={delay}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((option, id) => {
          const key = documentKey(option);
          const href = key ? `/${locale}/support?option=${encodeURIComponent(key)}` : `/${locale}/support`;
          const entry = option._id ? progress[option._id] : undefined;
          const percent = option.goal && option.goal > 0 ? Math.round(((entry?.raised ?? 0) / option.goal) * 100) : null;
          const destination = destinationKey(option);

          return (
            <BlurFade key={option._id ?? `${option.title}-${id}`} delay={delay + 0.06 + id * 0.05} inView className="h-full">
              <SupportCard
                option={option}
                modeLabel={t(`modes.${option.mode}`)}
                destinationLabel={destination ? t(`providers.${destination}`) : undefined}
                regionLabel={t(`regions.${option.region}`)}
                cadenceLabel={option.recurring ? t('monthly') : t('oneTime')}
                anyPriceLabel={t('anyPrice')}
                progressPercent={percent ?? undefined}
                progressLabel={
                  percent !== null && option.goal
                    ? t('progress', {
                        percent: `${new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(percent)}${t('percent')}`,
                        amount: `${formatPrice(option.goal, lang)} ${tp(option.currency)}`,
                      })
                    : undefined
                }
                supportersLabel={entry && entry.count > 0 ? t('stats.supporters', { count: localizedCount(entry.count, lang) }) : undefined}
                detailHref={href}
                headingLevel="h2"
                className="h-full"
                action={
                  <Link href={href} className={cn(buttonVariants({ size: 'sm' }), 'rounded-full')}>
                    {t('pay')}
                  </Link>
                }
              />
            </BlurFade>
          );
        })}
      </div>

      {/* The newest cups, as one quiet line — the wall itself is on `/support`. */}
      {wallNames.length > 0 && (
        <BlurFade delay={delay + 0.1} inView>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase text-muted-foreground ltr:font-mono ltr:tracking-[0.14em] rtl:tracking-normal">
              <Coffee className="size-3.5" aria-hidden />
              {wallLabel}
            </span>
            <ul className="flex flex-wrap gap-1.5">
              {wallNames.map((supporter, id) => {
                const name = supporter.anonymous ? '' : supporter.name?.trim();
                return (
                  <li key={supporter._id ?? id}>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground" dir="auto">
                      {name || t('wall.anonymous')}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </BlurFade>
      )}

      <BlurFade delay={delay + 0.14} inView>
        <div className="mt-6 flex justify-center">
          <Link href={`/${locale}/support`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}>
            {viewAllLabel}
            <ArrowRight className="ms-2 size-3.5 rtl:-scale-x-100" aria-hidden />
          </Link>
        </div>
      </BlurFade>
    </section>
  );
}
