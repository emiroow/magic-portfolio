import localFont from 'next/font/local';

/** Self-hosted fonts applied per-locale so each language always gets the right face. */
export const estedad = localFont({
  src: '../../public/fonts/Estedad-Regular.ttf',
  variable: '--font-estedad',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const roboto = localFont({
  src: [
    { path: '../../public/fonts/Roboto-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Roboto-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-roboto',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

/**
 * The two `next/font` variable classes, applied together on `<html>` and never
 * swapped: they only publish `--font-estedad` / `--font-roboto`, so both faces
 * stay addressable in every locale while exactly one of them is the reading face.
 * A control that names the *other* language — the navbar's `فا` / `EN` switch —
 * needs the other face to be reachable, or its Persian letters drop onto a
 * Latin-only fallback and render crushed.
 */
export const fontVariables = `${estedad.variable} ${roboto.variable}`;
