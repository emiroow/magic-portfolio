import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // The upload route re-bakes catalogue covers with sharp, which links a native
  // libvips binary. Keeping it external stops the bundler trying to inline it.
  serverExternalPackages: ['sharp'],
  images: {
    localPatterns: [
      // First-party uploads under /public. The dashboard appends a display-only
      // `?cb=` cache-buster to force a refresh after re-upload; omitting `search`
      // lets any query (or none) through, which is what the default would reject.
      { pathname: '/**' },
    ],
    remotePatterns: [
      // Vercel Blob storage (production image uploads).
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      // Local development uploads served from /public via NEXT_PUBLIC_SITE_URL.
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
};

export default withNextIntl(nextConfig);
