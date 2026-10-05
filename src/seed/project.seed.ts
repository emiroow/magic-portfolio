import { projectModel } from '@/features/projects/model';
import { withBothLangs, type Persona } from '@/seed/personas/types';

/**
 * Portfolio projects with long-form case studies.
 * `createdAt` comes from the persona so the archive and the home row land in a
 * sensible order, and the three `featured` ones lead the home section.
 * Returns the inserted count.
 */
export const seedProjectData = async (persona: Persona) => {
  const inserted = await projectModel.insertMany(withBothLangs(persona.projects));
  return inserted.length;
};
