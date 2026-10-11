import { optionalImagePath, optionalString, optionalUrl } from '@/lib/validations';
import { z } from 'zod';

/**
 * Server-side shape of a certificate.
 *
 * Only the name is required: a credential an owner cannot find the issuer page for,
 * or one that carries no scan, is still worth listing. The dates stay free-form
 * strings because the month picker writes `YYYY/MM` while an imported record may
 * hold an ISO stamp, and `formatYearMonthLocal` reads both.
 */
export const certificateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  issuer: optionalString(),
  href: optionalUrl(),
  logoUrl: optionalImagePath(),
  credentialId: optionalString(),
  issueDate: optionalString(),
  expirationDate: optionalString(),
  description: optionalString(),
  featured: z.boolean().optional(),
});

export type CertificateInput = z.infer<typeof certificateSchema>;
