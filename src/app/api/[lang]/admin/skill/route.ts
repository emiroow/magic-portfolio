import { createAdminCrud } from '@/lib/crud';
import { forUpdate } from '@/lib/validations';
import { skillSchema } from '@/features/skills/schema';
import { skillModel } from '@/features/skills/model';

// Admin CRUD for skills (guarded by session + zod validation).
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: skillModel,
  createSchema: skillSchema,
  updateSchema: forUpdate(skillSchema),
  sort: { name: 1 },
});
