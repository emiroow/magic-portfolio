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
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/android-icon-36x36.png',
        sizes: '36x36',
        type: 'image/png',
      },
      {
        src: '/android-icon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/android-icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/android-icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/android-icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
    ],
  };
}
