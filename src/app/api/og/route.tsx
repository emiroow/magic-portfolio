import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getProfile } from '@/features/profile/queries';
import { brandedTitle, site } from '@/lib/seo';

/**
 * Dynamic Open Graph image endpoint (`GET /api/og?title=...`).
 * Falls back to the brand (`Name | Job Title | Portfolio`) when no title is
 * provided, so every share card looks intentional without extra config.
 */
const SIZE = { width: 1200, height: 630 };

/**
 * The face a Persian card is drawn with, taken once per warm instance.
 *
 * Satori bundles one Latin-only typeface, and reaching for it with Persian text dies while
 * applying that font's own GSUB table — `lookupType: 5 - substFormat: 3 is not yet supported` —
 * which closed the connection before a single pixel was written. The face the site already sets
 * Persian body text in is the answer, and it is the face a reader who follows the card home sees.
 *
 * Two sources, because the two hosts this runs on differ: a server has `public/` on disk, while
 * Vercel serves it from a CDN and leaves the function's filesystem without it. A failed read is
 * dropped rather than remembered, so one unreachable request cannot poison an instance.
 */
let persian: Promise<Buffer | ArrayBuffer> | undefined;

function persianFace(req: Request) {
  persian ??= readPersianFace(req).catch((error: unknown) => {
    persian = undefined;
    throw error;
  });
  return persian;
}

async function readPersianFace(req: Request) {
  try {
    return await readFile(join(process.cwd(), 'public/fonts/Estedad-Regular.ttf'));
  } catch {
    const res = await fetch(new URL('/fonts/Estedad-Regular.ttf', req.url), { cache: 'no-store' });
    if (!res.ok) throw new Error(`Estedad came back ${res.status}`);
    return res.arrayBuffer();
  }
}

/**
 * Persian text as Satori is able to draw it.
 *
 * The engine paints a zero-width non-joiner as a visible vertical bar, so every نیم‌فاصله in
 * `توسعه‌دهنده` would arrive as a stray cursor sitting in the middle of a word. A space is the
 * substitution plain text has always made in its place: it never misjoins the two halves, and
 * at the headline's size it is barely wider than the gap the reader expects.
 */
function drawable(text: string) {
  return text.replace(/\u200c/g, ' ');
}

/**
 * A Persian headline broken into lines a Persian reader can read top to bottom.
 *
 * Satori shapes each run properly — letters join and take their final forms — but it applies
 * no bidi reordering: it flows runs left to right in logical order, so a Persian line arrives
 * word-reversed and, once it wraps, with its last chunk on the top line. Grouping the words in
 * reading order first keeps the lines stacked the right way, and reversing the runs inside each
 * line puts the first word at the right edge, where a browser would put it. An em dash or a
 * Latin word inside the sentence travels with its neighbours either way.
 *
 * `perLine` is a character budget rather than a measurement: Estedad runs about 30px a glyph at
 * the headline's size, so 26 of them stay inside the 1040px the card's own padding leaves.
 */
function rtlLines(text: string, perLine: number) {
  const lines: string[][] = [];
  let line: string[] = [];
  let used = 0;

  for (const word of text.trim().split(/\s+/)) {
    if (line.length && used + word.length > perLine) {
      lines.push(line);
      line = [];
      used = 0;
    }
    line.push(word);
    used += word.length + 1;
  }
  if (line.length) lines.push(line);

  return lines.map(words => words.reverse().join(' '));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  // `?lang=fa` renders the Persian profile; English is the default card.
  const fa = url.searchParams.get('lang') === 'fa';
  const lang = fa ? 'fa' : 'en';
  const profile = await getProfile(lang);

  const rawTitle = url.searchParams.get('title')?.slice(0, 120) || profile?.fullName || brandedTitle(profile, lang);
  const rawSubtitle = profile?.jobTitle || (site ? site.replace(/^https?:\/\//, '') : '');
  // Latin text wraps itself correctly, so it stays one block; Persian is laid out line by line.
  const titleLines = fa ? rtlLines(drawable(rawTitle), 26) : [rawTitle];
  const subtitleLines = fa ? rtlLines(drawable(rawSubtitle), 56) : [rawSubtitle];
  // A Persian card is read from its right edge, so the block sits there and wraps from it too.
  const lineAlign = fa ? 'flex-end' : 'flex-start';
  const textAlign = fa ? 'right' : 'left';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        backgroundColor: '#0a0a0a',
        color: '#fafafa',
        fontFamily: fa ? 'Estedad' : 'sans-serif',
      }}
    >
      {/* The Persian card has one regular face to draw with, so it asks for that weight rather
          than the bold the Latin card gets from its bundled default. */}
      {titleLines.map(line => (
        <div key={line} style={{ fontSize: 64, fontWeight: fa ? 400 : 700, lineHeight: 1.2, display: 'flex', justifyContent: lineAlign, textAlign }}>
          {line}
        </div>
      ))}
      {subtitleLines.map((line, index) => (
        <div key={line} style={{ marginTop: index ? 0 : 24, fontSize: 28, color: '#a3a3a3', display: 'flex', justifyContent: lineAlign, textAlign }}>
          {line}
        </div>
      ))}
    </div>,
    fa ? { ...SIZE, fonts: [{ name: 'Estedad', data: await persianFace(req), weight: 400 }] } : SIZE
  );
}
