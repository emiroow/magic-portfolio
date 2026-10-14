import { forUpdate, optionalImagePath, optionalString, optionalUrl } from '@/lib/validations';
import { z } from 'zod';

/** A month the editor has no answer for yet is an empty one, whichever way it arrives. */
const toEmptyMonth = (value?: string | null) => value ?? '';

/**
 * A month as the picker writes it: `YYYY/MM` in the locale's own calendar (Jalali for
 * Persian, Gregorian for English), or nothing. `undefined`, `null` and a blank all
 * collapse to `''`, so a document stores one honest "no end month" instead of three
 * flavours of it and a PUT always carries the field explicitly.
 */
const monthString = () => z.string().trim().nullish().transform(toEmptyMonth);

/** `YYYY/MM` as a month count, or null for anything that is not such a pair. */
function monthIndex(value: string) {
  const match = value.match(/^(\d{3,4})\/(\d{1,2})$/);
  if (!match) return null;

  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? Number(match[1]) * 12 + month : null;
}

/**
 * A role cannot end before it began. Only `YYYY/MM` pairs are compared: an older
 * document may hold an ISO stamp instead, and reading it in the wrong calendar would
 * flag a period that is perfectly valid.
 */
function refinePeriod(work: { start?: string; end?: string }, ctx: z.RefinementCtx) {
  const from = monthIndex(work.start ?? '');
  const to = monthIndex(work.end ?? '');

  if (from !== null && to !== null && to < from) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end'], message: 'End cannot be before start' });
  }
}

export const workSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  href: optionalUrl(),
  location: optionalString(),
  title: optionalString(),
  logoUrl: optionalImagePath(),
  start: monthString(),
  end: monthString(),
  description: optionalString(),
});

/** Create body: the fields, with the period rule applied to the pair. */
export const workCreateSchema = workSchema.superRefine(refinePeriod);

/** Update body: a patch may leave a field out, but it must not file an impossible period. */
export const workUpdateSchema = forUpdate(workSchema).superRefine(refinePeriod);

/**
 * Dashboard form: the API shape, the document id, and `current` — the "I currently work
 * here" switch. `current` is deliberately not stored: an open role *is* a role with no
 * end month, so the switch and the record can never disagree, and the hook drops the key
 * before the body leaves the browser.
 *
 * The form does insist on that agreement. Left unchecked without an end month, the save
 * would store a role the public page reads as ongoing while its owner said otherwise.
 */
export const workFormSchema = workSchema.extend({ _id: z.string().optional(), current: z.boolean() }).superRefine((work, ctx) => {
  refinePeriod(work, ctx);

  if (!work.current && !work.end) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end'], message: 'Add an end date or mark the role as current' });
  }
});

export type WorkInput = z.infer<typeof workSchema>;
/**
 * What the form holds, before the schema has had its say: a month may still reach the
 * editor as null or a blank, and `toPayload` in the hook is what makes that impossible
 * on the way out.
 */
export type WorkForm = z.input<typeof workFormSchema>;
