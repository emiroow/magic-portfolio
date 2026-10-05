import { GATEWAY_CURRENCIES } from '@/features/support/constants';
import type { GatewayId, ISupporter } from '@/features/support/types';
import type { ProductCurrency } from '@/types';

/**
 * Gateway adapters for the in-site `gateway` checkout mode.
 *
 * Every call is server-to-server and uses plain `fetch`, so the site needs no
 * vendor SDK. The supporter is never trusted with an amount: the value charged
 * is the one this layer computes from the option the dialog resolved to, and the
 * payment is only confirmed after the gateway answers a verify request here.
 *
 * Endpoints follow each gateway's published REST API. Credentials and the base
 * URLs live in the environment (see `.env.example`) so a sandbox account can be
 * swapped without touching code.
 */

/** Every outbound call is bounded: a hanging gateway must not pin a request. */
const TIMEOUT_MS = 15_000;

const env = (key: string) => process.env[key]?.trim() || '';

/** Base URL override first, then the gateway's production default. */
const baseUrl = (key: string, fallback: string) => (env(key) || fallback).replace(/\/$/, '');

/** `true` for a gateway whose credentials are present; unconfigured ones are never offered. */
export function isGatewayConfigured(gateway: GatewayId): boolean {
  switch (gateway) {
    case 'zarinpal':
      return Boolean(env('ZARINPAL_MERCHANT_ID'));
    case 'idpay':
      return Boolean(env('IDPAY_API_TOKEN') && env('IDPAY_RESELLER_ID'));
    case 'stripe':
      return Boolean(env('STRIPE_SECRET_KEY'));
    case 'paypal':
      return Boolean(env('PAYPAL_CLIENT_ID') && env('PAYPAL_SECRET'));
  }
}

/** Gateways this deployment can actually charge through, in the listed order. */
export function configuredGateways(): GatewayId[] {
  return (Object.keys(GATEWAY_CURRENCIES) as GatewayId[]).filter(isGatewayConfigured);
}

/** Whether the gateway settles in this currency at all. */
export function gatewaySupports(gateway: GatewayId, currency: ProductCurrency): boolean {
  return GATEWAY_CURRENCIES[gateway].includes(currency);
}

/**
 * Amount in rial. The Iranian rails quote in rial and the dashboard stores
 * تومان, so the ten-fold step happens here and nowhere else. Anything else is a
 * configuration mistake, and guessing an exchange rate is not on offer.
 */
export function toRial(amount: number, currency: ProductCurrency): number {
  if (currency === 'toman') return Math.round(amount * 10);
  if (currency === 'rial') return Math.round(amount);
  throw new Error(`[payments] ${currency} cannot settle through an Iranian gateway`);
}

/** Amount in minor units (cents); only reached for the hard currencies a gateway accepts. */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/** Hard-currency gateways quote in `USD`/`EUR` only. */
function toPayPalCurrency(currency: ProductCurrency): string {
  return currency === 'eur' ? 'EUR' : 'USD';
}

async function request(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
}

async function form(body: Record<string, string | number | undefined>, init: RequestInit & { url: string }): Promise<Response> {
  const params = new URLSearchParams();
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });

  return request(init.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...init.headers },
    body: params.toString(),
  });
}

/** A gateway session: where to send the supporter, and the id that ties the callback back. */
export interface GatewaySession {
  redirectUrl: string;
  externalId: string;
}

export interface PaymentRequest {
  /** Site-side record id, echoed to the gateway so the callback can find it. */
  orderId: string;
  amount: number;
  currency: ProductCurrency;
  description: string;
  /** Where the gateway sends the supporter back to. */
  callbackUrl: string;
  email?: string;
  phone?: string;
}

export type CaptureOutcome =
  { status: 'completed'; reference?: string } | { status: 'cancelled'; reference?: string } | { status: 'failed'; message?: string };

/* ---------------------------------- ZarinPal --------------------------------- */

/**
 * ZarinPal v4: `request.json` mints an `authority`, the supporter pays on
 * ZarinPal's page, then `verify.json` confirms it. Verifying is what makes the
 * money real — the redirect alone proves nothing.
 */
async function createZarinpal(payment: PaymentRequest): Promise<GatewaySession> {
  const merchantId = env('ZARINPAL_MERCHANT_ID');
  const sandbox = env('ZARINPAL_SANDBOX') === 'true';
  const apiBase = baseUrl('ZARINPAL_API_BASE', sandbox ? 'https://sandbox.zarinpal.com' : 'https://api.zarinpal.com');
  const payBase = baseUrl('ZARINPAL_PAY_BASE', sandbox ? 'https://sandbox.zarinpal.com/pg/StartPay' : 'https://www.zarinpal.com/pg/StartPay');

  const response = await request(`${apiBase}/pg/v4/payment/request.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: toRial(payment.amount, payment.currency),
      description: payment.description,
      email: payment.email || undefined,
      mobile: payment.phone || undefined,
      callback_url: payment.callbackUrl,
      is_from_buyer_account_id: undefined,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: { authority?: string };
    errors?: unknown;
  };

  const authority = payload.data?.authority;
  if (!authority) {
    throw new Error('[zarinpal] payment request rejected');
  }

  return { redirectUrl: `${payBase}/${authority}`, externalId: authority };
}

async function captureZarinpal(authority: string, payment: { amount: number; currency: ProductCurrency }): Promise<CaptureOutcome> {
  const merchantId = env('ZARINPAL_MERCHANT_ID');
  const sandbox = env('ZARINPAL_SANDBOX') === 'true';
  const apiBase = baseUrl('ZARINPAL_API_BASE', sandbox ? 'https://sandbox.zarinpal.com' : 'https://api.zarinpal.com');

  const response = await request(`${apiBase}/pg/v4/payment/verify.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchant_id: merchantId, authority, amount: toRial(payment.amount, payment.currency) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: { code?: number; card_pan_masked?: string; tracking_code?: number };
    errors?: { code?: number };
  };

  // ZarinPal keeps its own result codes in `data.code`: 100 and 101 are paid.
  const code = payload.data?.code;
  if (code === 100 || code === 101) {
    return { status: 'completed', reference: String(payload.data?.tracking_code ?? authority) };
  }

  return { status: 'failed', message: `ZarinPal code ${code ?? payload.errors?.code ?? 'unknown'}` };
}

/* ----------------------------------- IDPay ---------------------------------- */

/**
 * IDPay's REST rails: a purchase request returns a token that carries the
 * supporter to the payment page, and the token is verified afterwards.
 */
async function createIdpay(payment: PaymentRequest): Promise<GatewaySession> {
  const apiBase = baseUrl('IDPAY_API_BASE', 'https://idpay.ir');
  const token = env('IDPAY_API_TOKEN');
  const resellerId = env('IDPAY_RESELLER_ID');

  const response = await form(
    {
      amount: toRial(payment.amount, payment.currency),
      name: payment.description.slice(0, 30),
      description: payment.description,
      resellerId,
      redirect: payment.callbackUrl,
      returnUrl: payment.callbackUrl,
      callback: payment.callbackUrl,
    },
    { url: `${apiBase}/pws/rest/secure-purchase-request/`, headers: { Authorization: `Bearer ${token}` } }
  );

  const payload = (await response.json().catch(() => ({}))) as { token?: string; error?: number | string };

  if (!payload.token) throw new Error('[idpay] purchase request rejected');

  return { redirectUrl: `${apiBase}/pws/insecure/pay/${payload.token}`, externalId: payload.token };
}

async function captureIdpay(token: string): Promise<CaptureOutcome> {
  const apiBase = baseUrl('IDPAY_API_BASE', 'https://idpay.ir');

  const response = await form(
    { token },
    { url: `${apiBase}/pws/rest/secure-purchase-verify/`, headers: { Authorization: `Bearer ${env('IDPAY_API_TOKEN')}` } }
  );
  const payload = (await response.json().catch(() => ({}))) as {
    isVerified?: boolean | string;
    isCompleted?: boolean | string;
    orderTransferId?: string;
    error?: number | string;
  };

  const verified = payload.isVerified === true || payload.isVerified === 'true';
  const completed = payload.isCompleted === true || payload.isCompleted === 'true';

  if (verified && completed) return { status: 'completed', reference: payload.orderTransferId ?? token };
  return { status: 'failed', message: `IDPay error ${payload.error ?? 'unverified'}` };
}

/* ---------------------------------- Stripe ---------------------------------- */

/**
 * Stripe Checkout as a hosted redirect: `price_data` is built inline so the
 * account needs no pre-created products, and `client_reference_id` ties the
 * session back to the support record.
 */
async function createStripe(payment: PaymentRequest): Promise<GatewaySession> {
  const apiBase = baseUrl('STRIPE_API_BASE', 'https://api.stripe.com');
  const currency = payment.currency === 'eur' ? 'eur' : 'usd';

  const response = await form(
    {
      mode: 'payment',
      client_reference_id: payment.orderId,
      success_url: `${payment.callbackUrl}?status=success&order_id=${payment.orderId}`,
      cancel_url: `${payment.callbackUrl}?status=cancelled&order_id=${payment.orderId}`,
      'line_items[0][quantity]': 1,
      'line_items[0][price_data][currency]': currency,
      'line_items[0][price_data][unit_amount]': toMinorUnits(payment.amount),
      'line_items[0][price_data][product_data][name]': payment.description,
      'metadata[order_id]': payment.orderId,
    },
    { url: `${apiBase}/v1/checkout/sessions`, headers: { Authorization: `Bearer ${env('STRIPE_SECRET_KEY')}` } }
  );

  const payload = (await response.json().catch(() => ({}))) as { id?: string; url?: string; error?: { message?: string } };

  if (!payload.id || !payload.url) throw new Error(payload.error?.message || '[stripe] session creation failed');

  return { redirectUrl: payload.url, externalId: payload.id };
}

async function captureStripe(sessionId: string): Promise<CaptureOutcome> {
  const apiBase = baseUrl('STRIPE_API_BASE', 'https://api.stripe.com');

  const response = await request(`${apiBase}/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${env('STRIPE_SECRET_KEY')}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as { payment_status?: string; amount_total?: number };

  if (payload.payment_status === 'paid') return { status: 'completed', reference: String(payload.amount_total ?? sessionId) };
  return { status: 'failed', message: `Stripe ${payload.payment_status ?? 'unknown'}` };
}

/* ---------------------------------- PayPal ---------------------------------- */

const paypalBase = () => baseUrl('PAYPAL_API_BASE', env('PAYPAL_ENV') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

async function paypalToken(): Promise<string> {
  const credentials = btoa(`${env('PAYPAL_CLIENT_ID')}:${env('PAYPAL_SECRET')}`);

  const response = await form(
    { grant_type: 'client_credentials' },
    {
      url: `${paypalBase()}/v1/oauth2/token`,
      headers: { Authorization: `Basic ${credentials}` },
    }
  );
  const payload = (await response.json().catch(() => ({}))) as { access_token?: string };

  if (!payload.access_token) throw new Error('[paypal] credential exchange failed');
  return payload.access_token;
}

async function createPaypal(payment: PaymentRequest): Promise<GatewaySession> {
  const access = await paypalToken();

  const response = await request(`${paypalBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: payment.orderId,
          description: payment.description,
          amount: {
            currency_code: toPayPalCurrency(payment.currency),
            value: (payment.amount ?? 0).toFixed(2),
          },
        },
      ],
      application_context: {
        user_action: 'PAY_NOW',
        return_url: `${payment.callbackUrl}?status=success&order_id=${payment.orderId}`,
        cancel_url: `${payment.callbackUrl}?status=cancelled&order_id=${payment.orderId}`,
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    links?: { rel?: string; href?: string }[];
    message?: string;
  };

  const approve = payload.links?.find(link => link.rel === 'approve')?.href;
  if (!payload.id || !approve) throw new Error(payload.message || '[paypal] order creation failed');

  return { redirectUrl: approve, externalId: payload.id };
}

async function capturePaypal(orderId: string): Promise<CaptureOutcome> {
  const access = await paypalToken();

  const response = await request(`${paypalBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    status?: string;
    purchase_units?: { payments?: { captures?: { id?: string; status?: string }[] } }[];
    message?: string;
  };

  const capture = payload.purchase_units?.[0]?.payments?.captures?.[0];
  if (payload.status === 'COMPLETED') return { status: 'completed', reference: capture?.id ?? orderId };

  return { status: 'failed', message: payload.message || `PayPal ${payload.status ?? 'unknown'}` };
}

/* --------------------------------- Facade ---------------------------------- */

/** Send the supporter to the gateway's own page. Throws when the gateway refuses. */
export async function createGatewaySession(gateway: GatewayId, payment: PaymentRequest): Promise<GatewaySession> {
  if (!isGatewayConfigured(gateway)) throw new Error(`[payments] ${gateway} is not configured`);
  if (!gatewaySupports(gateway, payment.currency)) throw new Error(`[payments] ${gateway} cannot charge ${payment.currency}`);

  switch (gateway) {
    case 'zarinpal':
      return createZarinpal(payment);
    case 'idpay':
      return createIdpay(payment);
    case 'stripe':
      return createStripe(payment);
    case 'paypal':
      return createPaypal(payment);
  }
}

/**
 * Confirm a return trip against the gateway. `record` supplies the amount the
 * Iranian rails need to verify, so a replayed callback cannot claim a bigger sum.
 */
export async function captureGatewayPayment(
  gateway: GatewayId,
  externalId: string,
  record: Pick<ISupporter, 'amount' | 'currency'>
): Promise<CaptureOutcome> {
  if (!externalId) return { status: 'failed', message: 'Missing gateway reference' };

  switch (gateway) {
    case 'zarinpal':
      return captureZarinpal(externalId, record);
    case 'idpay':
      return captureIdpay(externalId);
    case 'stripe':
      return captureStripe(externalId);
    case 'paypal':
      return capturePaypal(externalId);
  }
}

/** The gateway a callback belongs to, from its tell-tale query parameters. */
export function gatewayFromParams(params: URLSearchParams): GatewayId | null {
  const declared = params.get('gateway') as GatewayId | null;
  if (declared && (Object.keys(GATEWAY_CURRENCIES) as GatewayId[]).includes(declared)) return declared;

  if (params.get('Authority') || params.get('authority')) return 'zarinpal';
  if (params.get('session_id')) return 'stripe';
  if (params.get('PayerID')) return 'paypal';
  if (params.get('token') || params.get('transfer_id')) return 'idpay';

  return null;
}

/** The gateway-side id carried by the return trip. */
export function externalIdFromParams(gateway: GatewayId, params: URLSearchParams): string {
  switch (gateway) {
    case 'zarinpal':
      return params.get('Authority') || params.get('authority') || '';
    case 'stripe':
      return params.get('session_id') || '';
    case 'paypal':
      return params.get('token') || '';
    case 'idpay':
      return params.get('token') || params.get('transfer_id') || '';
  }
}

/** A `FAIL`/`CANCEL` status from the Iranian rails, before any verification call. */
export function rejectedByGateway(params: URLSearchParams): boolean {
  const status = (params.get('Status') || params.get('status') || '').toUpperCase();
  return status === 'FAIL' || status === 'CANCEL' || status === 'CANCELED' || status === 'CANCELLED';
}
