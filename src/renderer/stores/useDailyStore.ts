import { create } from 'zustand';
import { dailyEntryRepo } from '../db';
import type { DailyEntry } from '../../shared/types';

interface DailyStore {
  entries: DailyEntry[];
  selectedEntry: DailyEntry | null;
  searchQuery: string;
  loadEntries: (page?: number, limit?: number) => void;
  selectEntry: (entry: DailyEntry | null) => void;
  createEntry: (entry: Omit<DailyEntry, 'id' | 'created_at' | 'updated_at'>) => DailyEntry;
  updateEntry: (id: string, updates: Partial<Omit<DailyEntry, 'id' | 'created_at' | 'updated_at'>>) => DailyEntry | null;
  deleteEntry: (id: string) => boolean;
  search: (query: string) => void;
  clearSearch: () => void;
}

export const useDailyStore = create<DailyStore>((set, get) => ({
  entries: [],
  selectedEntry: null,
  searchQuery: '',

  loadEntries(page = 1, limit = 50) {
    const entries = dailyEntryRepo.getAll(page, limit);
    set({ entries });
  },

  selectEntry(entry) {
    set({ selectedEntry: entry });
  },

  createEntry(data) {
    const entry = dailyEntryRepo.create(data);
    get().loadEntries();
    set({ selectedEntry: entry });
    return entry;
  },

  updateEntry(id, updates) {
    const entry = dailyEntryRepo.update(id, updates);
    if (entry) {
      get().loadEntries();
      const { selectedEntry } = get();
      if (selectedEntry?.id === id) {
        set({ selectedEntry: entry });
      }
    }
    return entry;
  },

  deleteEntry(id) {
    const success = dailyEntryRepo.delete(id);
    if (success) {
      const { selectedEntry } = get();
      if (selectedEntry?.id === id) {
        set({ selectedEntry: null });
      }
      get().loadEntries();
    }
    return success;
  },

  search(query) {
    set({ searchQuery: query });
    if (!query.trim()) {
      get().loadEntries();
      return;
    }
    const entries = dailyEntryRepo.search(query);
    set({ entries });
  },

  clearSearch() {
    set({ searchQuery: '' });
    get().loadEntries();
  },
}));
