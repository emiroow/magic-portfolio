import { educationModel } from '@/features/education/model';
import { withBothLangs, type Persona } from '@/seed/personas/types';

/** Study history — degrees, or a degree plus a certification for a designer. */
export const seedEducationData = async (persona: Persona) => {
  const inserted = await educationModel.insertMany(withBothLangs(persona.educations));
  return inserted.length;
};
