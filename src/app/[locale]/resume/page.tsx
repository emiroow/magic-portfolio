import { JsonLd } from '@/components/JsonLd';
import { LANGUAGE_LEVELS } from '@/constants/global';
import { getPortfolioData } from '@/features/portfolio/queries';
import { buildResume, resumeSummary, seoDescription } from '@/features/profile/resume/build';
import { ResumeSheet, type ResumeLevelLabels, type ResumeSectionLabels } from '@/features/profile/resume/document';
import ResumeViewer, { type ResumeViewerLabels } from '@/features/profile/resume/viewer';
import { getProfile } from '@/features/profile/queries';
import { languageAlternates, localeUrl, ogImageFor, personName, personTitle } from '@/lib/seo';
import type { AppLocale, LanguageLevel } from '@/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import './resume.css';

/**
 * The public résumé: one printable, indexable document per locale.
 *
 * It composes live from the same data the home page shows, so it is never stale, and it
 * needs no session — it only ever reads public content. An owner who has uploaded their
 * own file never reaches this file at all: `layout.tsx` hands that reader straight to the
 * document, as an HTTP redirect rather than a rendered page.
 *
 * Being a page rather than a bare document route is what gives the résumé the things a
 * document shared with a recruiter needs to carry: a canonical URL per locale, hreflang
 * pairs for the two languages it exists in, structured data naming the person behind it,
 * and the site's own faces and theme rather than a second copy of each.
 */
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

function asLocale(locale: string): AppLocale {
  return locale === 'fa' ? 'fa' : 'en';
}

/** The section headings and the proficiency words, both from the locale's own messages. */
async function labelsFor(locale: string) {
  const [t, tLevels] = await Promise.all([
    getTranslations({ locale, namespace: 'resume' }),
    getTranslations({ locale, namespace: 'dashboard.profile.languageLevels' }),
  ]);

  const sections: ResumeSectionLabels = {
    summary: t('sections.summary'),
    experience: t('sections.experience'),
    projects: t('sections.projects'),
    skills: t('sections.skills'),
    education: t('sections.education'),
    certificates: t('sections.certificates'),
    languages: t('sections.languages'),
  };

  const levels = Object.fromEntries(LANGUAGE_LEVELS.map((level: LanguageLevel) => [level, tLevels(level)])) as ResumeLevelLabels;

  const viewer: ResumeViewerLabels = {
    docTitle: t('docTitle'),
    hint: t('hint'),
    controls: t('controls'),
    home: t('home'),
    get: t('get'),
    pdf: t('pdf'),
    pdfDesc: t('pdfDesc'),
    pdfBusy: t('pdfBusy'),
    print: t('print'),
    printDesc: t('printDesc'),
    theme: t('theme'),
    toOther: t('toOther'),
  };

  return { t, sections, levels, viewer };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = asLocale(locale);
  // Profile only: the sheet's full load belongs to the render, and the headline a search
  // result shows is all the metadata needs from the document.
  const [t, profile] = await Promise.all([getTranslations({ locale, namespace: 'resume' }), getProfile(lang)]);

  const docWord = t('docTitle');
  // `Résumé | Name | Job Title` — the document, the person and their craft, and no site suffix:
  // a sheet handed to a recruiter speaks for the person on it, not for the portfolio hosting it.
  const title = [docWord, personTitle(profile)].filter(Boolean).join(' | ');
  const name = personName(profile) || docWord;
  const description = seoDescription(resumeSummary(profile)) || t('description');
  const url = localeUrl(locale, '/resume');
  // The card draws a headline rather than a title tag, so it gets the person and the word for
  // this document instead of the pipe-separated string a browser tab shows.
  const ogSubject = `${name} — ${docWord}`;
  const ogImage = ogImageFor(ogSubject, locale);

  return {
    // `absolute` is the opt-out of the root template, which would append the brand — suffix and all.
    title: { absolute: title },
    description,
    alternates: { canonical: url, languages: languageAlternates('/resume') },
    openGraph: {
      type: 'profile',
      title,
      description,
      url,
      locale: lang === 'fa' ? 'fa_IR' : 'en_US',
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogSubject }],
    },
    twitter: { card: 'summary', title, description, images: [ogImage] },
  };
}

export default async function ResumePage({ params }: Props) {
  const { locale } = await params;
  const lang = asLocale(locale);

  const [labels, data] = await Promise.all([labelsFor(locale), getPortfolioData(lang)]);
  const { t, sections, levels, viewer } = labels;

  const model = buildResume(data, lang);
  if (!model) notFound();

  const canonical = localeUrl(locale, '/resume');
  const description = seoDescription(model.summary) || t('description');
  // Only the links the model kept as links: `build.ts` has already dropped any stored URL
  // whose scheme was not one worth pointing a reader at.
  const sameAs = model.contacts.map(contact => contact.href).filter((href): href is string => Boolean(href?.startsWith('http')));

  const personId = `${canonical}#person`;
  const documentId = `${canonical}#resume`;

  return (
    <>
      {/* Two nodes, one graph: the person, and the résumé document that describes them.
          The document carries this locale's own canonical URL, so a consumer of the data
          reaches the sheet a recruiter would save rather than a guessed path. */}
      <JsonLd
        item={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Person',
              '@id': personId,
              name: model.name,
              jobTitle: model.role || undefined,
              description,
              url: canonical,
              knowsAbout: model.skills.length ? model.skills : undefined,
              knowsLanguage: model.languages.length ? model.languages.map(language => language.name) : undefined,
              sameAs: sameAs.length ? sameAs : undefined,
              subjectOf: { '@id': documentId },
            },
            {
              '@type': 'ProfilePage',
              '@id': documentId,
              url: canonical,
              name: `${model.name} — ${t('docTitle')}`,
              description,
              inLanguage: lang,
              mainEntity: { '@id': personId },
            },
          ],
        }}
      />

      <ResumeViewer locale={lang} name={model.name} pageWord={t('page')} labels={viewer}>
        <ResumeSheet model={model} labels={sections} levels={levels} />
      </ResumeViewer>
    </>
  );
}
