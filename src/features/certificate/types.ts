import type { AppLocale } from '@/types';

/**
 * A credential the owner earned: a course completion, a professional exam, an
 * award or a licence.
 *
 * Shaped like the other timeline records (`IEducation`, `IWork`) on purpose —
 * the same optional logo in the same gutter, the same `YYYY/MM` date strings the
 * month picker writes, the same verification link — so a certificate can be
 * listed, edited and printed by the parts those two already use.
 */
export interface ICertificate {
  _id?: string;
  /** Name of the credential, e.g. `AWS Certified Solutions Architect`. */
  title?: string;
  /** Body that issued it, e.g. `Amazon Web Services`. */
  issuer?: string;
  /** Verification page a reader can check the credential against. */
  href?: string;
  /** Issuer mark, or a scan of the certificate itself. */
  logoUrl?: string;
  /** Identifier printed on the credential; what a verifier is asked for. */
  credentialId?: string;
  /** ISO date or `YYYY/MM` string. */
  issueDate?: string;
  /** ISO date or `YYYY/MM` string; empty means the credential does not lapse. */
  expirationDate?: string;
  /** What was covered or demonstrated, disclosed on demand. */
  description?: string;
  /** Promoted onto the generated résumé sheet. */
  featured?: boolean;
  lang: AppLocale;
}
