import { createAdminCrud } from '@/lib/crud';
import { normalizeDonation } from '@/lib/data';
import { donationSchema, donationUpdateSchema } from '@/lib/validations';
import { donationModel } from '@/models/donation';

// Admin CRUD for payment methods (guarded by session + zod validation). The list is
// normalized on the way out, so a document saved before destinations existed is
// edited in the shape the page actually renders.
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: donationModel,
  createSchema: donationSchema,
  updateSchema: donationUpdateSchema,
  sort: { order: 1, createdAt: -1 },
  transform: normalizeDonation,
});
