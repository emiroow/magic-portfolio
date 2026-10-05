'use client';

import { EmptyPanel } from '@/components/empty-panel';
import BlurFade from '@/components/magicui/blur-fade';
import { ProjectCard } from '@/features/projects/project-card';
import { Button } from '@/components/ui/button';
import { ListingToolbar } from '@/components/ui/listing-toolbar';
import { documentKey, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IProject } from '@/features/projects/types';
import { FolderGit2, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

/** Projects rendered before the “load more” control appears: two rows of three. */
const PAGE_SIZE = 6;

interface ProjectsGridProps {
  projects: IProject[];
  technologies: string[];
}

/**
 * Project archive: instant search plus a technology filter on the shared
 * listing toolbar, over the same compact card grid as the home section.
 */
export default function ProjectsGrid({ projects, technologies }: ProjectsGridProps) {
  const t = useTranslations('projectsPage');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const [query, setQuery] = useState('');
  const [tech, setTech] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return projects.filter(project => {
      if (tech && !project.technologies.some(item => item.toLowerCase() === tech.toLowerCase())) return false;
      if (!needle) return true;
      return (
        (project.title || '').toLowerCase().includes(needle) ||
        (project.description || '').toLowerCase().includes(needle) ||
        project.technologies.some(item => item.toLowerCase().includes(needle))
      );
    });
  }, [projects, query, tech]);

  const filtering = Boolean(query.trim() || tech);
  const shown = filtered.slice(0, visible);

  // The incoming list is alphabetical; leading with the stacks that appear in
  // most projects keeps the first row of chips the one worth pressing. Spelling
  // variants share a chip, because the filter itself ignores case.
  const facets = useMemo(() => {
    const uses = new Map<string, number>();
    projects.forEach(project =>
      project.technologies.forEach(item => {
        const key = item.toLowerCase();
        uses.set(key, (uses.get(key) ?? 0) + 1);
      })
    );

    const seen = new Set<string>();
    return technologies
      .filter(item => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (uses.get(b.toLowerCase()) ?? 0) - (uses.get(a.toLowerCase()) ?? 0));
  }, [projects, technologies]);

  const pickTech = (value: string | null) => {
    setTech(value);
    setVisible(PAGE_SIZE);
  };

  const clearAll = () => {
    setQuery('');
    pickTech(null);
  };

  if (!projects.length) {
    return <EmptyPanel icon={<FolderGit2 className="size-5 text-muted-foreground" />} text={t('empty')} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ListingToolbar
        query={query}
        onQueryChange={value => {
          setQuery(value);
          setVisible(PAGE_SIZE);
        }}
        searchLabel={t('searchPlaceholder')}
        clearSearchLabel={t('clearSearch')}
        options={facets}
        active={tech}
        onPick={pickTech}
        meta={filtering ? t('count', { count: localizedCount(filtered.length, lang) }) : undefined}
        clearLabel={t('clearFilters')}
        onClear={clearAll}
      />

      {shown.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((project, id) => {
              const key = documentKey(project);
              return (
                <BlurFade key={project._id ?? `${project.title}-${id}`} inView className="h-full">
                  <ProjectCard
                    href={project.href}
                    detailHref={key ? `/${locale}/projects/${key}` : undefined}
                    title={project.title}
                    description={project.description}
                    dates={project.dates}
                    tags={project.technologies}
                    image={project.image}
                    links={project.links}
                    liveLabel={t('visit')}
                    headingLevel="h2"
                    priority={id < 3}
                    className="h-full"
                  />
                </BlurFade>
              );
            })}
          </div>

          {filtered.length > shown.length && (
            <div className="flex justify-center pt-1">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setVisible(value => value + PAGE_SIZE)}>
                {t('loadMore', { count: localizedCount(filtered.length - shown.length, lang) })}
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyPanel
          icon={<Search className="size-5 text-muted-foreground" />}
          text={t('noResults')}
          actionLabel={t('clearFilters')}
          onAction={clearAll}
        />
      )}
    </div>
  );
}
