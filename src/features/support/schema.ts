import {
  ACTION_PROVIDERS,
  CRYPTO_ASSET_NETWORKS,
  CRYPTO_NETWORKS,
  DONATION_MODES,
  DONATION_REGIONS,
  GATEWAY_CURRENCIES,
  GATEWAY_IDS,
  MAX_CRYPTO_ADDRESS,
  MAX_VARIANTS,
  MAX_VARIANT_INSTRUCTION,
  MAX_VARIANT_LABEL,
  PLATFORM_PROVIDERS,
  SUPPORT_PROVIDERS,
  SUPPORTER_MESSAGE_LIMIT,
  SUPPORTER_STATUSES,
} from '@/features/support/constants';
import { CRYPTO_ASSETS } from '@/constants/global';
import { isBic, isIban, isInternationalCardNumber, isIranianCardNumber, isSheba, isWalletAddress } from '@/features/support/instruments';
import { objectIdSchema, optionalString, optionalUrl, slugSchema, supportCurrencySchema } from '@/lib/validations';
import { withUniqueKeys } from '@/features/support/variants';
import { z } from 'zod';

/* ------------------------------------------------------------------
 * Financial support
 * ------------------------------------------------------------------ */

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

/** Amount in whole units of the chosen currency; `0` means “the supporter picks”. */
const donationAmountSchema = z
  .number({ invalid_type_error: 'Price is required', required_error: 'Price is required' })
  .min(0, 'Price cannot be negative')
  .max(999_999_999_999, 'That amount is too large');

/**
 * An optional bound. `0` is the stored “none” value, so a cleared input means
 * “no limit” instead of failing validation; the surfaces that read these fields
 * all test for a positive number before using them.
 */
const optionalAmountSchema = z
  .number({ invalid_type_error: 'Enter the amount as a number' })
  .min(0, 'Amount cannot be negative')
  .max(999_999_999_999, 'That amount is too large');

/** Quick-pick amounts. Twelve is already more than the dialog can show in one row. */
const suggestedAmountsSchema = z.array(z.number({ invalid_type_error: 'Price is required' }).min(0).max(999_999_999_999)).max(12);

/** Card numbers are stored as bare digits; spaces, dashes and Persian digits are a display concern. */
const digitsOnly = (value: string) =>
  value
    .replace(/[\s\u200c-]/g, '')
    .replace(/[\u0660-\u0669]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\u06F0-\u06F9]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

/** An account code as its standard writes it: no spaces, upper case. */
const accountCode = (value: string) => value.replace(/[\s\u200c-]/g, '').toUpperCase();

/**
 * The three codes a transfer is made with, cleaned here and checked against their own
 * standard in `refineDonation`. The shape of a card number, an IBAN or a SWIFT code is
 * only meaningful inside the market that uses it — sixteen Luhn-checked digits at home,
 * an IBAN of the issuing country's own length abroad — and a destination knows its market
 * from itself, not from the method that carries it.
 */
const digitsField = z
  .string()
  .optional()
  .transform(value => (value === undefined ? undefined : digitsOnly(value)));

const codeField = z
  .string()
  .optional()
  .transform(value => (value === undefined ? undefined : accountCode(value)));

/**
 * One destination of a payment method, with its own amount policy. Every field is
 * optional here because a destination only means something inside its own method: the
 * refinement below asks each method for exactly the fields it spends money with, and
 * validates that destination's bounds, quick-picks and price together.
 */
const supportVariantSchema = z.object({
  /** Derived from the destination's own content on save; an owner never types it. */
  key: z.string().trim().max(40).optional().or(z.literal('')),
  label: z.string().trim().max(MAX_VARIANT_LABEL, 'The name is too long').optional().or(z.literal('')),
  provider: z.enum(SUPPORT_PROVIDERS).optional().or(z.literal('')),
  href: optionalUrl(),
  instruction: z.string().trim().max(MAX_VARIANT_INSTRUCTION, 'The instruction is too long').optional().or(z.literal('')),
  number: digitsField,
  iban: codeField,
  bic: codeField,
  holder: z.string().trim().max(60).optional(),
  qrPayload: z.string().trim().max(500).optional().or(z.literal('')),
  network: z.enum(CRYPTO_NETWORKS).optional().or(z.literal('')),
  asset: z.enum(CRYPTO_ASSETS).optional().or(z.literal('')),
  address: z.string().trim().max(MAX_CRYPTO_ADDRESS, 'The address is too long').optional(),
  // A wallet row legitimately holds its coin here; the form keeps it equal to the asset.
  currency: supportCurrencySchema.optional().or(z.literal('')),
  region: z.enum(DONATION_REGIONS).optional().or(z.literal('')),
  // The destination's own amount policy; absent on a method that takes no money.
  amount: donationAmountSchema.optional(),
  customAmount: z.boolean().optional(),
  suggestedAmounts: suggestedAmountsSchema.optional(),
  minAmount: optionalAmountSchema.optional(),
  maxAmount: optionalAmountSchema.optional(),
  active: z.boolean(),
});

const donationShape = {
  title: z.string().min(1, 'Title is required'),
  slug: slugSchema.optional().or(z.literal('')),
  description: optionalString(),
  mode: z.enum(DONATION_MODES, { errorMap: () => ({ message: 'Choose a payment method' }) }),
  region: z.enum(DONATION_REGIONS, { errorMap: () => ({ message: 'Choose a market' }) }),
  variants: z.array(supportVariantSchema).min(1, 'Add at least one destination').max(MAX_VARIANTS, 'That is too many destinations for one method'),
  // Only the default a destination inherits when it names no currency of its own. The
  // amount policy itself lives on every destination, and a wallet's unit is its asset —
  // so a stored method can legitimately carry a coin here, even though the form offers
  // national moneys, which are the only defaults a non-wallet destination can want.
  currency: supportCurrencySchema,
  active: z.boolean(),
  order: z
    .number({ invalid_type_error: 'Enter the order as a number' })
    .int('Order must be a whole number')
    .min(0, 'Order cannot be negative')
    .max(999, 'Order must be 999 or lower'),
};

/** The method shape on its own, so the dashboard form can extend it. */
export const donationBaseSchema = z.object(donationShape);

/**
 * A support method must carry, in at least one of its destinations, what that
 * method spends money with — or, for a free gesture, the page the gesture is made
 * on. Checking it here means a half-built method can never reach the public page,
 * where the wizard would have nothing to show.
 */
function refineDonation(value: z.infer<typeof donationBaseSchema>, ctx: z.RefinementCtx) {
  const at = (path: (string | number)[], message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

  const active = value.variants.filter(variant => variant.active !== false);
  if (!active.length) at(['variants', 0], 'Turn on at least one destination');

  // Every field is reported at its own row, so the form can put the message under
  // the input that caused it instead of under the first one.
  value.variants.forEach((variant, index) => {
    if (variant.active === false) return;

    const row = (field: string, message: string) => at(['variants', index, field], message);
    // The destination answers for its own market: one method can carry a sheba at home
    // and an IBAN abroad, and the codes each of those needs are not the same codes.
    const market = variant.region || value.region;

    switch (value.mode) {
      case 'platform': {
        const href = (variant.href || '').trim();
        if (!variant.provider) row('provider', 'Choose the platform');
        if (!href) row('href', 'Add the page supporters should open');
        // `custom` has no catalogue name, so its own label is the only title it can show.
        if (variant.provider === 'custom' && !(variant.label || '').trim()) row('label', 'Name this platform');
        break;
      }
      case 'card': {
        const number = variant.number || '';
        const iban = variant.iban || '';

        if (!number && !iban) row('number', market === 'ir' ? 'Add a card number or a sheba' : 'Add an IBAN or a card number');

        // A card is checked against the market's own rule: sixteen digits with a sound
        // Shetab check digit at home, a number a scheme actually issues abroad.
        if (number && market === 'ir' && !isIranianCardNumber(number)) row('number', 'Enter a valid 16-digit card number');
        if (number && market !== 'ir' && !isInternationalCardNumber(number)) row('number', 'That card number is not one the scheme issues');

        if (iban && market === 'ir' && !isSheba(iban)) row('iban', 'Enter a valid Iranian sheba (IR followed by 24 digits)');
        if (iban && market !== 'ir') {
          if (iban.startsWith('IR')) row('iban', 'An Iranian sheba belongs to the card-to-card market');
          else if (!isIban(iban)) row('iban', 'Enter a valid IBAN');
        }

        if (market === 'ir') {
          // A transfer inside Iran is made from a banking application that reads a card
          // number and nothing else, so a code left over from another market is a mistake.
          if (variant.bic) row('bic', 'A transfer inside Iran has no SWIFT code');
        } else {
          if (variant.bic && !isBic(variant.bic)) row('bic', 'Enter the SWIFT code as 8 or 11 characters');
          // An international transfer without a name on the account comes back, and the
          // supporter pays for sending it.
          if (iban && !(variant.holder || '').trim()) row('holder', 'Name the account the transfer is for');
        }
        break;
      }
      case 'crypto': {
        const address = (variant.address || '').trim();
        // Both halves of a wallet are stored and both are checked: the ledger decides the
        // shape of the address and the asset decides what may be sent to it, so a
        // destination can never be read as a guess about which coin it holds.
        if (!variant.network) row('network', 'Choose the network');
        if (!variant.asset) row('asset', 'Choose the asset that arrives here');
        if (!address) row('address', 'Add the receiving address');

        if (variant.asset && variant.network && !CRYPTO_ASSET_NETWORKS[variant.asset].includes(variant.network)) {
          row('asset', 'That asset does not move on that network');
        }

        if (variant.network && address && !isWalletAddress(variant.network, address)) row('address', 'That address is not one this network issues');
        // The coin is the unit: an override could only disagree with it.
        if (variant.asset && variant.currency && variant.currency !== variant.asset) row('currency', 'A wallet is priced in the coin it receives');
        break;
      }
      case 'gateway':
        if (!variant.provider) row('provider', 'Choose the gateway to charge through');
        else if (!GATEWAY_IDS.includes(variant.provider as (typeof GATEWAY_IDS)[number])) row('provider', 'That service is not a gateway');
        break;
      case 'action': {
        // A gesture is its page plus the one step to take there; with neither name
        // nor service the tile would be an empty button.
        if (!(variant.href || '').trim()) row('href', 'Add the page the supporter should open');
        if (!variant.provider) row('provider', 'Choose where the gesture happens');
        if ((!variant.provider || variant.provider === 'custom') && !(variant.label || '').trim()) row('label', 'Name this action');
        break;
      }
    }

    // The amount policy belongs to this destination. A floor above a ceiling, a
    // quick-pick outside the range or a fixed price the destination would refuse are
    // mistakes that must never reach the database. A method that takes no money has
    // no amount rules to check.
    if (value.mode !== 'action') {
      const min = variant.minAmount ?? 0;
      const max = variant.maxAmount ?? 0;
      const fixed = variant.amount ?? 0;
      const suggested = variant.suggestedAmounts ?? [];

      if (min > 0 && max > 0 && min > max) row('minAmount', 'The minimum amount is above the maximum');

      if (fixed > 0) {
        if (min > 0 && fixed < min) row('amount', 'The fixed amount is below the minimum');
        if (max > 0 && fixed > max) row('amount', 'The fixed amount is above the maximum');
      }

      suggested.forEach((pick, pos) => {
        if (min > 0 && pick < min) at(['variants', index, 'suggestedAmounts', pos], 'A suggested amount is below the minimum');
        if (max > 0 && pick > max) at(['variants', index, 'suggestedAmounts', pos], 'A suggested amount is above the maximum');
      });

      // Custom off with nothing pre-set leaves the destination with no amount it accepts.
      if (!variant.customAmount && !(fixed > 0) && !suggested.length) row('customAmount', 'Turn on a custom amount or set at least one amount');

      // A gateway can only charge in a currency it actually settles — and a coin is
      // never one of them, however the row is filled in.
      if (value.mode === 'gateway' && variant.provider) {
        const settled = GATEWAY_CURRENCIES[variant.provider as keyof typeof GATEWAY_CURRENCIES];
        const unit = variant.currency || value.currency;
        if (settled && !(settled as readonly string[]).includes(unit)) row('currency', 'That gateway cannot charge in this currency');
      }
    }
  });

  // Two destinations that would be stored under one key cannot be told apart in a link.
  const keys = withUniqueKeys(value.mode, value.variants).map(variant => variant.key);
  if (new Set(keys).size !== keys.length) at(['variants'], 'Two destinations share one name');

  // A platform method may only hand off to a support platform or a prepared link,
  // and a free gesture only to a network its own picker offers.
  const allowed = value.mode === 'platform' ? PLATFORM_PROVIDERS : value.mode === 'action' ? ACTION_PROVIDERS : null;
  if (allowed) {
    value.variants.forEach((variant, index) => {
      if (variant.provider && !allowed.includes(variant.provider as (typeof allowed)[number])) {
        at(['variants', index, 'provider'], value.mode === 'action' ? 'Choose where the gesture happens' : 'Choose a support platform');
      }
    });
  }
}

/** The create body the API accepts. */
export const donationSchema = donationBaseSchema.superRefine(refineDonation);

/**
 * Update body for a method. Deliberately unrefined: a row-level switch in the
 * dashboard sends only the flipped flag, and the destination check belongs to the
 * full form. The API still refuses a missing or malformed `_id`.
 */
export const donationUpdateSchema = z.object({ _id: objectIdSchema }).merge(donationBaseSchema.partial());

/** Dashboard form: the full method plus the document id when editing. */
export const donationFormSchema = donationBaseSchema.extend({ _id: objectIdSchema.optional() }).superRefine(refineDonation);

/**
 * What a visitor may send when starting a checkout. The amount arrives as a
 * candidate and the destination as a key: the server re-reads the method and only
 * accepts a value inside its own bounds, so a hand-edited request can never charge
 * a different sum or be pointed at a different wallet.
 */
export const supporterSubmitSchema = z.object({
  donationId: objectIdSchema,
  /** Which destination of the method the supporter picked; empty takes the first. */
  variantKey: z.string().trim().max(40).optional().or(z.literal('')),
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

export type DonationInput = z.infer<typeof donationSchema>;
export type DonationUpdateInput = z.infer<typeof donationUpdateSchema>;
export type DonationFormInput = z.infer<typeof donationFormSchema>;
export type SupporterSubmitInput = z.infer<typeof supporterSubmitSchema>;
