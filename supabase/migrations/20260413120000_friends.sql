-- Friend requests: one row per directed pair (sender → recipient), status lifecycle.
create table if not exists public.friend_requests (
  id bigserial primary key,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fr_no_self check (sender_id <> recipient_id),
  constraint fr_unique_pair unique (sender_id, recipient_id)
);

create index if not exists idx_friend_requests_recipient_pending
  on public.friend_requests (recipient_id) where status = 'pending';

create index if not exists idx_friend_requests_sender
  on public.friend_requests (sender_id);

-- Undirected friendship: always store user_a_id < user_b_id (UUID text comparison).
create table if not exists public.friendships (
  id bigserial primary key,
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendships_ordered check (user_a_id::text < user_b_id::text),
  constraint friendships_unique_pair unique (user_a_id, user_b_id)
);

create index if not exists idx_friendships_user_a on public.friendships (user_a_id);
create index if not exists idx_friendships_user_b on public.friendships (user_b_id);
