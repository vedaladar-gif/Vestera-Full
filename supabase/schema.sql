-- Profiles table (one row per Supabase auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  cash numeric not null default 10000,
  created_at timestamptz not null default now()
);

-- Portfolio (trades) table
create table if not exists public.portfolio (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stock text not null,
  shares integer not null,
  price numeric not null,
  action text not null,
  created_at timestamptz not null default now()
);

-- Terms acceptance (run migrations for existing DBs; safe for new installs)
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

-- Chat messages table
create table if not exists public.chat_messages (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  content text not null,
  mode text not null,
  route text,
  created_at timestamptz not null default now()
);

-- Friends (see migrations/20260413120000_friends.sql for full DDL)
-- friend_requests: sender_id → recipient_id, status pending|accepted|declined
-- friendships: user_a_id < user_b_id, unique pair

-- Academy engine (see migrations/20260909200000_academy.sql)
-- academy_progress, diagnostic, lessons, quizzes, rank-up, sessions, achievements


