import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv();

/** Treat blank env values as unset (common with `KEY=` in .env files). */
const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().url().optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),

    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

    LLM_PROVIDER: z.enum(['groq', 'dashscope']).default('groq'),
    LLM_API_KEY: z.string().min(1),
    LLM_BASE_URL: optionalUrl,
    LLM_MODEL: z.string().min(1).default('llama-3.3-70b-versatile'),

    VAPI_WEBHOOK_SECRET: z.string().min(1),
    VAPI_API_KEY: optionalNonEmptyString,

    ADMIN_API_KEY: z.string().min(1),
    DEFAULT_AGENT_SLUG: z.string().min(1).default('default'),
    PROMPTS_DIR: z.string().min(1).default('prompts'),
    /** Path to intent catalog JSON (relative to cwd or absolute) */
    INTENTS_CONFIG: z.string().min(1).default('config/intents.json'),

    /** Open an ngrok tunnel in development for Vapi webhooks */
    ENABLE_NGROK: z.preprocess(
      (value) => value === true || value === 'true' || value === '1',
      z.boolean(),
    ),
    NGROK_AUTHTOKEN: optionalNonEmptyString,
    /** Optional reserved/static ngrok hostname (no https://), e.g. xxx.ngrok-free.dev */
    NGROK_DOMAIN: optionalNonEmptyString,
    /** Public HTTPS base URL for webhooks (ngrok or Railway), no trailing slash */
    PUBLIC_BASE_URL: optionalUrl,
  })
  .superRefine((data, ctx) => {
    if (data.ENABLE_NGROK && !data.NGROK_AUTHTOKEN) {
      ctx.addIssue({
        code: 'custom',
        path: ['NGROK_AUTHTOKEN'],
        message: 'Required when ENABLE_NGROK=true',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

function parseEnv(raw: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return result.data;
}

export const env: Env = parseEnv(process.env);
