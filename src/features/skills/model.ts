import { ISkill } from '@/features/skills/types';
import { registerModel } from '@/lib/mongoose-model';
import { Schema } from 'mongoose';

export const skillSchema = new Schema<ISkill>({
  name: { type: String, required: true },
  lang: { type: String, required: true },
});

export const skillModel = registerModel<ISkill>('skill', skillSchema);
