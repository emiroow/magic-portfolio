import { getServerAuthSession } from '@/features/auth/config';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });
  // Admin area must never be indexed.
  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

/**
 * Dashboard layout: enforces an admin session and applies the shared page
 * rhythm. Providers and locale validation come from `[locale]/layout.tsx`.
 */
export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const session = await getServerAuthSession();
  if (!session) {
    const callback = encodeURIComponent(`/${locale}/dashboard`);
    redirect(`/${locale}/auth?callbackUrl=${callback}`);
  }

  return <div className="site-shell max-w-4xl">{children}</div>;
}
