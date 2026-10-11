import { IProfile } from '@/features/profile/types';
import { LANGUAGE_LEVELS } from '@/constants/global';
import { registerModel } from '@/lib/mongoose-model';
import { Schema } from 'mongoose';

export const profileSchema = new Schema<IProfile>({
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  jobTitle: { type: String, required: true },
  description: { type: String },
  summary: { type: String },
  avatarUrl: { type: String },
  tel: { type: String },
  email: { type: String },
  resumeUrl: { type: String },
  languages: [
    {
      name: { type: String, required: true },
      level: { type: String, required: true, enum: LANGUAGE_LEVELS },
    },
  ],
  lang: { type: String, required: true },
});

export const profileModel = registerModel<IProfile>('profile', profileSchema);
