import { IEducation } from '@/features/education/types';
import { registerModel } from '@/lib/mongoose-model';
import { Schema } from 'mongoose';

export const educationSchema = new Schema<IEducation>({
  school: { type: String },
  href: { type: String },
  degree: { type: String },
  logoUrl: { type: String },
  start: { type: String },
  end: { type: String },
  lang: { type: String, required: true },
});

export const educationModel = registerModel<IEducation>('education', educationSchema);
