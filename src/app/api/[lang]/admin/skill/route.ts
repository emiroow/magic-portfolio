import { createAdminCrud } from '@/lib/crud';
import { forUpdate } from '@/lib/validations';
import { skillSchema } from '@/features/skills/schema';
import { skillModel } from '@/features/skills/model';

// Admin CRUD for skills (guarded by session + zod validation).
// Priority first, then the locale's reading order — the same sort the home page applies,
// so the dashboard list is the public list.
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: skillModel,
  createSchema: skillSchema,
  updateSchema: forUpdate(skillSchema),
  sort: { order: 1, name: 1 },
});
