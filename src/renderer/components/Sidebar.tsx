import React from 'react';
import { useUIStore } from '../stores';
import { Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';

const navItems = [
  { id: 'daily' as const, icon: '🌞', label: 'Daily Journal' },
  { id: 'dream' as const, icon: '🌙', label: 'Dream Journal' },
  { id: 'review' as const, icon: '🔮', label: 'Soul Review' },
  { id: 'settings' as const, icon: '⚙️', label: 'Settings' },
];

const Sidebar: React.FC = () => {
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-brand">
        {collapsed ? (
          <span className="brand-icon">✨</span>
        ) : (
          <h1>✨ Soul Journal</h1>
        )}
      </div>

      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li
            key={item.id}
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => setActiveTab(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <button onClick={toggleTheme} title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button onClick={toggleSidebar} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
