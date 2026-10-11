import { getPortfolioData } from '@/features/portfolio/queries';
import { buildResume } from '@/features/profile/resume/build';
import { renderResumeHtml, renderResumeUnavailable } from '@/features/profile/resume/document';
import { langSchema } from '@/lib/validations';
import type { AppLocale } from '@/types';

/**
 * Public résumé: one printable document per locale.
 *
 * A visitor's "Résumé" action lands here when the owner has not uploaded their own
 * file. The résumé is composed live from the same data the home page shows, so it is
 * never stale, and it needs no admin session — it only ever reads public content.
 */
export const dynamic = 'force-dynamic';

const HTML_HEADERS = { 'content-type': 'text/html; charset=utf-8' } as const;

export async function GET(request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const parsed = langSchema.safeParse(lang);
  if (!parsed.success) {
    return new Response(renderResumeUnavailable('en'), { status: 400, headers: HTML_HEADERS });
  }

  const locale = parsed.data as AppLocale;
  const data = await getPortfolioData(locale);

  // An uploaded file is the owner's résumé, verbatim: hand the reader straight to it.
  // Resolve against the request origin so a development `/resumes/...` path (a
  // relative URL, which `Response.redirect` rejects) reaches the right place.
  if (data.profile?.resumeUrl) {
    return Response.redirect(new URL(data.profile.resumeUrl, request.url), 302);
  }

  const model = buildResume(data, locale);
  if (!model) {
    return new Response(renderResumeUnavailable(locale), { status: 404, headers: HTML_HEADERS });
  }

  return new Response(renderResumeHtml(model), { headers: HTML_HEADERS });
}
