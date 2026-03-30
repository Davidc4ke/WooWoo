import React from 'react';
import Sidebar from './Sidebar';
import { useUIStore } from '../stores';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import DailyJournalPage from '../pages/DailyJournalPage';
import DreamJournalPage from '../pages/DreamJournalPage';
import SoulReviewPage from '../pages/SoulReviewPage';
import SettingsPage from '../pages/SettingsPage';

/* ── Moon Phase Calculation ── */
function getMoonPhase(date: Date): { icon: string; label: string } {
  // Known new moon: January 6, 2000
  const knownNew = new Date(2000, 0, 6).getTime();
  const cycle = 29.53058770576;
  const diffDays = (date.getTime() - knownNew) / (1000 * 60 * 60 * 24);
  const phase = ((diffDays % cycle) + cycle) % cycle;

  if (phase < 1.85) return { icon: '🌑', label: 'New Moon' };
  if (phase < 5.53) return { icon: '🌒', label: 'Waxing Crescent' };
  if (phase < 9.22) return { icon: '🌓', label: 'First Quarter' };
  if (phase < 12.91) return { icon: '🌔', label: 'Waxing Gibbous' };
  if (phase < 16.61) return { icon: '🌕', label: 'Full Moon' };
  if (phase < 20.30) return { icon: '🌖', label: 'Waning Gibbous' };
  if (phase < 23.99) return { icon: '🌗', label: 'Last Quarter' };
  if (phase < 27.68) return { icon: '🌘', label: 'Waning Crescent' };
  return { icon: '🌑', label: 'New Moon' };
}

const MoonPhaseIndicator: React.FC = () => {
  const moon = getMoonPhase(new Date());
  return (
    <div className="moon-phase" title={moon.label}>
      <span className="moon-phase-icon">{moon.icon}</span>
      <span className="moon-phase-label">{moon.label}</span>
    </div>
  );
};

const StarDecorations: React.FC = () => (
  <div className="star-decorations">
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="sparkle" />
    ))}
  </div>
);

const Layout: React.FC = () => {
  const activeTab = useUIStore((s) => s.activeTab);

  useKeyboardShortcuts();

  const renderPage = () => {
    switch (activeTab) {
      case 'daily':
        return <DailyJournalPage />;
      case 'dream':
        return <DreamJournalPage />;
      case 'review':
        return <SoulReviewPage />;
      case 'settings':
        return <SettingsPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <StarDecorations />
        <div className="page-container" key={activeTab}>
          {renderPage()}
        </div>
        <MoonPhaseIndicator />
      </main>
    </div>
  );
};

export default Layout;
