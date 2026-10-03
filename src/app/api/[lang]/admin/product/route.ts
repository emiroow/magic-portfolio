import { createAdminCrud } from '@/lib/crud';
import { forUpdate, productSchema } from '@/lib/validations';
import { productModel } from '@/models/product';

// Admin CRUD for products (guarded by session + zod validation).
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: productModel,
  createSchema: productSchema,
  updateSchema: forUpdate(productSchema),
  sort: { createdAt: -1 },
});
