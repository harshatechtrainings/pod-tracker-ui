import { TYPE_COLORS, TYPE_LABELS, ALL_TYPES } from '../utils/colors';
import { fmtMins } from '../utils/time';

function sumMins(entries, types) {
  return entries
    .filter(e => !types || types.includes(e.type))
    .reduce((sum, e) => sum + (e.mins || 0), 0);
}

export default function DayViewTab({ entries, loading, onEntryEdit }) {
  const totalMins      = sumMins(entries);
  const breakMins      = sumMins(entries, ['break']);
  const productiveMins = totalMins - breakMins;

  // Minutes by type (only types with data)
  const byType = ALL_TYPES
    .map(type => ({ type, mins: sumMins(entries, [type]) }))
    .filter(t => t.mins > 0);

  const maxMins = Math.max(...byType.map(t => t.mins), 1);

  return (
    <div className="tab-content">

      {/* ── Summary cards ───────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Logged</div>
          <div className="stat-value">{fmtMins(totalMins)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Productive</div>
          <div className="stat-value" style={{ color: 'var(--color-review)' }}>{fmtMins(productiveMins)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Breaks</div>
          <div className="stat-value" style={{ color: 'var(--color-break)' }}>{fmtMins(breakMins)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Entries</div>
          <div className="stat-value">{entries.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="empty-state">No entries for this day.</div>
      ) : (
        <>
          {/* ── Timeline bar ─────────────────────────────────── */}
          {totalMins > 0 && (
            <section className="panel">
              <h2 className="panel-title">Timeline</h2>
              <div className="timeline-bar">
                {entries.map(entry => (
                  <div
                    key={entry._id}
                    className="timeline-segment"
                    style={{
                      width: `${(entry.mins / totalMins) * 100}%`,
                      background: TYPE_COLORS[entry.type],
                    }}
                    title={`${entry.task} — ${fmtMins(entry.mins)}`}
                  />
                ))}
              </div>
              <div className="timeline-legend">
                {byType.map(({ type, mins }) => (
                  <div key={type} className="legend-item">
                    <span className="legend-dot" style={{ background: TYPE_COLORS[type] }} />
                    <span>{TYPE_LABELS[type]}: {fmtMins(mins)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Horizontal bar chart by type ─────────────────── */}
          {byType.length > 0 && (
            <section className="panel">
              <h2 className="panel-title">Time by Type</h2>
              <div className="bar-chart">
                {byType.map(({ type, mins }) => (
                  <div key={type} className="bar-row">
                    <div className="bar-label">{TYPE_LABELS[type]}</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(mins / maxMins) * 100}%`, background: TYPE_COLORS[type] }}
                      />
                    </div>
                    <div className="bar-value">{fmtMins(mins)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Full entry list ───────────────────────────────── */}
          <section className="panel">
            <h2 className="panel-title">All Entries</h2>
            <div className="entry-list">
              {entries.map(entry => (
                <div key={entry._id} className="entry-card">
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
                        {entry.start  && <span>{entry.start}</span>}
                        {entry.ticket && <span className="ticket-badge">{entry.ticket}</span>}
                      </div>
                      {entry.notes && <div className="entry-notes">{entry.notes}</div>}
                    </div>
                  </div>
                  <div className="entry-right">
                    <span className="entry-duration">{fmtMins(entry.mins)}</span>
                    <button className="icon-btn" title="Edit" onClick={() => onEntryEdit(entry)}>✏</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
