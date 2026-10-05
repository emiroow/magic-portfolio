import { createAdminCrud } from '@/lib/crud';
import { blogSchema } from '@/features/blog/schema';
import { forUpdate } from '@/lib/validations';
import { blogModel } from '@/features/blog/model';

// Admin CRUD for blog posts (guarded by session + zod validation).
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: blogModel,
  createSchema: blogSchema,
  updateSchema: forUpdate(blogSchema),
  sort: { createdAt: -1 },
});
