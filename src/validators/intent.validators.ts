import { z } from 'zod';

export const detectIntentSchema = z.object({
  text: z.string().min(1),
  model: z.string().min(1).optional(),
});
