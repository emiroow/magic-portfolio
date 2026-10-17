import { uploadedResumeFile } from '@/features/profile/resume/build';
import { getProfile } from '@/features/profile/queries';
import type { AppLocale } from '@/types';
import { redirect } from 'next/navigation';

/** The résumé ages like the profile it is built from; admin writes revalidate sooner. */
export const revalidate = 3600;

/**
 * The owner's own file, served before the document is ever composed.
 *
 * This decision lives in the layout rather than in the page for one reason: the page sits
 * behind a `loading.tsx` boundary, so by the time it renders the response has already
 * started streaming and a redirect there can only arrive as a client-side refresh. A
 * layout belongs to the shell, which is still a status code and a `Location` header — so a
 * crawler, a link preview and a `curl` all get the very file the owner uploaded.
 */
export default async function ResumeLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const lang: AppLocale = locale === 'fa' ? 'fa' : 'en';

  // The profile alone answers this; the sheet's own load belongs to the page below.
  const profile = await getProfile(lang);
  const uploaded = uploadedResumeFile(profile);
  if (uploaded) redirect(uploaded);

  return children;
}
