-- Friend tables: Vestera API uses iron-session + anon/publishable Supabase key without a user JWT,
-- so auth.uid() is NULL on the server. If RLS is enabled with no permissive policies, all access fails.
--
-- Option A (recommended): set SUPABASE_SERVICE_ROLE_KEY in the Next.js server env — the app uses it for friend ops.
-- Option B: keep RLS off for these tables so the anon key from trusted API routes can read/write.
--
-- This migration ensures RLS does not block backend access when not using the service role.

alter table if exists public.friend_requests disable row level security;
alter table if exists public.friendships disable row level security;

-- Grant to anon/authenticated roles if your project uses explicit revokes (safe default)
grant select, insert, update, delete on public.friend_requests to anon, authenticated;
grant select, insert, update, delete on public.friendships to anon, authenticated;
grant usage, select on sequence public.friend_requests_id_seq to anon, authenticated;
grant usage, select on sequence public.friendships_id_seq to anon, authenticated;
