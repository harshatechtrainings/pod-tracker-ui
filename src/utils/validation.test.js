import { describe, it, expect } from 'vitest';
import { validateEntryForm, validateSignupForm } from './validation';

describe('validateEntryForm', () => {
  it('requires a non-empty task', () => {
    expect(validateEntryForm({ task: '', mins: 10 })).toBe('Task name is required');
    expect(validateEntryForm({ task: '   ', mins: 10 })).toBe('Task name is required');
  });

  it('requires mins to be at least 1', () => {
    expect(validateEntryForm({ task: 'Do a thing', mins: '' })).toMatch(/at least 1 minute/);
    expect(validateEntryForm({ task: 'Do a thing', mins: 0 })).toMatch(/at least 1 minute/);
    expect(validateEntryForm({ task: 'Do a thing', mins: 'abc' })).toMatch(/at least 1 minute/);
  });

  it('passes for valid input', () => {
    expect(validateEntryForm({ task: 'Do a thing', mins: 30 })).toBeNull();
    expect(validateEntryForm({ task: 'Do a thing', mins: '30' })).toBeNull();
  });
});

describe('validateSignupForm', () => {
  it('requires a non-empty name', () => {
    expect(validateSignupForm({ name: '', password: 'longenough', confirm: 'longenough' }))
      .toBe('Full name is required');
  });

  it('requires a password of at least 8 characters', () => {
    expect(validateSignupForm({ name: 'Ada', password: 'short', confirm: 'short' }))
      .toMatch(/at least 8 characters/);
  });

  it('requires password and confirm to match', () => {
    expect(validateSignupForm({ name: 'Ada', password: 'longenough', confirm: 'different' }))
      .toBe('Passwords do not match');
  });

  it('passes for valid input', () => {
    expect(validateSignupForm({ name: 'Ada', password: 'longenough', confirm: 'longenough' }))
      .toBeNull();
  });
});
