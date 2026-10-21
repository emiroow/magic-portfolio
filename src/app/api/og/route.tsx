import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CSSProperties } from 'react';
import { getProfile } from '@/features/profile/queries';
import { brandedTitle, personName, SITE_SUFFIX, site } from '@/lib/seo';

/**
 * Dynamic Open Graph image endpoint (`GET /api/og?title=...`).
 *
 * The card is the site's own section header, drawn on its dark surface: the hairline grid that
 * dissolves before the content starts, an eyebrow row of mark + dash + name with the host at the
 * far reading end, the page headline, a rule that fades out along the direction of the text, and
 * the owner's role under it. Every value comes from `globals.css` — the dark tokens, the two
 * self-hosted faces, `.surface-grid`, `.rule-fade` — and every one of them mirrors, so a Persian
 * card is the same composition read from its right edge rather than a flipped afterthought.
 *
 * With no `title` it becomes the brand card: the person and their role. So a share from anywhere
 * looks intentional without any extra configuration.
 */
const WIDTH = 1200;
const HEIGHT = 630;
const PAD = 72;
const CONTENT = WIDTH - PAD * 2;

/* The dark theme's tokens written out as literals: Satori has no CSS variables to read. */
const SURFACE = '#0a0a0a'; // --background
const INK = '#f7f7f7'; // --foreground
const MUTED = '#a6a6a6'; // --muted-foreground
const FAINT = '#737373'; // one step below muted, for the host
const RULE = '#2b2b2b'; // --border
const GRID = 'rgba(247, 247, 247, 0.05)'; // --foreground at the 5% the site's grid is drawn in

/**
 * An average character as a fraction of the size — a wrapping budget, not a measurement of any
 * font's metrics. It has to be wider for Persian than the ink suggests, because the engine
 * *measures* a Persian row some 25% broader than it later draws it: budget to the ink and a row
 * still trips into a second line, and every line that gets broken is justified to fill the card,
 * which sprouts gaps of a hundred pixels between words that were never typed there.
 */
const EM = { latin: 0.52, persian: 0.72 };
/** Headline sizes, largest first: the card takes the biggest one a headline still fits. */
const HEAD_SIZES = [76, 66, 56];
const HEAD_LINES = 3;
const HEAD_LEADING = 1.12;
const HEAD_LEADING_RTL = 1.5; // Persian needs the room; the site gives its headings 1.4 and up.
const ROLE_SIZE = 30;
const ROLE_LINES = 2;

/**
 * The three faces the site ships, taken once per warm instance.
 *
 * Satori bundles one Latin-only typeface and dies on Persian text while applying *that* font's
 * GSUB table (`lookupType: 5 - substFormat: 3 is not yet supported`), which is what used to reset
 * the connection on every `lang=fa` card. The site's own faces answer it and keep the card in the
 * same hand as the page behind it: Roboto where Latin is read, Estedad where Persian is, each
 * with the other behind it so a mixed headline still has somewhere to fall back to.
 *
 * Two sources, because the two hosts this runs on differ: a server has `public/` on disk, while
 * Vercel serves it from a CDN and leaves the function's filesystem without it. A failed read is
 * dropped rather than remembered, so one unreachable request cannot poison an instance.
 */
const faces = new Map<string, Promise<Buffer | ArrayBuffer>>();

function face(req: Request, file: string) {
  let taken = faces.get(file);
  if (!taken) {
    taken = readFace(req, file).catch((error: unknown) => {
      faces.delete(file);
      throw error;
    });
    faces.set(file, taken);
  }
  return taken;
}

async function readFace(req: Request, file: string) {
  try {
    return await readFile(join(process.cwd(), 'public/fonts', file));
  } catch {
    const res = await fetch(new URL(`/fonts/${file}`, req.url), { cache: 'no-store' });
    if (!res.ok) throw new Error(`${file} came back ${res.status}`);
    return res.arrayBuffer();
  }
}

/**
 * Text as Satori is able to draw it.
 *
 * The engine paints a zero-width non-joiner as a visible vertical bar, so every نیم‌فاصله in
 * `توسعه‌دهنده` would arrive as a stray cursor sitting in the middle of a word. A space is the
 * substitution plain text has always made in its place: it never misjoins the two halves, and at
 * these sizes it is barely wider than the gap the reader expects.
 */
function drawable(text: string) {
  return text.replace(/\u200c/g, ' ');
}

/**
 * Break a line into rows of at most `perLine` characters, in reading order.
 *
 * Wrapping happens here rather than being left to Satori for two reasons: the card has to know how
 * many rows a headline will take before it can choose the size, and a Persian stack is only read
 * top-to-bottom if its rows were cut in logical order — Satori flows rows left to right, so a row
 * it broke itself would land in the wrong place in the stack.
 */
function wrap(text: string, perLine: number): string[] {
  const rows: string[] = [];
  let row = '';

  for (const word of text.trim().split(/\s+/)) {
    if (row && `${row} ${word}`.length > perLine) {
      rows.push(row);
      row = word;
    } else {
      row = row ? `${row} ${word}` : word;
    }
  }
  if (row) rows.push(row);

  return rows;
}

/** The headline at the largest size the card can hold, down to an ellipsis when nothing fits. */
function headline(text: string, em: number) {
  for (const size of HEAD_SIZES) {
    const rows = wrap(text, Math.floor(CONTENT / (size * em)));
    if (rows.length <= HEAD_LINES) return { size, rows };
  }

  const size = HEAD_SIZES[HEAD_SIZES.length - 1];
  const rows = wrap(text, Math.floor(CONTENT / (size * em))).slice(0, HEAD_LINES);
  rows[rows.length - 1] += '…';
  return { size, rows };
}

/**
 * The rows a Persian reader gets: Satori shapes each run correctly — letters join and take their
 * final forms — but it applies no bidi reordering, so a row of logical-order text comes out
 * word-reversed. Reversing the runs inside an already-cut row puts the first word at the right
 * edge, where a browser would have put it, and leaves an em dash or a Latin word travelling with
 * its neighbours.
 */
function reverseRuns(rows: string[]) {
  return rows.map(row => row.split(' ').reverse().join(' '));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  // `?lang=fa` renders the Persian profile; English is the default card.
  const fa = url.searchParams.get('lang') === 'fa';
  const lang = fa ? 'fa' : 'en';
  const profile = await getProfile(lang);

  const name = personName(profile);
  const rawTitle = url.searchParams.get('title')?.slice(0, 120) || name || brandedTitle(profile, lang);
  const role = profile?.jobTitle?.trim() || '';
  const host = site ? site.replace(/^https?:\/\//, '') : '';

  // The brand card headlines the person, so its eyebrow carries the site word instead of the name
  // twice; every other page headlines its own subject and is signed by who published it.
  const signed = name && rawTitle.includes(name) ? SITE_SUFFIX[lang] : name || SITE_SUFFIX[lang];

  const em = fa ? EM.persian : EM.latin;
  const head = headline(drawable(rawTitle), em);
  const titleRows = fa ? reverseRuns(head.rows) : head.rows;
  const wrappedRole = wrap(drawable(role), Math.floor(CONTENT / (ROLE_SIZE * em))).slice(0, ROLE_LINES);
  const roleRows = fa ? reverseRuns(wrappedRole) : wrappedRole;
  // One row of text, held to the reading edge. `textAlign` is inert in this engine, so the row is
  // a flex line and flexbox does the placing; `nowrap` keeps a row that is measured wider than it
  // draws from breaking into a second line, which is what makes a Persian row justify.
  const row = (text: string, style: CSSProperties) => (
    <div key={text} style={{ ...style, display: 'flex', justifyContent: fa ? 'flex-end' : 'flex-start', whiteSpace: 'nowrap' }}>
      {text}
    </div>
  );

  const fonts = [
    { name: 'Roboto', data: await face(req, 'Roboto-Regular.ttf'), weight: 400 as const },
    { name: 'Roboto', data: await face(req, 'Roboto-Bold.ttf'), weight: 700 as const },
    { name: 'Estedad', data: await face(req, 'Estedad-Regular.ttf'), weight: 400 as const },
  ];

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        padding: PAD,
        backgroundColor: SURFACE,
        color: INK,
        fontFamily: fa ? 'Estedad, Roboto' : 'Roboto, Estedad',
      }}
    >
      {/* `.surface-grid`, the same hairline grid and the same dissolve. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 300,
          backgroundImage: `repeating-linear-gradient(to right, ${GRID} 0px, ${GRID} 1px, transparent 1px, transparent 32px), repeating-linear-gradient(to bottom, ${GRID} 0px, ${GRID} 1px, transparent 1px, transparent 32px)`,
          maskImage: 'linear-gradient(to bottom, black, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 80%)',
        }}
      />

      {/* Eyebrow: mark, dash, name — and the host held to the far end of the reading direction. */}
      <div style={{ display: 'flex', flexDirection: fa ? 'row-reverse' : 'row', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 10, height: 10, backgroundColor: INK }} />
        <div style={{ width: 34, height: 1, backgroundColor: RULE }} />
        {/* Tracking is a Latin-only treatment: letter-spacing breaks the joining of Persian. */}
        <div style={{ fontSize: 22, color: MUTED, letterSpacing: fa ? 0 : 4, textTransform: 'uppercase' }}>{drawable(signed)}</div>
        <div style={{ flexGrow: 1 }} />
        {host ? <div style={{ fontSize: 22, color: FAINT, letterSpacing: fa ? 0 : 2 }}>{host}</div> : null}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 }}>
        {titleRows.map(text =>
          row(text, {
            fontSize: head.size,
            fontWeight: fa ? 400 : 700,
            lineHeight: fa ? HEAD_LEADING_RTL : HEAD_LEADING,
            letterSpacing: fa ? 0 : -1.5,
          })
        )}
      </div>

      {/* `.rule-fade`, whose gradient turns to follow the text. */}
      <div style={{ height: 1, marginTop: 38, backgroundImage: `linear-gradient(to ${fa ? 'left' : 'right'}, ${RULE}, transparent)` }} />

      {role ? (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22 }}>
          {roleRows.map(text => row(text, { fontSize: ROLE_SIZE, color: MUTED, lineHeight: fa ? 1.7 : 1.4 }))}
        </div>
      ) : null}
    </div>,
    { width: WIDTH, height: HEIGHT, fonts }
  );
}
