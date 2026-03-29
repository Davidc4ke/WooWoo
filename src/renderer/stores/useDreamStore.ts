import { create } from 'zustand';
import { dreamEntryRepo } from '../db';
import type { DreamEntry } from '../../shared/types';

interface DreamStore {
  entries: DreamEntry[];
  selectedEntry: DreamEntry | null;
  searchQuery: string;
  loadEntries: (page?: number, limit?: number) => void;
  selectEntry: (entry: DreamEntry | null) => void;
  createEntry: (entry: Omit<DreamEntry, 'id' | 'created_at' | 'updated_at'>) => DreamEntry;
  updateEntry: (id: string, updates: Partial<Omit<DreamEntry, 'id' | 'created_at' | 'updated_at'>>) => DreamEntry | null;
  deleteEntry: (id: string) => boolean;
  search: (query: string) => void;
  clearSearch: () => void;
}

export const useDreamStore = create<DreamStore>((set, get) => ({
  entries: [],
  selectedEntry: null,
  searchQuery: '',

  loadEntries(page = 1, limit = 50) {
    const entries = dreamEntryRepo.getAll(page, limit);
    set({ entries });
  },

  selectEntry(entry) {
    set({ selectedEntry: entry });
  },

  createEntry(data) {
    const entry = dreamEntryRepo.create(data);
    get().loadEntries();
    set({ selectedEntry: entry });
    return entry;
  },

  updateEntry(id, updates) {
    const entry = dreamEntryRepo.update(id, updates);
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
    const success = dreamEntryRepo.delete(id);
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
    const entries = dreamEntryRepo.search(query);
    set({ entries });
  },

  clearSearch() {
    set({ searchQuery: '' });
    get().loadEntries();
  },
}));
