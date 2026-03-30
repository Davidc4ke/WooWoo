import { useEffect } from 'react';
import { useUIStore } from '../stores';
import { useDailyStore } from '../stores/useDailyStore';
import { useDreamStore } from '../stores/useDreamStore';

export interface KeyboardShortcutHandlers {
  onNew?: () => void;
  onSave?: () => void;
  onFocusSearch?: () => void;
}

let currentHandlers: KeyboardShortcutHandlers = {};

export function setShortcutHandlers(handlers: KeyboardShortcutHandlers) {
  currentHandlers = handlers;
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl+N: New entry
      if (mod && e.key === 'n') {
        e.preventDefault();
        currentHandlers.onNew?.();
      }

      // Cmd/Ctrl+S: Save current entry
      if (mod && e.key === 's') {
        e.preventDefault();
        currentHandlers.onSave?.();
      }

      // Cmd/Ctrl+F: Focus search
      if (mod && e.key === 'f') {
        e.preventDefault();
        currentHandlers.onFocusSearch?.();
      }

      // Escape: Deselect current entry
      if (e.key === 'Escape') {
        const activeTab = useUIStore.getState().activeTab;
        if (activeTab === 'daily') {
          useDailyStore.getState().selectEntry(null);
        } else if (activeTab === 'dream') {
          useDreamStore.getState().selectEntry(null);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
