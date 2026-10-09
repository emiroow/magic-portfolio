import { IBlog } from '@/features/blog/types';
import { registerModel } from '@/lib/mongoose-model';
import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema<IBlog>(
  {
    title: { type: String, required: true },
    summary: { type: String },
    content: { type: String, default: '' },
    slug: { type: String, required: true, index: true },
    /** Cover, always `images[0]`; the list, header and social cards read this one. */
    image: { type: String },
    /** Ordered gallery rendered under the article; first entry leads. */
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    // Drafts stay out of every public surface; legacy documents default to true.
    published: { type: Boolean, default: true },
    /** Chosen for the home page; when none are set the newest published stand in. */
    featured: { type: Boolean, default: false },
    lang: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export const blogModel = registerModel<IBlog>('Blog', BlogSchema);
