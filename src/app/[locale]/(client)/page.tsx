import { JsonLd } from '@/components/JsonLd';
import Navbar from '@/components/navbar';
import { About } from '@/components/sections/about';
import { Blog } from '@/components/sections/blog';
import { Contact } from '@/components/sections/contact';
import { Education } from '@/components/sections/education';
import { Experience } from '@/components/sections/experience';
import { Hero } from '@/components/sections/hero';
import { Products } from '@/components/sections/products';
import { Projects } from '@/components/sections/projects';
import { Skills } from '@/components/sections/skills';
import { getPortfolioData, getProducts, getProfile, getBlogList, hasDonations } from '@/lib/data';
import { OG_IMAGE_URL, TWITTER_HANDLE, brandedTitle, languageAlternates, localeUrl, site } from '@/lib/seo';
import { sectionIndex, localizedCount } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AlertTriangle } from 'lucide-react';

/** Revalidate the home page every hour; admin mutations revalidate sooner. */
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

function asLocale(locale: string): AppLocale {
  return locale === 'fa' ? 'fa' : 'en';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = asLocale(locale);
  const profile = await getProfile(lang);
  const t = await getTranslations({ locale, namespace: 'meta.home' });

  const title = brandedTitle(profile, lang);
  const description = profile?.summary || profile?.description || t('description');
  const ogImage = profile?.avatarUrl?.startsWith('http') ? profile.avatarUrl : OG_IMAGE_URL;

  return {
    // Home shows the full brand as-is; the root template must not append to it.
    title: { absolute: title },
    description,
    keywords: [profile?.fullName || profile?.name, profile?.jobTitle, 'portfolio', 'developer', locale === 'fa' ? 'نمونه کار' : 'web developer'].filter(Boolean) as string[],
    alternates: {
      canonical: localeUrl(locale),
      languages: languageAlternates(''),
    },
    openGraph: {
      type: 'website',
      url: localeUrl(locale),
      title,
      description,
      siteName: title,
      locale: locale === 'fa' ? 'fa_IR' : 'en_US',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE || undefined,
      creator: TWITTER_HANDLE || undefined,
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  const lang = asLocale(locale);

  const [t, tSections, data, products, posts, supported] = await Promise.all([
    getTranslations({ locale }),
    getTranslations({ locale, namespace: 'sections' }),
    getPortfolioData(lang),
    getProducts(lang),
    getBlogList(lang),
    hasDonations(lang),
  ]);

  const { profile, projects, works, educations, skills, socials } = data;

  // First-run experience: no database (or no content) yet.
  if (!profile) {
    return (
      <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 text-center">
        <span className="flex size-12 items-center justify-center rounded-full border" aria-hidden>
          <AlertTriangle className="size-5 text-muted-foreground" />
        </span>
        <div className="space-y-3">
          <h1 className="text-xl font-bold ltr:tracking-tight">{t('empty.title')}</h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">{t('empty.description')}</p>
        </div>
        <Navbar socials={[]} />
      </main>
    );
  }

  const jsonLdBase = site ?? '';

  // Ordinals follow the sections that actually render, so a missing record
  // type never leaves a gap in the numbering.
  const rendered = {
    about: Boolean(profile.description?.trim()),
    experience: works.length > 0,
    education: educations.length > 0,
    skills: skills.length > 0,
    projects: projects.some(project => project.active),
    products: products.length > 0,
    blog: posts.length > 0,
    contact: Boolean(profile.email?.trim() || profile.tel?.trim() || socials.some(social => social.url)),
  };
  const renderedKeys = (Object.keys(rendered) as (keyof typeof rendered)[]).filter(key => rendered[key]);
  const ordinal = (key: keyof typeof rendered) => {
    const position = renderedKeys.indexOf(key);
    return position === -1 ? undefined : sectionIndex(position + 1, lang);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col gap-14 sm:gap-20">
      {/* Structured data: person + breadcrumbs for rich results */}
      <JsonLd
        item={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profile.fullName || profile.name,
          url: localeUrl(locale),
          image: profile.avatarUrl || undefined,
          email: profile.email ? `mailto:${profile.email}` : undefined,
          jobTitle: profile.jobTitle || undefined,
          description: profile.summary || profile.description || undefined,
          sameAs: socials.map(s => s.url).filter(Boolean),
        }}
      />
      <JsonLd
        item={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [{ '@type': 'ListItem', position: 1, name: t('navbar.home'), item: `${jsonLdBase}/${locale}` }],
        }}
      />

      <Hero
        profile={profile}
        greeting={tSections('hero.greeting')}
        emailLabel={profile.email ? tSections('hero.emailCta') : undefined}
        supportLabel={supported ? t('support.pay') : undefined}
        supportHref={`/${locale}/support`}
      />
      <About
        index={ordinal('about')}
        label={tSections('about.label')}
        title={tSections('about.title')}
        description={profile.description}
        delay={0.1}
      />
      <Experience
        index={ordinal('experience')}
        label={tSections('experience.label')}
        title={tSections('experience.title')}
        description={tSections('experience.description')}
        meta={tSections('experience.count', { count: localizedCount(works.length, lang) })}
        works={works}
        locale={lang}
        presentLabel={t('present')}
        delay={0.15}
      />
      <Education
        index={ordinal('education')}
        label={tSections('education.label')}
        title={tSections('education.title')}
        meta={tSections('education.count', { count: localizedCount(educations.length, lang) })}
        educations={educations}
        locale={lang}
        delay={0.2}
      />
      <Skills
        index={ordinal('skills')}
        label={tSections('skills.label')}
        title={tSections('skills.title')}
        description={tSections('skills.description')}
        meta={tSections('skills.count', { count: localizedCount(skills.length, lang) })}
        skills={skills}
        delay={0.25}
      />
      <Projects
        index={ordinal('projects')}
        label={tSections('projects.label')}
        title={tSections('projects.title')}
        description={tSections('projects.description')}
        meta={tSections('projects.count', { count: localizedCount(projects.filter(project => project.active).length, lang) })}
        projects={projects}
        locale={locale}
        liveLabel={tSections('projects.visit')}
        viewAllLabel={tSections('projects.viewAll')}
        delay={0.3}
      />
      <Products
        index={ordinal('products')}
        label={tSections('products.label')}
        title={tSections('products.title')}
        description={tSections('products.description')}
        meta={tSections('products.count', { count: localizedCount(products.length, lang) })}
        products={products}
        locale={locale}
        unavailableLabel={t('productsPage.unavailable')}
        viewAllLabel={tSections('products.viewAll')}
        delay={0.35}
      />
      <Blog
        index={ordinal('blog')}
        label={tSections('blog.label')}
        title={tSections('blog.title')}
        description={tSections('blog.description')}
        meta={tSections('blog.count', { count: localizedCount(posts.length, lang) })}
        posts={posts}
        locale={locale}
        lang={lang}
        viewAllLabel={tSections('blog.viewAll')}
        delay={0.4}
      />
      <Contact
        index={ordinal('contact')}
        label={tSections('contact.label')}
        title={tSections('contact.title')}
        description={tSections('contact.description')}
        profile={profile}
        socials={socials}
        delay={0.5}
      />

      <Navbar socials={socials} />
    </main>
  );
}
