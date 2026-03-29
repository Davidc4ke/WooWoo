import React, { useEffect } from 'react';
import { useDailyStore, useDreamStore, useSettingsStore, useUIStore } from './stores';
import Layout from './components/Layout';

const App: React.FC = () => {
  const loadDailyEntries = useDailyStore((s) => s.loadEntries);
  const loadDreamEntries = useDreamStore((s) => s.loadEntries);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    loadSettings();
    loadDailyEntries();
    loadDreamEntries();
  }, [loadSettings, loadDailyEntries, loadDreamEntries]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <Layout />;
};

export default App;
