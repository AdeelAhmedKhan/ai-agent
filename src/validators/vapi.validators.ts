import { z } from 'zod';

export const vapiWebhookSchema = z.object({
  message: z
    .object({
      type: z.string().min(1),
      call: z
        .object({
          id: z.string().min(1),
        })
        .passthrough()
        .optional(),
    })
    .passthrough(),
});

export type VapiWebhookInput = z.infer<typeof vapiWebhookSchema>;
