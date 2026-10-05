import { apiError, apiJson } from '@/lib/api';
import { getBlogBySlug } from '@/features/blog/queries';
import { langSchema } from '@/lib/validations';

/** Public blog post lookup by slug and locale. */
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const parsed = langSchema.safeParse(lang);
  if (!parsed.success) {
    return apiError('Unsupported language. Use "fa" or "en".', 400);
  }

  const post = await getBlogBySlug(parsed.data, decodeURIComponent(slug));
  if (!post) {
    return apiError('Not Found', 404);
  }

  return apiJson({ data: post });
}
