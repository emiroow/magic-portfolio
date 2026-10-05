import { profileModel } from '@/features/profile/model';
import { withBothLangs, type Persona } from '@/seed/personas/types';

/** The persona's owner profile — one document per locale. Returns the inserted count. */
export const seedUserData = async (persona: Persona) => {
  const inserted = await profileModel.insertMany(withBothLangs(persona.profile));
  return inserted.length;
};
