import { ISkill } from '@/features/skills/types';
import { registerModel } from '@/lib/mongoose-model';
import { Schema } from 'mongoose';

export const skillSchema = new Schema<ISkill>({
  name: { type: String, required: true },
  icon: { type: String },
  /** Display priority, smallest first; the row arrows rewrite it across the list. */
  order: { type: Number, default: 0 },
  lang: { type: String, required: true },
});

export const skillModel = registerModel<ISkill>('skill', skillSchema);
