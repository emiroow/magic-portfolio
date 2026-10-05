import { optionalString, optionalUrl, slugSchema, tagListSchema } from '@/lib/validations';
import { z } from 'zod';

export const projectLinkSchema = z.object({
  type: z.string().min(1),
  href: z.string().url(),
  icon: z.string().min(1),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: slugSchema.optional().or(z.literal('')),
  href: optionalUrl(),
  dates: optionalString(),
  active: z.boolean(),
  // Optional: documents stored before this field simply keep their current value.
  featured: z.boolean().optional(),
  description: z.string().min(1, 'Description is required'),
  details: optionalString(),
  technologies: tagListSchema(),
  links: z.array(projectLinkSchema),
  image: optionalString(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
