import { v4 as uuidv4 } from 'uuid';
import { getDb } from './database';
import type { Analysis, EntryType, SpiritualFramework } from '../../shared/types';

interface AnalysisRow {
  id: string;
  entry_id: string;
  entry_type: string;
  content: string | null;
  frameworks_used: string;
  astro_context: string | null;
  created_at: string;
}

function rowToAnalysis(row: AnalysisRow): Analysis {
  return {
    id: row.id,
    entry_id: row.entry_id,
    entry_type: row.entry_type as EntryType,
    content: row.content || '',
    frameworks_used: JSON.parse(row.frameworks_used || '[]') as SpiritualFramework[],
    astro_context: row.astro_context || '',
    created_at: row.created_at,
  };
}

export const analysisRepo = {
  create(analysis: Omit<Analysis, 'id' | 'created_at'>): Analysis {
    const db = getDb();
    const now = new Date().toISOString();
    const id = uuidv4();
    const row = {
      id,
      entry_id: analysis.entry_id,
      entry_type: analysis.entry_type,
      content: analysis.content || '',
      frameworks_used: JSON.stringify(analysis.frameworks_used || []),
      astro_context: analysis.astro_context || '',
      created_at: now,
    };
    db.prepare(`
      INSERT INTO analyses (id, entry_id, entry_type, content, frameworks_used, astro_context, created_at)
      VALUES (@id, @entry_id, @entry_type, @content, @frameworks_used, @astro_context, @created_at)
    `).run(row);
    return rowToAnalysis(row as AnalysisRow);
  },

  getByEntryId(entryId: string): Analysis[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM analyses WHERE entry_id = ? ORDER BY created_at DESC').all(entryId) as AnalysisRow[];
    return rows.map(rowToAnalysis);
  },

  deleteByEntryId(entryId: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM analyses WHERE entry_id = ?').run(entryId);
    return result.changes > 0;
  },
};
