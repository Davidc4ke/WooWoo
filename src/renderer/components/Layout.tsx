import React from 'react';
import Sidebar from './Sidebar';
import { useUIStore } from '../stores';
import DailyJournalPage from '../pages/DailyJournalPage';
import DreamJournalPage from '../pages/DreamJournalPage';
import SoulReviewPage from '../pages/SoulReviewPage';
import SettingsPage from '../pages/SettingsPage';

const StarDecorations: React.FC = () => (
  <div className="star-decorations">
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="sparkle" />
    ))}
  </div>
);

const Layout: React.FC = () => {
  const activeTab = useUIStore((s) => s.activeTab);

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
      </main>
    </div>
  );
};

export default Layout;
