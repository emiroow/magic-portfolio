import { socialModel } from '@/features/socials/model';
import { withBothLangs, type Persona } from '@/seed/personas/types';

/** Contact channels for the floating dock and the contact section. */
export const seedSocialData = async (persona: Persona) => {
  const inserted = await socialModel.insertMany(withBothLangs(persona.socials));
  return inserted.length;
};
