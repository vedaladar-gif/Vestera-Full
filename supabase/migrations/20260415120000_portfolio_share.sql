-- Portfolio visibility for friends (owner-controlled).
alter table public.profiles
  add column if not exists portfolio_share_mode text default 'all_friends';

update public.profiles set portfolio_share_mode = 'all_friends' where portfolio_share_mode is null;

alter table public.profiles
  alter column portfolio_share_mode set not null;

alter table public.profiles drop constraint if exists profiles_portfolio_share_mode_check;

alter table public.profiles
  add constraint profiles_portfolio_share_mode_check
  check (portfolio_share_mode in ('all_friends', 'no_one', 'selected_friends'));

create table if not exists public.portfolio_share_allowed (
  id bigserial primary key,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  allowed_friend_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint portfolio_share_allowed_no_self check (owner_user_id <> allowed_friend_user_id),
  constraint portfolio_share_allowed_unique unique (owner_user_id, allowed_friend_user_id)
);

create index if not exists idx_portfolio_share_allowed_owner on public.portfolio_share_allowed (owner_user_id);

alter table public.portfolio_share_allowed disable row level security;

grant select, insert, update, delete on public.portfolio_share_allowed to anon, authenticated;
grant usage, select on sequence public.portfolio_share_allowed_id_seq to anon, authenticated;
