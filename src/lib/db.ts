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
