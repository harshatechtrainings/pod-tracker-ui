const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function post(path, body) {
  const res  = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || `Request failed: ${res.status}`);
  return json.data;
}

export const signup = (name, email, password) =>
  post('/api/auth/signup', { name, email, password });

export const login = (email, password) =>
  post('/api/auth/login', { email, password });
