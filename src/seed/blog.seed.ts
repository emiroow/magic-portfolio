import { blogModel } from '@/features/blog/model';
import { withBothLangs, type Localized, type Persona, type PersonaPost } from '@/seed/personas/types';

const DAY = 24 * 60 * 60 * 1000;

/** The newest publication date in the persona, used to date the notice post. */
function latestDate(posts: PersonaPost[]): number {
  return Math.max(...posts.map(post => Date.parse(post.createdAt)));
}

/**
 * A "read me first" post, seeded after every persona so nobody mistakes demo
 * content for real work. It is stamped one day newer than the newest persona
 * post, which keeps it at the top of the list.
 */
const noticePosts = (createdAt: string): Localized<PersonaPost> => ({
  en: [
    {
      title: 'About this demo content',
      slug: 'about-this-demo-content',
      summary: 'Everything on this site came from the seed script and belongs to a fictional persona. Here is how to replace it.',
      tags: ['demo', 'dashboard', 'seed'],
      published: true,
      createdAt,
      content: [
        'The profile, the roles, the projects and the writing on this site were inserted by `npm run seed`. They describe a fictional persona, so please replace them before publishing anything real.',
        '',
        '- **Edit it** from `/dashboard`. Every section is data in MongoDB, not code in the repository.',
        '- **Switch identity** with `npm run seed -- --persona=<id> --force`, and list the available personas with `--list-personas`.',
        '- **Skip the placeholder media** by seeding with `SEED_IMAGES=false`; the site falls back to its own monogram placeholders.',
        '',
        'Images, links, metrics and company names are invented for the demo. Nothing here should be quoted as a reference.',
      ].join('\n'),
    },
  ],
  fa: [
    {
      title: 'درباره محتوای نمونه',
      slug: 'about-this-demo-content',
      summary: 'همه‌چیزی که در این سایت می‌بینید از اسکریپت seed آمده و متعلق به یک شخصیت داستانی است. اینجا نحوه جایگزینی‌اش آمده.',
      tags: ['demo', 'dashboard', 'seed'],
      published: true,
      createdAt,
      content: [
        'پروفایل، سوابق شغلی، پروژه‌ها و نوشته‌های این سایت با `npm run seed` درج شده‌اند و شخصیتی ساختگی را توصیف می‌کنند؛ پیش از انتشار هر محتوای واقعی جای آن‌ها را پر کنید.',
        '',
        '- **ویرایش از `/dashboard`** هر بخش داده‌ای در MongoDB است، نه کد در ریپو.',
        '- **تغییر شخصیت** با `npm run seed -- --persona=<id> --force` و دیدن فهرست شخصیت‌ها با `--list-personas`.',
        '- **رد کردن تصویرهای جانشین** با seed شدن در `SEED_IMAGES=false`؛ در این حالت سایت جای تصویرها را با مونوگرام‌های خودش پر می‌کند.',
        '',
        'تصویرها، نشانی‌ها، رقم‌ها و نام شرکت‌ها همه برای نمونه ساخته شده‌اند و هیچ‌کدام نباید به‌عنوان منبع نقل شوند.',
      ].join('\n'),
    },
  ],
});

/** Blog posts (Markdown bodies), plus the demo notice. Returns the inserted count. */
export const seedBlogData = async (persona: Persona) => {
  const newest = new Date(latestDate(persona.posts.en) + DAY).toISOString();
  const inserted = await blogModel.insertMany([...withBothLangs(persona.posts), ...withBothLangs(noticePosts(newest))]);
  return inserted.length;
};
