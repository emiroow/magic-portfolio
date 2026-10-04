/**
 * Small in-process sliding-window limiter for the public support endpoints.
 *
 * The gift forms are the only write surfaces the public site exposes, so they are
 * the ones a script would hammer. This is a per-instance guard — enough for a
 * single deployment on Vercel, and it fails open rather than blocking real
 * supporters if the process is recycled.
 */

interface Window {
  hits: number[];
}

const buckets = new Map<string, Window>();

/** Entries older than this are dropped, so the map cannot grow without bound. */
const SWEEP_AFTER = 500;

function sweep(now: number, windowMs: number) {
  if (buckets.size < SWEEP_AFTER) return;
  for (const [key, bucket] of buckets) {
    const live = bucket.hits.filter(hit => now - hit < windowMs);
    if (live.length) bucket.hits = live;
    else buckets.delete(key);
  }
}

export interface RateResult {
  ok: boolean;
  /** Seconds the caller should wait before trying again. */
  retryAfter: number;
}

/** Allow `limit` hits per `windowMs` for one key (route + IP). */
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  sweep(now, windowMs);

  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter(hit => now - hit < windowMs);

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    const oldest = bucket.hits[0] ?? now;
    return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)) };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfter: 0 };
}

/** Best-effort visitor identity behind a proxy: the first forwarded IP, else the socket. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
