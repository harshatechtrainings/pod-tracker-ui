import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, signup as apiSignup } from '../api/auth';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode,     setMode]     = useState('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'signup') {
      if (!name.trim())         { setError('Full name is required'); return; }
      if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
      if (password !== confirm) { setError('Passwords do not match'); return; }
    }
    setLoading(true);
    try {
      const data = mode === 'login'
        ? await apiLogin(email, password)
        : await apiSignup(name, email, password);
      login(data.token, data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m) {
    setMode(m); setError('');
    setName(''); setEmail(''); setPassword(''); setConfirm('');
  }

  return (
    <div className="auth-page">

      {/* ── Left branding panel ──────────────────────────── */}
      <div className="auth-panel-brand">
        <div className="auth-brand-inner">
          <span className="auth-brand-logo">⏱</span>
          <h1 className="auth-brand-title">Work Tracker</h1>
          <p className="auth-brand-tagline">
            The simplest way to track your engineering work, understand your time, and stay on top of every task.
          </p>
          <ul className="auth-feature-list">
            <li><span>⏱</span><span>Live stopwatch — track tasks in real time</span></li>
            <li><span>📅</span><span>Daily timeline &amp; time-by-type charts</span></li>
            <li><span>📊</span><span>14-day activity heatmap &amp; trends</span></li>
            <li><span>🔒</span><span>All data is private, linked to your account</span></li>
          </ul>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────── */}
      <div className="auth-panel-form">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Sign in to continue tracking' : 'Start tracking your work today'}</p>
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab-btn${mode === 'login' ? ' active' : ''}`} onClick={() => switchMode('login')} type="button">Sign In</button>
            <button className={`auth-tab-btn${mode === 'signup' ? ' active' : ''}`} onClick={() => switchMode('signup')} type="button">Sign Up</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Full Name *</label>
                <input className="input" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} autoFocus autoComplete="name" />
              </div>
            )}
            <div className="form-group">
              <label>Email *</label>
              <input className="input" type="email" placeholder="jane@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus={mode === 'login'} autoComplete="email" />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input className="input" type="password" placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Confirm Password *</label>
                <input className="input" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
              </div>
            )}
            {error && <p className="field-error">⚠ {error}</p>}
            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={loading}>
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button className="auth-switch-btn" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} type="button">
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}
