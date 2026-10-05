import { getProfile } from '@/features/profile/queries';
import { brandedTitle, SITE_DESCRIPTION } from '@/lib/seo';
import type { MetadataRoute } from 'next';

/**
 * PWA manifest. Name/description mirror the SEO brand and come from the
 * profile document (never env). English is used as the manifest locale since
 * the manifest itself is not localized.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const profile = await getProfile('en');
  const name = brandedTitle(profile, 'en');
  const shortName = profile?.fullName || profile?.name || name;

  return {
    name,
    short_name: shortName,
    description: profile?.summary || profile?.description || SITE_DESCRIPTION.en,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a0a0a',
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}
