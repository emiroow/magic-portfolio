import { languageListSchema, optionalDocumentPath, optionalEmail, optionalImagePath, optionalString } from '@/lib/validations';
import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fullName: z.string().min(1, 'Full name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  description: optionalString(),
  summary: optionalString(),
  avatarUrl: optionalImagePath(),
  tel: optionalString(),
  email: optionalEmail(),
  resumeUrl: optionalDocumentPath(),
  languages: languageListSchema(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
