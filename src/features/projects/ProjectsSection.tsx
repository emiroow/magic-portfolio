import BlurFade from '@/components/magicui/blur-fade';
import { SectionHeader, type SectionHeadingProps } from '@/components/section-header';
import { ProjectCard } from '@/features/projects/project-card';
import { buttonVariants } from '@/components/ui/button';
import { HOME_PROJECT_SLOTS } from '@/features/projects/constants';
import { cn, documentKey } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { IProject } from '@/features/projects/types';

/**
 * Projects the home section may show. The owner picks them in the dashboard
 * ("show on the home page", up to `HOME_PROJECT_SLOTS` of them) and those picks
 * lead the row; any leftover slot is filled by the newest published project so
 * the section never renders half empty. Everything else lives on `/projects`.
 */
const PREVIEW_COUNT = HOME_PROJECT_SLOTS;

interface ProjectsProps extends SectionHeadingProps {
  projects: IProject[];
  /** Active locale, used to build the localized project-page links. */
  locale: string;
  /** Label for the external-visit chip on each card. */
  liveLabel: string;
  /** Label for the archive link. */
  viewAllLabel: string;
  delay?: number;
}

/** Grid of the active portfolio projects, capped to a preview set. */
export function Projects({ index, label, title, description, meta, projects, locale, liveLabel, viewAllLabel, delay = 0 }: ProjectsProps) {
  const active = projects.filter(project => project.active);
  if (!active.length) return null;

  const chosen = active.filter(project => project.featured);
  const preview = [...chosen, ...active.filter(project => !project.featured)].slice(0, PREVIEW_COUNT);

  return (
    <section id="projects" aria-labelledby="projects-heading">
      <SectionHeader index={index} label={label} title={title} description={description} meta={meta} id="projects-heading" delay={delay} />
      {/* Three fixed tracks from `lg` up, so one or two projects keep the same
          measure they would have in a full row instead of stretching. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((project, id) => (
          <BlurFade key={project._id ?? `${project.title}-${id}`} delay={delay + 0.06 + id * 0.05} inView className="h-full">
            <ProjectCard
              href={project.href}
              detailHref={documentKey(project) ? `/${locale}/projects/${documentKey(project)}` : undefined}
              title={project.title}
              description={project.description}
              dates={project.dates}
              tags={project.technologies}
              image={project.image}
              links={project.links}
              liveLabel={liveLabel}
              priority={id < 3}
              className="h-full"
            />
          </BlurFade>
        ))}
      </div>

      {active.length > preview.length && (
        <BlurFade delay={delay + 0.1} inView>
          <div className="mt-6 flex justify-center">
            <Link href={`/${locale}/projects`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}>
              {viewAllLabel}
              <ArrowRight className="ms-2 size-3.5 rtl:-scale-x-100" aria-hidden />
            </Link>
          </div>
        </BlurFade>
      )}
    </section>
  );
}
