import { optionalString } from '@/lib/validations';
import { z } from 'zod';

/** Length a toolkit pill can carry without wrapping inside the chip. */
export const MAX_SKILL_NAME_LENGTH = 48;

export const skillSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(MAX_SKILL_NAME_LENGTH, 'The name is too long'),
  icon: optionalString(),
  // Optional: documents stored before ordering existed simply keep their shared rank.
  // Same bounded shape the support methods' display order uses, messages included, so
  // every rejection reads translated.
  order: z
    .number({ invalid_type_error: 'Enter the order as a number' })
    .int('Order must be a whole number')
    .min(0, 'Order cannot be negative')
    .max(999, 'Order must be 999 or lower')
    .optional(),
});

export type SkillInput = z.infer<typeof skillSchema>;
