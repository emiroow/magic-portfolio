import { optionalString, optionalUrl, slugSchema, tagListSchema } from '@/lib/validations';
import { z } from 'zod';

export const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: slugSchema,
  summary: optionalString(),
  content: optionalString(),
  image: optionalUrl(),
  tags: tagListSchema().optional(),
  published: z.boolean().optional(),
  // Optional: documents stored before this field simply keep their current value.
  featured: z.boolean().optional(),
});

export type BlogInput = z.infer<typeof blogSchema>;
