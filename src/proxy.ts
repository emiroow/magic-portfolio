import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

/**
 * Locale proxy (Next 16 `proxy` convention): negotiates the locale from
 * the URL and `Accept-Language`, keeping every page under `/{locale}/*`.
 */
export default createMiddleware(routing);

export const config = {
  // Match all paths except API routes, Next.js internals and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
