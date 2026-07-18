import { useState } from 'react';
import { updateEntry } from '../api/entries';
import { TYPE_LABELS, ALL_TYPES } from '../utils/colors';
import { validateEntryForm } from '../utils/validation';

export default function EditModal({ entry, onClose, onSaved }) {
  const [task,   setTask]   = useState(entry.task   || '');
  const [type,   setType]   = useState(entry.type   || 'task');
  const [mins,   setMins]   = useState(String(entry.mins || ''));
  const [start,  setStart]  = useState(entry.start  || '');
  const [ticket, setTicket] = useState(entry.ticket || '');
  const [notes,  setNotes]  = useState(entry.notes  || '');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  async function handleSave(e) {
    e.preventDefault();
    const validationError = validateEntryForm({ task, mins });
    if (validationError) { setError(validationError); return; }
    setError('');
    setSaving(true);
    try {
      await updateEntry(entry._id, { task, type, mins: Number(mins), start, ticket, notes });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Close when clicking the backdrop (not the modal itself)
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">Edit Entry</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label>Task *</label>
            <input className="input" value={task} onChange={e => setTask(e.target.value)} autoFocus />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type *</label>
              <select className="select" value={type} onChange={e => setType(e.target.value)}>
                {ALL_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Duration (mins) *</label>
              <input
                className="input"
                type="number"
                min="1"
                value={mins}
                onChange={e => setMins(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start time</label>
              <input className="input" type="time" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Ticket</label>
              <input className="input" value={ticket} onChange={e => setTicket(e.target.value)} placeholder="JIRA-123" />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea className="textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {error && <p className="field-error">⚠ {error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
