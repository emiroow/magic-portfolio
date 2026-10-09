import { IProduct } from '@/features/products/types';
import { registerModel } from '@/lib/mongoose-model';
import { Schema } from 'mongoose';

export const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true },
    description: { type: String },
    details: { type: String },
    /** Cover, always `images[0]`; cards and social read this one. */
    image: { type: String },
    /** Ordered gallery rendered on the product page; first entry leads. */
    images: { type: [String], default: [] },
    category: { type: String },
    features: { type: [String], default: [] },
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'usd' },
    available: { type: Boolean, default: true },
    href: { type: String },
    active: { type: Boolean, default: true },
    /** Chosen for the home page; when none are set the newest published stand in. */
    featured: { type: Boolean, default: false },
    lang: { type: String, required: true },
  },
  { timestamps: true }
);

export const productModel = registerModel<IProduct>('product', productSchema);
