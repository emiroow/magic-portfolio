import { createAdminCrud } from '@/lib/crud';
import { workCreateSchema, workUpdateSchema } from '@/features/experience/schema';
import { workModel } from '@/features/experience/model';

// Admin CRUD for work experiences (guarded by session + zod validation).
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: workModel,
  createSchema: workCreateSchema,
  updateSchema: workUpdateSchema,
  sort: { start: -1 },
});
