import { ISocial } from '@/features/socials/types';
import mongoose, { Schema } from 'mongoose';

export const socialSchema = new Schema<ISocial>({
  name: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String },
  lang: { type: String, required: true },
});

export const socialModel = mongoose.models.social || mongoose.model<ISocial>('social', socialSchema);
