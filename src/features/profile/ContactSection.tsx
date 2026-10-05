import { iconDecider } from '@/components/icons';
import BlurFade from '@/components/magicui/blur-fade';
import { ContactTileContent, contactTileClass } from '@/features/profile/contact-tile';
import { CopyEmail } from '@/features/profile/copy-email';
import { SectionHeader, type SectionHeadingProps } from '@/components/section-header';
import { cn, formatSocialHandle, toDialNumber } from '@/lib/utils';
import type { IProfile } from '@/features/profile/types';
import type { ISocial } from '@/features/socials/types';
import { ArrowUpRight, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface ContactProps extends SectionHeadingProps {
  profile: IProfile;
  socials: ISocial[];
  delay?: number;
}

/** Mirrored in RTL so the arrow keeps pointing "outward". */
const arrowClass = 'size-4 rtl:-scale-x-100';

/**
 * Contact surface: every channel is one tile from the same family, so email,
 * phone and social profiles carry equal visual weight. Handles and numbers
 * are rendered as LTR runs to keep them readable inside the Persian layout.
 */
export async function Contact({ index, label, title, description, profile, socials, delay = 0 }: ContactProps) {
  const t = await getTranslations('sections.contact');
  const tSocial = await getTranslations('navbar.social');

  const links = socials.filter(social => Boolean(social.url)).slice(0, 6);
  const phone = profile.tel?.trim() || '';
  const dial = toDialNumber(phone);

  if (!profile.email && !dial && !links.length) return null;

  // Platform names come from the navbar dictionary: one source of truth.
  const socialLabel = (icon: string, name: string) => {
    const key = icon?.toLowerCase();
    return key && tSocial.has(key) ? tSocial(key) : name;
  };

  return (
    <section id="contact" aria-labelledby="contact-heading">
      <SectionHeader index={index} label={label} title={title} description={description} id="contact-heading" delay={delay} />

      <BlurFade delay={delay + 0.06} inView>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {profile.email && <CopyEmail email={profile.email} label={t('emailLabel')} className="lg:col-span-2" />}

          {dial && (
            <a href={`tel:${dial}`} className={cn(contactTileClass, !profile.email && 'lg:col-span-2')}>
              <ContactTileContent
                icon={<Phone className="size-4" />}
                label={t('phoneLabel')}
                value={phone}
                trailing={<ArrowUpRight className={arrowClass} />}
              />
            </a>
          )}

          {links.map(social => (
            <a key={social._id ?? social.url} href={social.url} target="_blank" rel="noopener noreferrer" className={contactTileClass}>
              <ContactTileContent
                icon={iconDecider(social.icon, 'size-4')}
                label={socialLabel(social.icon, social.name)}
                value={formatSocialHandle(social.url)}
                trailing={<ArrowUpRight className={arrowClass} />}
              />
            </a>
          ))}
        </div>
      </BlurFade>
    </section>
  );
}
