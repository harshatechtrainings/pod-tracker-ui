import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEntriesByDate, getEntriesRange, createEntry, updateEntry, deleteEntry } from './entries';

function mockFetchOnce(status, body) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('entries api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('attaches the stored JWT as a Bearer token when present', async () => {
    localStorage.setItem('work_tracker_token', 'abc123');
    mockFetchOnce(200, { success: true, data: [] });
    await getEntriesByDate('2026-07-18');
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer abc123');
  });

  it('omits the Authorization header when no token is stored', async () => {
    mockFetchOnce(200, { success: true, data: [] });
    await getEntriesByDate('2026-07-18');
    const [, options] = global.fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('getEntriesByDate hits the date query param', async () => {
    mockFetchOnce(200, { success: true, data: [] });
    await getEntriesByDate('2026-07-18');
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/api\/entries\?date=2026-07-18$/);
  });

  it('getEntriesRange hits from/to query params', async () => {
    mockFetchOnce(200, { success: true, data: [] });
    await getEntriesRange('2026-07-01', '2026-07-31');
    expect(global.fetch.mock.calls[0][0]).toMatch(/\/api\/entries\/range\?from=2026-07-01&to=2026-07-31$/);
  });

  it('createEntry POSTs the entry payload as JSON', async () => {
    mockFetchOnce(201, { success: true, data: { _id: '1' } });
    await createEntry({ task: 'Do a thing', type: 'task', date: '2026-07-18', mins: 30 });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/entries$/);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ task: 'Do a thing', type: 'task', date: '2026-07-18', mins: 30 });
  });

  it('updateEntry PUTs to /api/entries/:id', async () => {
    mockFetchOnce(200, { success: true, data: { _id: '1', task: 'Updated' } });
    await updateEntry('1', { task: 'Updated' });
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/entries\/1$/);
    expect(options.method).toBe('PUT');
  });

  it('deleteEntry DELETEs to /api/entries/:id', async () => {
    mockFetchOnce(200, { success: true, data: { deleted: true } });
    await deleteEntry('1');
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/entries\/1$/);
    expect(options.method).toBe('DELETE');
  });

  it('throws when the server responds with success: false', async () => {
    mockFetchOnce(400, { success: false, error: 'task is required' });
    await expect(createEntry({})).rejects.toThrow('task is required');
  });
});
