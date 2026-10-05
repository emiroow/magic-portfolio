import { optionalString, optionalUrl } from '@/lib/validations';
import { z } from 'zod';

export const educationSchema = z.object({
  school: z.string().min(1, 'School is required'),
  href: optionalUrl(),
  degree: optionalString(),
  logoUrl: optionalUrl(),
  start: optionalString(),
  end: optionalString(),
});

export type EducationInput = z.infer<typeof educationSchema>;
