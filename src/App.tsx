import React, { useState, useEffect } from 'react';
import { CardProfile, AuthSession } from './types';
import { Navbar } from './components/Navbar';
import { DigitalCardView } from './components/DigitalCardView';
import { UserDashboard } from './components/UserDashboard';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { InlineLoginBox } from './components/InlineLoginBox';
import { BusinessGuideModal } from './components/BusinessGuideModal';

export default function App() {
  const [profiles, setProfiles] = useState<CardProfile[]>(() => {
    const saved = localStorage.getItem('nfc_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved profiles', e);
      }
    }
    return [];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('nfc_front_preview_id') || 'card-joshua';
  });
  const [activeView, setActiveView] = useState<'card' | 'user' | 'admin'>('card');
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem('nfc_auth_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse auth session', e);
      }
    }
    return null;
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const [appTheme, setAppTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('nfc_app_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = appTheme === 'dark' ? 'light' : 'dark';
    setAppTheme(nextTheme);
    localStorage.setItem('nfc_app_theme', nextTheme);
  };

  // Helper to extract requested card username or slug from URL
  const getTargetUsernameFromUrl = (): string | null => {
    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    // 1. Search params e.g. ?card=username or ?c=username or ?u=username
    const searchCard = search.get('card') || search.get('c') || search.get('u') || search.get('username');
    if (searchCard) return searchCard.trim();

    // 2. Pathname e.g. /c/username or /card/username or /u/username
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length >= 2 && ['c', 'card', 'u', 'user'].includes(pathParts[0].toLowerCase())) {
      return pathParts[1].trim();
    } else if (pathParts.length === 1 && !['api', 'assets', 'admin', 'dashboard', 'login', 'c', 'card'].includes(pathParts[0].toLowerCase())) {
      return pathParts[0].trim();
    }

    // 3. Hash e.g. #/c/username or #/card/username
    if (hash) {
      const cleanHash = hash.replace(/^#\/?/, '');
      const hashParts = cleanHash.split('/').filter(Boolean);
      if (hashParts.length >= 2 && ['c', 'card', 'u', 'user'].includes(hashParts[0].toLowerCase())) {
        return hashParts[1].trim();
      }
    }

    return null;
  };

  // Sync profiles to localStorage
  useEffect(() => {
    localStorage.setItem('nfc_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (authSession) {
      localStorage.setItem('nfc_auth_session', JSON.stringify(authSession));
    } else {
      localStorage.removeItem('nfc_auth_session');
    }
  }, [authSession]);

  // Handle URL scanning & routing for NFC tags / QR code taps
  useEffect(() => {
    const checkUrlAndRoute = () => {
      const targetSlug = getTargetUsernameFromUrl();
      if (!targetSlug) return;

      const targetLower = targetSlug.toLowerCase();
      
      const matchingCard = profiles.find(
        (p) =>
          p.username.toLowerCase() === targetLower ||
          p.id.toLowerCase() === targetLower ||
          p.id.toLowerCase() === `card-${targetLower}`
      );

      if (matchingCard) {
        setActiveProfileId(matchingCard.id);
        setActiveView('card');
        
        fetch(`/api/cards/${matchingCard.username}/tap`, { method: 'POST' }).catch((e) =>
          console.warn('Failed to record tap:', e)
        );
      } else {
        // Fetch from backend API
        fetch(`/api/cards/${targetSlug}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((fetchedCard) => {
            if (fetchedCard && fetchedCard.id) {
              setProfiles((prev) => {
                const exists = prev.some((p) => p.id === fetchedCard.id);
                return exists ? prev.map((p) => (p.id === fetchedCard.id ? fetchedCard : p)) : [...prev, fetchedCard];
              });
              setActiveProfileId(fetchedCard.id);
              setActiveView('card');
              
              fetch(`/api/cards/${fetchedCard.username}/tap`, { method: 'POST' }).catch((e) =>
                console.warn('Failed to record tap:', e)
              );
            }
          })
          .catch((err) => console.error('Failed to fetch card by slug:', err));
      }
    };

    checkUrlAndRoute();

    window.addEventListener('popstate', checkUrlAndRoute);
    window.addEventListener('hashchange', checkUrlAndRoute);
    return () => {
      window.removeEventListener('popstate', checkUrlAndRoute);
      window.removeEventListener('hashchange', checkUrlAndRoute);
    };
  }, [profiles]);

  // Fetch profiles and app settings from backend on initial mount
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.activeFrontCardId) {
          localStorage.setItem('nfc_front_preview_id', data.activeFrontCardId);
          if (!getTargetUsernameFromUrl()) {
            setActiveProfileId(data.activeFrontCardId);
          }
        }
      })
      .catch((e) => console.warn('Failed to load front preview setting:', e));

    fetch('/api/cards')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('API unavailable');
      })
      .then((loadedCards) => {
        if (Array.isArray(loadedCards) && loadedCards.length > 0) {
          setProfiles(loadedCards);
        }
      })
      .catch((err) => {
        console.warn('Using local profiles fallback:', err.message);
      });
  }, []);

  const refreshAllCards = () => {
    fetch('/api/cards')
      .then((res) => (res.ok ? res.json() : null))
      .then((cards) => {
        if (Array.isArray(cards) && cards.length > 0) {
          setProfiles(cards);
        }
      })
      .catch((e) => console.warn('Refresh cards failed', e));
  };

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ||
    profiles[0];

  const handleProfileUpdate = async (updated: CardProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );

    try {
      await fetch(`/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authSession ? `Bearer ${authSession.token}` : '',
        },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn('Backend update skipped, using local state');
    }
  };

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);

    // If the session came with a card, ensure it is added/updated in profiles!
    if (session.card) {
      const cardToUse = session.card;
      setProfiles((prev) => {
        const exists = prev.some((p) => p.id === cardToUse.id);
        if (exists) {
          return prev.map((p) => (p.id === cardToUse.id ? cardToUse : p));
        } else {
          return [...prev, cardToUse];
        }
      });
      setActiveProfileId(cardToUse.id);
    } else if (session.user.role === 'user' && session.user.cardId) {
      const existing = profiles.find((p) => p.id === session.user.cardId);
      if (existing) {
        setActiveProfileId(existing.id);
      } else {
        // Fetch card for user by username
        fetch(`/api/cards/${session.user.username}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((fetchedCard) => {
            if (fetchedCard) {
              setProfiles((prev) => [...prev.filter((p) => p.id !== fetchedCard.id), fetchedCard]);
              setActiveProfileId(fetchedCard.id);
            }
          })
          .catch((e) => console.error('Failed to fetch user card on login', e));
      }
    }

    if (session.user.role === 'user') {
      setActiveView('user');
    } else if (session.user.role === 'admin') {
      setActiveView('admin');
    }
  };

  const handleLogout = () => {
    setAuthSession(null);
    setActiveView('card');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white transition-colors duration-200 ${
      appTheme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Top Header & Navigation */}
      <Navbar
        authSession={authSession}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        appTheme={appTheme}
        onToggleTheme={toggleTheme}
        onGoHome={() => setActiveView('card')}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {activeView === 'card' && (
          <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Digital Card Live Preview */}
              <div className="lg:col-span-7 xl:col-span-7 flex justify-center w-full">
                <DigitalCardView card={activeProfile} showDeviceFrameDefault={true} />
              </div>

              {/* Right Column: Inline Login Box */}
              <div className="lg:col-span-5 xl:col-span-5 w-full lg:sticky lg:top-24">
                <InlineLoginBox
                  onLoginSuccess={handleLoginSuccess}
                  appTheme={appTheme}
                  authSession={authSession}
                  onLogout={handleLogout}
                  onGoToDashboard={() => {
                    if (authSession?.user.role === 'admin') {
                      setActiveView('admin');
                    } else if (authSession?.user.role === 'user') {
                      setActiveView('user');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeView === 'user' && (
          <UserDashboard
            card={
              profiles.find((p) => p.id === authSession?.user.cardId || (authSession?.user.username && p.username.toLowerCase() === authSession.user.username.toLowerCase())) ||
              authSession?.card ||
              activeProfile
            }
            authToken={authSession?.token || ''}
            onUpdateCard={handleProfileUpdate}
            appTheme={appTheme}
            onToggleTheme={toggleTheme}
          />
        )}

        {activeView === 'admin' && (
          <AdminPanel 
            authToken={authSession?.token || ''} 
            appTheme={appTheme}
            onToggleTheme={toggleTheme}
            onProfilesChange={refreshAllCards}
            onCardCreated={(newCard) => {
              setProfiles((prev) => [...prev.filter((p) => p.id !== newCard.id), newCard]);
            }}
            activeFrontCardId={activeProfileId}
            onSetFrontPreviewCard={(cardId) => {
              setActiveProfileId(cardId);
              localStorage.setItem('nfc_front_preview_id', cardId);
              fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeFrontCardId: cardId }),
              }).catch((err) => console.error('Failed to save front card setting:', err));
            }}
            onUpdateCardProfile={handleProfileUpdate}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className={`py-6 border-t text-center text-xs transition-colors ${
        appTheme === 'dark' 
          ? 'border-slate-800 text-slate-500 bg-slate-950' 
          : 'border-slate-200 text-slate-600 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} <strong>Zyro Cards</strong> - NFC & QR Smart Card Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="hover:text-blue-400 transition-colors underline"
            >
              A-Z Business Blueprint
            </button>
            <span>•</span>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="hover:text-blue-400 transition-colors"
            >
              {authSession ? `Logged in as @${authSession.user.username}` : 'Login Portal'}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        appTheme={appTheme}
      />

      <BusinessGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
