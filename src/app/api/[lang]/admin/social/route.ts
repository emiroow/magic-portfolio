import { createAdminCrud } from '@/lib/crud';
import { forUpdate } from '@/lib/validations';
import { socialSchema } from '@/features/socials/schema';
import { socialModel } from '@/features/socials/model';

// Admin CRUD for social profiles (guarded by session + zod validation).
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: socialModel,
  createSchema: socialSchema,
  updateSchema: forUpdate(socialSchema),
});
