import { z } from 'zod';

export const socialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  icon: z.string(),
});

export type SocialInput = z.infer<typeof socialSchema>;
