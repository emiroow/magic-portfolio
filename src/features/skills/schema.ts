import { z } from 'zod';

export const skillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export type SkillInput = z.infer<typeof skillSchema>;
