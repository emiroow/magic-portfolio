import { createAdminCrud } from '@/lib/crud';
import { certificateSchema } from '@/features/certificate/schema';
import { certificateModel } from '@/features/certificate/model';
import { normalizeCertificate } from '@/features/certificate/queries';
import { forUpdate } from '@/lib/validations';

// Admin CRUD for certificates (guarded by session + zod validation). The list is
// normalized on the way out, so a credential saved before the résumé flag existed
// is edited in the shape the dashboard toggle and the print sheet both read.
export const { GET, POST, PUT, DELETE } = createAdminCrud({
  model: certificateModel,
  createSchema: certificateSchema,
  updateSchema: forUpdate(certificateSchema),
  sort: { issueDate: -1, createdAt: -1 },
  transform: normalizeCertificate,
});
