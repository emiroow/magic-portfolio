import { BlogCard } from '@/features/blog/BlogCard';
import BlurFade from '@/components/magicui/blur-fade';
import { SectionHeader, type SectionHeadingProps } from '@/components/section-header';
import { buttonVariants } from '@/components/ui/button';
import { HOME_BLOG_SLOTS } from '@/features/blog/constants';
import { cn } from '@/lib/utils';
import type { AppLocale } from '@/types';
import type { IBlog } from '@/features/blog/types';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Posts the home section may show. The owner picks them in the dashboard
 * ("show on the home page", up to `HOME_BLOG_SLOTS` of them) and those picks
 * lead the row; any leftover slot is filled by the newest published post so the
 * section never renders half empty. Everything else lives on `/blog`.
 */
const PREVIEW_COUNT = HOME_BLOG_SLOTS;

interface BlogProps extends SectionHeadingProps {
  posts: IBlog[];
  /** Active locale, used to build the localized post-page links. */
  locale: string;
  lang: AppLocale;
  /** Label for the archive link. */
  viewAllLabel: string;
  delay?: number;
}

/** Grid of the published posts, capped to a preview set. */
export function Blog({ index, label, title, description, meta, posts, locale, lang, viewAllLabel, delay = 0 }: BlogProps) {
  if (!posts.length) return null;

  const chosen = posts.filter(post => post.featured);
  const preview = [...chosen, ...posts.filter(post => !post.featured)].slice(0, PREVIEW_COUNT);

  return (
    <section id="blog" aria-labelledby="blog-heading">
      <SectionHeader index={index} label={label} title={title} description={description} meta={meta} id="blog-heading" delay={delay} />
      {/* Three fixed tracks from `lg` up, so one or two posts keep the same
          measure they would have in a full row instead of stretching. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {preview.map((post, id) => (
          <BlurFade key={post._id ?? post.slug} delay={delay + 0.06 + id * 0.05} inView className="h-full">
            <BlogCard post={post} locale={locale} lang={lang} priority={id < 3} className="h-full" />
          </BlurFade>
        ))}
      </div>

      {posts.length > preview.length && (
        <BlurFade delay={delay + 0.1} inView>
          <div className="mt-6 flex justify-center">
            <Link href={`/${locale}/blog`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-full')}>
              {viewAllLabel}
              <ArrowRight className="ms-2 size-3.5 rtl:-scale-x-100" aria-hidden />
            </Link>
          </div>
        </BlurFade>
      )}
    </section>
  );
}
