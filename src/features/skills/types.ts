import type { AppLocale } from '@/types';

/** Skill badge on the toolkit list. */
export interface ISkill {
  _id?: string;
  name: string;
  /** Icon slug resolved by `iconDecider`; a skill without one renders as a plain pill. */
  icon?: string;
  /** Display priority, smallest first; records saved before it existed sort as 0. */
  order?: number;
  lang: AppLocale;
}
