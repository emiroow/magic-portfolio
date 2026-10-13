import { tryConnectDB } from '@/config/dbConnection';
import { hasPosts } from '@/features/blog/queries';
import { educationModel } from '@/features/education/model';
import { getCertificates } from '@/features/certificate/queries';
import { profileModel } from '@/features/profile/model';
import { hasProducts } from '@/features/products/queries';
import { projectModel } from '@/features/projects/model';
import { hasProjects } from '@/features/projects/queries';
import { skillModel } from '@/features/skills/model';
import { socialModel } from '@/features/socials/model';
import { hasDonations } from '@/features/support/queries';
import { workModel } from '@/features/experience/model';
import { serialize, serializeList } from '@/lib/serialize';
import { normalizeProfile } from '@/features/profile/queries';
import type { SectionAvailability } from '@/constants/global';
import type { AppLocale } from '@/types';
import type { ICertificate } from '@/features/certificate/types';
import type { IEducation } from '@/features/education/types';
import type { IProfile } from '@/features/profile/types';
import type { IProject } from '@/features/projects/types';
import type { ISkill } from '@/features/skills/types';
import type { ISocial } from '@/features/socials/types';
import type { IWork } from '@/features/experience/types';

/** Cross-domain reads behind the public home page, the dock and `/api/[lang]`. */

export interface PortfolioData {
  profile: IProfile | null;
  projects: IProject[];
  works: IWork[];
  educations: IEducation[];
  certificates: ICertificate[];
  skills: ISkill[];
  socials: ISocial[];
}

const EMPTY_PORTFOLIO: PortfolioData = {
  profile: null,
  projects: [],
  works: [],
  educations: [],
  certificates: [],
  skills: [],
  socials: [],
};

/** What the dock lists when there is no database to ask: the home page, and nothing else. */
const NOTHING_AVAILABLE: SectionAvailability = { '/products': false, '/projects': false, '/blog': false, '/support': false };

/** Load every public home-page section in one call (empty when DB unavailable). */
export async function getPortfolioData(locale: AppLocale): Promise<PortfolioData> {
  if (!(await tryConnectDB())) return EMPTY_PORTFOLIO;

  const [profile, projects, works, educations, certificates, skills, socials] = await Promise.all([
    profileModel.findOne({ lang: locale }).lean(),
    projectModel.find({ lang: locale }).sort({ createdAt: -1 }).lean(),
    workModel.find({ lang: locale }).sort({ start: -1 }).lean(),
    educationModel.find({ lang: locale }).sort({ start: -1 }).lean(),
    getCertificates(locale),
    // Owner-set priority first, then the alphabet; the dashboard's arrows write the same rank.
    skillModel.find({ lang: locale }).sort({ order: 1, name: 1 }).lean(),
    socialModel.find({ lang: locale }).lean(),
  ]);

  return {
    profile: normalizeProfile(serialize<IProfile>(profile as Record<string, unknown> | null)),
    projects: serializeList<IProject>(projects as Record<string, unknown>[]),
    works: serializeList<IWork>(works as Record<string, unknown>[]),
    educations: serializeList<IEducation>(educations as Record<string, unknown>[]),
    certificates,
    skills: serializeList<ISkill>(skills as Record<string, unknown>[]),
    socials: serializeList<ISocial>(socials as Record<string, unknown>[]),
  };
}

/**
 * Which of the dock's archives hold content for a locale.
 *
 * The dock sits on every public page, so the question is answered once here instead of
 * page by page: an archive with nothing in it is no destination to offer a reader, and a
 * single source keeps the two from ever disagreeing about which ones are open.
 *
 * Each answer is the existence check of the list its page renders, so a draft post, an
 * inactive record or a support method with no usable destination counts as nothing.
 */
export async function getSectionAvailability(locale: AppLocale): Promise<SectionAvailability> {
  // Asked once here rather than per helper, so a database that is down costs one failed
  // connection and one log line instead of four.
  if (!(await tryConnectDB())) return NOTHING_AVAILABLE;

  const [products, projects, blog, support] = await Promise.all([
    hasProducts(locale),
    hasProjects(locale),
    hasPosts(locale),
    hasDonations(locale),
  ]);

  return { '/products': products, '/projects': projects, '/blog': blog, '/support': support };
}
