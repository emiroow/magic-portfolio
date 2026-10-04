import type { IDonation } from '@/types';
import mongoose, { Schema } from 'mongoose';

/**
 * A buy-me-a-coffee / support option. Money always arrives through exactly one
 * `mode`, so the fields that belong to the other modes stay empty and the
 * checkout surface never has to guess which rail a document uses.
 */
const donationItemSchema = new Schema<IDonation>(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true },
    description: { type: String },
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'toman' },
    customAmount: { type: Boolean, default: true },
    suggestedAmounts: { type: [Number], default: [] },
    minAmount: { type: Number, default: 0, min: 0 },
    maxAmount: { type: Number, default: 0, min: 0 },
    mode: { type: String, required: true, default: 'referral' },
    region: { type: String, required: true, default: 'global' },
    referral: { type: String },
    href: { type: String },
    linkProvider: { type: String },
    card: {
      number: { type: String },
      holder: { type: String },
      iban: { type: String },
    },
    cardQrPayload: { type: String },
    crypto: {
      network: { type: String },
      address: { type: String },
    },
    gateway: { type: String },
    goal: { type: Number, min: 0 },
    recurring: { type: Boolean, default: false },
    cups: { type: Number, default: 1, min: 1, max: 12 },
    active: { type: Boolean, default: true },
    /** Chosen for the home page section; `active` still controls visibility. */
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    lang: { type: String, required: true },
  },
  { timestamps: true }
);

export const donationModel = mongoose.models.donation || mongoose.model<IDonation>('donation', donationItemSchema);
