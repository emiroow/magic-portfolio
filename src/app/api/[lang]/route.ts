import { apiError, apiJson } from '@/lib/api';
import { getPortfolioData } from '@/features/portfolio/queries';
import { langSchema } from '@/lib/validations';

/**
 * Public aggregate endpoint: all home-page content for one locale.
 * Read-only and database-safe (returns empty sections when the DB
 * is unavailable).
 */
export const dynamic = 'force-dynamic';

export const GET = async (_request: Request, { params }: { params: Promise<{ lang: string }> }) => {
  const { lang } = await params;
  const parsed = langSchema.safeParse(lang);
  if (!parsed.success) {
    return apiError('Unsupported language. Use "fa" or "en".', 400);
  }

  const data = await getPortfolioData(parsed.data);
  return apiJson({ data });
};
