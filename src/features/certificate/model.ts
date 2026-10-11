import { ICertificate } from '@/features/certificate/types';
import { registerModel } from '@/lib/mongoose-model';
import { Schema } from 'mongoose';

export const certificateSchema = new Schema<ICertificate>(
  {
    title: { type: String, required: true },
    issuer: { type: String },
    href: { type: String },
    logoUrl: { type: String },
    credentialId: { type: String },
    issueDate: { type: String },
    expirationDate: { type: String },
    description: { type: String },
    /** Chosen for the generated résumé sheet; the site lists every credential. */
    featured: { type: Boolean, default: false },
    lang: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const certificateModel = registerModel<ICertificate>('certificate', certificateSchema);
