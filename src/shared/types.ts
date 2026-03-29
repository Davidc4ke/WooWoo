export type Mood = 'radiant' | 'good' | 'neutral' | 'low' | 'stormy';
export type EntryType = 'daily' | 'dream' | 'weekly_review';
export type SpiritualFramework = 'astrology' | 'numerology' | 'tarot' | 'chakra' | 'general';

export interface DailyEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: Mood;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DreamEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  clarity: number;
  is_lucid: boolean;
  is_recurring: boolean;
  symbol_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  entry_id: string;
  entry_type: EntryType;
  content: string;
  frameworks_used: SpiritualFramework[];
  astro_context: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  preferred_frameworks: SpiritualFramework[];
  api_key_encrypted: string;
  created_at: string;
  updated_at: string;
}
