import BlurFade from '@/components/magicui/blur-fade';
import { SectionHeader, type SectionHeadingProps } from '@/components/section-header';
import { Stack } from '@/components/stack';
import { ResumeCard } from '@/components/resume-card';
import { formatYearMonthLocal } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IEducation } from '@/features/education/types';

interface EducationProps extends SectionHeadingProps {
  educations: IEducation[];
  locale: AppLocale;
  delay?: number;
}

/** Education history, rendered with the same surface language as experience. */
export function Education({ index, label, title, description, meta, educations, locale, delay = 0 }: EducationProps) {
  if (!educations.length) return null;

  return (
    <section id="education" aria-labelledby="education-heading">
      <SectionHeader index={index} label={label} title={title} description={description} meta={meta} id="education-heading" delay={delay} />
      <Stack>
        {educations.map((education, id) => (
          <BlurFade key={education._id ?? `${education.school}-${id}`} delay={delay + 0.06 + id * 0.05} inView>
            <ResumeCard
              href={education.href}
              logoUrl={education.logoUrl}
              altText={education.school}
              title={education.school}
              subtitle={education.degree}
              period={`${formatYearMonthLocal(education.start, locale)}${education.start && education.end ? ' – ' : ''}${formatYearMonthLocal(
                education.end,
                locale
              )}`}
            />
          </BlurFade>
        ))}
      </Stack>
    </section>
  );
}
