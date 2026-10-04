import type { ISupporter } from '@/types';
import mongoose, { Schema } from 'mongoose';

/**
 * One act of support: created when a visitor starts a checkout and confirmed
 * either by a gateway callback or by the owner. The wall on `/support` reads
 * completed, opted-in records from here, so the supporter's name and message are
 * stored with the money rather than being reconstructed later.
 */
const supporterSchema = new Schema<ISupporter>(
  {
    donationId: { type: String, index: true },
    donationTitle: { type: String },
    name: { type: String },
    anonymous: { type: Boolean, default: false },
    email: { type: String },
    message: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'toman' },
    mode: { type: String, required: true },
    region: { type: String },
    /** `pending` until the money is seen: nothing public is created on trust. */
    status: { type: String, default: 'pending', index: true },
    reference: { type: String },
    externalId: { type: String, index: true },
    note: { type: String },
    showOnWall: { type: Boolean, default: true },
    lang: { type: String, required: true },
  },
  { timestamps: true }
);

// A gateway callback arrives with its own id; the same id must never confirm twice.
supporterSchema.index({ externalId: 1, lang: 1 }, { unique: true, partialFilterExpression: { externalId: { $type: 'string' } } });

export const supporterModel =
  mongoose.models.supporter || mongoose.model<ISupporter>('supporter', supporterSchema);
