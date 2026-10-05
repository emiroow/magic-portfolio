/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireAdmin, parseBody, apiError, apiJson } from '@/lib/api';
import { connectDB } from '@/config/dbConnection';
import { langSchema, objectIdSchema } from '@/lib/validations';
import type { Model, SortOrder } from 'mongoose';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

/**
 * Factory for guarded admin CRUD handlers: each handler checks the admin
 * session, validates `lang` and the body (zod), then revalidates public pages.
 */

type RouteContext = { params: Promise<{ lang: string }> };

export interface CrudConfig {
  /** Concrete Mongoose model for the resource. */
  model: Model<any>;
  /** Schema used to validate POST bodies. */
  createSchema: z.ZodTypeAny;
  /** Schema used to validate PUT bodies (must include `_id`). */
  updateSchema: z.ZodTypeAny;
  /** Optional sort applied to the listing query. */
  sort?: Record<string, SortOrder>;
  /**
   * Optional read-time shaping for a resource whose stored documents may predate
   * the current shape, so the dashboard edits exactly what the public page shows.
   */
  transform?: (doc: unknown) => unknown;
}

export function createAdminCrud({ model, createSchema, updateSchema, sort, transform }: CrudConfig) {
  async function prepareLocale(context: RouteContext) {
    const guard = await requireAdmin();
    if (!guard.ok) return guard;

    const { lang } = await context.params;
    const parsed = langSchema.safeParse(lang);
    if (!parsed.success) {
      return { ok: false as const, response: apiError('Unsupported language. Use "fa" or "en".', 400) };
    }

    await connectDB();
    return { ok: true as const, lang: parsed.data };
  }

  async function GET(_request: Request, context: RouteContext) {
    const prepared = await prepareLocale(context);
    if (!prepared.ok) return prepared.response;

    try {
      const docs = await model
        .find({ lang: prepared.lang })
        .sort(sort ?? {})
        .lean();
      const items = docs.map(doc => (transform ? transform(doc) : doc));
      return apiJson({ data: JSON.parse(JSON.stringify(items)) });
    } catch (error) {
      console.error('[api/admin] list failed:', error);
      return apiError('Internal Server Error', 500);
    }
  }

  async function POST(request: Request, context: RouteContext) {
    const prepared = await prepareLocale(context);
    if (!prepared.ok) return prepared.response;

    const parsed = await parseBody(createSchema, request);
    if (!parsed.ok) return parsed.response;

    try {
      const created = await model.create({ ...parsed.data, lang: prepared.lang });
      revalidatePath(`/${prepared.lang}`, 'layout');
      return apiJson({ data: JSON.parse(JSON.stringify(created)) }, { status: 201 });
    } catch (error) {
      console.error('[api/admin] create failed:', error);
      return apiError('Internal Server Error', 500);
    }
  }

  async function PUT(request: Request, context: RouteContext) {
    const prepared = await prepareLocale(context);
    if (!prepared.ok) return prepared.response;

    const parsed = await parseBody(updateSchema, request);
    if (!parsed.ok) return parsed.response;

    const { _id, ...update } = parsed.data as { _id: string } & Record<string, unknown>;
    try {
      const updated = await model.findOneAndUpdate({ _id, lang: prepared.lang }, update, { new: true, runValidators: true }).lean();
      if (!updated) return apiError('Document not found', 404);

      revalidatePath(`/${prepared.lang}`, 'layout');
      return apiJson({ data: JSON.parse(JSON.stringify(updated)) });
    } catch (error) {
      console.error('[api/admin] update failed:', error);
      return apiError('Internal Server Error', 500);
    }
  }

  async function DELETE(request: Request, context: RouteContext) {
    const prepared = await prepareLocale(context);
    if (!prepared.ok) return prepared.response;

    const id = new URL(request.url).searchParams.get('id');
    const parsedId = objectIdSchema.safeParse(id);
    if (!parsedId.success) return apiError('A valid "id" query parameter is required');

    try {
      const deleted = await model.findOneAndDelete({ _id: parsedId.data, lang: prepared.lang });
      if (!deleted) return apiError('Document not found', 404);

      revalidatePath(`/${prepared.lang}`, 'layout');
      return apiJson({ data: { message: 'Deleted successfully' } });
    } catch (error) {
      console.error('[api/admin] delete failed:', error);
      return apiError('Internal Server Error', 500);
    }
  }

  return { GET, POST, PUT, DELETE };
}
