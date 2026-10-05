import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { InsightsPage } from './pages/InsightsPage';
import { AdminPage } from './pages/AdminPage';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { authService } from './services/authService';
import './styles/main.css';

const VALID_ROUTES = ['dashboard', 'transactions', 'budgets', 'insights', 'admin'];

const getInitialRoute = () => {
  if (typeof window !== 'undefined' && window.location.hash) {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (VALID_ROUTES.includes(hash)) {
      return hash;
    }
  }
  return 'dashboard';
};

export function App() {
  const [activeRoute, setActiveRoute] = useState(getInitialRoute);
  const [stateMode, setStateMode] = useState('loaded');
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(!authService.isAuthenticated());
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Check and refresh session on mount
  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService
        .getProfile()
        .then((profile) => {
          if (profile) {
            setUser(profile);
            setAuthModalOpen(false);
          }
        })
        .catch((err) => {
          if (err.status === 401) {
            setUser(null);
            setAuthModalOpen(true);
          }
        });
    } else {
      setAuthModalOpen(true);
    }
  }, []);

  // Listen for global auth events
  useEffect(() => {
    const handleAuthChange = (e) => {
      const updatedUser = e.detail?.user || null;
      setUser(updatedUser);
      if (!updatedUser) {
        setAuthModalOpen(true);
      }
    };

    const handleUnauthorized = () => {
      setUser(null);
      setAuthModalOpen(true);
    };

    window.addEventListener('fintrack:auth-change', handleAuthChange);
    window.addEventListener('fintrack:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('fintrack:auth-change', handleAuthChange);
      window.removeEventListener('fintrack:unauthorized', handleUnauthorized);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setAuthModalOpen(true);
    setActiveRoute('dashboard');
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setAuthModalOpen(false);
  };

  const isAuthenticated = Boolean(user && authService.isAuthenticated());

  const handleNavigate = useCallback((route) => {
    if (VALID_ROUTES.includes(route)) {
      setActiveRoute(route);
      if (typeof window !== 'undefined') {
        window.location.hash = `#${route}`;
      }
    }
  }, []);

  // Listen to browser hash changes (Back/Forward buttons & manual URL hash)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (VALID_ROUTES.includes(hash)) {
        setActiveRoute(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderActivePage = () => {
    // Protected route gate: redirect unauthenticated users away from protected finance pages
    if (!isAuthenticated) {
      return (
        <main className="page-content" id="unauth-content">
          <div className="surface-card state-container" role="status" style={{ maxWidth: '500px', margin: '4rem auto' }}>
            <div className="state-icon-box" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-emerald-500)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="state-title">FinTrack Shield Authentication Required</h3>
            <p className="state-description">
              Your financial records, transactions, and budgets are strictly isolated and encrypted per user session. Please sign in to access your ledger.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAuthModalOpen(true)}
              style={{ marginTop: 'var(--space-2)' }}
            >
              Sign In Securely
            </button>
          </div>
        </main>
      );
    }

    switch (activeRoute) {
      case 'dashboard':
        return (
          <DashboardPage
            simulatedState={stateMode}
            onNavigate={handleNavigate}
          />
        );
      case 'transactions':
        return (
          <TransactionsPage
            simulatedState={stateMode}
            onNavigate={handleNavigate}
          />
        );
      case 'budgets':
        return (
          <BudgetsPage
            simulatedState={stateMode}
            onNavigate={handleNavigate}
          />
        );
      case 'insights':
        return (
          <InsightsPage
            simulatedState={stateMode}
            onNavigate={handleNavigate}
          />
        );
      case 'admin':
        return <AdminPage />;
      default:
        return (
          <DashboardPage
            simulatedState={stateMode}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <>
      <Layout
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        stateMode={stateMode}
        onChangeStateMode={(mode) => setStateMode(mode)}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      >
        {renderActivePage()}
      </Layout>

      <AuthModal
        isOpen={authModalOpen}
        onClose={isAuthenticated ? () => setAuthModalOpen(false) : null}
        onAuthSuccess={handleAuthSuccess}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onProfileUpdated={(updatedUser) => {
          setUser(updatedUser);
        }}
      />
    </>
  );
}

export default App;
