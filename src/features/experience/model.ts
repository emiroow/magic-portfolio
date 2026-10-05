import { IWork } from '@/features/experience/types';
import mongoose, { Schema } from 'mongoose';

export const workSchema = new Schema<IWork>({
  company: { type: String, required: true },
  href: { type: String },
  location: { type: String },
  title: { type: String },
  logoUrl: { type: String },
  start: { type: String },
  end: { type: String },
  description: { type: String },
  lang: { type: String, required: true },
});

export const workModel = mongoose.models.work || mongoose.model<IWork>('work', workSchema);
