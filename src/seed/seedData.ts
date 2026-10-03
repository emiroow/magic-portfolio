import { connectDB } from '@/config/dbConnection';
import { blogModel } from '@/models/blog';
import { educationModel } from '@/models/education';
import { productModel } from '@/models/product';
import { profileModel } from '@/models/profile';
import { projectModel } from '@/models/project';
import { skillModel } from '@/models/skill';
import { socialModel } from '@/models/social';
import { workModel } from '@/models/work';
import mongoose from 'mongoose';
import { describePersonas, getPersona } from './personas';
import type { Persona } from './personas/types';
import { seedBlogData } from './blog.seed';
import { seedEducationData } from './education.seed';
import { seedUserData } from './profile.seed';
import { seedProductData } from './product.seed';
import { seedProjectData } from './project.seed';
import { seedSkillsData } from './skill.seed';
import { seedSocialData } from './social.seed';
import { seedWorkData } from './work.seed';

/** One collection to fill, and the label used in the summary line. */
type Step = readonly [label: string, run: (persona: Persona) => Promise<number>];

const STEPS: readonly Step[] = [
  ['profile', seedUserData],
  ['education', seedEducationData],
  ['work', seedWorkData],
  ['projects', seedProjectData],
  ['products', seedProductData],
  ['skills', seedSkillsData],
  ['socials', seedSocialData],
  ['blog', seedBlogData],
];

/** `FORCE_SEED=true` or `--force`: drop the database before seeding. */
const isForced = (argv: string[] = process.argv) => process.env.FORCE_SEED === 'true' || argv.includes('--force');

/**
 * Insert the demo persona. Skips when the database already has content,
 * unless `--force` (or `FORCE_SEED=true`) drops it first.
 */
export const seedData = async (persona: Persona = getPersona()) => {
  const owner = persona.profile.en[0].fullName;
  console.log(`Persona: ${persona.id} — ${persona.label} (${owner})`);

  await connectDB();

  if (isForced()) {
    await mongoose.connection.dropDatabase();
    console.log('Database dropped (--force).');
  }

  const counts = await Promise.all([
    educationModel.countDocuments(),
    projectModel.countDocuments(),
    productModel.countDocuments(),
    socialModel.countDocuments(),
    profileModel.countDocuments(),
    workModel.countDocuments(),
    skillModel.countDocuments(),
    blogModel.countDocuments(),
  ]);

  if (counts.some(count => count > 0)) {
    console.log('Database is not empty; skipping seed. Add --force to reset it, or --list-personas to see the identities.');
    return;
  }

  const inserted = await Promise.all(STEPS.map(([, run]) => run(persona)));
  const summary = STEPS.map(([label], index) => `${label} ${inserted[index]}`).join(' · ');
  console.log(`Seed data inserted successfully (${summary}).`);
};

/** `--list-personas` prints without touching the database. */
const run = async () => {
  if (process.argv.includes('--list-personas')) {
    console.log(describePersonas().join('\n'));
    return;
  }
  await seedData();
};

// Run directly: `npm run seed`, `npm run seed:force`, `npm run seed -- --persona=<id>`.
if (process.argv[1] && process.argv[1].includes('seedData')) {
  run()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Seeding failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
