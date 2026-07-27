import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/index.js';
import type { Database } from '../types/database.js';

export type DbClient = SupabaseClient<Database>;

let client: DbClient | undefined;

export function getDbClient(): DbClient {
  if (!client) {
    client = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}

export async function pingDatabase(db: DbClient = getDbClient()): Promise<boolean> {
  const { error } = await db.from('agents').select('id').limit(1);
  return !error;
}
