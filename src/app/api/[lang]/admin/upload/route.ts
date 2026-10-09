import { apiError, apiJson, requireAdmin } from '@/lib/api';
import { connectDB } from '@/config/dbConnection';
import { profileModel } from '@/features/profile/model';
import { specForUploadType, type ImageSpec } from '@/constants/imageSpecs';
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
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

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
async function normalizeToSpec(input: ArrayBuffer, spec: ImageSpec): Promise<Buffer> {
  return sharp(Buffer.from(input))
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
    case 'blog':
      return 'blog';
    default:
      return 'others';
  }
}

/** Extract and validate the `lang` query parameter. */
function parseLang(value: string | null) {
  return langSchema.safeParse(value);
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
    const file = formData.get('image');

    if (!(file instanceof File)) {
      return apiError('No file uploaded');
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError(`Only ${ALLOWED_TYPES.join(', ')} files are allowed`);
    }
    if (file.size > MAX_FILE_SIZE) {
      return apiError('File exceeds the 5 MB size limit');
    }

    const spec = specForUploadType(type);
    const sourceBytes = await file.arrayBuffer();
    // Catalogue covers are re-baked to their canonical canvas; everything else
    // (avatar, logos, certificates) is stored as uploaded, alpha and all. A cover that
    // cannot be decoded is refused rather than filed in a shape the pages cannot frame.
    let payload: Buffer;
    try {
      payload = spec ? await normalizeToSpec(sourceBytes, spec) : Buffer.from(sourceBytes);
    } catch (error) {
      console.error('[api/admin/upload] image processing failed:', error);
      return apiError('The image could not be processed', 400);
    }

    const ext = spec ? 'jpg' : file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
    const fileName = type === 'avatar' ? `avatarImage.${ext}` : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    await connectDB();

    let fileUrl: string;

    if (isDev) {
      // Local development: persist under /public so hot reload serves it.
      const uploadDir = path.join(process.cwd(), 'public', folder);

      try {
        await access(uploadDir, constants.F_OK);
      } catch {
        await mkdir(uploadDir, { recursive: true });
      }

      // Avatars keep a fixed name; remove stale variants first.
      if (type === 'avatar') {
        for (const stale of ['avatarImage.png', 'avatarImage.jpg', 'avatarImage.jpeg', 'avatarImage.webp']) {
          try {
            await unlink(path.join(uploadDir, stale));
          } catch {
            /* file did not exist */
          }
        }
      }

      await writeFile(path.join(uploadDir, fileName), payload);
      fileUrl = `/${folder}/${fileName}`;
    } else {
      // Production: Vercel Blob storage.
      const blob = await put(`${folder}/${fileName}`, payload, {
        access: 'public',
        addRandomSuffix: type !== 'avatar',
        allowOverwrite: true,
      });
      fileUrl = blob.url;
    }

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
