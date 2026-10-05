import { getServerAuthSession } from '@/features/auth/config';
import type { z } from 'zod';

/** Shared route-handler helpers: JSON envelopes, admin guard and body validation. */

/** Successful JSON response. */
export function apiJson<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}

/** Error JSON response with a stable `{ error }` shape. */
export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return Response.json({ error: message, ...extra }, { status });
}

/** 401 when the caller has no valid admin session. */
export async function requireAdmin() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return { ok: false as const, response: apiError('Unauthorized', 401) };
  }
  return { ok: true as const, session };
}

/** Parse/validate a JSON body against a zod schema; returns `{ data }` or a 400/422 response. */
export async function parseBody<S extends z.ZodTypeAny>(
  schema: S,
  request: Request
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: Response }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: apiError('Invalid JSON body') };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, response: apiError('Validation failed', 422, { fields: result.error.flatten().fieldErrors }) };
  }
  return { ok: true, data: result.data };
}
