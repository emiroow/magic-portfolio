import { optionalImagePath, optionalString, optionalUrl } from '@/lib/validations';
import { z } from 'zod';

export const workSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  href: optionalUrl(),
  location: optionalString(),
  title: optionalString(),
  logoUrl: optionalImagePath(),
  start: optionalString(),
  end: optionalString(),
  description: optionalString(),
});

export type WorkInput = z.infer<typeof workSchema>;
