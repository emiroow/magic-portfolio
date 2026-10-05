import { workModel } from '@/features/experience/model';
import { withBothLangs, type Persona } from '@/seed/personas/types';

/** Career history, newest role first, both locales. Returns the inserted count. */
export const seedWorkData = async (persona: Persona) => {
  const inserted = await workModel.insertMany(withBothLangs(persona.works));
  return inserted.length;
};
