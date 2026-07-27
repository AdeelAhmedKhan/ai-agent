import { z } from 'zod';

const jsonSchema = z.record(z.string(), z.unknown()).optional();

export const createAgentSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  name: z.string().min(1).max(200),
  system_prompt_key: z.string().min(1).optional(),
  model: z.string().min(1).nullable().optional(),
  voice_config: jsonSchema,
  metadata: jsonSchema,
  is_active: z.boolean().optional(),
  tools: z.array(z.string().min(1)).optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  system_prompt_key: z.string().min(1).optional(),
  model: z.string().min(1).nullable().optional(),
  voice_config: jsonSchema,
  metadata: jsonSchema,
  is_active: z.boolean().optional(),
  tools: z.array(z.string().min(1)).optional(),
});

export const agentIdParamsSchema = z.object({
  id: z.string().uuid(),
});
