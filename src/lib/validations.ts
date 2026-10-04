import { CRYPTO_NETWORKS, DONATION_MODES, DONATION_REGIONS, GATEWAY_IDS, LINK_PROVIDERS, PRODUCT_CURRENCIES, REFERRAL_PROVIDERS, SUPPORTER_MESSAGE_LIMIT, SUPPORTER_STATUSES } from '@/constants/global';
import { z } from 'zod';

/** Zod schemas shared by API handlers and dashboard forms. */

/** Locales accepted by the API (`/api/[lang]/...`). */
export const langSchema = z.enum(['fa', 'en']);

/** MongoDB object id. */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/** Optional string that also accepts empty values from forms. */
const optional = () => z.string().optional();
const optionalUrl = () => z.string().url().optional().or(z.literal(''));
const optionalEmail = () => z.string().email().optional().or(z.literal(''));

/** URL segment: Latin/Persian letters, digits and single dashes. */
const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9\u0600-\u06FF]+(?:-[a-z0-9\u0600-\u06FF]+)*$/, 'Slug may contain letters, digits and dashes');

/** Tags/technologies: trimmed, de-duplicated, bounded. */
const tagList = () => z.array(z.string().trim().min(1).max(32)).max(12);

/**
 * A supporter's email. Pasted addresses arrive with spaces and in caps, so they
 * are folded before the check; an empty field becomes `undefined` rather than `''`.
 */
const supporterEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email')
  .optional()
  .or(z.literal(''))
  .transform(value => (value ? value : undefined));

export const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fullName: z.string().min(1, 'Full name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  description: optional(),
  summary: optional(),
  avatarUrl: optionalUrl(),
  tel: optional(),
  email: optionalEmail(),
});

export const projectLinkSchema = z.object({
  type: z.string().min(1),
  href: z.string().url(),
  icon: z.string().min(1),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: slugSchema.optional().or(z.literal('')),
  href: optionalUrl(),
  dates: optional(),
  active: z.boolean(),
  // Optional: documents stored before this field simply keep their current value.
  featured: z.boolean().optional(),
  description: z.string().min(1, 'Description is required'),
  details: optional(),
  technologies: tagList(),
  links: z.array(projectLinkSchema),
  image: optional(),
});

export const skillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

/** Currency selector for a product price; the codes double as the type union. */
export const productCurrencySchema = z.enum(PRODUCT_CURRENCIES, { errorMap: () => ({ message: 'Choose a currency' }) });

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
  details: optional(),
  image: optional(),
  features: tagList(),
  price: priceSchema,
  currency: productCurrencySchema,
  available: z.boolean(),
  href: optionalUrl(),
  active: z.boolean(),
  // Optional: documents stored before this field simply keep their current value.
  featured: z.boolean().optional(),
});

export const socialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  icon: z.string(),
});

export const workSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  href: optionalUrl(),
  location: optional(),
  title: optional(),
  logoUrl: optionalUrl(),
  start: optional(),
  end: optional(),
  description: optional(),
});

export const educationSchema = z.object({
  school: z.string().min(1, 'School is required'),
  href: optionalUrl(),
  degree: optional(),
  logoUrl: optionalUrl(),
  start: optional(),
  end: optional(),
});

export const blogSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: slugSchema,
  summary: optional(),
  content: optional(),
  image: optionalUrl(),
  tags: tagList().optional(),
  published: z.boolean().optional(),
  // Optional: documents stored before this field simply keep their current value.
  featured: z.boolean().optional(),
});

/* ------------------------------------------------------------------
 * Buy-me-a-coffee / financial support
 * ------------------------------------------------------------------ */

/** Amount in whole units of the chosen currency; `0` means “the supporter picks”. */
const donationAmountSchema = z
  .number({ invalid_type_error: 'Price is required', required_error: 'Price is required' })
  .min(0, 'Price cannot be negative')
  .max(999_999_999_999);

/** Quick-pick amounts. Twelve is already more than the dialog can show in one row. */
const suggestedAmountsSchema = z
  .array(z.number({ invalid_type_error: 'Price is required' }).min(0).max(999_999_999_999))
  .max(12);

/** Card numbers are stored as bare digits; spaces are a display concern. */
const cardNumberSchema = z
  .string()
  .trim()
  .transform(value => value.replace(/[\s\u200c\u0660-\u0669\u06F0-\u06F9-]/g, match => (/[\u0660-\u0669]/.test(match) ? String('٠١٢٣٤٥٦٧٨٩'.indexOf(match)) : /[\u06F0-\u06F9]/.test(match) ? String('۰۱۲۳۴۵۶۷۸۹'.indexOf(match)) : '')))
  .pipe(z.string().regex(/^$|^[\d]{16}$|^\d{16}(\d{6,9})?$/, 'Enter a 16-digit card number'));

/** Iranian IBAN: `IR` plus 24 check digits, spaces tolerated on input. */
const ibanSchema = z
  .string()
  .trim()
  .transform(value => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())
  .pipe(z.string().regex(/^$|^IR\d{24}$/, 'Enter a valid IBAN (IR followed by 24 digits)'));

/** A crypto destination is an address, a `lnurl…` string or a Lightning invite. */
const cryptoAddressSchema = z
  .string()
  .trim()
  .min(8, 'Enter the receiving address')
  .max(120, 'The address is too long')
  .regex(/^[A-Za-z0-9:_+.\-]+$/, 'The address contains unsupported characters');

const donationShape = {
  title: z.string().min(1, 'Title is required'),
  slug: slugSchema.optional().or(z.literal('')),
  description: optional(),
  amount: donationAmountSchema,
  currency: z.enum(PRODUCT_CURRENCIES, { errorMap: () => ({ message: 'Choose a currency' }) }),
  customAmount: z.boolean(),
  suggestedAmounts: suggestedAmountsSchema,
  minAmount: donationAmountSchema,
  maxAmount: donationAmountSchema,
  mode: z.enum(DONATION_MODES, { errorMap: () => ({ message: 'Choose a payment method' }) }),
  region: z.enum(DONATION_REGIONS, { errorMap: () => ({ message: 'Choose a market' }) }),
  referral: z.enum(REFERRAL_PROVIDERS).optional().or(z.literal('')),
  href: optionalUrl(),
  linkProvider: z.enum(LINK_PROVIDERS).optional().or(z.literal('')),
  card: z
    .object({
      number: cardNumberSchema.optional(),
      holder: z.string().trim().max(60).optional(),
      iban: ibanSchema.optional(),
    })
    .optional(),
  cardQrPayload: z.string().trim().max(500).optional().or(z.literal('')),
  crypto: z
    .object({
      network: z.enum(CRYPTO_NETWORKS).optional().or(z.literal('')),
      address: z.string().trim().max(120).optional(),
    })
    .optional(),
  gateway: z.enum(GATEWAY_IDS).optional().or(z.literal('')),
  goal: z.number({ invalid_type_error: 'Goal must be a number' }).min(0).max(999_999_999_999).optional().or(z.literal('')),
  recurring: z.boolean(),
  cups: z.number({ invalid_type_error: 'Cups is required' }).int().min(1, 'At least one cup').max(12),
  active: z.boolean(),
  // Optional: documents stored before this field simply keep their current value.
  featured: z.boolean().optional(),
  order: z.number({ invalid_type_error: 'Order is required' }).int().min(0).max(999),
};

/** The option shape on its own, so the dashboard form can extend it. */
export const donationBaseSchema = z.object(donationShape);

/**
 * A support option must carry the credentials its own mode spends money with.
 * Checking that here means a half-filled option can never reach the public page,
 * where the dialog would have nothing to show.
 */
function refineDonation(value: z.infer<typeof donationBaseSchema>, ctx: z.RefinementCtx) {
  const at = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

  const href = (value.href || '').trim();
  const card = value.card ?? {};
  const crypto = value.crypto ?? {};

  switch (value.mode) {
    case 'referral':
      if (!href) at('href', 'Add the platform page supporters should open');
      if (!value.referral) at('referral', 'Choose the platform');
      break;
    case 'link':
      if (!href) at('href', 'Add the checkout link you prepared');
      if (!value.linkProvider) at('linkProvider', 'Choose the gateway the link belongs to');
      break;
    case 'card':
      if (!card.number && !card.iban) at('card', 'Add a card number or an IBAN');
      break;
    case 'crypto':
      if (!crypto.network) at('crypto', 'Choose the network');
      if (!crypto.address?.trim()) at('crypto', 'Add the receiving address');
      else if (cryptoAddressSchema.safeParse(crypto.address).success === false) at('crypto', 'Enter a valid address');
      break;
    case 'gateway':
      if (!value.gateway) at('gateway', 'Choose the gateway to charge through');
      break;
  }

  // A floor above the ceiling is a mistake, and the dialog would refuse every amount.
  if (value.minAmount && value.maxAmount && value.minAmount > value.maxAmount) {
    at('minAmount', 'The minimum amount is above the maximum');
  }
}

/** The create body the API accepts. */
export const donationSchema = donationBaseSchema.superRefine(refineDonation);

/**
 * Update body for an option. Deliberately unrefined: a row-level switch in the
 * dashboard sends only the flipped flag, and the mode-credential check belongs to
 * the full form. The API still refuses a missing or malformed `_id`.
 */
export const donationUpdateSchema = z.object({ _id: objectIdSchema }).merge(donationBaseSchema.partial());

/** Dashboard form: the full option plus the document id when editing. */
export const donationFormSchema = donationBaseSchema.extend({ _id: objectIdSchema.optional() }).superRefine(refineDonation);

/**
 * What a visitor may send when starting a checkout. The amount arrives as a
 * candidate: the server re-reads the option and only accepts a value inside that
 * option's own bounds, so a hand-edited request can never charge a different sum.
 */
export const supporterSubmitSchema = z.object({
  donationId: objectIdSchema,
  amount: z
    .number({ invalid_type_error: 'Price is required', required_error: 'Price is required' })
    .positive('Enter an amount above zero')
    .max(999_999_999_999),
  name: z.string().trim().max(60, 'The name is too long').optional().or(z.literal('')),
  anonymous: z.boolean().optional(),
  email: supporterEmailSchema,
  message: z.string().trim().max(SUPPORTER_MESSAGE_LIMIT, 'The message is too long').optional().or(z.literal('')),
  showOnWall: z.boolean().optional(),
  /** Card-to-card and crypto receipts: the tracker, hash or last digits. */
  reference: z.string().trim().max(120).optional().or(z.literal('')),
  /**
   * Honeypot: a human never fills a hidden field, a script usually does. It is
   * accepted rather than rejected so a bot is told the same thing a person is,
   * and the checkout route drops the request without storing it.
   */
  company: z.string().max(200).optional(),
});

/** “I have sent it”, after an instruction screen: only the reference is added. */
export const supporterConfirmSchema = z.object({
  orderId: objectIdSchema,
  reference: z.string().trim().max(120).optional().or(z.literal('')),
});

/** Owner-side edits to a support record: status, wall visibility and a note. */
export const supporterAdminSchema = z.object({
  _id: objectIdSchema,
  status: z.enum(SUPPORTER_STATUSES).optional(),
  showOnWall: z.boolean().optional(),
  anonymous: z.boolean().optional(),
  note: z.string().trim().max(280).optional(),
});

/** Wrap any create schema into an update schema keyed by `_id`. */
export function forUpdate<S extends z.ZodRawShape>(schema: z.ZodObject<S>) {
  return z.object({ _id: objectIdSchema }).merge(schema.partial());
}

export type ProfileInput = z.infer<typeof profileSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type SocialInput = z.infer<typeof socialSchema>;
export type WorkInput = z.infer<typeof workSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type BlogInput = z.infer<typeof blogSchema>;
export type DonationInput = z.infer<typeof donationSchema>;
export type DonationUpdateInput = z.infer<typeof donationUpdateSchema>;
export type DonationFormInput = z.infer<typeof donationFormSchema>;
export type SupporterSubmitInput = z.infer<typeof supporterSubmitSchema>;
