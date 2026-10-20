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
 * When a section is taller than the space left in a column it is laid row by row from
 * where that column currently ends — the column fills to its foot and the section
 * carries on in the next one — and every fragment it leaves behind is wrapped in its
 * own `.rs-sec` with a cloned `.rs-sh` heading, so the reader always knows which
 * section they are in. A column is therefore never left blank under a section that
 * could have started there. Individual records that exceed a full column are split at
 * their internal structure; content that overflows is a layout to fix, content that
 * vanishes is a document that lied.
 *
 * Every pass re-derives its source first: continuation fragments an earlier pass left
 * in the columns are merged back into the sections they came from before anything is
 * measured, so the flow is idempotent and never depends on the state the DOM arrived
 * in — a second pass after the fonts load breaks exactly where the first one did.
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
  /** True when this placement opened a brand-new sheet, so a carried-over section restates its heading. */
  freshSheet: boolean;
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
 * Create a continuation fragment: a new `.rs-sec` section wrapping a cloned heading.
 * Rows are appended into this fragment as they are placed.
 */
function createFragment(original: HTMLElement, heading: HTMLElement, withHeading: boolean): HTMLElement {
  const fragment = document.createElement('section');
  fragment.className = original.className;
  const ariaLabel = original.getAttribute('aria-label');
  if (ariaLabel) fragment.setAttribute('aria-label', ariaLabel);
  if (withHeading) fragment.appendChild(heading.cloneNode(true) as HTMLElement);
  return fragment;
}

/** A continuation fragment that caught no content row: all it still holds is its own heading. */
function isEmptyFragment(fragment: HTMLElement): boolean {
  return [...fragment.children].every(child => child.classList.contains('rs-sh'));
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
  const raw = [...pages.querySelectorAll<HTMLElement>('.rs-flow__col')].flatMap(column => [...column.children] as HTMLElement[]);
  if (!raw.length) return;

  // Re-derive the original sections before anything is measured: an earlier pass may
  // have split one section into consecutive continuation fragments that share its
  // accessible name, and re-flowing those fragments as sections of their own would
  // freeze an old break in place — which is how a stale pass once left a column blank.
  // Merging them back makes every pass start from the same source, so the flow is
  // idempotent whatever state the DOM arrived in.
  const blocks: HTMLElement[] = [];
  for (const block of raw) {
    const label = block.getAttribute('aria-label');
    const prev = blocks[blocks.length - 1];
    if (prev && label && label === prev.getAttribute('aria-label')) {
      for (const child of [...block.children]) {
        if (!child.classList.contains('rs-sh')) prev.appendChild(child);
      }
      continue;
    }
    blocks.push(block);
  }
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

      return { column, other, usedFirst: false, limit: inner - chrome.offsetHeight - topGap, freshSheet: true };
    };

    /** Move to the next column, turning the page once both are spent. */
    const advance = (placement: Placement): Placement => {
      if (!placement.usedFirst) return { ...placement, column: placement.other, usedFirst: true, freshSheet: false };
      sheet += 1;
      return openSheet(runningLine(pages, sheet));
    };

    let placement = openSheet(band);

    /**
     * `scrollHeight` rounds to whole pixels; the +1 keeps that rounding from bouncing a
     * block which exactly fills the column into the next one.
     */
    const fits = (node: HTMLElement, placement: Placement): boolean => {
      placement.column.appendChild(node);
      if (placement.column.scrollHeight > placement.limit + 1) {
        placement.column.removeChild(node);
        return false;
      }
      return true;
    };

    /**
     * Flow one section across columns and pages.
     *
     * A section that fits the space left in the current column stays whole. Anything
     * taller is laid row by row from where that column currently ends, so the first
     * column fills to its foot and the section carries on in the second with its
     * heading repeated; a fresh sheet opens only once both columns are spent. Turning
     * the column ahead of a section that could have started in the space left behind
     * is what once stranded a blank first column, so it never happens here.
     *
     * A single row taller than an entire column is split at its internal structure
     * (bullet lists are distributed item by item); only a leaf that cannot be split is
     * ever forced past a column foot.
     */
    const flowSection = (block: HTMLElement): void => {
      if (fits(block, placement)) return;

      const children = [...block.children] as HTMLElement[];
      if (!children.length) {
        placement.column.appendChild(block);
        return;
      }

      // Identify the heading (the `.rs-sh` child) and the content rows after it.
      const headingEl = children.find(child => child.classList.contains('rs-sh'));
      const rows = headingEl ? children.filter(child => child !== headingEl) : children;

      if (!headingEl || !rows.length) {
        placement.column.appendChild(block);
        return;
      }

      // A section's heading is drawn once, where its content first lands, and again only when
      // the flow turns to a fresh sheet. Carrying on into the second column of the page the
      // section already started on is a continuation the reader sees beside the original, so it
      // must not reprint the label over the same career.
      let headingPlaced = false;
      const newFragment = (freshSheet: boolean): HTMLElement => {
        const withHeading = freshSheet || !headingPlaced;
        const made = createFragment(block, headingEl, withHeading);
        if (withHeading) headingPlaced = true;
        return made;
      };

      // The first fragment opens in the column the section was reached in.
      let fragment = newFragment(placement.freshSheet);
      placement.column.appendChild(fragment);

      /**
       * Split a tall row at its internal structure. Bullet lists (`.rs-list`, `ul`)
       * are distributed item by item; other children are kept whole. Continuation
       * wrappers preserve the row's class so CSS still applies.
       */
      const splitRow = (row: HTMLElement): void => {
        const parts = [...row.children] as HTMLElement[];
        if (!parts.length) {
          // Leaf node with only text — force it.
          fragment.appendChild(row);
          return;
        }

        let wrapper = document.createElement('div');
        wrapper.className = row.className;
        fragment.appendChild(wrapper);

        /** Open the next column/page and a continuation of both fragment and wrapper. */
        const continueRow = (): void => {
          placement = advance(placement);
          fragment = newFragment(placement.freshSheet);
          placement.column.appendChild(fragment);
          wrapper = document.createElement('div');
          wrapper.className = row.className;
          fragment.appendChild(wrapper);
        };

        for (const part of parts) {
          // A bullet list is the most common overflow source — split at `li` level.
          if (part.classList.contains('rs-list') || (part.tagName === 'UL' && part.children.length > 1)) {
            const items = [...part.children] as HTMLElement[];
            let currentList = document.createElement(part.tagName.toLowerCase());
            currentList.className = part.className;
            wrapper.appendChild(currentList);

            for (const item of items) {
              currentList.appendChild(item);
              if (placement.column.scrollHeight <= placement.limit + 1) continue;

              // Doesn't fit — pull it back out and carry on in the next column.
              currentList.removeChild(item);
              if (!currentList.children.length) wrapper.removeChild(currentList);
              continueRow();
              currentList = document.createElement(part.tagName.toLowerCase());
              currentList.className = part.className;
              wrapper.appendChild(currentList);
              currentList.appendChild(item);
              // A single bullet taller than a column stays forced past its foot.
            }
          } else {
            // Non-list child: place whole.
            wrapper.appendChild(part);
            if (placement.column.scrollHeight <= placement.limit + 1) continue;

            wrapper.removeChild(part);
            if (!wrapper.children.length) fragment.removeChild(wrapper);
            continueRow();
            wrapper.appendChild(part);
          }
        }

        // Clean up an empty trailing wrapper.
        if (!wrapper.children.length && wrapper.parentElement) wrapper.parentElement.removeChild(wrapper);
      };

      let rowIdx = 0;
      while (rowIdx < rows.length) {
        const row = rows[rowIdx];

        // Try placing the row into the current fragment.
        fragment.appendChild(row);
        if (placement.column.scrollHeight <= placement.limit + 1) {
          rowIdx++;
          continue;
        }
        fragment.removeChild(row);

        // A fragment left holding only its heading would orphan it at the column foot:
        // the heading travels to the column its first row lands in instead.
        if (isEmptyFragment(fragment)) {
          const carriedHeading = fragment.querySelector('.rs-sh') !== null;
          fragment.parentElement?.removeChild(fragment);
          // A heading removed together with its empty fragment was never really placed after all.
          if (carriedHeading) headingPlaced = false;
        }

        placement = advance(placement);
        fragment = newFragment(placement.freshSheet);
        placement.column.appendChild(fragment);

        fragment.appendChild(row);
        if (placement.column.scrollHeight <= placement.limit + 1) {
          rowIdx++;
          continue;
        }

        // Row taller than a fresh column — split it internally.
        fragment.removeChild(row);
        splitRow(row);
        rowIdx++;
      }

      // A trailing fragment that caught no row would print a heading over nothing.
      if (isEmptyFragment(fragment) && fragment.parentElement) fragment.parentElement.removeChild(fragment);
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
