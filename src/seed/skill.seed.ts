import { skillModel } from '@/features/skills/model';
import { rankSkills, withBothLangs, type Persona } from '@/seed/personas/types';

/**
 * Toolkit badges, localised per persona (a designer's list reads differently from an
 * engineer's) and ranked in the order the persona authored them, so the first badge is
 * what the owner would name first rather than whatever the alphabet put there.
 */
export const seedSkillsData = async (persona: Persona) => {
  const inserted = await skillModel.insertMany(withBothLangs(rankSkills(persona.skills)));
  return inserted.length;
};
