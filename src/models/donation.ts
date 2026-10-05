import type { IDonation } from '@/types';
import mongoose, { Schema } from 'mongoose';

/**
 * One destination of a payment method. Which fields mean anything depends on the
 * parent's `mode`, so a card row never carries an address and a wallet never
 * carries a merchant id — the checkout can only ever be shown one rail's data.
 */
const supportVariantSchema = new Schema<IDonation['variants'][number]>(
  {
    key: { type: String, required: true },
    label: { type: String },
    provider: { type: String },
    href: { type: String },
    number: { type: String },
    iban: { type: String },
    holder: { type: String },
    qrPayload: { type: String },
    network: { type: String },
    address: { type: String },
    currency: { type: String },
    region: { type: String },
    active: { type: Boolean, default: true },
  },
  { _id: true }
);

/**
 * A payment method: one way money arrives, the amount policy around it, and the
 * destinations it can be paid into. Support platforms, card-to-card, crypto and an
 * in-site gateway checkout are four separate documents, never four prices for the
 * same act of giving.
 */
const donationItemSchema = new Schema<IDonation>(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true },
    description: { type: String },
    mode: { type: String, required: true, default: 'platform' },
    region: { type: String, required: true, default: 'global' },
    variants: { type: [supportVariantSchema], default: [] },
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'toman' },
    customAmount: { type: Boolean, default: true },
    suggestedAmounts: { type: [Number], default: [] },
    minAmount: { type: Number, default: 0, min: 0 },
    maxAmount: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    lang: { type: String, required: true },
  },
  { timestamps: true }
);

export const donationModel = mongoose.models.donation || mongoose.model<IDonation>('donation', donationItemSchema);
