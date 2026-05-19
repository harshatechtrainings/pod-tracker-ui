import { useState } from 'react';
import { TYPE_LABELS, ALL_TYPES } from '../utils/colors';
import { createEntry } from '../api/entries';
import { todayStr } from '../utils/time';

const STORAGE_KEY = 'wt_todos';

function loadTodos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export default function TodosTab() {
  const [todos, setTodos]           = useState(loadTodos);
  const [newTask, setNewTask]       = useState('');
  const [addError, setAddError]     = useState('');
  const [completingTodo, setCompletingTodo] = useState(null);

  function handleAddTodo(e) {
    e.preventDefault();
    if (!newTask.trim()) { setAddError('Todo name is required'); return; }
    const todo = {
      id: Date.now().toString(),
      task: newTask.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [todo, ...todos];
    setTodos(updated);
    saveTodos(updated);
    setNewTask('');
    setAddError('');
  }

  function handleDelete(id) {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    saveTodos(updated);
  }

  function handleMarkDone(todo) {
    setCompletingTodo(todo);
  }

  function handleCompleted(todoId) {
    const updated = todos.map(t => t.id === todoId ? { ...t, done: true } : t);
    setTodos(updated);
    saveTodos(updated);
    setCompletingTodo(null);
  }

  function handleSkip(todoId) {
    const updated = todos.map(t => t.id === todoId ? { ...t, done: true } : t);
    setTodos(updated);
    saveTodos(updated);
    setCompletingTodo(null);
  }

  const pending = todos.filter(t => !t.done);
  const done    = todos.filter(t => t.done);

  return (
    <div className="tab-content">

      {/* ── Add todo ──────────────────────────────────────── */}
      <section className="panel">
        <h2 className="panel-title">📋 Todos</h2>
        <form onSubmit={handleAddTodo}>
          <div className="sw-row" style={{ gap: 8 }}>
            <input
              className="input"
              placeholder="What do you need to do?"
              value={newTask}
              onChange={e => { setNewTask(e.target.value); setAddError(''); }}
            />
            <button type="submit" className="btn btn-primary">+ Add</button>
          </div>
          {addError && <p className="field-error" style={{ marginTop: 6 }}>⚠ {addError}</p>}
        </form>
      </section>

      {/* ── Pending todos ─────────────────────────────────── */}
      <section>
        <h3 className="section-title">{pending.length} pending</h3>
        {pending.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">All caught up!</div>
            <div className="empty-sub">Add a todo above to get started</div>
          </div>
        ) : (
          <div className="entry-list">
            {pending.map(todo => (
              <div key={todo.id} className="entry-card" style={{ borderLeftColor: 'var(--accent)' }}>
                <div className="entry-main">
                  <span className="entry-task">{todo.task}</span>
                </div>
                <div className="entry-actions">
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '4px 12px' }}
                    onClick={() => handleMarkDone(todo)}
                  >
                    ✓ Done
                  </button>
                  <button
                    className="icon-btn"
                    title="Remove"
                    onClick={() => handleDelete(todo.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Completed todos ───────────────────────────────── */}
      {done.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h3 className="section-title" style={{ color: 'var(--text-secondary)' }}>
            {done.length} completed
          </h3>
          <div className="entry-list">
            {done.map(todo => (
              <div
                key={todo.id}
                className="entry-card"
                style={{ borderLeftColor: 'var(--color-review)', opacity: 0.55 }}
              >
                <div className="entry-main">
                  <span className="entry-task" style={{ textDecoration: 'line-through' }}>
                    {todo.task}
                  </span>
                </div>
                <div className="entry-actions">
                  <button className="icon-btn" title="Remove" onClick={() => handleDelete(todo.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Complete modal ────────────────────────────────── */}
      {completingTodo && (
        <TodoCompleteModal
          todo={completingTodo}
          onSaved={() => handleCompleted(completingTodo.id)}
          onSkip={() => handleSkip(completingTodo.id)}
          onClose={() => setCompletingTodo(null)}
        />
      )}
    </div>
  );
}

function TodoCompleteModal({ todo, onSaved, onSkip, onClose }) {
  const [task,   setTask]   = useState(todo.task);
  const [type,   setType]   = useState('task');
  const [date,   setDate]   = useState(todayStr());
  const [mins,   setMins]   = useState('');
  const [start,  setStart]  = useState('');
  const [ticket, setTicket] = useState('');
  const [notes,  setNotes]  = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function handleSave(e) {
    e.preventDefault();
    if (!task.trim())              { setError('Task name is required'); return; }
    if (!mins || Number(mins) < 1) { setError('Duration must be at least 1 minute'); return; }
    setError('');
    setSaving(true);
    try {
      await createEntry({ task, type, date, mins: Number(mins), start, ticket, notes });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="todo-modal-title">
        <div className="modal-header">
          <h2 id="todo-modal-title">Log time for this todo</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Task *</label>
            <input
              className="input"
              value={task}
              onChange={e => setTask(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select className="select" value={type} onChange={e => setType(e.target.value)}>
                {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                className="input"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (mins) *</label>
              <input
                className="input"
                type="number"
                min="1"
                value={mins}
                onChange={e => setMins(e.target.value)}
                placeholder="30"
              />
            </div>
            <div className="form-group">
              <label>Start time</label>
              <input
                className="input"
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Ticket</label>
              <input
                className="input"
                value={ticket}
                onChange={e => setTicket(e.target.value)}
                placeholder="JIRA-123"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              className="textarea"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>

          {error && <p className="field-error">⚠ {error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : '✓ Log & Mark Done'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onSkip}>
              Mark Done (skip log)
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
