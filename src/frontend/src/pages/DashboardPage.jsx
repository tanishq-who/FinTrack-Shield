import React, { useState, useEffect, useCallback } from 'react';
import { StatCard } from '../components/common/StatCard';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { CategorySpendingChart } from '../components/charts/CategorySpendingChart';
import { RecentTransactionsTable } from '../components/transactions/RecentTransactionsTable';
import { LoadingView, EmptyView, ErrorView } from '../components/common/StateViews';
import { dashboardService } from '../services/dashboardService';

/**
 * Main FinTrack Shield Dashboard Page
 */
export const DashboardPage = ({ simulatedState = 'loaded', onNavigate }) => {
  const [data, setData] = useState({
    summary: null,
    incomeExpense: [],
    categories: [],
    transactions: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load live or mock data via dashboardService
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [summary, incomeExpense, categories, transactions] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getIncomeVsExpense(),
        dashboardService.getCategorySpending(),
        dashboardService.getRecentTransactions(6)
      ]);

      setData({
        summary,
        incomeExpense,
        categories,
        transactions
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const handleDataChange = () => {
      loadDashboardData();
    };

    window.addEventListener('fintrack:transactions-updated', handleDataChange);
    window.addEventListener('fintrack:budgets-updated', handleDataChange);

    return () => {
      window.removeEventListener('fintrack:transactions-updated', handleDataChange);
      window.removeEventListener('fintrack:budgets-updated', handleDataChange);
    };
  }, [loadDashboardData]);

  // Handle Simulated State overrides (Requested in dashboard states requirement)
  if (simulatedState === 'loading' || (loading && simulatedState === 'loaded')) {
    return <LoadingView />;
  }

  if (simulatedState === 'error') {
    return (
      <div className="page-content">
        <ErrorView
          error="Network timeout: Unable to reach the FinTrack secure reporting gateway."
          onRetry={() => loadDashboardData()}
        />
      </div>
    );
  }

  if (simulatedState === 'empty') {
    return (
      <div className="page-content">
        <EmptyView onReset={() => loadDashboardData()} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <ErrorView error={error} onRetry={loadDashboardData} />
      </div>
    );
  }

  const { summary, incomeExpense, categories, transactions } = data;

  if (!summary) {
    return <LoadingView />;
  }

  return (
    <main className="page-content" id="main-content">
      {/* 1. Summary Cards Grid */}
      <section aria-label="Key Financial Performance Indicators">
        <div className="stat-grid">
          <StatCard
            label="Total Net Balance"
            value={summary.totalBalance}
            trend={summary.trends?.balanceDelta}
            trendPositive={true}
            iconTheme="emerald"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            }
          />

          <StatCard
            label="Monthly Inflow (Income)"
            value={summary.monthlyIncome}
            trend={summary.trends?.incomeDelta}
            trendPositive={true}
            iconTheme="teal"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            }
          />

          <StatCard
            label="Monthly Expenses"
            value={summary.monthlyExpenses}
            trend={summary.trends?.expenseDelta}
            trendPositive={true} // negative spending change is positive for budget
            iconTheme="danger"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            }
          />

          <StatCard
            label="Net Savings Rate"
            value={`${summary.savingsRate}%`}
            trend={summary.trends?.savingsRateDelta}
            trendPositive={true}
            trendPeriod="vs target 50%"
            iconTheme="indigo"
            prefix=""
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />
        </div>
      </section>

      {/* 2 & 3. Charts Grid (Income vs Expense & Spending by Category) */}
      <section className="charts-grid" aria-label="Cash Flow and Category Visualizations">
        <IncomeExpenseChart data={incomeExpense} />
        <CategorySpendingChart categories={categories} />
      </section>

      {/* 4. Recent Transactions Table */}
      <section aria-label="Recent Transactions Ledger">
        <RecentTransactionsTable
          transactions={transactions}
          onViewAll={() => onNavigate && onNavigate('transactions')}
        />
      </section>
    </main>
  );
};
