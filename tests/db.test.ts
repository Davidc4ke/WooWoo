/**
 * Simple database test — run with: npx tsx tests/db.test.ts
 * Tests CRUD operations on daily entries.
 */
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, 'test-soul-journal.db');

// Clean up any previous test db
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}

const db = new Database(TEST_DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables
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
`);

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

console.log('Testing Daily Entry CRUD:\n');

// CREATE
const id = uuidv4();
const now = new Date().toISOString();
db.prepare(`
  INSERT INTO daily_entries (id, date, title, body, mood, tags, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`).run(id, '2026-03-29', 'Test Entry', 'This is a test entry body.', 'good', '["test","hello"]', now, now);

assert(true, 'Created daily entry');

// READ
const row = db.prepare('SELECT * FROM daily_entries WHERE id = ?').get(id) as Record<string, unknown>;
assert(row !== undefined, 'Retrieved entry by ID');
assert(row.title === 'Test Entry', 'Title matches');
assert(row.mood === 'good', 'Mood matches');
assert(row.date === '2026-03-29', 'Date matches');

const tags = JSON.parse(row.tags as string);
assert(Array.isArray(tags) && tags.length === 2, 'Tags parsed correctly');

// READ by date
const byDate = db.prepare('SELECT * FROM daily_entries WHERE date = ?').get('2026-03-29') as Record<string, unknown>;
assert(byDate !== undefined && byDate.id === id, 'Retrieved entry by date');

// UPDATE
db.prepare('UPDATE daily_entries SET title = ?, mood = ?, updated_at = ? WHERE id = ?')
  .run('Updated Title', 'radiant', new Date().toISOString(), id);

const updated = db.prepare('SELECT * FROM daily_entries WHERE id = ?').get(id) as Record<string, unknown>;
assert(updated.title === 'Updated Title', 'Title updated');
assert(updated.mood === 'radiant', 'Mood updated');

// DELETE
const result = db.prepare('DELETE FROM daily_entries WHERE id = ?').run(id);
assert(result.changes === 1, 'Deleted entry');

const deleted = db.prepare('SELECT * FROM daily_entries WHERE id = ?').get(id);
assert(deleted === undefined, 'Entry no longer exists after deletion');

// Cleanup
db.close();
fs.unlinkSync(TEST_DB_PATH);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
