import { productModel } from '@/features/products/model';
import { withBothLangs, type Persona } from '@/seed/personas/types';

/**
 * Commercial products for the `/products` catalogue, authored once per locale.
 * The `featured` ones lead the home section and the newest published backfill
 * any open slot; `createdAt` orders the newest-first listing. A persona without
 * products seeds an empty catalogue. Returns the inserted count.
 */
export const seedProductData = async (persona: Persona) => {
  if (!persona.products?.en.length) return 0;
  const inserted = await productModel.insertMany(withBothLangs(persona.products));
  return inserted.length;
};
