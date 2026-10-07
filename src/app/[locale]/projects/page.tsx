import Navbar from '@/components/navbar';
import ProjectsGrid from '@/features/projects/ProjectsGrid';
import { JsonLd } from '@/components/JsonLd';
import { SectionHeader } from '@/components/section-header';
import { getProfile } from '@/features/profile/queries';
import { getProjectTechnologies, getProjects } from '@/features/projects/queries';
import { getSocials } from '@/features/socials/queries';
import { brandedTitle, languageAlternates, localeUrl, ogImageFor } from '@/lib/seo';
import { localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

/** Project archive refreshes every hour, like the home page. */
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

function asLocale(locale: string): AppLocale {
  return locale === 'fa' ? 'fa' : 'en';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = asLocale(locale);
  const [t, profile] = await Promise.all([getTranslations({ locale, namespace: 'projectsPage' }), getProfile(lang)]);

  const title = t('title');
  const description = t('description');
  const url = localeUrl(locale, '/projects');
  const brand = brandedTitle(profile, lang);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates('/projects'),
    },
    openGraph: {
      type: 'website',
      title: `${title} | ${brand}`,
      description,
      url,
      locale: locale === 'fa' ? 'fa_IR' : 'en_US',
      images: [{ url: ogImageFor(title, locale), width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;
  const lang = asLocale(locale);

  const [t, projects, technologies, socials] = await Promise.all([
    getTranslations({ locale, namespace: 'projectsPage' }),
    getProjects(lang),
    getProjectTechnologies(lang),
    getSocials(lang),
  ]);

  return (
    <main>
      <section aria-labelledby="projects-heading">
        <JsonLd
          item={{
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: t('title'),
            description: t('description'),
            url: localeUrl(locale, '/projects'),
            inLanguage: locale,
          }}
        />

        <SectionHeader
          as="h1"
          id="projects-heading"
          label={t('eyebrow')}
          title={t('title')}
          description={t('description')}
          meta={projects.length ? t('count', { count: localizedCount(projects.length, lang) }) : undefined}
          variant="spine"
          mark="projects"
          delay={0.04}
        />

        <ProjectsGrid projects={projects} technologies={technologies} />

        <Navbar socials={socials} />
      </section>
    </main>
  );
}
