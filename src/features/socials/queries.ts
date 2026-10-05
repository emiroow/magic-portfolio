import { tryConnectDB } from '@/config/dbConnection';
import { socialModel } from '@/features/socials/model';
import { serializeList } from '@/lib/serialize';
import type { AppLocale } from '@/types';
import type { ISocial } from '@/features/socials/types';

/** Social links (used by the floating dock on every public page). */
export async function getSocials(locale: AppLocale): Promise<ISocial[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await socialModel.find({ lang: locale }).lean();
  return serializeList<ISocial>(docs as Record<string, unknown>[]);
}
