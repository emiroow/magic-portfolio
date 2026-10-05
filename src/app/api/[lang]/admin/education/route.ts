import { createAdminCrud } from '@/lib/crud';
import { educationSchema } from '@/features/education/schema';
import { forUpdate } from '@/lib/validations';
import { educationModel } from '@/features/education/model';

// Admin CRUD for education entries (guarded by session + zod validation).
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: educationModel,
  createSchema: educationSchema,
  updateSchema: forUpdate(educationSchema),
  sort: { start: -1 },
});
