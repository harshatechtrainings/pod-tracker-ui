import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { todayStr, formatDateDisplay, fmtMins, fmtSeconds, getPastDays } from './time';

describe('fmtMins', () => {
  it('formats 0 or nullish as 0m', () => {
    expect(fmtMins(0)).toBe('0m');
    expect(fmtMins(null)).toBe('0m');
    expect(fmtMins(undefined)).toBe('0m');
  });

  it('formats sub-hour durations as minutes', () => {
    expect(fmtMins(45)).toBe('45m');
  });

  it('formats whole hours without minutes', () => {
    expect(fmtMins(120)).toBe('2h');
  });

  it('formats hours and minutes together', () => {
    expect(fmtMins(90)).toBe('1h 30m');
  });
});

describe('fmtSeconds', () => {
  it('formats zero as 00:00:00', () => {
    expect(fmtSeconds(0)).toBe('00:00:00');
  });

  it('formats hours, minutes, and seconds with padding', () => {
    expect(fmtSeconds(3661)).toBe('01:01:01');
  });

  it('formats sub-minute durations', () => {
    expect(fmtSeconds(45)).toBe('00:00:45');
  });
});

describe('todayStr', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 18, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('returns today in YYYY-MM-DD format', () => {
    expect(todayStr()).toBe('2026-07-18');
  });
});

describe('formatDateDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 18, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('labels today', () => {
    expect(formatDateDisplay('2026-07-18')).toBe('Today');
  });

  it('labels yesterday', () => {
    expect(formatDateDisplay('2026-07-17')).toBe('Yesterday');
  });

  it('labels tomorrow', () => {
    expect(formatDateDisplay('2026-07-19')).toBe('Tomorrow');
  });

  it('falls back to a weekday/month/day format for other dates', () => {
    expect(formatDateDisplay('2026-07-01')).toBe('Wed, Jul 1');
  });
});

describe('getPastDays', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 18, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('returns n days ending today, oldest first', () => {
    const days = getPastDays(3);
    expect(days).toEqual(['2026-07-16', '2026-07-17', '2026-07-18']);
  });

  it('returns a single day for n=1', () => {
    expect(getPastDays(1)).toEqual(['2026-07-18']);
  });
});
