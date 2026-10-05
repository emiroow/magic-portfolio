import { apiError, apiJson, parseBody } from '@/lib/api';
import { tryConnectDB } from '@/config/dbConnection';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { langSchema } from '@/lib/validations';
import { supporterConfirmSchema } from '@/features/support/schema';
import { supporterModel } from '@/features/support/supporter.model';

/**
 * “I have sent the transfer.” Card-to-card and crypto gifts cannot be proven by
 * the browser, so this only flags the record with the reference the supporter
 * typed in. It stays `pending` — invisible on the wall — until the owner sees the
 * money and confirms it in the dashboard.
 */

export const dynamic = 'force-dynamic';

export const POST = async (request: Request, { params }: { params: Promise<{ lang: string }> }) => {
  const { lang } = await params;
  const parsedLang = langSchema.safeParse(lang);
  if (!parsedLang.success) return apiError('Unsupported language. Use "fa" or "en".', 400);

  const limited = rateLimit(`support-confirm:${clientIp(request)}`, 12, 5 * 60 * 1000);
  if (!limited.ok) return apiError('Too many attempts. Please wait a moment and try again.', 429);

  const parsed = await parseBody(supporterConfirmSchema, request);
  if (!parsed.ok) return parsed.response;

  if (!(await tryConnectDB())) return apiError('Support is unavailable right now.', 503);

  const updated = await supporterModel.findOneAndUpdate(
    { _id: parsed.data.orderId, lang: parsedLang.data, status: 'pending' },
    // The reference is what the owner matches against their bank statement; the
    // record stays pending, which is itself the “supporter declared it” marker.
    { reference: parsed.data.reference || undefined },
    { new: true }
  );

  if (!updated) return apiError('This support record is no longer open.', 404);

  return apiJson({ data: { orderId: String(updated._id), status: updated.status } });
};
