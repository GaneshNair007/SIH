import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

const DEFAULT_DUMMY_URL = 'https://placeholder-instance.supabase.co';
const DEFAULT_DUMMY_KEY = 'sb_publishable_placeholder_dummy_key_for_offline_and_testing';

/**
 * Creates a server-side Supabase client for Server Components and Route Handlers.
 */
export async function createSupabaseServerClient() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_DUMMY_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_DUMMY_KEY;

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Component context where cookie mutation is not allowed
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {
          // Server Component context where cookie mutation is not allowed
        }
      },
    },
  });
}
