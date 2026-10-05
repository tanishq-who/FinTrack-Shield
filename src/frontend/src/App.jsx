import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { InsightsPage } from './pages/InsightsPage';
import './styles/main.css';

const VALID_ROUTES = ['dashboard', 'transactions', 'budgets', 'insights'];

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
    <Layout
      activeRoute={activeRoute}
      onNavigate={handleNavigate}
      stateMode={stateMode}
      onChangeStateMode={(mode) => setStateMode(mode)}
    >
      {renderActivePage()}
    </Layout>
  );
}

export default App;
