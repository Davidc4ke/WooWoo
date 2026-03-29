import { v4 as uuidv4 } from 'uuid';
import { getDb } from './database';
import type { DailyEntry } from '../../shared/types';

interface DailyEntryRow {
  id: string;
  date: string;
  title: string | null;
  body: string | null;
  mood: string | null;
  tags: string;
  created_at: string;
  updated_at: string;
}

function rowToEntry(row: DailyEntryRow): DailyEntry {
  return {
    ...row,
    title: row.title || '',
    body: row.body || '',
    mood: (row.mood as DailyEntry['mood']) || 'neutral',
    tags: JSON.parse(row.tags || '[]'),
  };
}

export const dailyEntryRepo = {
  create(entry: Omit<DailyEntry, 'id' | 'created_at' | 'updated_at'>): DailyEntry {
    const db = getDb();
    const now = new Date().toISOString();
    const id = uuidv4();
    const row = {
      id,
      date: entry.date,
      title: entry.title || '',
      body: entry.body || '',
      mood: entry.mood || 'neutral',
      tags: JSON.stringify(entry.tags || []),
      created_at: now,
      updated_at: now,
    };
    db.prepare(`
      INSERT INTO daily_entries (id, date, title, body, mood, tags, created_at, updated_at)
      VALUES (@id, @date, @title, @body, @mood, @tags, @created_at, @updated_at)
    `).run(row);
    return rowToEntry(row as DailyEntryRow);
  },

  update(id: string, updates: Partial<Omit<DailyEntry, 'id' | 'created_at' | 'updated_at'>>): DailyEntry | null {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM daily_entries WHERE id = ?').get(id) as DailyEntryRow | undefined;
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated = {
      date: updates.date ?? existing.date,
      title: updates.title ?? existing.title ?? '',
      body: updates.body ?? existing.body ?? '',
      mood: updates.mood ?? existing.mood ?? 'neutral',
      tags: updates.tags ? JSON.stringify(updates.tags) : existing.tags,
      updated_at: now,
    };
    db.prepare(`
      UPDATE daily_entries SET date=@date, title=@title, body=@body, mood=@mood, tags=@tags, updated_at=@updated_at
      WHERE id=@id
    `).run({ ...updated, id });

    return rowToEntry({ ...existing, ...updated } as DailyEntryRow);
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM daily_entries WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getByDate(date: string): DailyEntry | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM daily_entries WHERE date = ?').get(date) as DailyEntryRow | undefined;
    return row ? rowToEntry(row) : null;
  },

  getById(id: string): DailyEntry | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM daily_entries WHERE id = ?').get(id) as DailyEntryRow | undefined;
    return row ? rowToEntry(row) : null;
  },

  getAll(page = 1, limit = 50): DailyEntry[] {
    const db = getDb();
    const offset = (page - 1) * limit;
    const rows = db.prepare('SELECT * FROM daily_entries ORDER BY date DESC LIMIT ? OFFSET ?').all(limit, offset) as DailyEntryRow[];
    return rows.map(rowToEntry);
  },

  search(query: string): DailyEntry[] {
    const db = getDb();
    const pattern = `%${query}%`;
    const rows = db.prepare(`
      SELECT * FROM daily_entries
      WHERE title LIKE ? OR body LIKE ? OR tags LIKE ?
      ORDER BY date DESC
    `).all(pattern, pattern, pattern) as DailyEntryRow[];
    return rows.map(rowToEntry);
  },
};
