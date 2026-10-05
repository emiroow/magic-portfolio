import { IBlog } from '@/features/blog/types';
import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema<IBlog>(
  {
    title: { type: String, required: true },
    summary: { type: String },
    content: { type: String, default: '' },
    slug: { type: String, required: true, index: true },
    image: { type: String },
    tags: { type: [String], default: [] },
    // Drafts stay out of every public surface; legacy documents default to true.
    published: { type: Boolean, default: true },
    /** Chosen for the home page; when none are set the newest published stand in. */
    featured: { type: Boolean, default: false },
    lang: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const blogModel = mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);
