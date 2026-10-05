import { apiError, apiJson, parseBody } from '@/lib/api';
import { tryConnectDB } from '@/config/dbConnection';
import { getDonations } from '@/lib/data';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { cardQrPayload, cryptoQrPayload, qrDataUrl } from '@/lib/qr';
import { createGatewaySession, gatewaySupports, isGatewayConfigured } from '@/lib/payments';
import { resolveVariant, variantCurrency, variantName, variantRegion } from '@/lib/support';
import { langSchema, supporterSubmitSchema } from '@/lib/validations';
import { supporterModel } from '@/models/supporter';
import { site } from '@/lib/seo';
import { revalidatePath } from 'next/cache';
import type { GatewayId, IDonation, SupportCheckoutResult } from '@/types';

/**
 * Public checkout: one endpoint for every payment method. It records the gift, then
 * answers with what the wizard should do — leave for a platform, show a transfer
 * screen, or hand the supporter to a gateway.
 *
 * Nothing here trusts the browser: the method is re-read from the database, the
 * destination is resolved from the stored list by its key, the amount is checked
 * against the method's own bounds, and the currency is the destination's, never the
 * request's.
 */

export const dynamic = 'force-dynamic';

/** Six starts per five minutes per address; enough for a real back-and-forth. */
const LIMIT = 6;
const WINDOW_MS = 5 * 60 * 1000;

/**
 * Decide the amount that will actually be charged.
 * Returns a stable code so the wizard can say it in the visitor's own language.
 */
function resolveAmount(method: IDonation, requested: number): { amount: number } | { code: string; message: string } {
  // A fixed-price method only ever takes its own price.
  if (!method.customAmount) {
    const accepted = method.amount > 0 ? [method.amount] : method.suggestedAmounts;
    if (accepted.includes(requested)) return { amount: requested };
    return { code: 'fixed', message: 'This method has a fixed amount.' };
  }

  if (method.minAmount > 0 && requested < method.minAmount) {
    return { code: 'min', message: 'The amount is below the minimum for this method.' };
  }
  if (method.maxAmount > 0 && requested > method.maxAmount) {
    return { code: 'max', message: 'The amount is above the maximum for this method.' };
  }

  return { amount: requested };
}

/** Where the gateway returns to. Needs the public origin, so it is checked first. */
function callbackUrl(lang: string, orderId: string): string | null {
  if (!site) return null;
  return `${site}/api/${lang}/support/callback?order=${orderId}`;
}

export const POST = async (request: Request, { params }: { params: Promise<{ lang: string }> }) => {
  const { lang } = await params;
  const parsedLang = langSchema.safeParse(lang);
  if (!parsedLang.success) return apiError('Unsupported language. Use "fa" or "en".', 400);

  const limited = rateLimit(`support:${parsedLang.data}:${clientIp(request)}`, LIMIT, WINDOW_MS);
  if (!limited.ok) {
    return apiError('Too many attempts. Please wait a moment and try again.', 429, { code: 'rateLimited', retryAfter: limited.retryAfter });
  }

  const parsed = await parseBody(supporterSubmitSchema, request);
  if (!parsed.ok) return parsed.response;

  // A filled honeypot is a bot: answer as if it worked, and store nothing.
  if (parsed.data.company) return apiJson({ data: { kind: 'external', orderId: '', url: '' } });

  if (!(await tryConnectDB())) return apiError('Support is unavailable right now.', 503, { code: 'database' });

  const body = parsed.data;
  const methods = await getDonations(parsedLang.data);

  const chosen = methods.find(item => item._id === body.donationId);
  if (!chosen) return apiError('This payment method is not available.', 404, { code: 'unavailable' });

  // The key decides the address, the page or the gateway; a request can never name
  // a destination the owner did not store.
  const variant = resolveVariant(chosen, body.variantKey);
  if (!variant) return apiError('This method has no destination set up yet.', 502, { code: 'notConfigured' });

  const amount = resolveAmount(chosen, body.amount);
  if ('code' in amount) return apiError(amount.message, 400, { code: amount.code });

  const currency = variantCurrency(chosen, variant);
  const anonymous = Boolean(body.anonymous) || !body.name;
  const record = await supporterModel.create({
    donationId: chosen._id,
    donationTitle: chosen.title,
    variantKey: variant.key,
    variantLabel: variantName(variant),
    name: anonymous ? '' : body.name,
    anonymous,
    email: body.email || undefined,
    message: body.message || undefined,
    amount: amount.amount,
    currency,
    mode: chosen.mode,
    region: variantRegion(chosen, variant),
    status: 'pending',
    reference: body.reference?.trim() || undefined,
    showOnWall: body.showOnWall !== false,
    lang: parsedLang.data,
  });

  revalidatePath(`/${parsedLang.data}/support`);

  const orderId = String(record._id);

  switch (chosen.mode) {
    case 'platform': {
      const url = (variant.href || '').trim();
      if (!url) return fail(record, 'notConfigured', 'This method has no destination configured.');
      return apiJson({ data: { kind: 'external' as const, orderId, url } }, { status: 201 });
    }

    case 'card': {
      const number = variant.number?.trim();
      const iban = variant.iban?.trim();
      if (!number && !iban) return fail(record, 'notConfigured', 'Card-to-card is not configured for this method.');

      const qr = await qrDataUrl(cardQrPayload({ number, iban, override: variant.qrPayload }));
      return apiJson(
        {
          data: {
            kind: 'instructions' as const,
            orderId,
            instruction: 'card' as const,
            qr,
            card: { number, holder: variant.holder?.trim(), iban },
          } satisfies SupportCheckoutResult,
        },
        { status: 201 }
      );
    }

    case 'crypto': {
      const address = variant.address?.trim();
      const network = variant.network;
      if (!address) return fail(record, 'notConfigured', 'No crypto destination is configured for this method.');

      const qr = await qrDataUrl(cryptoQrPayload(network, address));
      return apiJson(
        {
          data: {
            kind: 'instructions' as const,
            orderId,
            instruction: 'crypto' as const,
            qr,
            crypto: { network, address },
          } satisfies SupportCheckoutResult,
        },
        { status: 201 }
      );
    }

    case 'gateway': {
      const gateway = variant.provider as GatewayId | undefined;
      if (!gateway || !isGatewayConfigured(gateway)) return fail(record, 'gatewayUnconfigured', 'The gateway for this method is not configured.');
      if (!gatewaySupports(gateway, currency)) return fail(record, 'gatewayCurrency', 'This method currency cannot be charged through that gateway.');

      const url = callbackUrl(parsedLang.data, orderId);
      if (!url) return fail(record, 'siteUrl', 'The site address is not configured.');

      try {
        const session = await createGatewaySession(gateway, {
          orderId,
          amount: amount.amount,
          currency,
          description: `${chosen.title}${variantName(variant) ? ` · ${variantName(variant)}` : ''} — ${amount.amount.toLocaleString('en-US')}`,
          callbackUrl: url,
          email: body.email,
        });

        record.externalId = session.externalId;
        await record.save();

        return apiJson({ data: { kind: 'redirect' as const, orderId, url: session.redirectUrl } }, { status: 201 });
      } catch (error) {
        console.error('[api/support/checkout] gateway session failed:', error);
        return fail(record, 'gatewayUnconfigured', 'The gateway refused to start the payment. Please try again.');
      }
    }
  }
};

/** Close out a record the site cannot act on, so the dashboard shows why. */
async function fail(record: { _id?: unknown }, code: string, message: string) {
  try {
    await supporterModel.findOneAndUpdate({ _id: record._id }, { status: 'failed', note: message });
  } catch {
    /* the response matters more than the bookkeeping */
  }
  return apiError(message, 502, { code });
}
