import { createAdminCrud } from '@/lib/crud';
import { forUpdate } from '@/lib/validations';
import { workSchema } from '@/features/experience/schema';
import { workModel } from '@/features/experience/model';

// Admin CRUD for work experiences (guarded by session + zod validation).
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: workModel,
  createSchema: workSchema,
  updateSchema: forUpdate(workSchema),
  sort: { start: -1 },
});
