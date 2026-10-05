import { createAdminCrud } from '@/lib/crud';
import { forUpdate } from '@/lib/validations';
import { projectSchema } from '@/features/projects/schema';
import { projectModel } from '@/features/projects/model';

// Admin CRUD for projects (guarded by session + zod validation).
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: projectModel,
  createSchema: projectSchema,
  updateSchema: forUpdate(projectSchema),
  sort: { createdAt: -1 },
});
