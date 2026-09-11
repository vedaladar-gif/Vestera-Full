/** SQLite + Postgres DDL for the rebuilt Academy. Safe to run repeatedly. */

export const ACADEMY_SQLITE_DDL = `
CREATE TABLE IF NOT EXISTS academy_progress (
  user_id TEXT PRIMARY KEY,
  diagnostic_completed INTEGER NOT NULL DEFAULT 0,
  diagnostic_score INTEGER,
  diagnostic_total INTEGER,
  diagnostic_completed_at TEXT,
  starting_rank INTEGER,
  current_rank INTEGER,
  xp INTEGER NOT NULL DEFAULT 0,
  current_lesson INTEGER,
  last_active_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS academy_diagnostic_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  starting_rank INTEGER NOT NULL,
  topic_performance TEXT NOT NULL,
  ai_summary TEXT,
  completed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS academy_diagnostic_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_index INTEGER NOT NULL,
  is_correct INTEGER NOT NULL,
  topic TEXT,
  UNIQUE(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS academy_lesson_progress (
  user_id TEXT NOT NULL,
  lesson_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  best_score INTEGER,
  last_score INTEGER,
  time_spent_ms INTEGER NOT NULL DEFAULT 0,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS academy_quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  lesson_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS academy_quiz_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  selected_index INTEGER NOT NULL,
  is_correct INTEGER NOT NULL,
  topic TEXT
);

CREATE TABLE IF NOT EXISTS academy_rank_up_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  from_rank INTEGER NOT NULL,
  to_rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  weak_topics TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS academy_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  lesson_id INTEGER,
  started_at TEXT NOT NULL,
  last_heartbeat_at TEXT NOT NULL,
  ended_at TEXT,
  credited_ms INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS academy_achievements (
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  earned_at TEXT NOT NULL,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS academy_daily_activity (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS academy_topic_stats (
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  misses INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_academy_lesson_progress_user ON academy_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_quiz_attempts_user ON academy_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_rank_up_user ON academy_rank_up_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_sessions_user ON academy_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_sessions_last ON academy_sessions(last_heartbeat_at);
`;

export function initAcademySqlite(db: { exec: (sql: string) => unknown }) {
    db.exec(ACADEMY_SQLITE_DDL);
}
