// ── API base URL ───────────────────────────────────────────────
// Development: set VITE_API_BASE=http://localhost:3000 in .env
// Production:  set VITE_API_BASE=https://your-service.onrender.com in Netlify env vars
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('work_tracker_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }
  return json.data;
}

// GET /api/entries?date=YYYY-MM-DD
export function getEntriesByDate(date) {
  return request(`/api/entries?date=${date}`);
}

// GET /api/entries/range?from=YYYY-MM-DD&to=YYYY-MM-DD
export function getEntriesRange(from, to) {
  return request(`/api/entries/range?from=${from}&to=${to}`);
}

// POST /api/entries
export function createEntry(entry) {
  return request('/api/entries', { method: 'POST', body: JSON.stringify(entry) });
}

// PUT /api/entries/:id
export function updateEntry(id, updates) {
  return request(`/api/entries/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

// DELETE /api/entries/:id
export function deleteEntry(id) {
  return request(`/api/entries/${id}`, { method: 'DELETE' });
}
