import { tryConnectDB } from '@/config/dbConnection';
import { educationModel } from '@/features/education/model';
import { profileModel } from '@/features/profile/model';
import { projectModel } from '@/features/projects/model';
import { skillModel } from '@/features/skills/model';
import { socialModel } from '@/features/socials/model';
import { workModel } from '@/features/experience/model';
import { serialize, serializeList } from '@/lib/serialize';
import { normalizeProfile } from '@/features/profile/queries';
import type { AppLocale } from '@/types';
import type { IEducation } from '@/features/education/types';
import type { IProfile } from '@/features/profile/types';
import type { IProject } from '@/features/projects/types';
import type { ISkill } from '@/features/skills/types';
import type { ISocial } from '@/features/socials/types';
import type { IWork } from '@/features/experience/types';

/** Cross-domain read behind the public home page and `/api/[lang]`. */

export interface PortfolioData {
  profile: IProfile | null;
  projects: IProject[];
  works: IWork[];
  educations: IEducation[];
  skills: ISkill[];
  socials: ISocial[];
}

const EMPTY_PORTFOLIO: PortfolioData = {
  profile: null,
  projects: [],
  works: [],
  educations: [],
  skills: [],
  socials: [],
};

/** Load every public home-page section in one call (empty when DB unavailable). */
export async function getPortfolioData(locale: AppLocale): Promise<PortfolioData> {
  if (!(await tryConnectDB())) return EMPTY_PORTFOLIO;

  const [profile, projects, works, educations, skills, socials] = await Promise.all([
    profileModel.findOne({ lang: locale }).lean(),
    projectModel.find({ lang: locale }).sort({ createdAt: -1 }).lean(),
    workModel.find({ lang: locale }).sort({ start: -1 }).lean(),
    educationModel.find({ lang: locale }).sort({ start: -1 }).lean(),
    skillModel.find({ lang: locale }).sort({ name: 1 }).lean(),
    socialModel.find({ lang: locale }).lean(),
  ]);

  return {
    profile: normalizeProfile(serialize<IProfile>(profile as Record<string, unknown> | null)),
    projects: serializeList<IProject>(projects as Record<string, unknown>[]),
    works: serializeList<IWork>(works as Record<string, unknown>[]),
    educations: serializeList<IEducation>(educations as Record<string, unknown>[]),
    skills: serializeList<ISkill>(skills as Record<string, unknown>[]),
    socials: serializeList<ISocial>(socials as Record<string, unknown>[]),
  };
}
