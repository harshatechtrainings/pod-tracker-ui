import { useState, useEffect, useRef } from 'react';
import { createEntry, deleteEntry } from '../api/entries';
import { fmtMins, fmtSeconds } from '../utils/time';
import { TYPE_COLORS, TYPE_LABELS, ALL_TYPES } from '../utils/colors';
import { validateEntryForm } from '../utils/validation';

export default function LogTab({ date, entries, loading, onEntryAdded, onEntryDeleted, onEntryEdit }) {
  // ── Stopwatch ──────────────────────────────────────────────
  const [swTask,      setSwTask]      = useState('');
  const [swType,      setSwType]      = useState('task');
  const [swTicket,    setSwTicket]    = useState('');
  const [swRunning,   setSwRunning]   = useState(false);
  const [swSeconds,   setSwSeconds]   = useState(0);
  const [swStartTime, setSwStartTime] = useState('');
  const [swError,     setSwError]     = useState('');
  const [swSaving,    setSwSaving]    = useState(false);
  const timerRef = useRef(null);

  // ── Manual form ────────────────────────────────────────────
  const [showManual, setShowManual] = useState(false);
  const [mTask,   setMTask]   = useState('');
  const [mType,   setMType]   = useState('task');
  const [mMins,   setMMins]   = useState('');
  const [mStart,  setMStart]  = useState('');
  const [mTicket, setMTicket] = useState('');
  const [mNotes,  setMNotes]  = useState('');
  const [mError,  setMError]  = useState('');
  const [mSaving, setMSaving] = useState(false);

  // ── Delete ─────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Stop stopwatch when date changes
  useEffect(() => {
    clearInterval(timerRef.current);
    setSwRunning(false);
    setSwSeconds(0);
    setSwStartTime('');
  }, [date]);

  // Tick
  useEffect(() => {
    if (swRunning) {
      timerRef.current = setInterval(() => setSwSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [swRunning]);

  function handleSwStart() {
    if (!swTask.trim()) { setSwError('Task name is required'); return; }
    setSwError('');
    const now = new Date();
    setSwStartTime(
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    );
    setSwSeconds(0);
    setSwRunning(true);
  }

  async function handleSwStop() {
    setSwRunning(false);
    const mins = Math.max(1, Math.round(swSeconds / 60));
    setSwSaving(true);
    try {
      await createEntry({ task: swTask, type: swType, date, mins, start: swStartTime, ticket: swTicket, notes: '' });
      setSwTask(''); setSwTicket(''); setSwSeconds(0); setSwStartTime('');
      onEntryAdded();
    } catch (e) {
      setSwError(e.message);
      setSwRunning(false); // ensure timer is stopped even on error
    } finally {
      setSwSaving(false);
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    const validationError = validateEntryForm({ task: mTask, mins: mMins });
    if (validationError) { setMError(validationError); return; }
    setMError('');
    setMSaving(true);
    try {
      await createEntry({ task: mTask, type: mType, date, mins: Number(mMins), start: mStart, ticket: mTicket, notes: mNotes });
      setMTask(''); setMType('task'); setMMins(''); setMStart(''); setMTicket(''); setMNotes('');
      setShowManual(false);
      onEntryAdded();
    } catch (e) {
      setMError(e.message);
    } finally {
      setMSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setDeleteError('');
    try {
      await deleteEntry(id);
      onEntryDeleted();
    } catch (e) {
      setDeleteError(e.message || 'Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="tab-content">

      {/* ── Stopwatch ───────────────────────────────────────── */}
      <section className="panel">
        <h2 className="panel-title">⏱ Stopwatch</h2>
        <div className="sw-layout">
          <input
            className="input"
            placeholder="What are you working on?"
            value={swTask}
            onChange={e => setSwTask(e.target.value)}
            disabled={swRunning}
            onKeyDown={e => { if (e.key === 'Enter' && !swRunning) handleSwStart(); }}
          />
          <div className="sw-row">
            <select className="select" value={swType} onChange={e => setSwType(e.target.value)} disabled={swRunning}>
              {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
            <input
              className="input"
              placeholder="Ticket (optional, e.g. JIRA-123)"
              value={swTicket}
              onChange={e => setSwTicket(e.target.value)}
              disabled={swRunning}
              style={{ maxWidth: 220 }}
            />
          </div>
          <div className="sw-controls">
            {swRunning && <span className="sw-pulse-dot" />}
            <span className="sw-timer" style={{ color: swRunning ? '#E24B4A' : 'var(--text-secondary)' }}>
              {fmtSeconds(swSeconds)}
            </span>
            {!swRunning ? (
              <button className="btn btn-primary" onClick={handleSwStart} disabled={swSaving}>
                ▶ Start
              </button>
            ) : (
              <button className="btn btn-danger" onClick={handleSwStop} disabled={swSaving}>
                ■ Stop &amp; Save
              </button>
            )}
          </div>
          {swError && <p className="field-error">⚠ {swError}</p>}
        </div>
      </section>

      {/* ── Manual Entry ────────────────────────────────────── */}
      <section className="panel">
        <button className="toggle-btn" onClick={() => setShowManual(v => !v)}>
          {showManual ? '▾' : '▸'} Add Manually
        </button>
        {showManual && (
          <form className="manual-form" onSubmit={handleManualSubmit}>
            <div className="form-row">
              <div className="form-group flex2">
                <label>Task *</label>
                <input className="input" value={mTask} onChange={e => setMTask(e.target.value)} placeholder="Task description" />
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select className="select" value={mType} onChange={e => setMType(e.target.value)}>
                  {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Duration (mins) *</label>
                <input className="input" type="number" min="1" value={mMins} onChange={e => setMMins(e.target.value)} placeholder="30" />
              </div>
              <div className="form-group">
                <label>Start time</label>
                <input className="input" type="time" value={mStart} onChange={e => setMStart(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Ticket</label>
                <input className="input" value={mTicket} onChange={e => setMTicket(e.target.value)} placeholder="JIRA-123" />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea className="textarea" rows={2} value={mNotes} onChange={e => setMNotes(e.target.value)} placeholder="Optional notes…" />
            </div>
            {mError && <p className="field-error">⚠ {mError}</p>}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={mSaving}>
                {mSaving ? 'Saving…' : '+ Save Entry'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowManual(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>

      {/* ── Entries list ────────────────────────────────────── */}
      <section>
        <h3 className="section-title">{entries.length} {entries.length === 1 ? 'entry' : 'entries'} logged</h3>
        {deleteError && <p className="field-error">⚠ {deleteError}</p>}
        {loading ? (
          <div className="loading">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">Nothing logged yet</div>
            <div className="empty-sub">Start the stopwatch above or use "Add Manually" to record your first entry</div>
          </div>
        ) : (
          <div className="entry-list">
            {entries.map(entry => (
              <div
                key={entry._id}
                className="entry-card"
                style={{ borderLeftColor: TYPE_COLORS[entry.type] }}
              >
                <div className="entry-left">
                  <span
                    className="type-badge"
                    style={{
                      background: TYPE_COLORS[entry.type] + '22',
                      color: TYPE_COLORS[entry.type],
                      borderColor: TYPE_COLORS[entry.type] + '55',
                    }}
                  >
                    {TYPE_LABELS[entry.type]}
                  </span>
                  <div>
                    <div className="entry-task">{entry.task}</div>
                    <div className="entry-meta">
                      {entry.start && <span>{entry.start}</span>}
                      {entry.ticket && <span className="ticket-badge">{entry.ticket}</span>}
                    </div>
                  </div>
                </div>
                <div className="entry-right">
                  <span className="entry-duration">{fmtMins(entry.mins)}</span>
                  <button className="icon-btn" title="Edit" onClick={() => onEntryEdit(entry)}>✏</button>
                  <button
                    className="icon-btn danger"
                    title="Delete"
                    onClick={() => handleDelete(entry._id)}
                    disabled={deletingId === entry._id}
                  >
                    {deletingId === entry._id ? '…' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
