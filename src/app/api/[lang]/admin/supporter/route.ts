import { requireAdmin, parseBody, apiError, apiJson } from '@/lib/api';
import { connectDB } from '@/config/dbConnection';
import { langSchema } from '@/lib/validations';
import { supporterAdminSchema } from '@/features/support/schema';
import { supporterModel } from '@/features/support/supporter.model';
import { revalidatePath } from 'next/cache';

/**
 * Admin view of the support records: list everything (including drafts and
 * failures), confirm a card-to-card or crypto transfer, move one off the wall,
 * or delete it. Creation happens on the public checkout route, never here.
 */

type RouteContext = { params: Promise<{ lang: string }> };

export const GET = async (_request: Request, { params }: RouteContext) => {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { lang } = await params;
  const parsed = langSchema.safeParse(lang);
  if (!parsed.success) return apiError('Unsupported language. Use "fa" or "en".', 400);

  try {
    await connectDB();
    const docs = await supporterModel.find({ lang: parsed.data }).sort({ createdAt: -1 }).lean();
    return apiJson({ data: JSON.parse(JSON.stringify(docs)) });
  } catch (error) {
    console.error('[api/admin/supporter] list failed:', error);
    return apiError('Internal Server Error', 500);
  }
};

export const PUT = async (request: Request, { params }: RouteContext) => {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { lang } = await params;
  const parsedLang = langSchema.safeParse(lang);
  if (!parsedLang.success) return apiError('Unsupported language. Use "fa" or "en".', 400);

  const parsed = await parseBody(supporterAdminSchema, request);
  if (!parsed.ok) return parsed.response;

  const { _id, ...update } = parsed.data;
  if (!Object.keys(update).length) return apiError('Nothing to update', 400);

  try {
    await connectDB();
    const updated = await supporterModel.findOneAndUpdate({ _id, lang: parsedLang.data }, update, { new: true, runValidators: true }).lean();
    if (!updated) return apiError('Document not found', 404);

    // Confirming a gift changes the public wall, so both surfaces refresh.
    revalidatePath(`/${parsedLang.data}/support`);
    revalidatePath(`/${parsedLang.data}`, 'layout');
    return apiJson({ data: JSON.parse(JSON.stringify(updated)) });
  } catch (error) {
    console.error('[api/admin/supporter] update failed:', error);
    return apiError('Internal Server Error', 500);
  }
};

export const DELETE = async (request: Request, { params }: RouteContext) => {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { lang } = await params;
  const parsedLang = langSchema.safeParse(lang);
  if (!parsedLang.success) return apiError('Unsupported language. Use "fa" or "en".', 400);

  const id = new URL(request.url).searchParams.get('id');
  const parsedId = supporterAdminSchema.shape._id.safeParse(id);
  if (!parsedId.success) return apiError('A valid "id" query parameter is required');

  try {
    await connectDB();
    const deleted = await supporterModel.findOneAndDelete({ _id: parsedId.data, lang: parsedLang.data });
    if (!deleted) return apiError('Document not found', 404);

    revalidatePath(`/${parsedLang.data}/support`);
    revalidatePath(`/${parsedLang.data}`, 'layout');
    return apiJson({ data: { message: 'Deleted successfully' } });
  } catch (error) {
    console.error('[api/admin/supporter] delete failed:', error);
    return apiError('Internal Server Error', 500);
  }
};
