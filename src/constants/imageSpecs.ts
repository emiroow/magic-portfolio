/**
 * Canonical image sizes for the three catalogues that own a cover picture:
 * products, projects and blog posts.
 *
 * Every number a picture touches lives here once, so the crop a dashboard owner
 * drags, the pixels the upload route bakes, the frame a card draws and the hero on
 * the detail page are all read from the same record. When one of them drifts the
 * others follow automatically — that is the whole point of the file: the aspect a
 * reader sees is the aspect the cropper offered and the only aspect the server keeps.
 */

/** The entities that carry a standardised cover image. Mirrors the upload route's `type`. */
export type ImageEntity = 'product' | 'project' | 'blog';

export interface ImageSpec {
  /** width / height. The one ratio every surface for this entity enforces. */
  aspect: number;
  /** Tailwind aspect-ratio utility for the frame — card cover, detail hero, gallery. */
  aspectClass: string;
  /** Canonical output width in pixels; the server resizes to exactly this. */
  width: number;
  /** Canonical output height in pixels — derived from `width` and `aspect`, never hand-set. */
  height: number;
  /**
   * Narrowest source we still normalise. A crop narrower than this is upscaled to
   * `width` by the server, which blurs it, so the cropper warns the owner to start
   * from a bigger picture instead of silently shipping a soft one.
   */
  minWidth: number;
}

/** Build a spec so height is always derived, never a value that can disagree with the aspect. */
function defineSpec(aspect: number, aspectClass: string, width: number, minWidth: number): ImageSpec {
  return { aspect, aspectClass, width, height: Math.round(width / aspect), minWidth };
}

/**
 * One entry per catalogue. The ratio is a deliberate per-entity choice — a product
 * reads as a 4:3 catalogue tile, a project and a post as a 16:9 banner — but the
 * output width is uniform so a grid of any mix stays sharp and even.
 */
export const IMAGE_SPECS: Record<ImageEntity, ImageSpec> = {
  product: defineSpec(4 / 3, 'aspect-[4/3]', 1600, 800),
  project: defineSpec(16 / 9, 'aspect-video', 1600, 800),
  blog: defineSpec(16 / 9, 'aspect-video', 1600, 800),
};

/** Look up a spec by entity. */
export function imageSpec(entity: ImageEntity): ImageSpec {
  return IMAGE_SPECS[entity];
}

/**
 * Map the upload route's `type` query parameter to the spec it must produce, or
 * `null` for uploads that keep their own shape (avatar, logos, certificates). The
 * keys are the same strings `folderForType` switches on, so a new catalogue folder
 * has to be added in exactly one place.
 */
export function specForUploadType(type: string | null): ImageSpec | null {
  switch (type) {
    case 'product':
      return IMAGE_SPECS.product;
    case 'project':
      return IMAGE_SPECS.project;
    case 'blog':
      return IMAGE_SPECS.blog;
    default:
      return null;
  }
}

/**
 * Layout widths for the responsive `sizes` hint, so the browser never fetches a
 * variant wider than the column can show.
 *
 * The three grids are built the same way — one card on a phone, two on a tablet,
 * three on a desktop — so a single value fits product, project and post alike. The
 * detail hero spans the reading column, which is a different measure again.
 */
export const CARD_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 420px';
export const HERO_IMAGE_SIZES = '(max-width: 1023px) 100vw, 848px';

/**
 * Open Graph / Twitter share card. A social preview is its own fixed 1.91:1 canvas,
 * independent of any entity's aspect, and is what the generated `/api/og` fallback
 * renders at.
 */
export const OG_CARD = { width: 1200, height: 630 } as const;
