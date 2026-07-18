import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signup, login } from './auth';

function mockFetchOnce(status, body) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('auth api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('signup posts to /api/auth/signup with name/email/password', async () => {
    mockFetchOnce(201, { success: true, data: { token: 't', user: { id: '1' } } });
    const data = await signup('Ada', 'ada@example.com', 'longenough');
    expect(data).toEqual({ token: 't', user: { id: '1' } });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/signup$/);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ name: 'Ada', email: 'ada@example.com', password: 'longenough' });
  });

  it('login posts to /api/auth/login with email/password', async () => {
    mockFetchOnce(200, { success: true, data: { token: 't', user: { id: '1' } } });
    await login('ada@example.com', 'longenough');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/auth\/login$/);
    expect(JSON.parse(options.body)).toEqual({ email: 'ada@example.com', password: 'longenough' });
  });

  it('throws the server error message on failure', async () => {
    mockFetchOnce(401, { success: false, error: 'Invalid email or password' });
    await expect(login('ada@example.com', 'wrong')).rejects.toThrow('Invalid email or password');
  });

  it('throws a generic error when the response has no error message', async () => {
    mockFetchOnce(500, {});
    await expect(login('ada@example.com', 'wrong')).rejects.toThrow(/Request failed: 500/);
  });
});
