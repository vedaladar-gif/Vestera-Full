import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/**
 * Supabase client with the service role key — bypasses RLS.
 * Use only from API Route Handlers after verifying the user via iron-session.
 *
 * Vestera authenticates with iron-session, not Supabase Auth JWT on each request,
 * so the anon client has no auth.uid(). RLS policies that require auth.uid() will
 * block friend_requests / friendships unless this client is used or RLS is disabled.
 */
export function getSupabaseServiceRole(): SupabaseClient | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!url || !key) return null;
    if (!cached) {
        cached = createClient(url, key, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    return cached;
}
