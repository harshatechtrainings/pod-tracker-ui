import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from './AuthPage';
import { AuthProvider } from '../context/AuthContext';
import * as authApi from '../api/auth';

vi.mock('../api/auth');

function renderAuthPage() {
  return render(
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  );
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders the sign-in form by default', () => {
    renderAuthPage();
    expect(screen.getByText('Sign In', { selector: 'button.auth-submit-btn' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Full Name/)).not.toBeInTheDocument();
  });

  it('shows signup-only fields after switching modes', async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText('Sign Up', { selector: 'button.auth-tab-btn' }));
    expect(screen.getByPlaceholderText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Repeat password')).toBeInTheDocument();
  });

  it('blocks signup submission on mismatched passwords without calling the API', async () => {
    renderAuthPage();
    await userEvent.click(screen.getByText('Sign Up', { selector: 'button.auth-tab-btn' }));
    await userEvent.type(screen.getByPlaceholderText('Jane Smith'), 'Ada Lovelace');
    await userEvent.type(screen.getByPlaceholderText('jane@example.com'), 'ada@example.com');
    await userEvent.type(screen.getByPlaceholderText('At least 8 characters'), 'longenough');
    await userEvent.type(screen.getByPlaceholderText('Repeat password'), 'different');
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText(/Passwords do not match/)).toBeInTheDocument();
    expect(authApi.signup).not.toHaveBeenCalled();
  });

  it('logs in successfully and surfaces no error', async () => {
    authApi.login.mockResolvedValue({ token: 'tok', user: { id: '1', name: 'Ada' } });
    renderAuthPage();
    await userEvent.type(screen.getByPlaceholderText('jane@example.com'), 'ada@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'longenough');
    await userEvent.click(screen.getByText('Sign In', { selector: 'button.auth-submit-btn' }));

    await waitFor(() => expect(authApi.login).toHaveBeenCalledWith('ada@example.com', 'longenough'));
    expect(localStorage.getItem('work_tracker_token')).toBe('tok');
  });

  it('shows the server error message on failed login', async () => {
    authApi.login.mockRejectedValue(new Error('Invalid email or password'));
    renderAuthPage();
    await userEvent.type(screen.getByPlaceholderText('jane@example.com'), 'ada@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword');
    await userEvent.click(screen.getByText('Sign In', { selector: 'button.auth-submit-btn' }));

    expect(await screen.findByText(/Invalid email or password/)).toBeInTheDocument();
  });
});
