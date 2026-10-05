import { apiError, apiJson } from '@/lib/api';
import { getBlogList } from '@/features/blog/queries';
import { langSchema } from '@/lib/validations';

/** Public blog list for a locale (content stripped). */
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const parsed = langSchema.safeParse(lang);
  if (!parsed.success) {
    return apiError('Unsupported language. Use "fa" or "en".', 400);
  }

  const data = await getBlogList(parsed.data);
  return apiJson({ data });
}
