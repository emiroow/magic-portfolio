import { MAX_GALLERY_IMAGES, PRODUCT_CURRENCIES, SUPPORT_CURRENCIES } from '@/constants/global';
import { z } from 'zod';

/**
 * Cross-domain zod primitives shared by feature schemas and API handlers.
 * Domain schemas live with their feature; only the building blocks every one of
 * them composes from stay here so the pieces cannot drift.
 */

/** Locales accepted by the API (`/api/[lang]/...`). */
export const langSchema = z.enum(['fa', 'en']);

/** MongoDB object id. */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/** Optional string that also accepts empty values from forms. */
export const optionalString = () => z.string().optional();
export const optionalUrl = () => z.string().url().optional().or(z.literal(''));
export const optionalEmail = () => z.string().email().optional().or(z.literal(''));

/**
 * A stored image reference: the site-relative path a `/public` upload returns in
 * development (`/education/123.jpg`), an absolute URL a remote/Blob upload returns
 * in production, or nothing.
 *
 * Distinct from `optionalUrl` on purpose. A logo/avatar upload is saved as a bare
 * path, which `z.string().url()` rejects outright — so validating an image field with
 * `optionalUrl` makes a record silently refuse to save the moment a picture is added.
 * Image paths are checked for shape, not treated as URLs.
 */
export const optionalImagePath = () =>
  z
    .string()
    .trim()
    .refine(value => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value), 'Enter a valid image path or URL')
    .optional();

/** URL segment: Latin/Persian letters, digits and single dashes. */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9\u0600-\u06FF]+(?:-[a-z0-9\u0600-\u06FF]+)*$/, 'Slug may contain letters, digits and dashes');

/** Tags/technologies: trimmed, de-duplicated, bounded. */
export const MAX_TAG_ITEMS = 12;
export const MAX_TAG_ITEM_LENGTH = 32;

/**
 * A list of short names — technologies, features, tags.
 *
 * The per-item rules are enforced through `superRefine` rather than chained `.min/.max`
 * on the element schema so that every violation is reported on the array itself. A
 * react-hook-form field only reads `errors.<name>.message`, and zod files a per-index
 * error (`features.2`) that the composer never renders — which is how an over-long chip
 * silently blocked a save. Attaching the issue to the array root makes it visible.
 */
export const tagListSchema = () =>
  z
    .array(z.string())
    .max(MAX_TAG_ITEMS, 'That is too many entries')
    .superRefine((items, ctx) => {
      if (items.some(item => item.trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'An entry cannot be empty' });
      }
      if (items.some(item => item.trim().length > MAX_TAG_ITEM_LENGTH)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'An entry is too long' });
      }
    });

/**
 * Ordered image gallery, first entry being the cover.
 *
 * Stored as a list of paths rather than absolute URLs, because a dev upload is
 * `/products/123.jpg` and a production one is a Blob host — neither is a URL that
 * `z.string().url()` would accept. The count is capped where the dashboard counter
 * and the lightbox steps read it, so a record cannot grow past what the UI shows.
 */
export const gallerySchema = () => z.array(z.string().trim().min(1, 'An image path is required')).max(MAX_GALLERY_IMAGES, 'That is too many images');

/** Currency selector offered to a product price: the moneys a shop can quote in. */
export const productCurrencySchema = z.enum(PRODUCT_CURRENCIES, { errorMap: () => ({ message: 'Choose a currency' }) });

/**
 * Currency selector offered to a support method: the moneys above plus the coins a
 * wallet can receive. A shop never quotes in coins, so the two lists stay apart even
 * though both read their labels from the `pricing` namespace.
 */
export const supportCurrencySchema = z.enum(SUPPORT_CURRENCIES, { errorMap: () => ({ message: 'Choose a currency' }) });

/** Wrap any create schema into an update schema keyed by `_id`. */
export function forUpdate<S extends z.ZodRawShape>(schema: z.ZodObject<S>) {
  return z.object({ _id: objectIdSchema }).merge(schema.partial());
}
