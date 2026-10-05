import { IProject } from '@/features/projects/types';
import mongoose, { Schema } from 'mongoose';

export const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true },
    href: { type: String },
    dates: { type: String },
    active: { type: Boolean, default: true },
    /** Chosen for the home page; when none are set the newest published stand in. */
    featured: { type: Boolean, default: false },
    description: { type: String },
    details: { type: String },
    technologies: [String],
    links: [
      {
        type: { type: String },
        href: { type: String },
        icon: { type: String },
      },
    ],
    image: { type: String },
    lang: { type: String, required: true },
  },
  { timestamps: true }
);

export const projectModel = mongoose.models.project || mongoose.model<IProject>('project', projectSchema);
