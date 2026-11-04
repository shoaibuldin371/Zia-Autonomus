import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverClientInstance: SupabaseClient | null = null;
let browserClientInstance: SupabaseClient | null = null;

/**
 * Returns the privileged server-side Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Never expose this client to the browser bundle.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (serverClientInstance) return serverClientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Supabase configuration missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    }
  }

  serverClientInstance = createClient(url || 'https://placeholder.supabase.co', serviceKey || 'placeholder', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serverClientInstance;
}

/**
 * Returns the public browser client using NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Protected by Row Level Security; used only for Supabase Realtime subscriptions.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClientInstance) return browserClientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  browserClientInstance = createClient(url, anonKey, {
    auth: {
      persistSession: true,
    },
  });

  return browserClientInstance;
}

