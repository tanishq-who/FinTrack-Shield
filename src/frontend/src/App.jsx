import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { InsightsPlaceholder } from './pages/RoutePlaceholders';
import './styles/main.css';

export function App() {
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [stateMode, setStateMode] = useState('loaded');

  const renderActivePage = () => {
    switch (activeRoute) {
      case 'dashboard':
        return (
          <DashboardPage
            simulatedState={stateMode}
            onNavigate={(route) => setActiveRoute(route)}
          />
        );
      case 'transactions':
        return <TransactionsPage />;
      case 'budgets':
        return <BudgetsPage />;
      case 'insights':
        return <InsightsPlaceholder onNavigate={(route) => setActiveRoute(route)} />;
      default:
        return (
          <DashboardPage
            simulatedState={stateMode}
            onNavigate={(route) => setActiveRoute(route)}
          />
        );
    }
  };

  return (
    <Layout
      activeRoute={activeRoute}
      onNavigate={(route) => setActiveRoute(route)}
      stateMode={stateMode}
      onChangeStateMode={(mode) => setStateMode(mode)}
    >
      {renderActivePage()}
    </Layout>
  );
}

export default App;
