import { apiError, apiJson, parseBody, requireAdmin } from '@/lib/api';
import { connectDB } from '@/config/dbConnection';
import { langSchema } from '@/lib/validations';
import { profileSchema } from '@/features/profile/schema';
import { profileModel } from '@/features/profile/model';
import { revalidatePath } from 'next/cache';

type RouteContext = { params: Promise<{ lang: string }> };

/** Resolve + validate the guarded locale shared by both handlers. */
async function prepare(request: Request, context: RouteContext) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const { lang } = await context.params;
  const parsedLang = langSchema.safeParse(lang);
  if (!parsedLang.success) {
    return { ok: false as const, response: apiError('Unsupported language. Use "fa" or "en".', 400) };
  }

  await connectDB();
  return { ok: true as const, lang: parsedLang.data };
}

/** Get the profile document for a locale. */
export async function GET(_request: Request, context: RouteContext) {
  const prepared = await prepare(_request, context);
  if (!prepared.ok) return prepared.response;

  try {
    const profile = await profileModel.findOne({ lang: prepared.lang }).lean();
    return apiJson({ data: profile ? JSON.parse(JSON.stringify(profile)) : null });
  } catch (error) {
    console.error('[api/admin/profile] read failed:', error);
    return apiError('Internal Server Error', 500);
  }
}

/** Create-or-update the profile document for a locale (upsert). */
export async function PUT(request: Request, context: RouteContext) {
  const prepared = await prepare(request, context);
  if (!prepared.ok) return prepared.response;

  const parsed = await parseBody(profileSchema, request);
  if (!parsed.ok) return parsed.response;

  try {
    const profile = await profileModel
      .findOneAndUpdate({ lang: prepared.lang }, parsed.data, { new: true, upsert: true, runValidators: true })
      .lean();

    revalidatePath(`/${prepared.lang}`, 'layout');
    return apiJson({ data: JSON.parse(JSON.stringify(profile)) });
  } catch (error) {
    console.error('[api/admin/profile] update failed:', error);
    return apiError('Internal Server Error', 500);
  }
}
