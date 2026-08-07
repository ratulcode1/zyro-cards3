import React, { useState } from 'react';
import { AuthSession } from '../types';
import { KeyRound, ShieldAlert, User, LogOut, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  onLoginSuccess: (session: AuthSession) => void;
  appTheme?: 'light' | 'dark';
  authSession: AuthSession | null;
  onLogout: () => void;
  onGoToDashboard?: () => void;
}

export const InlineLoginBox: React.FC<Props> = ({
  onLoginSuccess,
  appTheme = 'dark',
  authSession,
  onLogout,
  onGoToDashboard,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isDark = appTheme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        onLoginSuccess(data);
      } else {
        setErrorMsg(data.error || 'Invalid username or password');
      }
    } catch (err) {
      setErrorMsg('Network error during login');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  // If already logged in, show account status card with quick actions
  if (authSession) {
    return (
      <div
        className={`rounded-3xl p-6 sm:p-8 border shadow-xl transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border ${
            isDark
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Active Session Logged In</span>
        </div>

        <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Hello, @{authSession.user.username}!
        </h2>
        <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          You are authenticated as{' '}
          <strong className="capitalize text-blue-500">{authSession.user.role}</strong>. Manage
          your digital NFC card profile or administration panel below.
        </p>

        <div className="space-y-3">
          {onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>
                {authSession.user.role === 'admin' ? 'Open Admin Control Panel' : 'Go to User Dashboard'}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          <button
            onClick={onLogout}
            className={`w-full py-3 px-4 rounded-2xl font-semibold text-xs border transition-colors flex items-center justify-center gap-2 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>Sign Out Account</span>
          </button>
        </div>
      </div>
    );
  }

  // Logged out: render inline login form
  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div
        className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold mb-3 border ${
          isDark
            ? 'bg-blue-950/80 text-blue-300 border-blue-800'
            : 'bg-blue-50 text-blue-700 border-blue-100'
        }`}
      >
        <KeyRound className="w-3.5 h-3.5" />
        <span>Account Portal</span>
      </div>

      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Login to Zyro Cards
      </h2>
      <p className={`text-xs mt-1 mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Access your account to customize your NFC smart card or manage all customer cards.
      </p>

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800 border border-rose-200 rounded-xl text-xs font-semibold mb-4">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className={`block text-xs font-semibold mb-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            Username or Email
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. joshua or admin"
            className={`w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              isDark
                ? 'bg-slate-800/80 text-slate-100 border-slate-700 placeholder:text-slate-500'
                : 'bg-slate-50 text-slate-900 border-slate-300 placeholder:text-slate-400'
            }`}
          />
        </div>

        <div>
          <label
            className={`block text-xs font-semibold mb-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              isDark
                ? 'bg-slate-800/80 text-slate-100 border-slate-700 placeholder:text-slate-500'
                : 'bg-slate-50 text-slate-900 border-slate-300 placeholder:text-slate-400'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Sign In Account'}
        </button>
      </form>

    </div>
  );
};
