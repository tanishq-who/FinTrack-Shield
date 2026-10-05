import React from 'react';

export const TransactionsPlaceholder = ({ onNavigate }) => (
  <div className="page-content">
    <div className="surface-card state-container">
      <div className="state-icon-box" style={{ backgroundColor: 'var(--color-emerald-50)', color: 'var(--color-emerald-600)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <h3 className="state-title">Transactions View</h3>
      <p className="state-description">
        Comprehensive transaction ledger, search filters, and export controls will be active here.
      </p>
      <button className="state-action-btn" onClick={() => onNavigate('dashboard')}>
        Return to Dashboard
      </button>
    </div>
  </div>
);

export const BudgetsPlaceholder = ({ onNavigate }) => (
  <div className="page-content">
    <div className="surface-card state-container">
      <div className="state-icon-box" style={{ backgroundColor: 'var(--color-teal-50)', color: 'var(--color-teal-600)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <h3 className="state-title">Budgets View</h3>
      <p className="state-description">
        Category spending thresholds, budget health indicators, and limit managers will render here.
      </p>
      <button className="state-action-btn" onClick={() => onNavigate('dashboard')}>
        Return to Dashboard
      </button>
    </div>
  </div>
);

export const InsightsPlaceholder = ({ onNavigate }) => (
  <div className="page-content">
    <div className="surface-card state-container">
      <div className="state-icon-box" style={{ backgroundColor: '#eef2ff', color: '#4f46e5' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      </div>
      <h3 className="state-title">FinTrack Shield Insights</h3>
      <p className="state-description">
        Spending anomaly alerts, recurring subscription detection, and savings optimization strategies will appear here.
      </p>
      <button className="state-action-btn" onClick={() => onNavigate('dashboard')}>
        Return to Dashboard
      </button>
    </div>
  </div>
);
