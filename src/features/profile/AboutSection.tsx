import BlurFade from '@/components/magicui/blur-fade';
import { SectionHeader, type SectionHeadingProps } from '@/components/section-header';
import Markdown from 'react-markdown';

interface AboutProps extends SectionHeadingProps {
  /** Long-form bio, rendered as Markdown. */
  description?: string;
  delay?: number;
}

/** Long-form bio rendered from Markdown inside the shared header rhythm. */
export function About({ index, label, title, description, delay = 0 }: AboutProps) {
  if (!description) return null;

  return (
    <section id="about" aria-labelledby="about-heading">
      <SectionHeader index={index} label={label} title={title} id="about-heading" delay={delay} />
      <BlurFade delay={delay + 0.06} inView>
        <Markdown className="prose prose-neutral max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground rtl:leading-[1.9] dark:prose-invert sm:text-base prose-a:text-foreground prose-a:underline-offset-4 prose-p:my-0 [&_p+p]:mt-4">
          {description}
        </Markdown>
      </BlurFade>
    </section>
  );
}
