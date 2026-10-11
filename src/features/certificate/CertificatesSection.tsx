import BlurFade from '@/components/magicui/blur-fade';
import { SectionHeader, type SectionHeadingProps } from '@/components/section-header';
import { Stack } from '@/components/stack';
import { ResumeCard } from '@/components/resume-card';
import { certificatePeriod } from '@/features/certificate/format';
import type { AppLocale } from '@/types';
import type { ICertificate } from '@/features/certificate/types';

interface CertificatesProps extends SectionHeadingProps {
  certificates: ICertificate[];
  locale: AppLocale;
  /** Copy used when a credential does not lapse. */
  noExpirationLabel: string;
  /** Prefix for the identifier printed on the credential. */
  credentialLabel: string;
  delay?: number;
}

/** Credentials earned: one divided surface, newest first, expandable on demand. */
export function Certificates({
  index,
  label,
  title,
  description,
  meta,
  certificates,
  locale,
  noExpirationLabel,
  credentialLabel,
  delay = 0,
}: CertificatesProps) {
  if (!certificates.length) return null;

  /** The printed identifier, in an LTR run so it cannot be reordered inside Persian copy. */
  const credential = (certificate: ICertificate) => {
    const id = certificate.credentialId?.trim();
    if (!id) return undefined;
    return (
      <>
        {credentialLabel} <bdi dir="ltr">{id}</bdi>
      </>
    );
  };

  return (
    <section id="certificates" aria-labelledby="certificates-heading">
      <SectionHeader index={index} label={label} title={title} description={description} meta={meta} id="certificates-heading" delay={delay} />
      <Stack>
        {certificates.map((certificate, id) => (
          <BlurFade key={certificate._id ?? `${certificate.title}-${id}`} delay={delay + 0.06 + id * 0.05} inView>
            <ResumeCard
              logoUrl={certificate.logoUrl}
              altText={certificate.issuer || certificate.title}
              title={certificate.title}
              subtitle={certificate.issuer}
              href={certificate.href}
              period={certificatePeriod(certificate, locale, noExpirationLabel)}
              meta={credential(certificate)}
              description={certificate.description}
            />
          </BlurFade>
        ))}
      </Stack>
    </section>
  );
}
