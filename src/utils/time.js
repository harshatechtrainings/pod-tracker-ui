/** Returns today's date as YYYY-MM-DD (local timezone) */
export function todayStr() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Format a YYYY-MM-DD string for display: "Today", "Yesterday", or "Mon, May 17" */
export function formatDateDisplay(dateStr) {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);

  if (target.getTime() === today.getTime())     return 'Today';
  if (target.getTime() === yesterday.getTime()) return 'Yesterday';
  if (target.getTime() === tomorrow.getTime())  return 'Tomorrow';

  return target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Format minutes as "1h 30m", "45m", "2h" etc. */
export function fmtMins(mins) {
  if (mins == null || mins === 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Format raw seconds as HH:MM:SS */
export function fmtSeconds(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/** Returns an array of the last n days as YYYY-MM-DD strings (oldest → today) */
export function getPastDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push([
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-'));
  }
  return days;
}
