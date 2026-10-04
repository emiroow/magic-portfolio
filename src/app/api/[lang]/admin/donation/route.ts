import { createAdminCrud } from '@/lib/crud';
import { donationSchema, donationUpdateSchema } from '@/lib/validations';
import { donationModel } from '@/models/donation';

// Admin CRUD for support options (guarded by session + zod validation).
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: donationModel,
  createSchema: donationSchema,
  updateSchema: donationUpdateSchema,
  sort: { order: 1, createdAt: -1 },
});
