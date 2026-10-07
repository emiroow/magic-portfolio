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

  return (
    <section id="experience" aria-labelledby="experience-heading">
      <SectionHeader index={index} label={label} title={title} description={description} meta={meta} id="experience-heading" delay={delay} />
      <Stack>
        {works.map((work, id) => (
          <BlurFade key={work._id ?? `${work.company}-${id}`} delay={delay + 0.06 + id * 0.04} inView>
            <ResumeCard
              logoUrl={work.logoUrl}
              altText={work.company}
              title={work.company}
              subtitle={work.title}
              href={work.href}
              period={`${formatYearMonthLocal(work.start, locale)}${work.start && work.end ? ' – ' : ''}${
                work.end ? formatYearMonthLocal(work.end, locale) : work.start ? presentLabel : ''
              }`}
              meta={work.location}
              description={work.description}
            />
          </BlurFade>
        ))}
      </Stack>
    </section>
  );
}
