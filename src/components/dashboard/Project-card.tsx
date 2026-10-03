'use client';

import { iconDecider } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Loading from '@/components/ui/loading';
import type { IProject } from '@/types';
import { cn, documentKey, isOptimizableImage, localizedCount } from '@/lib/utils';
import { ExternalLink, Pencil, Pin, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface ProjectItemProps {
  project: IProject;
  onEdit: (project: IProject) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  /** 1-based position on the home page, or 0 when the project is not picked. */
  homePosition: number;
  /** Every slot is taken by another project, so this one cannot be picked. */
  slotsFull: boolean;
  onToggleHome: (project: IProject) => void;
  togglingHome: boolean;
}

/** Dashboard list item for a single project. */
const ProjectCard = ({ project, onEdit, onDelete, isDeleting, homePosition, slotsFull, onToggleHome, togglingHome }: ProjectItemProps) => {
  const t = useTranslations('dashboard.projects');
  const tLink = useTranslations('linkTypes');
  const locale = useLocale();
  const lang = locale === 'fa' ? 'fa' : 'en';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const key = documentKey(project);
  const featured = project.active && project.featured === true;

  // A stored type is a slug, so anything unexpected falls through readable.
  const linkLabel = (value: string) => (tLink.has(value) ? tLink(value) : value);

  // A dead control is worse than no control: say why it is unavailable.
  const homeBlock = !project.active ? t('featuredNeedsPublish') : slotsFull && !featured ? t('featuredFull') : '';

  return (
    <Card className="transition-colors hover:border-foreground/30">
      <CardHeader className="flex-row items-center justify-between space-y-0 p-4 sm:p-5">
        <div className="min-w-0 space-y-0.5">
          <h3 className="truncate text-sm font-semibold sm:text-base">{project.title}</h3>
          {project.dates && <p className="text-[11px] tabular-nums text-muted-foreground">{project.dates}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            className={cn('size-8', featured && 'text-foreground')}
            onClick={() => onToggleHome(project)}
            disabled={Boolean(homeBlock) || togglingHome}
            aria-pressed={featured}
            aria-label={featured ? t('removeFromHome') : t('addToHome')}
            title={homeBlock || (featured ? t('removeFromHome') : t('addToHome'))}
          >
            {togglingHome ? <Loading size="sm" /> : <Pin className={cn('size-4', featured && 'fill-current')} aria-hidden />}
          </Button>
          {project.active && key && (
            <Link
              href={`/${locale}/projects/${key}`}
              target="_blank"
              aria-label={t('viewProject')}
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}
            >
              <ExternalLink className="size-4" aria-hidden />
            </Link>
          )}
          <Button size="icon" variant="ghost" className="size-8" onClick={() => onEdit(project)} aria-label={t('edit')}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            aria-label={t('delete')}
          >
            {isDeleting ? <Loading size="sm" /> : <Trash2 className="size-4" aria-hidden />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="flex flex-col gap-4 sm:flex-row">
          {project.image && (
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg border sm:h-20 sm:w-32 sm:aspect-auto">
              {isOptimizableImage(project.image) ? (
                <Image src={project.image} alt={project.title} fill sizes="(max-width: 640px) 100vw, 128px" className="object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={project.image} alt={project.title} loading="lazy" decoding="async" className="size-full object-cover" />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{project.description}</p>

            {project.technologies?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((tech, index) => (
                  <Badge key={index} variant="secondary" className="px-2 py-0 text-[10px] font-normal">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={project.active ? 'default' : 'outline'} className="text-[10px]">
                {project.active ? t('active') : t('disabled')}
              </Badge>

              {featured && (
                <Badge variant="outline" className="text-[10px]">
                  {t('featuredBadge')}
                  {homePosition > 0 && (
                    <>
                      <span aria-hidden className="text-muted-foreground">
                        ·
                      </span>
                      <span className="tabular-nums text-muted-foreground">{localizedCount(homePosition, lang)}</span>
                    </>
                  )}
                </Badge>
              )}

              {project.links?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors hover:bg-foreground hover:text-background"
                      title={linkLabel(link.type)}
                    >
                      {iconDecider(link.icon, 'size-3')}
                      {linkLabel(link.type)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        itemName={project.title}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete(project._id!);
        }}
      />
    </Card>
  );
};

export default ProjectCard;
