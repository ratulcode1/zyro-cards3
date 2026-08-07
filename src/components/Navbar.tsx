import React, { useState } from 'react';
import { AuthSession } from '../types';
import { 
  Smartphone, 
  User, 
  ShieldCheck, 
  BookOpen, 
  LogIn, 
  LogOut, 
  Search, 
  Sparkles,
  ChevronDown,
  Sun,
  Moon
} from 'lucide-react';

interface Props {
  authSession: AuthSession | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  appTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  onGoHome?: () => void;
}

export const Navbar: React.FC<Props> = ({
  authSession,
  onOpenLogin,
  onLogout,
  appTheme,
  onToggleTheme,
  onGoHome,
}) => {
  return (
    <header className={`${appTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} sticky top-0 z-40 border-b shadow-md transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={onGoHome}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <span className={`font-extrabold text-base sm:text-lg tracking-tight ${appTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Zyro Cards
            </span>
            <span className="hidden sm:block text-[10px] text-blue-500 font-semibold">
              NFC & QR Smart Platform
            </span>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              appTheme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-indigo-700 hover:bg-slate-200'
            }`}
            title={`Switch to ${appTheme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {appTheme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-xs font-medium text-slate-200">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline text-xs font-medium text-slate-700">Dark</span>
              </>
            )}
          </button>

          {/* Login / Logout Button */}
          {authSession ? (
            <div className="flex items-center gap-2">
              <span className={`hidden lg:inline-block text-xs font-medium ${appTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Hi, <strong>@{authSession.user.username}</strong> ({authSession.user.role})
              </span>
              <button
                onClick={onLogout}
                className={`p-2 rounded-xl transition-colors border ${
                  appTheme === 'dark'
                    ? 'bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 border-slate-200'
                }`}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-blue-200" />
              <span>Admin Login</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
