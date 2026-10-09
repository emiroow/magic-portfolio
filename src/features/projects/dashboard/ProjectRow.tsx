'use client';

import { EntityCard, EntityThumb, HomeSlotChip, RowAction, StatusChip, TagChip } from '@/features/dashboard/components';
import { iconDecider } from '@/components/icons';
import type { IProject } from '@/features/projects/types';
import { documentKey, galleryUrls } from '@/lib/utils';
import type { AppLocale } from '@/types';
import { ExternalLink, Pencil, Pin, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface ProjectRowProps {
  project: IProject;
  onEdit: (project: IProject) => void;
  onDelete: (project: IProject) => void;
  /** This record, and not another one, is being deleted. */
  deleting: boolean;
  /** 1-based position on the home page, or 0 when the project is not picked. */
  homePosition: number;
  /** Every slot is taken by another project, so this one cannot be picked. */
  slotsFull: boolean;
  onToggleHome: (project: IProject) => void;
  togglingHome: boolean;
}

/** Dashboard list item for a single project. */
const ProjectRow = ({ project, onEdit, onDelete, deleting, homePosition, slotsFull, onToggleHome, togglingHome }: ProjectRowProps) => {
  const t = useTranslations('dashboard.projects');
  const tLink = useTranslations('linkTypes');
  const locale = useLocale();
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  const key = documentKey(project);
  const featured = project.active && project.featured === true;
  const technologies = project.technologies ?? [];
  const links = project.links ?? [];
  const gallery = galleryUrls(project);

  // A stored type is a slug, so anything unexpected falls through readable.
  const linkLabel = (value: string) => (tLink.has(value) ? tLink(value) : value);

  // A dead control is worse than no control: say why it is unavailable.
  const homeBlock = !project.active ? t('featuredNeedsPublish') : slotsFull && !featured ? t('featuredFull') : undefined;

  return (
    <EntityCard
      title={project.title}
      meta={project.dates ? <span className="tabular-nums">{project.dates}</span> : undefined}
      actions={
        <>
          <RowAction
            label={featured ? t('removeFromHome') : t('addToHome')}
            icon={Pin}
            iconClassName={featured ? 'fill-current' : undefined}
            pressed={featured}
            blockedReason={homeBlock}
            pending={togglingHome}
            onClick={() => onToggleHome(project)}
          />
          {project.active && key && <RowAction label={t('viewProject')} icon={ExternalLink} href={`/${locale}/projects/${key}`} />}
          <RowAction label={t('edit')} icon={Pencil} onClick={() => onEdit(project)} />
          <RowAction label={t('delete')} icon={Trash2} danger pending={deleting} onClick={() => onDelete(project)} />
        </>
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        {gallery.length > 0 && (
          <EntityThumb src={gallery[0]} alt={project.title} count={gallery.length} className="aspect-video w-full sm:aspect-auto sm:h-20 sm:w-32" />
        )}

        <div className="min-w-0 flex-1 space-y-3">
          {project.description && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{project.description}</p>}

          {technologies.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {technologies.map((tech, index) => (
                <li key={`${tech}-${index}`}>
                  <TagChip>{tech}</TagChip>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <StatusChip solid={project.active}>{project.active ? t('active') : t('disabled')}</StatusChip>
            {featured && <HomeSlotChip label={t('featuredBadge')} position={homePosition} lang={lang} />}

            {links.map((link, index) => (
              <a
                key={`${link.type}-${index}`}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={linkLabel(link.type)}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors hover:bg-foreground hover:text-background"
              >
                {iconDecider(link.icon, 'size-3')}
                {linkLabel(link.type)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </EntityCard>
  );
};

export default ProjectRow;
