import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!db) {
        const dbDir = path.join(process.cwd(), 'instance');
        fs.mkdirSync(dbDir, { recursive: true });
        const dbPath = path.join(dbDir, 'database.db');
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initDb(db);
    }
    return db;
}

function initDb(db: Database.Database) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      cash REAL NOT NULL DEFAULT 100000,
      created_at TEXT
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stock TEXT NOT NULL,
      shares INTEGER NOT NULL,
      price REAL NOT NULL,
      action TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      mode TEXT NOT NULL,
      route TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      full_name TEXT NOT NULL,
      organization TEXT,
      email TEXT NOT NULL,
      message TEXT,
      created_at TEXT NOT NULL
    )
  `);

    // ── AI Forecast ("Vesterast") ─────────────────────────────────────────
    db.exec(`
    CREATE TABLE IF NOT EXISTS ai_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      horizon TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      as_of_price REAL NOT NULL,
      predicted_direction TEXT NOT NULL,
      probability_up REAL NOT NULL,
      predicted_low REAL NOT NULL,
      predicted_high REAL NOT NULL,
      confidence REAL NOT NULL,
      composite_score REAL NOT NULL,
      target_date TEXT NOT NULL,
      actual_price REAL,
      resolved_at TEXT,
      direction_correct INTEGER,
      error_pct REAL,
      model_version TEXT NOT NULL DEFAULT 'v1'
    )
  `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_predictions_symbol_horizon ON ai_predictions(symbol, horizon)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_predictions_target_date ON ai_predictions(target_date)`);

    db.exec(`
    CREATE TABLE IF NOT EXISTS ai_backtest_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      run_at TEXT NOT NULL,
      methodology TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      sample_count INTEGER NOT NULL,
      model_version TEXT NOT NULL DEFAULT 'v1'
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS ai_backtest_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      horizon TEXT NOT NULL,
      as_of_date TEXT NOT NULL,
      predicted_direction TEXT NOT NULL,
      probability_up REAL NOT NULL,
      predicted_price REAL NOT NULL,
      actual_price REAL NOT NULL,
      actual_return_pct REAL NOT NULL,
      direction_correct INTEGER NOT NULL,
      error_pct REAL NOT NULL,
      FOREIGN KEY(run_id) REFERENCES ai_backtest_runs(id)
    )
  `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_backtest_results_run ON ai_backtest_results(run_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_backtest_results_symbol_horizon ON ai_backtest_results(symbol, horizon)`);

    db.exec(`
    CREATE TABLE IF NOT EXISTS ai_watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, symbol)
    )
  `);

    // ── Vestera Predict AI (separate, additive model — see src/lib/predictAI) ──
    db.exec(`
    CREATE TABLE IF NOT EXISTS predictai_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      horizon TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      as_of_price REAL NOT NULL,
      predicted_price REAL NOT NULL,
      predicted_direction TEXT NOT NULL,
      confidence REAL NOT NULL,
      composite_score REAL NOT NULL,
      target_date TEXT NOT NULL,
      news_snapshot TEXT,
      trigger_reason TEXT NOT NULL,
      actual_price REAL,
      resolved_at TEXT,
      direction_correct INTEGER,
      error_pct REAL,
      model_version TEXT NOT NULL DEFAULT 'v1.0'
    )
  `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_predictai_predictions_symbol_horizon ON predictai_predictions(symbol, horizon)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_predictai_predictions_target_date ON predictai_predictions(target_date)`);

    db.exec(`
    CREATE TABLE IF NOT EXISTS predictai_history_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      ts TEXT NOT NULL,
      trigger_reason TEXT NOT NULL,
      note TEXT NOT NULL,
      predicted_price REAL NOT NULL,
      direction TEXT NOT NULL,
      confidence REAL NOT NULL
    )
  `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_predictai_history_log_symbol ON predictai_history_log(symbol, ts)`);

    db.exec(`
    CREATE TABLE IF NOT EXISTS predictai_backtest_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      run_at TEXT NOT NULL,
      methodology TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      sample_count INTEGER NOT NULL,
      model_version TEXT NOT NULL DEFAULT 'v1.0'
    )
  `);

    db.exec(`
    CREATE TABLE IF NOT EXISTS predictai_backtest_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      horizon TEXT NOT NULL,
      as_of_date TEXT NOT NULL,
      predicted_direction TEXT NOT NULL,
      predicted_price REAL NOT NULL,
      actual_price REAL NOT NULL,
      actual_return_pct REAL NOT NULL,
      direction_correct INTEGER NOT NULL,
      error_pct REAL NOT NULL,
      FOREIGN KEY(run_id) REFERENCES predictai_backtest_runs(id)
    )
  `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_predictai_backtest_results_run ON predictai_backtest_results(run_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_predictai_backtest_results_symbol_horizon ON predictai_backtest_results(symbol, horizon)`);

    // Tracks the last analyzed news snapshot per symbol so we can detect *new* articles (recompute trigger).
    db.exec(`
    CREATE TABLE IF NOT EXISTS predictai_news_seen (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      uuid TEXT NOT NULL,
      title TEXT NOT NULL,
      published_at TEXT NOT NULL,
      first_seen_at TEXT NOT NULL,
      event_type TEXT NOT NULL,
      sentiment REAL NOT NULL,
      importance REAL NOT NULL,
      UNIQUE(symbol, uuid)
    )
  `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_predictai_news_seen_symbol ON predictai_news_seen(symbol)`);

    // Last computed state per symbol — powers the "recompute only when meaningful info changes" trigger.
    db.exec(`
    CREATE TABLE IF NOT EXISTS predictai_state (
      symbol TEXT PRIMARY KEY,
      computed_at TEXT NOT NULL,
      as_of_price REAL NOT NULL,
      composite_score REAL NOT NULL
    )
  `);

    for (const sql of [
        'ALTER TABLE users ADD COLUMN email TEXT',
        'ALTER TABLE users ADD COLUMN display_name TEXT',
        'ALTER TABLE users ADD COLUMN avatar_color TEXT DEFAULT \'blue\'',
        'ALTER TABLE users ADD COLUMN theme TEXT DEFAULT \'dark\'',
        'ALTER TABLE users ADD COLUMN terms_accepted_at TEXT',
    ]) {
        try { db.exec(sql); } catch { /* column already exists */ }
    }
}
