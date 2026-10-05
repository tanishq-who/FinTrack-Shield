import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import {
  TransactionsPlaceholder,
  BudgetsPlaceholder,
  InsightsPlaceholder
} from './pages/RoutePlaceholders';
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
        return <TransactionsPlaceholder onNavigate={(route) => setActiveRoute(route)} />;
      case 'budgets':
        return <BudgetsPlaceholder onNavigate={(route) => setActiveRoute(route)} />;
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
