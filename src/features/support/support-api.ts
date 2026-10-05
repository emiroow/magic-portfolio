'use client';

import type { SupportCheckoutResult } from '@/features/support/types';

/**
 * Fetch helper for the public support endpoints.
 *
 * The dashboard wrapper (`client-api`) is deliberately not used here: it redirects
 * to the sign-in page on a 401, which would be nonsense for a supporter who has no
 * account. This one keeps the error `code` so the dialog can translate the
 * failure instead of showing the server's English sentence.
 */

export class SupportApiError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'SupportApiError';
    this.code = code;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new SupportApiError('The request did not reach the site.', 'network');
  }

  const payload = (await res.json().catch(() => ({}))) as { data?: T; error?: string; code?: string };

  if (!res.ok) {
    throw new SupportApiError(payload.error || `Request failed with status ${res.status}`, payload.code || 'generic');
  }

  return payload.data as T;
}

export const supportApi = {
  /** Record the gift and get back whatever the visitor must do next. */
  checkout: <T = SupportCheckoutResult>(locale: string, body: unknown) => post<T>(`/api/${locale}/support/checkout`, body),
  /** “I have sent the transfer” for card-to-card and crypto gifts. */
  confirm: (locale: string, body: { orderId: string; reference?: string }) =>
    post<{ orderId: string; status: string }>(`/api/${locale}/support/confirm`, body),
};
