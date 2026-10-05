import { createAdminCrud } from '@/lib/crud';
import { forUpdate } from '@/lib/validations';
import { productSchema } from '@/features/products/schema';
import { productModel } from '@/features/products/model';

// Admin CRUD for products (guarded by session + zod validation).
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: productModel,
  createSchema: productSchema,
  updateSchema: forUpdate(productSchema),
  sort: { createdAt: -1 },
});
