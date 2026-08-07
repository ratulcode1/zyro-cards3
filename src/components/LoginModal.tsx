import React, { useState } from 'react';
import { AuthSession } from '../types';
import { KeyRound, ShieldAlert, User, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: AuthSession) => void;
  appTheme?: 'light' | 'dark';
}

export const LoginModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess, appTheme = 'dark' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isDark = appTheme === 'dark';

  if (!isOpen) return null;

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
        onClose();
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className={`rounded-3xl p-6 max-w-sm w-full shadow-2xl relative border ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 border ${
          isDark ? 'bg-blue-950/80 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100'
        }`}>
          <KeyRound className="w-3.5 h-3.5" />
          <span>Account Login</span>
        </div>

        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome Back</h2>
        <p className={`text-xs mt-0.5 mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Login as User to customize your card or Admin to manage all profiles.
        </p>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800 border border-rose-200 rounded-xl text-xs font-semibold mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Username or Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. joshua or admin"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark 
                  ? 'bg-slate-800 text-slate-100 border-slate-700 placeholder:text-slate-500' 
                  : 'bg-white text-slate-900 border-slate-300 placeholder:text-slate-400'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark 
                  ? 'bg-slate-800 text-slate-100 border-slate-700 placeholder:text-slate-500' 
                  : 'bg-white text-slate-900 border-slate-300 placeholder:text-slate-400'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

      </div>
    </div>
  );
};
