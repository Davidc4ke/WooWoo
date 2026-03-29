import { v4 as uuidv4 } from 'uuid';
import { getDb } from './database';
import type { DreamEntry } from '../../shared/types';

interface DreamEntryRow {
  id: string;
  date: string;
  title: string | null;
  body: string | null;
  clarity: number;
  is_lucid: number;
  is_recurring: number;
  symbol_tags: string;
  created_at: string;
  updated_at: string;
}

function rowToEntry(row: DreamEntryRow): DreamEntry {
  return {
    id: row.id,
    date: row.date,
    title: row.title || '',
    body: row.body || '',
    clarity: row.clarity,
    is_lucid: row.is_lucid === 1,
    is_recurring: row.is_recurring === 1,
    symbol_tags: JSON.parse(row.symbol_tags || '[]'),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const dreamEntryRepo = {
  create(entry: Omit<DreamEntry, 'id' | 'created_at' | 'updated_at'>): DreamEntry {
    const db = getDb();
    const now = new Date().toISOString();
    const id = uuidv4();
    const row = {
      id,
      date: entry.date,
      title: entry.title || '',
      body: entry.body || '',
      clarity: entry.clarity ?? 3,
      is_lucid: entry.is_lucid ? 1 : 0,
      is_recurring: entry.is_recurring ? 1 : 0,
      symbol_tags: JSON.stringify(entry.symbol_tags || []),
      created_at: now,
      updated_at: now,
    };
    db.prepare(`
      INSERT INTO dream_entries (id, date, title, body, clarity, is_lucid, is_recurring, symbol_tags, created_at, updated_at)
      VALUES (@id, @date, @title, @body, @clarity, @is_lucid, @is_recurring, @symbol_tags, @created_at, @updated_at)
    `).run(row);
    return rowToEntry(row as DreamEntryRow);
  },

  update(id: string, updates: Partial<Omit<DreamEntry, 'id' | 'created_at' | 'updated_at'>>): DreamEntry | null {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM dream_entries WHERE id = ?').get(id) as DreamEntryRow | undefined;
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated = {
      date: updates.date ?? existing.date,
      title: updates.title ?? existing.title ?? '',
      body: updates.body ?? existing.body ?? '',
      clarity: updates.clarity ?? existing.clarity,
      is_lucid: updates.is_lucid !== undefined ? (updates.is_lucid ? 1 : 0) : existing.is_lucid,
      is_recurring: updates.is_recurring !== undefined ? (updates.is_recurring ? 1 : 0) : existing.is_recurring,
      symbol_tags: updates.symbol_tags ? JSON.stringify(updates.symbol_tags) : existing.symbol_tags,
      updated_at: now,
    };
    db.prepare(`
      UPDATE dream_entries SET date=@date, title=@title, body=@body, clarity=@clarity,
        is_lucid=@is_lucid, is_recurring=@is_recurring, symbol_tags=@symbol_tags, updated_at=@updated_at
      WHERE id=@id
    `).run({ ...updated, id });

    return rowToEntry({ ...existing, ...updated } as DreamEntryRow);
  },

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM dream_entries WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getByDate(date: string): DreamEntry[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM dream_entries WHERE date = ? ORDER BY created_at DESC').all(date) as DreamEntryRow[];
    return rows.map(rowToEntry);
  },

  getById(id: string): DreamEntry | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM dream_entries WHERE id = ?').get(id) as DreamEntryRow | undefined;
    return row ? rowToEntry(row) : null;
  },

  getAll(page = 1, limit = 50): DreamEntry[] {
    const db = getDb();
    const offset = (page - 1) * limit;
    const rows = db.prepare('SELECT * FROM dream_entries ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?').all(limit, offset) as DreamEntryRow[];
    return rows.map(rowToEntry);
  },

  getByDateRange(startDate: string, endDate: string): DreamEntry[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM dream_entries WHERE date >= ? AND date <= ? ORDER BY date ASC, created_at ASC'
    ).all(startDate, endDate) as DreamEntryRow[];
    return rows.map(rowToEntry);
  },

  search(query: string): DreamEntry[] {
    const db = getDb();
    const pattern = `%${query}%`;
    const rows = db.prepare(`
      SELECT * FROM dream_entries
      WHERE title LIKE ? OR body LIKE ? OR symbol_tags LIKE ?
      ORDER BY date DESC
    `).all(pattern, pattern, pattern) as DreamEntryRow[];
    return rows.map(rowToEntry);
  },

  getBySymbolTag(tag: string): DreamEntry[] {
    const db = getDb();
    const pattern = `%"${tag}"%`;
    const rows = db.prepare(`
      SELECT * FROM dream_entries WHERE symbol_tags LIKE ? ORDER BY date DESC
    `).all(pattern) as DreamEntryRow[];
    return rows.map(rowToEntry);
  },
};
