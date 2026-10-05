import { ISkill } from '@/features/skills/types';
import mongoose, { Schema } from 'mongoose';

export const skillSchema = new Schema<ISkill>({
  name: { type: String, required: true },
  lang: { type: String, required: true },
});

export const skillModel = mongoose.models.skill || mongoose.model<ISkill>('skill', skillSchema);
