import { gallerySchema, optionalString, slugSchema, tagListSchema } from '@/lib/validations';
import { z } from 'zod';

export const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: slugSchema,
  summary: optionalString(),
  content: optionalString(),
  /**
   * Cover, written as `images[0]` by the dashboard.
   *
   * A stored cover is a path (`/blog/1763.jpg`) as often as an absolute Blob URL, so
   * it is read as a plain string; the URL rule belongs to `href`, which is only ever
   * an external address.
   */
  image: optionalString(),
  // Optional: documents stored before this field simply keep their current value.
  images: gallerySchema().optional(),
  tags: tagListSchema().optional(),
  published: z.boolean().optional(),
  // Optional: documents stored before this field simply keep their current value.
  featured: z.boolean().optional(),
});

export type BlogInput = z.infer<typeof blogSchema>;
