/**
 * The engine that flows the résumé across sheets.
 *
 * The sheet is rendered on the server as one A4 page with two columns, which is the
 * honest document: what a crawler, a script with JavaScript turned off and a search
 * result all read. Where a section actually ends is a question about measured pixels —
 * how tall a block lands on paper, in the fonts that are really loaded, at the width
 * that column will print at — and no stylesheet can answer it. So this file moves the
 * sections the server already rendered: it fills a column to its foot, carries on in
 * the next, and turns to a fresh sheet only when both are spent. Nothing is shrunk and
 * nothing is clipped.
 *
 * React owns none of this. The sheet markup reaches the client as `children` passed
 * from a Server Component, so it keeps one identity across every render and the tree is
 * never reconciled again — which is what makes moving its nodes safe here.
 */

/** Every sheet is a fixed A4 canvas: 210 × 297 mm at 96 dpi. */
export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1122;

/** Below this the document stops pretending to be paper and reads as one column. */
export const NARROW_QUERY = '(max-width: 819px)';

/** Whether the viewport is in reading mode rather than sheet mode. */
export function isNarrow(): boolean {
  return window.matchMedia(NARROW_QUERY).matches;
}

/** The three elements the engine works on, resolved once by the viewer. */
export interface Sheets {
  /** What `resume.css` gives print geometry to while measuring or capturing. */
  root: HTMLElement;
  stage: HTMLElement;
  pages: HTMLElement;
}

/** Where the next block lands: one column, the height it holds, and whether it is the second. */
interface Placement {
  column: HTMLElement;
  other: HTMLElement;
  usedFirst: boolean;
  limit: number;
}

/** Read the running-line text the page handed down as data. */
function runningLine(pages: HTMLElement, sheet: number): HTMLElement {
  const line = document.createElement('div');
  line.className = 'rs-cont';
  const label = [
    pages.dataset.name || '',
    pages.dataset.doc || '',
    `${pages.dataset.pageWord || 'Page'} ${sheet.toLocaleString(pages.dataset.locale || 'en')}`,
  ]
    .filter(Boolean)
    .join(' · ');
  line.textContent = label;
  return line;
}

/**
 * Re-break the flow across as many sheets as the content needs.
 *
 * Blocks are measured while `data-pdf` pins every sheet to its print box, so a page that
 * packs on a phone screen breaks in exactly the place it prints.
 */
export function paginate(sheets: Sheets): void {
  const { root, pages } = sheets;
  const first = pages.querySelector<HTMLElement>('.rs-page');
  const band = first?.querySelector('header');
  if (!first || !band) return;

  // The blocks in reading order, however an earlier pass distributed them.
  const blocks = [...pages.querySelectorAll<HTMLElement>('.rs-flow__col')].flatMap(column => [...column.children] as HTMLElement[]);
  if (!blocks.length) return;

  root.setAttribute('data-pdf', '1');
  try {
    const style = getComputedStyle(first);
    const inner = PAGE_HEIGHT - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const flow = first.querySelector<HTMLElement>('.rs-flow');
    // Everything under the column tops and the flow's own top gap is spent height.
    const topGap = flow ? parseFloat(getComputedStyle(flow).marginTop) || 0 : 0;

    pages.replaceChildren();
    let sheet = 1;

    /** Start a fresh sheet with `chrome` — the header band on the first, a running line after. */
    const openSheet = (chrome: HTMLElement): Placement => {
      const page = document.createElement('div');
      page.className = 'rs-page';
      page.appendChild(chrome);

      const row = document.createElement('div');
      row.className = 'rs-flow';
      const column = document.createElement('div');
      column.className = 'rs-flow__col';
      const other = document.createElement('div');
      other.className = 'rs-flow__col';
      row.append(column, other);
      page.appendChild(row);
      pages.appendChild(page);

      return { column, other, usedFirst: false, limit: inner - chrome.offsetHeight - topGap };
    };

    /** Move to the next column, turning the page once both are spent. */
    const advance = (placement: Placement): Placement => {
      if (!placement.usedFirst) return { ...placement, column: placement.other, usedFirst: true };
      sheet += 1;
      return openSheet(runningLine(pages, sheet));
    };

    let placement = openSheet(band);

    /**
     * `scrollHeight` rounds to whole pixels; the +1 keeps that rounding from bouncing a
     * block which exactly fills the column into the next one.
     */
    const place = (node: HTMLElement, placement: Placement): boolean => {
      placement.column.appendChild(node);
      if (placement.column.scrollHeight > placement.limit + 1) {
        placement.column.removeChild(node);
        return false;
      }
      return true;
    };
    const isFresh = (placement: Placement): boolean => placement.column.children.length === 0;

    /**
     * Flow one section. It is placed whole whenever a column can hold it, and the column is
     * only turned when it cannot — so a section never straddles a break for no reason.
     *
     * A section taller than a column is then laid row by row, and its heading is never left
     * standing alone at the foot of a column: an orphaned heading reads as a broken page
     * rather than as a break, so the heading is carried to the column its first row lands
     * in and the blank it leaves behind stays in the column above, where it belongs.
     */
    const flowSection = (block: HTMLElement): void => {
      if (place(block, placement)) return;
      if (!isFresh(placement)) {
        placement = advance(placement);
        if (place(block, placement)) return;
      }

      const rows = [...block.children] as HTMLElement[];
      // A section with nothing under its heading still prints the heading.
      if (!rows.length) {
        placement.column.appendChild(block);
        return;
      }

      rows.forEach((row, at) => {
        if (place(row, placement)) return;

        if (at === 1 && placement.column.children.length === 1) {
          const heading = placement.column.children[0] as HTMLElement;
          placement.column.removeChild(heading);
          placement = advance(placement);
          if (!place(heading, placement)) placement.column.appendChild(heading);
        }

        if (!isFresh(placement)) {
          placement = advance(placement);
          if (place(row, placement)) return;
        }

        // A row taller than an entire column is allowed past its foot: content that runs on
        // is a layout to fix, content that was never placed is a document that lied.
        placement.column.appendChild(row);
      });
    };

    blocks.forEach(flowSection);

    // Dead space never ships: a column that caught no section at all comes out, and a sheet
    // left with neither would print as a ruled running line over an empty page.
    [...pages.querySelectorAll<HTMLElement>('.rs-flow__col')].filter(column => !column.children.length).forEach(column => column.remove());
    [...pages.querySelectorAll<HTMLElement>('.rs-page')].filter(page => !page.querySelector('.rs-flow__col')).forEach(page => page.remove());
  } finally {
    root.removeAttribute('data-pdf');
  }
}

/**
 * Scale the stack of sheets to the viewport for the on-screen preview. The whole stack
 * scales and never the content inside a sheet, so the type is the size it prints at; in
 * reading mode CSS lays the sheets out as one continuous column instead.
 */
export function fitView(sheets: Sheets, narrow: boolean): void {
  const { stage, pages } = sheets;
  if (narrow) {
    pages.style.transform = '';
    stage.style.height = '';
    return;
  }

  pages.style.transform = 'none';
  const style = getComputedStyle(stage);
  const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const scale = Math.min(1, (window.innerWidth - 32) / PAGE_WIDTH);
  pages.style.transform = scale < 1 ? `scale(${scale})` : 'none';
  // A scaled stack leaves its own box at the unscaled height, so the page is told how far
  // it actually runs or the last sheet floats under a screen of empty background.
  stage.style.height = `${pages.offsetHeight * scale + padding}px`;
}

/** Break the flow at print geometry, then fit what the breaking produced to the viewport. */
export function layout(sheets: Sheets, narrow: boolean): void {
  paginate(sheets);
  fitView(sheets, narrow);
}
