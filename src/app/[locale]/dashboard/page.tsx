import Footer from '@/features/dashboard/footer';
import Tab from '@/features/dashboard/tab';
import { SectionHeader } from '@/components/section-header';
import { getTranslations } from 'next-intl/server';

/** Admin dashboard: page header, section switcher and control bar. */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  return (
    <main className="w-full">
      <SectionHeader as="h1" label={t('eyebrow')} title={t('title')} delay={0.02} />
      <Tab />
      <Footer />
    </main>
  );
}
