import { connectDB } from '@/config/dbConnection';
import { blogModel } from '@/features/blog/model';
import { certificateModel } from '@/features/certificate/model';
import { donationModel } from '@/features/support/donation.model';
import { educationModel } from '@/features/education/model';
import { productModel } from '@/features/products/model';
import { profileModel } from '@/features/profile/model';
import { projectModel } from '@/features/projects/model';
import { skillModel } from '@/features/skills/model';
import { socialModel } from '@/features/socials/model';
import { supporterModel } from '@/features/support/supporter.model';
import { workModel } from '@/features/experience/model';
import mongoose from 'mongoose';
import { PERSONAS, describePersonas, getPersona } from '@/seed/personas/index';
import { CERTIFICATES, seedCertificateData } from '@/seed/certificate.seed';
import { formatIssues, seedErrors, validatePersona, type SeedIssue } from '@/seed/personas/validate';
import type { Persona } from '@/seed/personas/types';
import { seedBlogData } from '@/seed/blog.seed';
import { seedDonationData } from '@/seed/donation.seed';
import { seedEducationData } from '@/seed/education.seed';
import { seedUserData } from '@/seed/profile.seed';
import { seedProductData } from '@/seed/product.seed';
import { seedProjectData } from '@/seed/project.seed';
import { seedSkillsData } from '@/seed/skill.seed';
import { seedSocialData } from '@/seed/social.seed';
import { seedSupporterData } from '@/seed/supporter.seed';
import { seedWorkData } from '@/seed/work.seed';

/** One collection to fill, and the label used in the summary line. */
type Step = readonly [label: string, run: (persona: Persona) => Promise<number>];

/**
 * The support rails and the wall built from them. Methods go first: every gift points
 * at a destination of a method that has to exist by then, so the two cannot run side
 * by side with the rest.
 */
const seedSupportData: Step[1] = async persona => {
  const methods = await seedDonationData(persona);
  return seedSupporterData(methods);
};

const STEPS: readonly Step[] = [
  ['profile', seedUserData],
  ['education', seedEducationData],
  ['certificates', seedCertificateData],
  ['work', seedWorkData],
  ['projects', seedProjectData],
  ['products', seedProductData],
  ['skills', seedSkillsData],
  ['socials', seedSocialData],
  ['blog', seedBlogData],
  ['support', seedSupportData],
];

/** `FORCE_SEED=true` or `--force`: drop the database before seeding. */
const isForced = (argv: string[] = process.argv) => process.env.FORCE_SEED === 'true' || argv.includes('--force');

/** The audit for one persona, against the credential set its career inherits. */
const issuesOf = (persona: Persona): SeedIssue[] => validatePersona(persona, persona.certificates ?? CERTIFICATES[persona.id]);

/**
 * The documents this persona will actually insert, audited before anything is written.
 *
 * A seed that half-succeeds is worse than one that refuses to run: the English site ends up
 * with a project the Persian site does not have. So the audit runs first and its errors abort
 * the run, while the craft warnings are printed for whoever is polishing the content.
 */
const auditPersona = (persona: Persona) => {
  const issues = issuesOf(persona);
  formatIssues(persona.id, issues).forEach(line => console.log(line));

  const errors = seedErrors(issues);
  if (errors.length) {
    throw new Error(`${errors.length} problem(s) in the "${persona.id}" persona — fix them, or run \`npm run seed:check\` for the full report.`);
  }
};

/**
 * `--check`: audit every persona, no database required. Prints the same report a seed run
 * prints, across all identities, and exits non-zero when any of them would insert bad content.
 */
const checkPersonas = (argv: string[] = process.argv) => {
  const list = argv.some(arg => arg.startsWith('--persona=')) ? [getPersona(argv)] : Object.values(PERSONAS);
  const perPersona = list.map(persona => ({ persona, issues: issuesOf(persona) }));

  const lines = perPersona.flatMap(({ persona, issues }) => formatIssues(persona.id, issues));
  const errors = perPersona.reduce((total, { issues }) => total + seedErrors(issues).length, 0);
  const warnings = perPersona.reduce((total, { issues }) => total + (issues.length - seedErrors(issues).length), 0);

  console.log(lines.length ? lines.join('\n') : `${list.length} persona(s) clean.`);
  console.log(`\nSeed audit: ${errors} error(s), ${warnings} warning(s) across ${list.length} persona(s).`);
  return errors;
};

/**
 * Insert the demo persona. Skips when the database already has content,
 * unless `--force` (or `FORCE_SEED=true`) drops it first.
 */
export const seedData = async (persona: Persona = getPersona()) => {
  const owner = persona.profile.en[0].fullName;
  console.log(`Persona: ${persona.id} — ${persona.label} (${owner})`);

  auditPersona(persona);

  await connectDB();

  if (isForced()) {
    await mongoose.connection.dropDatabase();
    console.log('Database dropped (--force).');
  }

  const counts = await Promise.all([
    educationModel.countDocuments(),
    certificateModel.countDocuments(),
    projectModel.countDocuments(),
    productModel.countDocuments(),
    socialModel.countDocuments(),
    profileModel.countDocuments(),
    workModel.countDocuments(),
    skillModel.countDocuments(),
    blogModel.countDocuments(),
    donationModel.countDocuments(),
    supporterModel.countDocuments(),
  ]);

  if (counts.some(count => count > 0)) {
    console.log('Database is not empty; skipping seed. Add --force to reset it, or --list-personas to see the identities.');
    return;
  }

  const inserted = await Promise.all(STEPS.map(([, run]) => run(persona)));
  const summary = STEPS.map(([label], index) => `${label} ${inserted[index]}`).join(' · ');
  console.log(`Seed data inserted successfully (${summary}).`);
};

/** `--list-personas` prints without touching the database; `--check` audits without writing. */
const run = async () => {
  if (process.argv.includes('--list-personas')) {
    console.log(describePersonas().join('\n'));
    return;
  }
  if (process.argv.includes('--check')) {
    if (checkPersonas()) process.exitCode = 1;
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
