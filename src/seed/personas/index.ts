import { backend } from './backend';
import { designer } from './designer';
import { frontend } from './frontend';
import { fullstack } from './fullstack';
import type { Persona, PersonaId } from './types';

/**
 * Demo identities, keyed by the id used in `--persona=<id>` and `SEED_PERSONA`.
 *
 * Adding a persona means one new module exporting a `Persona` and one entry
 * here — every seed module reads whatever it finds in the resolved persona.
 */
export const PERSONAS: Record<PersonaId, Persona> = { frontend, backend, fullstack, designer };

/** Used when neither the flag nor the environment variable is set. */
export const DEFAULT_PERSONA: PersonaId = 'frontend';

const FLAG = '--persona=';

/** `--persona=<id>` wins over `SEED_PERSONA`, which wins over the default. */
export function resolvePersonaId(argv: string[] = process.argv): PersonaId {
  const requested =
    argv
      .find(arg => arg.startsWith(FLAG))
      ?.slice(FLAG.length)
      .trim() ||
    process.env.SEED_PERSONA?.trim() ||
    DEFAULT_PERSONA;
  const id = requested.toLowerCase() as PersonaId;

  if (!PERSONAS[id]) {
    throw new Error(
      `Unknown persona "${requested}". Available: ${Object.keys(PERSONAS).join(', ')}. Use \`npm run seed -- --list-personas\` for details.`
    );
  }

  return id;
}

/** The persona the rest of the seed modules will read from. */
export function getPersona(argv: string[] = process.argv): Persona {
  return PERSONAS[resolvePersonaId(argv)];
}

/** Rows printed by `--list-personas`: id, role and per-locale content counts. */
export function describePersonas(): string[] {
  const header = ['Available personas (default: ' + DEFAULT_PERSONA + ')', ''];

  const rows = Object.values(PERSONAS).map(persona => {
    const name = persona.profile.en[0].fullName;
    const counts = [
      `${persona.works.en.length} roles`,
      `${persona.projects.en.length} projects`,
      `${persona.products?.en.length ?? 0} products`,
      `${persona.posts.en.length} posts`,
      `${persona.skills.en.length} skills`,
    ].join(', ');

    return `  ${persona.id.padEnd(10)} ${persona.label} — ${name} (${counts})`;
  });

  return [...header, ...rows, '', 'Usage: npm run seed -- --persona=<id> --force'];
}
