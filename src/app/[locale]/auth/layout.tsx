import { getServerAuthSession } from '@/features/auth/config';
import { absoluteUrl } from '@/lib/seo';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth.login' });

  // The login screen must never be indexed or linked from a sitemap.
  return {
    title: t('title'),
    description: t('subtitle'),
    robots: { index: false, follow: false },
    alternates: { canonical: absoluteUrl(`/${locale}/auth`) },
  };
}

/** Auth layout: bounces already-authenticated admins to the dashboard. */
export default async function AuthLayout({ children, params }: Readonly<{ children: React.ReactNode } & Props>) {
  const { locale } = await params;

  const session = await getServerAuthSession();
  if (session) {
    redirect(`/${locale}/dashboard`);
  }

  return <div className="flex min-h-screen items-center justify-center px-4 py-8">{children}</div>;
}
