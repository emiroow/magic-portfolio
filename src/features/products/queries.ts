import { tryConnectDB } from '@/config/dbConnection';
import { productModel } from '@/features/products/model';
import { byLocaleOrder, serialize, serializeList } from '@/lib/serialize';
import { galleryUrls } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IProduct } from '@/features/products/types';
import mongoose from 'mongoose';

/**
 * `.lean()` hands back stored documents as they are, so a record written outside
 * the dashboard can be missing a field the schema defaults. The catalogue
 * renders `features.length` and the price directly, so both get filled in here —
 * and the cover is re-derived from the gallery, because a record saved with only
 * `images` would otherwise read as pictureless on every card.
 */
function normalizeProduct(product: IProduct): IProduct {
  const images = galleryUrls(product);
  return {
    ...product,
    images,
    image: images[0] ?? '',
    features: product.features ?? [],
    price: Number.isFinite(product.price) ? product.price : 0,
    currency: product.currency ?? 'usd',
    available: product.available !== false,
    featured: Boolean(product.featured),
  };
}

/** Published products for a locale, newest first. */
export async function getProducts(locale: AppLocale): Promise<IProduct[]> {
  if (!(await tryConnectDB())) return [];

  const docs = await productModel.find({ lang: locale, active: true }).sort({ createdAt: -1 }).lean();
  return serializeList<IProduct>(docs as Record<string, unknown>[]).map(normalizeProduct);
}

/**
 * One product by its slug, or by id for records saved without one. Only
 * published products are public.
 */
export async function getProductByKey(locale: AppLocale, key: string): Promise<IProduct | null> {
  if (!(await tryConnectDB())) return null;

  const byKey = key.trim();
  const or: Record<string, unknown>[] = [{ slug: byKey }];
  if (mongoose.isValidObjectId(byKey)) or.push({ _id: byKey });

  const doc = await productModel.findOne({ lang: locale, active: true, $or: or }).lean();
  const product = serialize<IProduct>(doc as Record<string, unknown> | null);
  return product ? normalizeProduct(product) : null;
}

/** Distinct categories across the published products, for the catalogue filter. */
export async function getProductCategories(locale: AppLocale): Promise<string[]> {
  if (!(await tryConnectDB())) return [];

  const categories = await productModel.distinct('category', { lang: locale, active: true });
  return (categories as string[]).filter(Boolean).sort(byLocaleOrder(locale));
}
