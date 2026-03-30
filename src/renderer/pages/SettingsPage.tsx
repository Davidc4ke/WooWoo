import React, { useState, useEffect, useCallback } from 'react';
import { useSettingsStore, useUIStore, useDailyStore, useDreamStore } from '../stores';
import { dailyEntryRepo, dreamEntryRepo, analysisRepo } from '../db';
import type { SpiritualFramework, Analysis } from '../../shared/types';
import { Eye, EyeOff } from 'lucide-react';

const FRAMEWORKS: { key: SpiritualFramework; icon: string; label: string; description: string }[] = [
  { key: 'astrology', icon: '\u2604', label: 'Astrology', description: 'Planetary transits & natal chart insights' },
  { key: 'numerology', icon: '#', label: 'Numerology', description: 'Number patterns & life path analysis' },
  { key: 'tarot', icon: '\u2663', label: 'Tarot', description: 'Archetypal card wisdom & guidance' },
  { key: 'chakra', icon: '\u2740', label: 'Chakras', description: 'Energy center balance & alignment' },
  { key: 'general', icon: '\u2728', label: 'General Spiritual', description: 'Holistic reflection & mindfulness' },
];

const SettingsPage: React.FC = () => {
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const getApiKey = useSettingsStore((s) => s.getApiKey);
  const setPreferredFrameworks = useSettingsStore((s) => s.setPreferredFrameworks);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const loadDailyEntries = useDailyStore((s) => s.loadEntries);
  const loadDreamEntries = useDreamStore((s) => s.loadEntries);

  // Local form state
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');

  // Sync local state when settings load
  useEffect(() => {
    if (settings) {
      setBirthDate(settings.birth_date || '');
      setBirthTime(settings.birth_time || '');
      setBirthLocation(settings.birth_location || '');
      setApiKeyInput(getApiKey());
    }
  }, [settings, getApiKey]);

  // Save birth info on blur
  const saveBirthInfo = useCallback(() => {
    updateSettings({
      birth_date: birthDate,
      birth_time: birthTime,
      birth_location: birthLocation,
    });
  }, [birthDate, birthTime, birthLocation, updateSettings]);

  // Toggle a framework
  const toggleFramework = useCallback(
    (fw: SpiritualFramework) => {
      if (!settings) return;
      const current = settings.preferred_frameworks;
      const updated = current.includes(fw)
        ? current.filter((f) => f !== fw)
        : [...current, fw];
      // Don't allow deselecting all
      if (updated.length === 0) return;
      setPreferredFrameworks(updated);
    },
    [settings, setPreferredFrameworks]
  );

  // Save API key on blur
  const saveApiKey = useCallback(() => {
    setApiKey(apiKeyInput);
  }, [apiKeyInput, setApiKey]);

  // Test API connection
  const testConnection = useCallback(async () => {
    if (!apiKeyInput.trim()) {
      setTestStatus('error');
      setTestMessage('Please enter an API key first');
      return;
    }
    setTestStatus('testing');
    setTestMessage('');
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeyInput,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      if (response.ok) {
        setTestStatus('success');
        setTestMessage('Connection successful!');
      } else if (response.status === 401) {
        setTestStatus('error');
        setTestMessage('Invalid API key');
      } else if (response.status === 429) {
        setTestStatus('error');
        setTestMessage('Rate limited — try again shortly');
      } else {
        setTestStatus('error');
        setTestMessage(`Error: ${response.status}`);
      }
    } catch {
      setTestStatus('error');
      setTestMessage('Network error — check your connection');
    }
  }, [apiKeyInput]);

  // Export all data as JSON
  const handleExport = useCallback(() => {
    const allDaily = dailyEntryRepo.getAll(1, 10000);
    const allDreams = dreamEntryRepo.getAll(1, 10000);
    const allAnalyses: Analysis[] = [];
    // Gather analyses for all entries
    for (const entry of allDaily) {
      const a = analysisRepo.getByEntryId(entry.id);
      if (a.length > 0) allAnalyses.push(...a);
    }
    for (const entry of allDreams) {
      const a = analysisRepo.getByEntryId(entry.id);
      if (a.length > 0) allAnalyses.push(...a);
    }
    const exportData = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      daily_entries: allDaily,
      dream_entries: allDreams,
      analyses: allAnalyses,
      settings: settings
        ? {
            birth_date: settings.birth_date,
            birth_time: settings.birth_time,
            birth_location: settings.birth_location,
            preferred_frameworks: settings.preferred_frameworks,
          }
        : null,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soul-journal-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings]);

  // Import data from JSON
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          let imported = { daily: 0, dream: 0, analyses: 0 };

          // Import daily entries (merge — skip if date already exists)
          if (Array.isArray(data.daily_entries)) {
            for (const entry of data.daily_entries) {
              try {
                const existing = dailyEntryRepo.getByDate(entry.date);
                if (!existing) {
                  dailyEntryRepo.create({
                    date: entry.date,
                    title: entry.title || '',
                    body: entry.body || '',
                    mood: entry.mood || 'neutral',
                    tags: entry.tags || [],
                  });
                  imported.daily++;
                }
              } catch {
                // Skip duplicates
              }
            }
          }

          // Import dream entries
          if (Array.isArray(data.dream_entries)) {
            for (const entry of data.dream_entries) {
              try {
                dreamEntryRepo.create({
                  date: entry.date,
                  title: entry.title || '',
                  body: entry.body || '',
                  clarity: entry.clarity ?? 3,
                  is_lucid: entry.is_lucid || false,
                  is_recurring: entry.is_recurring || false,
                  symbol_tags: entry.symbol_tags || [],
                });
                imported.dream++;
              } catch {
                // Skip errors
              }
            }
          }

          // Import analyses
          if (Array.isArray(data.analyses)) {
            for (const analysis of data.analyses) {
              try {
                analysisRepo.create({
                  entry_id: analysis.entry_id,
                  entry_type: analysis.entry_type,
                  content: analysis.content || '',
                  frameworks_used: analysis.frameworks_used || [],
                  astro_context: analysis.astro_context || '',
                });
                imported.analyses++;
              } catch {
                // Skip errors
              }
            }
          }

          // Import settings (merge)
          if (data.settings) {
            const updates: Record<string, unknown> = {};
            if (data.settings.birth_date) updates.birth_date = data.settings.birth_date;
            if (data.settings.birth_time) updates.birth_time = data.settings.birth_time;
            if (data.settings.birth_location) updates.birth_location = data.settings.birth_location;
            if (data.settings.preferred_frameworks) updates.preferred_frameworks = data.settings.preferred_frameworks;
            if (Object.keys(updates).length > 0) {
              updateSettings(updates as Parameters<typeof updateSettings>[0]);
            }
          }

          // Reload stores
          loadSettings();
          loadDailyEntries();
          loadDreamEntries();

          setImportMessage(
            `Imported ${imported.daily} daily entries, ${imported.dream} dream entries, ${imported.analyses} analyses`
          );
          setTimeout(() => setImportMessage(''), 5000);
        } catch {
          setImportMessage('Failed to parse file. Make sure it is a valid Soul Journal export.');
          setTimeout(() => setImportMessage(''), 5000);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [updateSettings, loadSettings, loadDailyEntries, loadDreamEntries]);

  if (!settings) return null;

  return (
    <div className="settings-page">
      <div className="settings-inner">
        <h2>Settings</h2>

        {/* Birth Information */}
        <div className="settings-section">
          <div className="settings-section-title">Birth Information</div>
          <p className="settings-note">Used to personalize your spiritual analyses &#10024;</p>
          <div className="settings-field">
            <label>Birth Date</label>
            <input
              type="date"
              className="settings-input"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              onBlur={saveBirthInfo}
            />
          </div>
          <div className="settings-row">
            <div className="settings-field">
              <label>Birth Time (optional)</label>
              <input
                type="time"
                className="settings-input"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                onBlur={saveBirthInfo}
              />
            </div>
            <div className="settings-field">
              <label>Birth Location</label>
              <input
                type="text"
                className="settings-input"
                placeholder="City, Country"
                value={birthLocation}
                onChange={(e) => setBirthLocation(e.target.value)}
                onBlur={saveBirthInfo}
              />
            </div>
          </div>
        </div>

        {/* Spiritual Frameworks */}
        <div className="settings-section">
          <div className="settings-section-title">Spiritual Frameworks</div>
          <div className="framework-toggles">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw.key}
                className={`framework-pill${settings.preferred_frameworks.includes(fw.key) ? ' active' : ''}`}
                onClick={() => toggleFramework(fw.key)}
                title={fw.description}
              >
                {fw.icon} {fw.label}
              </button>
            ))}
          </div>
          <div className="framework-descriptions">
            {FRAMEWORKS.filter((fw) => settings.preferred_frameworks.includes(fw.key)).map((fw) => (
              <span key={fw.key} className="framework-desc">{fw.label}: {fw.description}</span>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="settings-section">
          <div className="settings-section-title">AI Connection</div>
          <div className="api-key-row">
            <div className="settings-field">
              <label>Anthropic API Key</label>
              <div className="api-key-input-wrapper">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="settings-input"
                  placeholder="Enter your API key..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  onBlur={saveApiKey}
                />
                <button
                  className="api-key-toggle"
                  onClick={() => setShowApiKey(!showApiKey)}
                  type="button"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              className="btn-small"
              onClick={testConnection}
              disabled={testStatus === 'testing'}
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test'}
            </button>
          </div>
          {testMessage && (
            <div className={`test-message ${testStatus}`}>{testMessage}</div>
          )}
        </div>

        {/* Theme */}
        <div className="settings-section">
          <div className="settings-section-title">Appearance</div>
          <div className="theme-selector">
            <div
              className={`theme-option${theme === 'light' ? ' active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <div className="theme-option-icon">&#9788;</div>
              <div className="theme-option-label">Light</div>
            </div>
            <div
              className={`theme-option${theme === 'dark' ? ' active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <div className="theme-option-icon">&#9790;</div>
              <div className="theme-option-label">Dark</div>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="settings-section">
          <div className="settings-section-title">Your Data</div>
          <p className="settings-note import-warning">Import will merge with your existing data</p>
          <div className="data-buttons">
            <button className="btn-outline" onClick={handleExport}>&#8615; Export JSON</button>
            <button className="btn-outline" onClick={handleImport}>&#8613; Import Data</button>
          </div>
          {importMessage && (
            <div className="import-message">{importMessage}</div>
          )}
        </div>

        {/* About */}
        <div className="settings-section">
          <div className="editor-divider">&#9790; &#10038; &#9790;</div>
          <div className="about-section">
            <div className="app-name">Soul Journal</div>
            <div className="app-version">Version 1.0.0</div>
            <div className="app-quote">
              "The soul usually knows what to do to heal itself.<br />
              The challenge is to silence the mind."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
