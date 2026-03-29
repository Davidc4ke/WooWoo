import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database | null = null;

function getDbPath(): string {
  const userDataPath = app?.getPath?.('userData') || process.cwd();
  return path.join(userDataPath, 'soul-journal.db');
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(getDbPath());
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeTables(db);
  }
  return db;
}

function initializeTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_entries (
      id TEXT PRIMARY KEY,
      date TEXT UNIQUE NOT NULL,
      title TEXT,
      body TEXT,
      mood TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dream_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT,
      body TEXT,
      clarity INTEGER DEFAULT 3,
      is_lucid INTEGER DEFAULT 0,
      is_recurring INTEGER DEFAULT 0,
      symbol_tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      entry_type TEXT NOT NULL,
      content TEXT,
      frameworks_used TEXT DEFAULT '[]',
      astro_context TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      birth_date TEXT,
      birth_time TEXT,
      birth_location TEXT,
      preferred_frameworks TEXT DEFAULT '["astrology","numerology","tarot","chakra","general"]',
      api_key_encrypted TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(date);
    CREATE INDEX IF NOT EXISTS idx_dream_entries_date ON dream_entries(date);
    CREATE INDEX IF NOT EXISTS idx_analyses_entry_id ON analyses(entry_id);
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
