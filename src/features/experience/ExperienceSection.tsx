import BlurFade from '@/components/magicui/blur-fade';
import { SectionHeader, type SectionHeadingProps } from '@/components/section-header';
import { Stack } from '@/components/stack';
import { ResumeCard } from '@/components/resume-card';
import { formatYearMonthLocal } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IWork } from '@/features/experience/types';

interface ExperienceProps extends SectionHeadingProps {
  works: IWork[];
  locale: AppLocale;
  /** Copy used when an entry has no end date. */
  presentLabel: string;
  delay?: number;
}

/** Work history: one divided surface, newest first, expandable on demand. */
export function Experience({ index, label, title, description, meta, works, locale, presentLabel, delay = 0 }: ExperienceProps) {
  if (!works.length) return null;

  /**
   * `March 2019 – May 2021`, or `February 2024 – Present` while the role is open.
   * The separator sits between the two segments rather than with the end date, so an
   * open role reads as a range instead of `February 2024Present`.
   */
  const period = (work: IWork) => {
    const from = formatYearMonthLocal(work.start, locale);
    const to = formatYearMonthLocal(work.end, locale) || (work.start ? presentLabel : '');
    return from && to ? `${from} – ${to}` : from || to;
  };

  return (
    <section id="experience" aria-labelledby="experience-heading">
      <SectionHeader index={index} label={label} title={title} description={description} meta={meta} id="experience-heading" delay={delay} />
      <Stack>
        {works.map((work, id) => (
          <BlurFade key={work._id ?? `${work.company}-${id}`} delay={delay + 0.06 + id * 0.05} inView>
            <ResumeCard
              logoUrl={work.logoUrl}
              altText={work.company}
              title={work.company}
              subtitle={work.title}
              href={work.href}
              period={period(work)}
              meta={work.location}
              description={work.description}
            />
          </BlurFade>
        ))}
      </Stack>
    </section>
  );
}
