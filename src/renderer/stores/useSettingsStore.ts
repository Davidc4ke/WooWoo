import { create } from 'zustand';
import { settingsRepo } from '../db';
import type { UserSettings, SpiritualFramework } from '../../shared/types';

interface SettingsStore {
  settings: UserSettings | null;
  loadSettings: () => void;
  updateSettings: (updates: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>) => void;
  setApiKey: (key: string) => void;
  getApiKey: () => string;
  setPreferredFrameworks: (frameworks: SpiritualFramework[]) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,

  loadSettings() {
    const settings = settingsRepo.get();
    set({ settings });
  },

  updateSettings(updates) {
    const settings = settingsRepo.update(updates);
    set({ settings });
  },

  setApiKey(key) {
    // TODO: Use Electron safeStorage for proper encryption
    const encoded = btoa(key);
    get().updateSettings({ api_key_encrypted: encoded });
  },

  getApiKey() {
    const { settings } = get();
    if (!settings?.api_key_encrypted) return '';
    try {
      return atob(settings.api_key_encrypted);
    } catch {
      return '';
    }
  },

  setPreferredFrameworks(frameworks) {
    get().updateSettings({ preferred_frameworks: frameworks });
  },
}));
