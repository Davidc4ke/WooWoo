import { getDb } from './database';
import type { UserSettings, SpiritualFramework } from '../../shared/types';

interface SettingsRow {
  id: string;
  birth_date: string | null;
  birth_time: string | null;
  birth_location: string | null;
  preferred_frameworks: string;
  api_key_encrypted: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSettings(row: SettingsRow): UserSettings {
  return {
    id: row.id,
    birth_date: row.birth_date || '',
    birth_time: row.birth_time || '',
    birth_location: row.birth_location || '',
    preferred_frameworks: JSON.parse(row.preferred_frameworks || '[]') as SpiritualFramework[],
    api_key_encrypted: row.api_key_encrypted || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const DEFAULT_FRAMEWORKS: SpiritualFramework[] = ['astrology', 'numerology', 'tarot', 'chakra', 'general'];

export const settingsRepo = {
  get(): UserSettings {
    const db = getDb();
    const row = db.prepare('SELECT * FROM user_settings WHERE id = ?').get('default') as SettingsRow | undefined;
    if (row) return rowToSettings(row);

    // Create default settings
    const now = new Date().toISOString();
    const defaults = {
      id: 'default',
      birth_date: '',
      birth_time: '',
      birth_location: '',
      preferred_frameworks: JSON.stringify(DEFAULT_FRAMEWORKS),
      api_key_encrypted: '',
      created_at: now,
      updated_at: now,
    };
    db.prepare(`
      INSERT INTO user_settings (id, birth_date, birth_time, birth_location, preferred_frameworks, api_key_encrypted, created_at, updated_at)
      VALUES (@id, @birth_date, @birth_time, @birth_location, @preferred_frameworks, @api_key_encrypted, @created_at, @updated_at)
    `).run(defaults);
    return rowToSettings(defaults as SettingsRow);
  },

  update(updates: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>): UserSettings {
    const db = getDb();
    // Ensure default row exists
    this.get();

    const now = new Date().toISOString();
    const fields: string[] = ['updated_at=@updated_at'];
    const params: Record<string, unknown> = { id: 'default', updated_at: now };

    if (updates.birth_date !== undefined) {
      fields.push('birth_date=@birth_date');
      params.birth_date = updates.birth_date;
    }
    if (updates.birth_time !== undefined) {
      fields.push('birth_time=@birth_time');
      params.birth_time = updates.birth_time;
    }
    if (updates.birth_location !== undefined) {
      fields.push('birth_location=@birth_location');
      params.birth_location = updates.birth_location;
    }
    if (updates.preferred_frameworks !== undefined) {
      fields.push('preferred_frameworks=@preferred_frameworks');
      params.preferred_frameworks = JSON.stringify(updates.preferred_frameworks);
    }
    if (updates.api_key_encrypted !== undefined) {
      fields.push('api_key_encrypted=@api_key_encrypted');
      params.api_key_encrypted = updates.api_key_encrypted;
    }

    db.prepare(`UPDATE user_settings SET ${fields.join(', ')} WHERE id=@id`).run(params);
    return this.get();
  },
};
