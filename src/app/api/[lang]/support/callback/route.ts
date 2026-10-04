import { tryConnectDB } from '@/config/dbConnection';
import { captureGatewayPayment, externalIdFromParams, gatewayFromParams, rejectedByGateway } from '@/lib/payments';
import { donationModel } from '@/models/donation';
import { supporterModel } from '@/models/supporter';
import { langSchema, objectIdSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import type { GatewayId, ISupporter } from '@/types';

/**
 * The gateway's return trip.
 *
 * A redirect back to the site proves nothing on its own, so the money is only
 * called paid after this handler verifies the transaction with the gateway
 * server-to-server. A record already marked completed short-circuits, so a
 * refreshed or replayed callback can never double-count a gift.
 */

export const dynamic = 'force-dynamic';

type Outcome = 'success' | 'failed' | 'cancelled' | 'error';

/** `.lean()` hands back stored fields untyped, like everywhere else in the data layer. */
type Lean<T> = T | null;

export const GET = async (request: Request, { params }: { params: Promise<{ lang: string }> }) => {
  const { lang } = await params;
  const parsedLang = langSchema.safeParse(lang);
  if (!parsedLang.success) return NextResponse.redirect(new URL('/en', request.url));

  const search = new URL(request.url).searchParams;
  const back = (outcome: Outcome) => {
    // Any outcome changes either the wall or the “try again” hint on the page.
    revalidatePath(`/${parsedLang.data}/support`);
    return NextResponse.redirect(new URL(`/${parsedLang.data}/support?status=${outcome}`, request.url));
  };

  const orderId = search.get('order') || search.get('order_id') || '';
  const parsedId = objectIdSchema.safeParse(orderId);
  if (!parsedId.success) return back('error');

  if (!(await tryConnectDB())) return back('error');

  const record = (await supporterModel.findOne({ _id: parsedId.data, lang: parsedLang.data }).lean()) as Lean<ISupporter>;
  if (!record) return back('error');
  if (record.status === 'completed') return back('success');
  if (record.status !== 'pending') return back('error');

  // Which gateway to verify against: the option says, the callback's own shape says.
  let gateway = gatewayFromParams(search);
  if (record.donationId) {
    const option = (await donationModel.findOne({ _id: record.donationId }).select({ gateway: 1 }).lean()) as Lean<{
      gateway?: string;
    }>;
    if (option?.gateway) gateway = option.gateway as GatewayId;
  }
  if (!gateway) return back('error');

  // The supporter turned back on the gateway page: there is nothing to verify.
  if (rejectedByGateway(search)) {
    await supporterModel.updateOne({ _id: record._id }, { status: 'cancelled' });
    return back('cancelled');
  }

  const externalId = externalIdFromParams(gateway, search) || record.externalId || '';
  const outcome = await captureGatewayPayment(gateway, externalId, record).catch(error => {
    console.error('[api/support/callback] verification failed:', error);
    return { status: 'failed' as const, message: 'The verification call to the gateway failed' };
  });

  if (outcome.status === 'completed') {
    await supporterModel.updateOne({ _id: record._id }, { status: 'completed', reference: outcome.reference || externalId });
    return back('success');
  }

  await supporterModel.updateOne({ _id: record._id }, {
    status: outcome.status,
    reference: 'reference' in outcome ? outcome.reference : undefined,
    note: outcome.status === 'failed' ? outcome.message : undefined,
  });
  return back(outcome.status === 'cancelled' ? 'cancelled' : 'failed');
};
