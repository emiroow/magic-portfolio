import Navbar from '@/components/navbar';
import PostShare from '@/features/blog/post-share';
import { ProjectCard } from '@/features/projects/project-card';
import { ImageGallery } from '@/components/image-gallery';
import { MarkdownBody } from '@/components/markdown-body';
import { JsonLd } from '@/components/JsonLd';
import { iconDecider } from '@/components/icons';
import BlurFade from '@/components/magicui/blur-fade';
import { eyebrowClass } from '@/components/section-header';
import { Stack } from '@/components/stack';
import { Badge } from '@/components/ui/badge';
import { IMAGE_SPECS, OG_CARD, HERO_IMAGE_SIZES } from '@/constants/imageSpecs';
import { getProfile } from '@/features/profile/queries';
import { getProjectByKey, getProjects } from '@/features/projects/queries';
import { getSocials } from '@/features/socials/queries';
import { languageAlternates, localeUrl, ogImageFor } from '@/lib/seo';
import { cn, documentKey, galleryUrls, linkHost } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IProject } from '@/features/projects/types';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

/** Project pages refresh hourly; admin writes revalidate immediately. */
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string; slug: string }> };

function asLocale(locale: string): AppLocale {
  return locale === 'fa' ? 'fa' : 'en';
}

/** Resolve params once; reuse for metadata and rendering. */
async function loadProject(params: Props['params']) {
  const { locale, slug } = await params;
  const project = await getProjectByKey(asLocale(locale), decodeURIComponent(slug));
  return { locale, project };
}

function projectUrl(locale: string, project: IProject) {
  return localeUrl(locale, `/projects/${documentKey(project)}`);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, project } = await loadProject(params);
  const t = await getTranslations({ locale, namespace: 'projectPage' });

  if (!project) {
    return { title: t('notFound'), robots: { index: false, follow: false } };
  }

  const url = projectUrl(locale, project);
  const description = project.description || t('defaultDescription');
  const cover = project.image;
  const image = cover || ogImageFor(project.title, locale);
  // A real cover ships at the catalogue's canonical size; the generated fallback is a
  // 1.91:1 card. Declaring the right pixels keeps social previewers from resampling.
  const imageWidth = cover ? IMAGE_SPECS.project.width : OG_CARD.width;
  const imageHeight = cover ? IMAGE_SPECS.project.height : OG_CARD.height;

  return {
    title: project.title,
    description,
    keywords: project.technologies,
    alternates: { canonical: url, languages: languageAlternates(`/projects/${documentKey(project)}`) },
    openGraph: {
      type: 'website',
      title: project.title,
      description,
      url,
      locale: locale === 'fa' ? 'fa_IR' : 'en_US',
      images: [{ url: image, width: imageWidth, height: imageHeight, alt: project.title }],
    },
    twitter: { card: 'summary_large_image', title: project.title, description, images: [image] },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { locale, project } = await loadProject(params);
  if (!project) notFound();

  const lang = asLocale(locale);
  const [t, tProjects, profile, all, socials] = await Promise.all([
    getTranslations({ locale, namespace: 'projectPage' }),
    getTranslations({ locale, namespace: 'projectsPage' }),
    getProfile(lang),
    getProjects(lang),
    getSocials(lang),
  ]);

  const index = all.findIndex(item => item._id === project._id);
  const prev = index > 0 ? all[index - 1] : undefined;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : undefined;
  const more = all.filter(item => item._id !== project._id).slice(0, 3);

  const url = projectUrl(locale, project);
  const gallery = galleryUrls(project);
  const author = profile?.fullName || profile?.name;

  // The product URL leads the list; a stored link pointing at the same
  // address would only duplicate the row.
  const resources = [
    ...(project.href ? [{ label: t('visit'), href: project.href, icon: 'website' }] : []),
    ...project.links.filter(link => link.href !== project.href).map(link => ({ label: link.type, href: link.href, icon: link.icon })),
  ];

  return (
    <main>
      <article>
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: project.title,
            description: project.description || undefined,
            url,
            inLanguage: locale,
            image: gallery.length > 0 ? gallery : undefined,
            applicationCategory: 'WebApplication',
            keywords: project.technologies.join(', '),
            dateCreated: project.dates || undefined,
            author: { '@type': 'Person', name: author || undefined, url: localeUrl(locale) },
          }}
        />
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: tProjects('title'), item: localeUrl(locale, '/projects') },
              { '@type': 'ListItem', position: 2, name: project.title, item: url },
            ],
          }}
        />

        <BlurFade delay={0.04}>
          <Link
            href={`/${locale}/projects`}
            className="-ms-1 mb-6 inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5 rtl:-scale-x-100" aria-hidden />
            {t('backToProjects')}
          </Link>
        </BlurFade>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <p className={eyebrowClass}>{t('eyebrow')}</p>
            {project.dates && (
              <>
                <span aria-hidden className="text-border">
                  ·
                </span>
                <span className="text-[11px] tabular-nums">{project.dates}</span>
              </>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight ltr:tracking-tight sm:text-3xl md:text-4xl">{project.title}</h1>

          {project.description && (
            <p className="mt-4 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground rtl:leading-[1.9] sm:text-base">
              {project.description}
            </p>
          )}

          {project.technologies.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {project.technologies.map(tag => (
                <li key={tag}>
                  <Badge variant="secondary" className="px-2 py-0.5 text-[11px] font-normal">
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          <div aria-hidden className="rule-fade mt-6" />
        </header>

        {gallery.length > 0 && (
          <BlurFade delay={0.08} className="mb-10">
            <ImageGallery images={gallery} alt={project.title} aspectClass={IMAGE_SPECS.project.aspectClass} sizes={HERO_IMAGE_SIZES} />
          </BlurFade>
        )}

        {project.details && (
          <BlurFade delay={0.1}>
            <MarkdownBody content={project.details} />
          </BlurFade>
        )}

        {resources.length > 0 && (
          <BlurFade delay={0.12} inView>
            <section aria-labelledby="project-links-heading" className="mt-10">
              <h2 id="project-links-heading" className={cn(eyebrowClass, 'mb-4')}>
                {t('resources')}
              </h2>
              <Stack>
                {resources.map(resource => (
                  <a
                    key={`${resource.label}-${resource.href}`}
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5"
                  >
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors group-hover:border-foreground group-hover:bg-foreground group-hover:text-background"
                    >
                      {iconDecider(resource.icon, 'size-4')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium leading-snug">{resource.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        <bdi dir="ltr">{linkHost(resource.href)}</bdi>
                      </span>
                    </span>
                    <ArrowUpRight
                      className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground rtl:-scale-x-100"
                      aria-hidden
                    />
                  </a>
                ))}
              </Stack>
            </section>
          </BlurFade>
        )}

        <BlurFade delay={0.14}>
          <div className="mt-10 border-t pt-6">
            <PostShare title={project.title} url={url} />
          </div>
        </BlurFade>

        {(prev || next) && (
          <nav aria-label={t('pagination')} className="mt-10 grid gap-3 sm:grid-cols-2">
            {prev && (
              <Link
                href={`/${locale}/projects/${documentKey(prev)}`}
                className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-sm transition-colors hover:border-foreground/40"
              >
                <ArrowLeft
                  className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground rtl:-scale-x-100"
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className={cn(eyebrowClass, 'block')}>{t('previous')}</span>
                  <span className="mt-1 line-clamp-1 block font-medium">{prev.title}</span>
                </span>
              </Link>
            )}
            {next && (
              <Link
                href={`/${locale}/projects/${documentKey(next)}`}
                className={cn(
                  'group flex items-center justify-end gap-3 rounded-xl border bg-card p-4 text-end text-sm shadow-sm transition-colors hover:border-foreground/40',
                  !prev && 'sm:col-start-2'
                )}
              >
                <span className="min-w-0">
                  <span className={cn(eyebrowClass, 'block')}>{t('next')}</span>
                  <span className="mt-1 line-clamp-1 block font-medium">{next.title}</span>
                </span>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground rtl:-scale-x-100"
                  aria-hidden
                />
              </Link>
            )}
          </nav>
        )}

        {more.length > 0 && (
          <section aria-labelledby="more-projects-heading" className="mt-12">
            <h2 id="more-projects-heading" className={cn(eyebrowClass, 'mb-4')}>
              {t('more')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {more.map(item => (
                <ProjectCard
                  key={item._id}
                  href={item.href}
                  detailHref={`/${locale}/projects/${documentKey(item)}`}
                  title={item.title}
                  description={item.description}
                  dates={item.dates}
                  tags={item.technologies}
                  image={item.image}
                  links={item.links}
                  liveLabel={t('visit')}
                  className="h-full"
                />
              ))}
            </div>
          </section>
        )}

        <Navbar socials={socials} />
      </article>
    </main>
  );
}
