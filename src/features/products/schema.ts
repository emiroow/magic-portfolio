import { gallerySchema, optionalString, optionalUrl, productCurrencySchema, slugSchema, tagListSchema } from '@/lib/validations';
import { z } from 'zod';

/**
 * Price in whole units of the chosen currency. `valueAsNumber` in the form turns
 * the input into a number, so an empty field arrives as `NaN` and has to say so
 * in plain words rather than as a type complaint.
 */
const priceSchema = z
  .number({ invalid_type_error: 'Price is required', required_error: 'Price is required' })
  .min(0, 'Price cannot be negative')
  .max(999_999_999_999);

export const productSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: slugSchema.optional().or(z.literal('')),
  category: z.string().trim().max(40, 'Category is too long').optional().or(z.literal('')),
  description: z.string().min(1, 'Description is required'),
  details: optionalString(),
  /** Cover, written as `images[0]` by the dashboard; cards and social read this. */
  image: optionalString(),
  // Optional: documents stored before this field simply keep their current value.
  images: gallerySchema().optional(),
  features: tagListSchema(),
  price: priceSchema,
  currency: productCurrencySchema,
  available: z.boolean(),
  href: optionalUrl(),
  active: z.boolean(),
  // Optional: documents stored before this field simply keep their current value.
  featured: z.boolean().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
