import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import LogTab from './components/LogTab';
import DayViewTab from './components/DayViewTab';
import StatsTab from './components/StatsTab';
import TodosTab from './components/TodosTab';
import EditModal from './components/EditModal';
import { getEntriesByDate } from './api/entries';
import { formatDateDisplay, todayStr } from './utils/time';

export default function App() {
  const { isAuthenticated, user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('wt_dark') === '1');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('wt_dark', darkMode ? '1' : '0');
  }, [darkMode]);

  if (!isAuthenticated) return <AuthPage />;
  return <AppShell user={user} onLogout={logout} darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
}

function AppShell({ user, onLogout, darkMode, onToggleDark }) {
  const [activeTab, setActiveTab] = useState('log');
  const [currentDate, setCurrentDate] = useState(todayStr());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEntriesByDate(currentDate);
      setEntries(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  function fmtLocal(d) {
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
  }

  function prevDay() {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setCurrentDate(fmtLocal(d));
  }

  function nextDay() {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setCurrentDate(fmtLocal(d));
  }

  function goToday() {
    setCurrentDate(todayStr());
  }

  return (
    <div className="app">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">⏱</span>
            <span className="brand-name">Work Tracker</span>
          </div>
          <nav className="tabs">
            {[
              { key: 'log',   label: 'Log' },
              { key: 'day',   label: 'Day View' },
              { key: 'todos', label: 'Todos' },
              { key: 'stats', label: 'Stats' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`tab-btn${activeTab === key ? ' active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="header-user">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase() ?? '?'}</div>
            <span className="user-name">{user?.name}</span>
            <button
              className="icon-btn theme-btn"
              onClick={onToggleDark}
              title={darkMode ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle theme"
            >
              {darkMode ? '☀' : '🌙'}
            </button>
            <button className="btn btn-ghost logout-btn" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </header>

      {/* ── Date Navigation (hidden on Stats and Todos) ─────── */}
      {activeTab !== 'stats' && activeTab !== 'todos' && (
        <div className="date-nav">
          <button className="icon-btn" onClick={prevDay} aria-label="Previous day">‹</button>
          <span className="date-label">{formatDateDisplay(currentDate)}</span>
          <button className="icon-btn" onClick={nextDay} aria-label="Next day">›</button>
          {currentDate !== todayStr() && (
            <button className="today-btn" onClick={goToday}>Today</button>
          )}
        </div>
      )}

      {/* ── Global error ──────────────────────────────────── */}
      {error && <div className="global-error">⚠ {error}</div>}

      {/* ── Tab Content ───────────────────────────────────── */}
      <main className="main-content">
        {activeTab === 'log' && (
          <LogTab
            date={currentDate}
            entries={entries}
            loading={loading}
            onEntryAdded={loadEntries}
            onEntryDeleted={loadEntries}
            onEntryEdit={setEditingEntry}
          />
        )}
        {activeTab === 'day' && (
          <DayViewTab
            date={currentDate}
            entries={entries}
            loading={loading}
            onEntryEdit={setEditingEntry}
          />
        )}
        {activeTab === 'todos' && <TodosTab />}
        {activeTab === 'stats' && <StatsTab />}
      </main>

      {/* ── Edit Modal ────────────────────────────────────── */}
      {editingEntry && (
        <EditModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={() => { setEditingEntry(null); loadEntries(); }}
        />
      )}
    </div>
  );
}
