import { optionalEmail, optionalString, optionalUrl } from '@/lib/validations';
import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fullName: z.string().min(1, 'Full name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  description: optionalString(),
  summary: optionalString(),
  avatarUrl: optionalUrl(),
  tel: optionalString(),
  email: optionalEmail(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
