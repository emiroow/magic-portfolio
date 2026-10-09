import { tryConnectDB } from '@/config/dbConnection';
import { projectModel } from '@/features/projects/model';
import { byLocaleOrder, serialize, serializeList } from '@/lib/serialize';
import { galleryUrls } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IProject } from '@/features/projects/types';
import mongoose from 'mongoose';

/**
 * A `.lean()` document carries whatever a record was saved with, so the gallery is
 * settled here: a legacy entry with only a cover becomes a one-picture list, and a
 * record written with only `images` gets its cover back for the cards and the
 * structured data. Every public read passes through this, so no surface has to
 * repeat the rule.
 */
function normalizeProject(project: IProject): IProject {
  const images = galleryUrls(project);
  return { ...project, images, image: images[0] ?? '', technologies: project.technologies ?? [], links: project.links ?? [] };
}

/** Active projects for a locale, newest first. */
export async function getProjects(locale: AppLocale): Promise<IProject[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await projectModel.find({ lang: locale, active: true }).sort({ createdAt: -1 }).lean();
  return serializeList<IProject>(docs as Record<string, unknown>[]).map(normalizeProject);
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
  const project = serialize<IProject>(doc as Record<string, unknown> | null);
  return project ? normalizeProject(project) : null;
}

/** Distinct technologies across the active projects, for the archive filter. */
export async function getProjectTechnologies(locale: AppLocale): Promise<string[]> {
  if (!(await tryConnectDB())) return [];

  const tags = await projectModel.distinct('technologies', { lang: locale, active: true });
  return (tags as string[]).filter(Boolean).sort(byLocaleOrder(locale));
}
