import { tryConnectDB } from '@/config/dbConnection';
import { certificateModel } from '@/features/certificate/model';
import { serializeList } from '@/lib/serialize';
import type { AppLocale } from '@/types';
import type { ICertificate } from '@/features/certificate/types';

/**
 * `.lean()` hands back stored documents as they are, so a credential written
 * outside the dashboard can be missing the flag the schema defaults. The résumé
 * and the dashboard row both read `featured` directly, so it is filled in here
 * rather than at each of the three places that would otherwise have to guess.
 */
export function normalizeCertificate(input: unknown): ICertificate {
  const certificate = (input ?? {}) as ICertificate;
  return { ...certificate, featured: Boolean(certificate.featured) };
}

/**
 * Every credential for a locale, most recently issued first.
 *
 * The dates are stored per locale — Jalali on `/fa`, Gregorian on `/en` — and both
 * sort correctly as `YYYY/MM` strings, so one ordering serves the two sites. A
 * record with no issue date at all falls to the end instead of leading the list.
 */
export async function getCertificates(locale: AppLocale): Promise<ICertificate[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await certificateModel.find({ lang: locale }).sort({ issueDate: -1, createdAt: -1 }).lean();
  return serializeList<ICertificate>(docs as Record<string, unknown>[]).map(normalizeCertificate);
}
