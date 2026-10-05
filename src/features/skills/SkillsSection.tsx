import BlurFade from '@/components/magicui/blur-fade';
import { SectionHeader, type SectionHeadingProps } from '@/components/section-header';
import type { ISkill } from '@/features/skills/types';

interface SkillsProps extends SectionHeadingProps {
  skills: ISkill[];
  delay?: number;
}

/**
 * Toolkit pills. Hovering inverts a pill to solid ink — the only emphasis
 * the monochrome palette needs.
 */
export function Skills({ index, label, title, description, meta, skills, delay = 0 }: SkillsProps) {
  if (!skills.length) return null;

  return (
    <section id="skills" aria-labelledby="skills-heading">
      <SectionHeader index={index} label={label} title={title} description={description} meta={meta} id="skills-heading" delay={delay} />
      <ul className="flex flex-wrap gap-2">
        {skills.map((skill, id) => (
          <li key={skill._id ?? `${skill.name}-${id}`}>
            <BlurFade delay={delay + 0.04 + id * 0.02} inView>
              <span className="inline-flex cursor-default items-center rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background">
                {skill.name}
              </span>
            </BlurFade>
          </li>
        ))}
      </ul>
    </section>
  );
}
