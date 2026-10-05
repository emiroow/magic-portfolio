import { tryConnectDB } from '@/config/dbConnection';
import { projectModel } from '@/features/projects/model';
import { byLocaleOrder, serialize, serializeList } from '@/lib/serialize';
import type { AppLocale } from '@/types';
import type { IProject } from '@/features/projects/types';
import mongoose from 'mongoose';

/** Active projects for a locale, newest first. */
export async function getProjects(locale: AppLocale): Promise<IProject[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await projectModel.find({ lang: locale, active: true }).sort({ createdAt: -1 }).lean();
  return serializeList<IProject>(docs as Record<string, unknown>[]);
}

/**
 * One project by its slug, or by id for records seeded before slugs existed.
 * Only active projects are public.
 */
export async function getProjectByKey(locale: AppLocale, key: string): Promise<IProject | null> {
  if (!(await tryConnectDB())) return null;

  const byKey = key.trim();
  const or: Record<string, unknown>[] = [{ slug: byKey }];
  if (mongoose.isValidObjectId(byKey)) or.push({ _id: byKey });

  const doc = await projectModel.findOne({ lang: locale, active: true, $or: or }).lean();
  return serialize<IProject>(doc as Record<string, unknown> | null);
}

/** Distinct technologies across the active projects, for the archive filter. */
export async function getProjectTechnologies(locale: AppLocale): Promise<string[]> {
  if (!(await tryConnectDB())) return [];

  const tags = await projectModel.distinct('technologies', { lang: locale, active: true });
  return (tags as string[]).filter(Boolean).sort(byLocaleOrder(locale));
}
