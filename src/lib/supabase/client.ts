import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const DEFAULT_DUMMY_URL = 'https://placeholder-instance.supabase.co';
const DEFAULT_DUMMY_KEY = 'sb_publishable_placeholder_dummy_key_for_offline_and_testing';

/**
 * Checks if Supabase credentials are validly configured in the environment.
 */
export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url.trim() !== '' &&
    !url.includes('placeholder') &&
    key.trim() !== '' &&
    !key.includes('placeholder')
  );
};

export const isProductionOperationsEnabled = (): boolean =>
  isSupabaseConfigured() && process.env.NEXT_PUBLIC_ENABLE_PRODUCTION_OPERATIONS === 'true';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Returns a resilient browser Supabase client, never throwing even if env variables are omitted.
 */
export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_DUMMY_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_DUMMY_KEY;

  browserClient = createBrowserClient<Database>(url, anonKey);
  return browserClient;
}

export const supabase = getSupabaseBrowserClient();
