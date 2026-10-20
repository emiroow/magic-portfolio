import { PAGE_HEIGHT, PAGE_WIDTH, paginate, type Sheets } from '@/features/profile/resume/layout-engine';

/**
 * The two engines a direct PDF download needs, and nothing else.
 *
 * "Print" keeps the browser's own pipeline. "Save as PDF" instead captures every sheet
 * on a canvas and wraps the images into a multi-page A4 file that lands in the visitor's
 * downloads — no print preview, no destination to pick. That is worth two libraries, but
 * not worth shipping them to every visitor who never presses the button: both load from
 * a pinned CDN on first use.
 *
 * Each file carries the SHA-256 jsDelivr publishes for it, so a swapped or tampered copy
 * is refused by the browser rather than being allowed to run inside the site's origin. A
 * refused file is not a dead end — the caller falls back to the print dialog, which needs
 * nothing from the network.
 */
const ENGINES = [
  {
    src: 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    integrity: 'sha256-6H5VB5QyLldKH9oMFUmjxw2uWpPZETQXpCkBaDjquMs=',
  },
  {
    src: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
    integrity: 'sha256-hbosw/+FiiD6Sf5uRXvshj6kC1Wp83JeWKlA5i9vYaQ=',
  },
] as const;

/** The slice of html2canvas the capture uses. */
type Snapshot = (element: HTMLElement, options: Record<string, unknown>) => Promise<HTMLCanvasElement>;

/** The slice of jsPDF the assembly uses. */
type PdfDocument = {
  addPage: () => void;
  addImage: (data: string, format: string, x: number, y: number, w: number, h: number) => void;
  output: (kind: 'blob') => Blob;
};

type PdfConstructor = new (options: { orientation: string; unit: string; format: string }) => PdfDocument;

const A4_MM = { width: 210, height: 297 } as const;

/**
 * The viewport the raster is drawn in. It must clear the 819px reading-mode breakpoint so the
 * capture's own window never matches the narrow media query: the sheets are A4 whatever the
 * visitor's device, and the raster must not inherit a phone's single-column reading layout.
 */
const CAPTURE_WINDOW_WIDTH = 1280;

/**
 * One settled promise per source, shared by every caller: a first capture that is still
 * running must not fetch a second copy, and a repeat call must not attach listeners to a
 * tag that finished loading long ago — which is what once made a second download hang
 * forever after a theme switch. A failure clears its entry, so the next press retries.
 */
const loading = new Map<string, Promise<void>>();

function loadEngine({ src, integrity }: (typeof ENGINES)[number]): Promise<void> {
  const settled = loading.get(src);
  if (settled) return settled;

  const pending = new Promise<void>((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = src;
    tag.async = true;
    // SRI needs CORS on a cross-origin script, and jsDelivr serves it with it.
    tag.crossOrigin = 'anonymous';
    tag.integrity = integrity;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error(`engine refused: ${src}`));
    document.head.appendChild(tag);
  }).catch((error: unknown) => {
    loading.delete(src);
    throw error;
  });

  loading.set(src, pending);
  return pending;
}

/** The globals the two libraries publish, once they are in. */
function engines(): { snapshot: Snapshot; Pdf: PdfConstructor } | null {
  const scope = window as unknown as { html2canvas?: Snapshot; jspdf?: { jsPDF?: PdfConstructor } };
  if (!scope.html2canvas || !scope.jspdf?.jsPDF) return null;
  return { snapshot: scope.html2canvas, Pdf: scope.jspdf.jsPDF };
}

/**
 * Capture every sheet as it stands on paper, and return the A4 file.
 *
 * The capture runs on an off-screen twin of the sheet stack rather than on the stack
 * the visitor is reading. Re-breaking and un-scaling the live page mid-download is what
 * once let scrollbars appear and vanish under the reader — the viewport jumped sideways
 * and snapped back — because `data-pdf` opens the stage's overflow and the released
 * scale changes the document's own height. The twin carries the same `data-pdf`
 * geometry, so it breaks and measures exactly as paper would, while the page on screen
 * never moves a pixel. The palette is whatever the visitor is reading in — a downloaded
 * file mirroring the theme on screen is the point of pressing this button instead of
 * Print.
 */
export async function capturePdf(sheets: Sheets): Promise<Blob> {
  const { pages } = sheets;
  await Promise.all(ENGINES.map(loadEngine));
  const loaded = engines();
  if (!loaded) throw new Error('no pdf engine');
  const { snapshot, Pdf } = loaded;

  // Fallback metrics and the real faces differ; the file must carry the ones on screen.
  await document.fonts?.ready;

  const host = document.createElement('div');
  host.className = 'rs-root rs-capture-host';
  host.setAttribute('data-pdf', '1');
  const stage = document.createElement('div');
  stage.className = 'rs-stage';
  const twin = pages.cloneNode(true) as HTMLElement;
  // The live stack carries the preview's inline scale; the twin must stand at paper size.
  twin.style.transform = '';
  stage.appendChild(twin);
  host.appendChild(stage);
  document.body.appendChild(host);

  try {
    paginate({ root: host, stage, pages: twin });
    // `paginate` drops the print flag the moment it finishes measuring — right for the live
    // page, but it would leave the raster to whatever the viewport's own reading-mode rules
    // produce: a phone's download would come out single-column and every glyph would lose the
    // compensation that keeps it beside its text. The flag goes back on for the capture itself.
    host.setAttribute('data-pdf', '1');
    const drawn = [...twin.querySelectorAll<HTMLElement>('.rs-page')];
    // Follow the sheet's own background so the canvas never fringes white along a dark page.
    const background = drawn[0] ? getComputedStyle(drawn[0]).backgroundColor : '#ffffff';

    const canvases: HTMLCanvasElement[] = [];
    for (const sheet of drawn) {
      canvases.push(
        await snapshot(sheet, {
          scale: 3,
          backgroundColor: background,
          logging: false,
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          windowWidth: CAPTURE_WINDOW_WIDTH,
          windowHeight: PAGE_HEIGHT,
        })
      );
    }

    const pdf = new Pdf({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    canvases.forEach((canvas, index) => {
      if (index) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4_MM.width, A4_MM.height);
    });
    return pdf.output('blob');
  } finally {
    host.remove();
  }
}

/** Hand the file to the browser and release it only once the download has read it. */
export function savePdfFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
