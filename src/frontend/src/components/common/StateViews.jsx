import React from 'react';

/**
 * Skeleton Loader for Dashboard
 */
export const LoadingView = () => (
  <div className="page-content" aria-busy="true" aria-label="Loading dashboard metrics">
    {/* Skeleton Stat Cards */}
    <div className="stat-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="surface-card skeleton-card">
          <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
          <div className="skeleton skeleton-title"></div>
          <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
        </div>
      ))}
    </div>

    {/* Skeleton Charts */}
    <div className="charts-grid">
      <div className="surface-card" style={{ height: '340px' }}>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton" style={{ height: '220px', width: '100%' }}></div>
      </div>
      <div className="surface-card" style={{ height: '340px' }}>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton" style={{ height: '220px', width: '100%' }}></div>
      </div>
    </div>

    {/* Skeleton Table */}
    <div className="surface-card" style={{ height: '260px' }}>
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton" style={{ height: '160px', width: '100%' }}></div>
    </div>
  </div>
);

/**
 * Empty State View
 */
export const EmptyView = ({ onReset }) => (
  <div className="surface-card state-container" role="status">
    <div className="state-icon-box state-empty-icon" aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    </div>
    <h3 className="state-title">No Financial Activity Yet</h3>
    <p className="state-description">
      There are currently no transactions or budget metrics recorded for this account. Once transactions are logged, your analytics and cash flow charts will render here.
    </p>
    {onReset && (
      <button className="state-action-btn" onClick={onReset}>
        Load Sample Activity
      </button>
    )}
  </div>
);

/**
 * Error State View
 */
export const ErrorView = ({ error, onRetry }) => (
  <div className="surface-card state-container" role="alert">
    <div className="state-icon-box state-error-icon" aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <h3 className="state-title">Unable to Load Dashboard Data</h3>
    <p className="state-description">
      {error || 'A network error occurred while communicating with the finance service. Please verify your connection or try again.'}
    </p>
    {onRetry && (
      <button className="state-action-btn" onClick={onRetry}>
        Retry Connection
      </button>
    )}
  </div>
);
