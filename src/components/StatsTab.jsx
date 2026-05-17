import { useState, useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { getEntriesRange } from '../api/entries';
import { TYPE_COLORS, TYPE_LABELS, ALL_TYPES } from '../utils/colors';
import { fmtMins, getPastDays } from '../utils/time';

Chart.register(...registerables);

function sumMins(entries, types) {
  return entries
    .filter(e => !types || types.includes(e.type))
    .reduce((s, e) => s + (e.mins || 0), 0);
}

function heatColor(hours) {
  if (hours === 0)   return '#E8E8E8';
  if (hours < 2)     return '#BDD7F5';
  if (hours < 4)     return '#6AAEE0';
  if (hours < 6)     return '#2D7DC8';
  return '#185FA5';
}

export default function StatsTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const chartRef         = useRef(null);
  const chartInstanceRef = useRef(null);

  // Stable date arrays (memoised once per mount)
  const last14 = useMemo(() => getPastDays(14), []);
  const last7  = useMemo(() => getPastDays(7),  []);

  // Fetch ~90 days of entries for stats
  useEffect(() => {
    const to   = last14[last14.length - 1];
    const from = (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); })();
    setLoading(true);
    getEntriesRange(from, to)
      .then(data => { setEntries(data); setError(null); })
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-day map: { 'YYYY-MM-DD': { task: mins, issue: mins, … } }
  const dayMap = useMemo(() => {
    const map = {};
    entries.forEach(e => {
      if (!map[e.date]) map[e.date] = {};
      map[e.date][e.type] = (map[e.date][e.type] || 0) + e.mins;
    });
    return map;
  }, [entries]);

  // ── All-time summary stats ────────────────────────────────
  const allTotal      = sumMins(entries);
  const allBreak      = sumMins(entries, ['break']);
  const allProductive = allTotal - allBreak;
  const productivePct = allTotal > 0 ? Math.round((allProductive / allTotal) * 100) : 0;

  const uniqueDays = [...new Set(entries.map(e => e.date))];
  const avgMins    = uniqueDays.length > 0 ? Math.round(allTotal / uniqueDays.length) : 0;

  const topType = ALL_TYPES
    .map(type => ({ type, mins: sumMins(entries, [type]) }))
    .sort((a, b) => b.mins - a.mins)[0];

  // ── All-time by type for horizontal bar ───────────────────
  const allTimeByType = ALL_TYPES
    .map(type => ({ type, mins: sumMins(entries, [type]) }))
    .filter(t => t.mins > 0)
    .sort((a, b) => b.mins - a.mins);
  const maxAllTime = Math.max(...allTimeByType.map(t => t.mins), 1);

  // ── Chart.js stacked bar (last 14 days) ───────────────────
  useEffect(() => {
    if (loading || !chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const labels   = last14.map(d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const datasets = ALL_TYPES.map(type => ({
      label: TYPE_LABELS[type],
      data:  last14.map(d => parseFloat(((dayMap[d]?.[type] || 0) / 60).toFixed(2))),
      backgroundColor: TYPE_COLORS[type],
      borderRadius: 2,
      borderSkipped: false,
    }));

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 16, font: { size: 12 } },
          },
        },
        responsive:          true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { stacked: true, title: { display: true, text: 'Hours', font: { size: 11 } }, grid: { color: '#F0F0F0' } },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [loading, dayMap, last14]);

  if (loading) return <div className="tab-content"><div className="loading">Loading stats…</div></div>;
  if (error)   return <div className="tab-content"><div className="field-error" style={{ padding: 24 }}>⚠ {error}</div></div>;

  return (
    <div className="tab-content" style={{ paddingTop: 16 }}>

      {/* ── Summary cards ─────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card" style={{ '--card-accent': 'var(--accent)' }}>
          <div className="stat-card-icon">⏱</div>
          <div className="stat-label">All-Time Logged</div>
          <div className="stat-value">{fmtMins(allTotal)}</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-review)' }}>
          <div className="stat-card-icon">🎯</div>
          <div className="stat-label">Productive %</div>
          <div className="stat-value" style={{ color: 'var(--color-review)' }}>{productivePct}%</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-meeting)' }}>
          <div className="stat-card-icon">📊</div>
          <div className="stat-label">Avg / Day</div>
          <div className="stat-value">{fmtMins(avgMins)}</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': topType?.mins > 0 ? TYPE_COLORS[topType.type] : 'var(--accent)' }}>
          <div className="stat-card-icon">🏆</div>
          <div className="stat-label">Top Type</div>
          <div
            className="stat-value"
            style={{ fontSize: 16, color: topType?.mins > 0 ? TYPE_COLORS[topType.type] : 'inherit' }}
          >
            {topType?.mins > 0 ? TYPE_LABELS[topType.type] : '—'}
          </div>
        </div>
      </div>

      {/* ── 7-day heatmap ─────────────────────────────────── */}
      <section className="panel">
        <h2 className="panel-title">Last 7 Days</h2>
        <div className="heatmap">
          {last7.map(d => {
            const mins  = Object.values(dayMap[d] || {}).reduce((s, v) => s + v, 0);
            const hours = Math.round(mins / 60 * 10) / 10;
            const day   = new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <div key={d} className="heatmap-cell">
                <div
                  className="heatmap-circle"
                  style={{ background: heatColor(hours) }}
                  title={`${d}: ${fmtMins(mins)}`}
                />
                <div className="heatmap-day">{day}</div>
                <div className="heatmap-hours">{hours > 0 ? `${hours}h` : '—'}</div>
              </div>
            );
          })}
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          {['#E8E8E8', '#BDD7F5', '#6AAEE0', '#2D7DC8', '#185FA5'].map(c => (
            <div
              key={c}
              className="heatmap-circle"
              style={{ background: c, width: 14, height: 14, border: '0.5px solid var(--border)' }}
            />
          ))}
          <span>More</span>
        </div>
      </section>

      {/* ── Chart.js stacked bar — last 14 days ─────────────── */}
      <section className="panel">
        <h2 className="panel-title">Last 14 Days by Type</h2>
        <div style={{ height: 260, position: 'relative' }}>
          <canvas ref={chartRef} />
        </div>
      </section>

      {/* ── All-time horizontal bar by type ─────────────────── */}
      {allTimeByType.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">All-Time by Type</h2>
          <div className="bar-chart">
            {allTimeByType.map(({ type, mins }) => (
              <div key={type} className="bar-row">
                <div className="bar-label">{TYPE_LABELS[type]}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(mins / maxAllTime) * 100}%`, background: TYPE_COLORS[type] }}
                  />
                </div>
                <div className="bar-value">{fmtMins(mins)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
