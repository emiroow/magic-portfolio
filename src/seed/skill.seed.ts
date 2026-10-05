import { skillModel } from '@/features/skills/model';
import { withBothLangs, type Persona } from '@/seed/personas/types';

/** Toolkit badges, localised per persona (a designer's list reads differently from an engineer's). */
export const seedSkillsData = async (persona: Persona) => {
  const inserted = await skillModel.insertMany(withBothLangs(persona.skills));
  return inserted.length;
};
