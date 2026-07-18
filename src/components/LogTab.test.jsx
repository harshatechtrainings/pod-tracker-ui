import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogTab from './LogTab';
import * as entriesApi from '../api/entries';

vi.mock('../api/entries');

const baseEntry = {
  _id: 'e1', task: 'Existing task', type: 'task', date: '2026-07-18', mins: 30, start: '', ticket: '', notes: '',
};

function renderLogTab(props = {}) {
  const onEntryAdded = vi.fn();
  const onEntryDeleted = vi.fn();
  const onEntryEdit = vi.fn();
  const utils = render(
    <LogTab
      date="2026-07-18"
      entries={[baseEntry]}
      loading={false}
      onEntryAdded={onEntryAdded}
      onEntryDeleted={onEntryDeleted}
      onEntryEdit={onEntryEdit}
      {...props}
    />
  );
  return { ...utils, onEntryAdded, onEntryDeleted, onEntryEdit };
}

describe('LogTab manual entry form', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('blocks submission with an empty task and does not call the API', async () => {
    renderLogTab();
    await userEvent.click(screen.getByRole('button', { name: '▸ Add Manually' }));
    await userEvent.click(screen.getByRole('button', { name: '+ Save Entry' }));

    expect(await screen.findByText(/Task name is required/)).toBeInTheDocument();
    expect(entriesApi.createEntry).not.toHaveBeenCalled();
  });

  it('blocks submission with mins below 1', async () => {
    renderLogTab();
    await userEvent.click(screen.getByRole('button', { name: '▸ Add Manually' }));
    await userEvent.type(screen.getByPlaceholderText('Task description'), 'New task');
    await userEvent.click(screen.getByRole('button', { name: '+ Save Entry' }));

    expect(await screen.findByText(/Duration must be at least 1 minute/)).toBeInTheDocument();
    expect(entriesApi.createEntry).not.toHaveBeenCalled();
  });

  it('submits a valid manual entry and notifies the parent', async () => {
    entriesApi.createEntry.mockResolvedValue({ _id: 'new1' });
    const { onEntryAdded } = renderLogTab();
    await userEvent.click(screen.getByRole('button', { name: '▸ Add Manually' }));
    await userEvent.type(screen.getByPlaceholderText('Task description'), 'New task');
    await userEvent.type(screen.getByPlaceholderText('30'), '45');
    await userEvent.click(screen.getByRole('button', { name: '+ Save Entry' }));

    await vi.waitFor(() => expect(entriesApi.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({ task: 'New task', mins: 45, date: '2026-07-18' })
    ));
    await vi.waitFor(() => expect(onEntryAdded).toHaveBeenCalled());
  });
});

describe('LogTab delete', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('calls onEntryDeleted on successful delete', async () => {
    entriesApi.deleteEntry.mockResolvedValue({ deleted: true });
    const { onEntryDeleted } = renderLogTab();
    await userEvent.click(screen.getByTitle('Delete'));

    await vi.waitFor(() => expect(entriesApi.deleteEntry).toHaveBeenCalledWith('e1'));
    await vi.waitFor(() => expect(onEntryDeleted).toHaveBeenCalled());
  });

  it('surfaces an error message instead of silently failing', async () => {
    entriesApi.deleteEntry.mockRejectedValue(new Error('Network error'));
    const { onEntryDeleted } = renderLogTab();
    await userEvent.click(screen.getByTitle('Delete'));

    expect(await screen.findByText(/Network error/)).toBeInTheDocument();
    expect(onEntryDeleted).not.toHaveBeenCalled();
  });
});
