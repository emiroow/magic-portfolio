import { tryConnectDB } from '@/config/dbConnection';
import { profileModel } from '@/features/profile/model';
import { serialize } from '@/lib/serialize';
import type { AppLocale } from '@/types';
import type { IProfile } from '@/features/profile/types';

/** Profile document only (used by metadata/OG generation). */
export async function getProfile(locale: AppLocale): Promise<IProfile | null> {
  if (!(await tryConnectDB())) return null;

  const doc = await profileModel.findOne({ lang: locale }).lean();
  return normalizeProfile(serialize<IProfile>(doc as Record<string, unknown> | null));
}

/** Strip legacy `?cb=` cache-buster cruft from stored URLs. */
function cleanUrl(url?: string) {
  return url ? url.split('?')[0] : url;
}

/** Defensive cleanup for stored profile documents. */
export function normalizeProfile(profile: IProfile | null): IProfile | null {
  if (!profile) return null;
  return { ...profile, avatarUrl: cleanUrl(profile.avatarUrl) };
}
