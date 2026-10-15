import { apiError, apiJson, requireAdmin } from '@/lib/api';
import { connectDB } from '@/config/dbConnection';
import { profileModel } from '@/features/profile/model';
import { specForUploadType, type ImageSpec } from '@/constants/imageSpecs';
import { RESUME_MAX_SIZE, RESUME_MIME_TYPES } from '@/constants/global';
import { langSchema } from '@/lib/validations';
import { del, put } from '@vercel/blob';
import { constants } from 'fs';
import { access, mkdir, unlink, writeFile } from 'fs/promises';
import { NextRequest } from 'next/server';
import path from 'path';
import sharp from 'sharp';

/**
 * Admin image upload. Dev stores files under `/public`; production uses
 * Vercel Blob storage (requires `BLOB_READ_WRITE_TOKEN`).
 */

const isDev = process.env.NODE_ENV === 'development';

/** 5 MB upload limit. */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Formats the pipeline can decode and serve, named the way sharp reports them —
 * the format read off the actual bytes, never the browser's `file.type` claim.
 * AVIF belongs here because sharp reads it and `next/image` serves it; each is
 * verified against the decoded header below, so a renamed non-image is refused
 * whatever MIME string it arrived with.
 */
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'avif'];

/**
 * Longest side, in pixels, an upload may have. A catalogue cover is normalised to
 * 1600px and an avatar to a few hundred, so 6000px is far beyond any real need —
 * it exists to refuse a decompression bomb: a small file that expands to an absurd
 * canvas. The 5 MB byte cap cannot catch that, because the danger is the decoded
 * size, not the compressed one, so the ceiling is enforced as sharp reads the header.
 */
const MAX_IMAGE_DIMENSION = 6000;

/** Total-pixel ceiling handed to sharp (`limitInputPixels`) as the bomb guard. */
const MAX_IMAGE_PIXELS = MAX_IMAGE_DIMENSION * MAX_IMAGE_DIMENSION;

/**
 * Re-bake a catalogue cover onto its canonical canvas.
 *
 * The dashboard cropper already frames the selection at the right aspect, but the
 * server is the last honest word: a file POSTed straight to this route, an EXIF
 * rotation the browser misread, or a crop a hair off the ratio all land here and
 * leave at exactly `spec.width × spec.height`. `fit: cover` centre-trims any residual
 * difference instead of stretching it, so nothing is ever distorted to hit the size,
 * and JPEG output keeps the catalogue uniform whatever format was uploaded.
 */
async function normalizeToSpec(input: Buffer, spec: ImageSpec): Promise<Buffer> {
  return sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'error' })
    .rotate() // honour the EXIF orientation, so a phone upload lands upright rather than sideways
    .flatten({ background: '#ffffff' }) // covers are opaque; clear alpha before the JPEG encode
    .resize({ width: spec.width, height: spec.height, fit: 'cover', position: 'centre', kernel: 'lanczos3' })
    .jpeg({ quality: 88, progressive: true })
    .toBuffer();
}

/** Maps the `type` query param to a storage folder. */
function folderForType(type: string | null): string {
  switch (type) {
    case 'avatar':
      return 'avatar';
    case 'project':
      return 'projects';
    case 'product':
      return 'products';
    case 'education':
      return 'education';
    case 'experience':
      return 'experience';
    case 'certificate':
      return 'certificates';
    case 'blog':
      return 'blog';
    case 'resume':
      return 'resumes';
    default:
      return 'others';
  }
}

/** Extension kept for an uploaded résumé, derived from its real name or MIME. */
function resumeExtension(file: File): string {
  const fromName = path.extname(file.name).toLowerCase().replace(/^\./, '');
  if (['pdf', 'doc', 'docx'].includes(fromName)) return fromName;
  switch (file.type) {
    case 'application/pdf':
      return 'pdf';
    case 'application/msword':
      return 'doc';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx';
    default:
      return 'bin';
  }
}

/** Extract and validate the `lang` query parameter. */
function parseLang(value: string | null) {
  return langSchema.safeParse(value);
}

/**
 * Persist one upload and return its URL: under `/public` in development so hot reload
 * serves it, in Vercel Blob in production. A `fixed` upload keeps its exact name and
 * replaces its previous copy (any extension) so a re-uploaded avatar or résumé
 * never leaves a stale sibling the profile could still point at; a random-suffix one is
 * a fresh, immutable file.
 */
async function storeUpload(folder: string, fileName: string, payload: Buffer, opts: { fixed: boolean }): Promise<string> {
  if (isDev) {
    const uploadDir = path.join(process.cwd(), 'public', folder);

    try {
      await access(uploadDir, constants.F_OK);
    } catch {
      await mkdir(uploadDir, { recursive: true });
    }

    if (opts.fixed) {
      const base = fileName.replace(/\.[^.]+$/, '');
      for (const ext of ['png', 'jpg', 'jpeg', 'webp', 'pdf', 'doc', 'docx']) {
        try {
          await unlink(path.join(uploadDir, `${base}.${ext}`));
        } catch {
          /* file did not exist */
        }
      }
    }

    await writeFile(path.join(uploadDir, fileName), payload);
    return `/${folder}/${fileName}`;
  }

  const blob = await put(`${folder}/${fileName}`, payload, {
    access: 'public',
    addRandomSuffix: !opts.fixed,
    allowOverwrite: true,
  });
  return blob.url;
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const langResult = parseLang(req.nextUrl.searchParams.get('lang'));
  if (!langResult.success) return apiError('A valid "lang" query parameter is required');

  const type = req.nextUrl.searchParams.get('type');
  const folder = folderForType(type);

  try {
    const formData = await req.formData();
    // Images arrive under `image`; a résumé is posted under `file`. Accepting
    // either keeps the route the single storage gateway without a second endpoint.
    const file = formData.get('image') ?? formData.get('file');

    if (!(file instanceof File)) {
      return apiError('No file uploaded');
    }

    await connectDB();

    // A résumé is a document, not a picture: it is stored byte-for-byte, never decoded
    // or resized, under a per-locale fixed name so a re-upload replaces the old file
    // and the two locales never overwrite each other.
    if (type === 'resume') {
      if (!RESUME_MIME_TYPES.includes(file.type as (typeof RESUME_MIME_TYPES)[number])) {
        return apiError('Only PDF and DOCX files are allowed');
      }
      if (file.size > RESUME_MAX_SIZE) {
        return apiError('File exceeds the 10 MB size limit');
      }

      const docPayload = Buffer.from(await file.arrayBuffer());
      const docName = `resume-${langResult.data}.${resumeExtension(file)}`;
      const docUrl = await storeUpload(folder, docName, docPayload, { fixed: true });
      return apiJson({ data: { fileUrl: docUrl } });
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError('File exceeds the 5 MB size limit');
    }

    const spec = specForUploadType(type);
    const sourceBytes = Buffer.from(await file.arrayBuffer());

    // Decode the bytes once, before anything reaches storage. A browser's MIME
    // string is a claim, not a fact: a renamed executable, a truncated file and a
    // decompression bomb all arrive wearing an innocent `image/png`. Reading the
    // real header with sharp is what proves the upload is an image at all, of a
    // format the pipeline can serve, and small enough in pixels not to exhaust
    // memory when it is decoded. This is the authority for every image — a
    // catalogue cover and an avatar alike — so nothing is stored on trust.
    let format: string;
    let width: number;
    let height: number;
    try {
      const metadata = await sharp(sourceBytes, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'error' }).metadata();
      format = metadata.format ?? '';
      width = metadata.width ?? 0;
      height = metadata.height ?? 0;
    } catch (error) {
      console.error('[api/admin/upload] image could not be decoded:', error);
      return apiError('The image could not be processed', 400);
    }

    if (!ALLOWED_FORMATS.includes(format)) {
      return apiError(`Only ${ALLOWED_FORMATS.join(', ')} images are allowed`, 400);
    }
    if (!width || !height || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
      return apiError(`Image dimensions must be ${MAX_IMAGE_DIMENSION}px or smaller on each side`, 400);
    }

    // Catalogue covers are re-baked to their canonical canvas; everything else
    // (avatar, logos, certificates) keeps the exact bytes just proven valid, alpha
    // and all, so a transparent logo is never flattened against its owner's intent.
    // A cover that cannot be re-baked is refused rather than filed in a shape the
    // pages cannot frame.
    let payload: Buffer;
    try {
      payload = spec ? await normalizeToSpec(sourceBytes, spec) : sourceBytes;
    } catch (error) {
      console.error('[api/admin/upload] image processing failed:', error);
      return apiError('The image could not be processed', 400);
    }

    // The stored extension follows the detected format, never the claimed MIME, so
    // the file on disk is named for what it actually is.
    const ext = spec ? 'jpg' : format === 'jpeg' ? 'jpg' : format;
    const fileName = type === 'avatar' ? `avatarImage.${ext}` : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const fileUrl = await storeUpload(folder, fileName, payload, { fixed: type === 'avatar' });

    // Avatar uploads also update the stored profile automatically.
    if (type === 'avatar') {
      await profileModel.findOneAndUpdate({ lang: langResult.data }, { avatarUrl: fileUrl });
    }

    return apiJson({ data: { fileUrl } });
  } catch (error) {
    console.error('[api/admin/upload] failed:', error);
    return apiError('Upload failed', 500);
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const fileName = req.nextUrl.searchParams.get('fileName');
  const type = req.nextUrl.searchParams.get('type');

  if (!fileName || fileName.includes('/') || fileName.includes('..')) {
    return apiError('A valid "fileName" query parameter is required');
  }

  const folder = folderForType(type);

  try {
    if (isDev) {
      await unlink(path.join(process.cwd(), 'public', folder, fileName));
    } else {
      await del(`${folder}/${fileName}`);
    }
    return apiJson({ data: { message: 'Delete successful' } });
  } catch (error) {
    console.error('[api/admin/upload] delete failed:', error);
    return apiError('Delete failed', 500);
  }
}
