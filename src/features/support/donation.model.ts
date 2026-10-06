import type { IDonation } from '@/features/support/types';
import mongoose, { Schema } from 'mongoose';

/**
 * One destination of a payment method — and the amount rules of that destination.
 * Which fields mean anything depends on the parent's `mode`, so a card row never
 * carries an address and a wallet never carries a merchant id — the checkout can only
 * ever be shown one rail's data. `amount`, `currency`, bounds and `suggestedAmounts`
 * live here, not on the method: two destinations can price differently.
 */
const supportVariantSchema = new Schema<IDonation['variants'][number]>(
  {
    key: { type: String, required: true },
    label: { type: String },
    provider: { type: String },
    href: { type: String },
    instruction: { type: String, maxlength: 160 },
    number: { type: String },
    iban: { type: String },
    holder: { type: String },
    qrPayload: { type: String },
    network: { type: String },
    address: { type: String },
    currency: { type: String },
    region: { type: String },
    amount: { type: Number, default: 0, min: 0 },
    customAmount: { type: Boolean, default: true },
    suggestedAmounts: { type: [Number], default: [] },
    minAmount: { type: Number, default: 0, min: 0 },
    maxAmount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { _id: true }
);

/**
 * A support method: one way backing arrives, the market it aims at and the
 * destinations it can be paid into. The amount policy belongs to each destination,
 * never here: `currency` and `region` are only the defaults a destination inherits
 * when it states none, so the method does not fix a price.
 */
const donationItemSchema = new Schema<IDonation>(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true },
    description: { type: String },
    mode: { type: String, required: true, default: 'platform' },
    region: { type: String, required: true, default: 'global' },
    variants: { type: [supportVariantSchema], default: [] },
    currency: { type: String, default: 'toman' },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    lang: { type: String, required: true },
  },
  { timestamps: true }
);

export const donationModel = mongoose.models.donation || mongoose.model<IDonation>('donation', donationItemSchema);
