import { create } from 'zustand';

type ActiveTab = 'daily' | 'dream' | 'review' | 'settings';
type Theme = 'light' | 'dark';

interface UIStore {
  activeTab: ActiveTab;
  sidebarCollapsed: boolean;
  theme: Theme;
  setActiveTab: (tab: ActiveTab) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'daily',
  sidebarCollapsed: false,
  theme: (typeof window !== 'undefined' && localStorage.getItem('soul-journal-theme') as Theme) || 'light',

  setActiveTab(tab) {
    set({ activeTab: tab });
  },

  toggleSidebar() {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed(collapsed) {
    set({ sidebarCollapsed: collapsed });
  },

  setTheme(theme) {
    localStorage.setItem('soul-journal-theme', theme);
    set({ theme });
  },

  toggleTheme() {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('soul-journal-theme', newTheme);
      return { theme: newTheme };
    });
  },
}));
