import React, { useState, useEffect, useCallback } from 'react';
import { SpendingAnalysisCard } from '../components/insights/SpendingAnalysisCard';
import { BudgetRiskRadar } from '../components/insights/BudgetRiskRadar';
import { RecurringPaymentsCard } from '../components/insights/RecurringPaymentsCard';
import { SavingsSuggestionsCard } from '../components/insights/SavingsSuggestionsCard';
import { insightsService } from '../services/insightsService';

export const InsightsPage = ({ simulatedState = 'loaded', onNavigate }) => {
  const [data, setData] = useState({
    analysis: null,
    risks: null,
    recurring: null,
    suggestions: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analysis, risks, recurring, suggestions] = await Promise.all([
        insightsService.getSpendingAnalysis(),
        insightsService.getBudgetRisks(),
        insightsService.getRecurringPayments(),
        insightsService.getSavingsSuggestions()
      ]);

      setData({
        analysis,
        risks,
        recurring,
        suggestions
      });
    } catch (err) {
      setError(err.message || 'Failed to generate financial intelligence insights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const { analysis, risks, recurring, suggestions } = data;

  return (
    <main className="page-content" id="insights-content">
      {/* 1. Page Header */}
      <section className="page-header-row">
        <div>
          <h1 className="page-title">Financial Insights</h1>
          <p className="page-description">
            Personalized intelligence and spending optimizations derived automatically from your verified financial activity.
          </p>
        </div>

        <div className="status-badge-secure" role="status" aria-label="FinTrack Shield Intelligence Engine Active">
          <span className="status-dot"></span>
          <span>Shield Intelligence Active</span>
        </div>
      </section>

      {/* 2. States & Insights Content */}
      {simulatedState === 'loading' || (loading && simulatedState === 'loaded') ? (
        <div aria-busy="true" aria-label="Generating financial insights">
          <div className="insights-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="surface-card skeleton-card" style={{ height: '260px' }}>
                <div className="skeleton skeleton-title"></div>
                <div className="skeleton skeleton-text" style={{ width: '85%' }}></div>
                <div className="skeleton" style={{ height: '120px', marginTop: '14px' }}></div>
              </div>
            ))}
          </div>
        </div>
      ) : simulatedState === 'error' || error ? (
        <div className="surface-card state-container" role="alert">
          <div className="state-icon-box state-error-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="state-title">Unable to Generate Insights</h3>
          <p className="state-description">
            {error || 'Simulation error: Financial analysis engine could not correlate ledger entries.'}
          </p>
          <button className="state-action-btn" onClick={loadInsights}>
            Retry Analysis
          </button>
        </div>
      ) : simulatedState === 'empty' || !analysis?.hasTransactions ? (
        <div className="surface-card state-container" role="status">
          <div className="state-icon-box state-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <h3 className="state-title">No Insights Available Yet</h3>
          <p className="state-description">
            We need recorded ledger transactions and budget allocations to generate spending velocity trends and recommendations.
          </p>
          {onNavigate && (
            <button className="state-action-btn" onClick={() => onNavigate('transactions')}>
              Record Transactions
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Top Row Grid: Spending Analysis & Budget Risk */}
          <section className="insights-grid" aria-label="Spending Analysis and Budget Risk">
            <SpendingAnalysisCard analysis={analysis} />
            <BudgetRiskRadar risks={risks} />
          </section>

          {/* Bottom Row Grid: Recurring Subscriptions & Savings Suggestions */}
          <section className="insights-grid" aria-label="Subscriptions and Savings Opportunities">
            <RecurringPaymentsCard recurring={recurring} />
            <SavingsSuggestionsCard suggestions={suggestions} />
          </section>
        </>
      )}
    </main>
  );
};
