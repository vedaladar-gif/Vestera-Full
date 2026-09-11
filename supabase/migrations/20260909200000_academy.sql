-- Vestera Academy learning engine
-- Safe for new projects and existing databases. Does not alter profiles/portfolio/chat.

create table if not exists public.academy_progress (
  user_id text primary key,
  diagnostic_completed boolean not null default false,
  diagnostic_score integer,
  diagnostic_total integer,
  diagnostic_completed_at timestamptz,
  starting_rank integer,
  current_rank integer,
  xp integer not null default 0,
  current_lesson integer,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_diagnostic_results (
  id bigserial primary key,
  user_id text not null unique,
  score integer not null,
  total integer not null,
  starting_rank integer not null,
  topic_performance jsonb not null default '{}'::jsonb,
  ai_summary text,
  completed_at timestamptz not null default now()
);

create table if not exists public.academy_diagnostic_answers (
  id bigserial primary key,
  user_id text not null,
  question_id text not null,
  selected_index integer not null,
  is_correct boolean not null,
  topic text,
  unique (user_id, question_id)
);

create table if not exists public.academy_lesson_progress (
  user_id text not null,
  lesson_id integer not null,
  status text not null,
  started_at timestamptz,
  completed_at timestamptz,
  best_score integer,
  last_score integer,
  time_spent_ms bigint not null default 0,
  xp_awarded integer not null default 0,
  attempts integer not null default 0,
  primary key (user_id, lesson_id)
);

create table if not exists public.academy_quiz_attempts (
  id bigserial primary key,
  user_id text not null,
  lesson_id integer not null,
  score integer not null,
  total integer not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_quiz_answers (
  id bigserial primary key,
  attempt_id bigint not null references public.academy_quiz_attempts(id) on delete cascade,
  question_id text not null,
  selected_index integer not null,
  is_correct boolean not null,
  topic text
);

create table if not exists public.academy_rank_up_attempts (
  id bigserial primary key,
  user_id text not null,
  from_rank integer not null,
  to_rank integer not null,
  score integer not null,
  total integer not null,
  passed boolean not null,
  weak_topics jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_sessions (
  id bigserial primary key,
  user_id text not null,
  lesson_id integer,
  started_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  ended_at timestamptz,
  credited_ms bigint not null default 0
);

create table if not exists public.academy_achievements (
  user_id text not null,
  achievement_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.academy_daily_activity (
  user_id text not null,
  day date not null,
  primary key (user_id, day)
);

create table if not exists public.academy_topic_stats (
  user_id text not null,
  topic text not null,
  hits integer not null default 0,
  misses integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic)
);

create index if not exists idx_academy_lesson_progress_user on public.academy_lesson_progress(user_id);
create index if not exists idx_academy_quiz_attempts_user on public.academy_quiz_attempts(user_id);
create index if not exists idx_academy_rank_up_user on public.academy_rank_up_attempts(user_id);
create index if not exists idx_academy_sessions_user on public.academy_sessions(user_id);
create index if not exists idx_academy_progress_last on public.academy_progress(last_active_at);

alter table public.academy_progress disable row level security;
alter table public.academy_diagnostic_results disable row level security;
alter table public.academy_diagnostic_answers disable row level security;
alter table public.academy_lesson_progress disable row level security;
alter table public.academy_quiz_attempts disable row level security;
alter table public.academy_quiz_answers disable row level security;
alter table public.academy_rank_up_attempts disable row level security;
alter table public.academy_sessions disable row level security;
alter table public.academy_achievements disable row level security;
alter table public.academy_daily_activity disable row level security;
alter table public.academy_topic_stats disable row level security;

grant select, insert, update, delete on public.academy_progress to anon, authenticated;
grant select, insert, update, delete on public.academy_diagnostic_results to anon, authenticated;
grant select, insert, update, delete on public.academy_diagnostic_answers to anon, authenticated;
grant select, insert, update, delete on public.academy_lesson_progress to anon, authenticated;
grant select, insert, update, delete on public.academy_quiz_attempts to anon, authenticated;
grant select, insert, update, delete on public.academy_quiz_answers to anon, authenticated;
grant select, insert, update, delete on public.academy_rank_up_attempts to anon, authenticated;
grant select, insert, update, delete on public.academy_sessions to anon, authenticated;
grant select, insert, update, delete on public.academy_achievements to anon, authenticated;
grant select, insert, update, delete on public.academy_daily_activity to anon, authenticated;
grant select, insert, update, delete on public.academy_topic_stats to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;
