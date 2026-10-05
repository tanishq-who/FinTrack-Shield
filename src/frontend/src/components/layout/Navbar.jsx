import React from 'react';

export const Navbar = ({
  activeRoute = 'dashboard',
  onToggleMobileNav,
  stateMode,
  onChangeStateMode
}) => {
  const getPageTitle = (route) => {
    switch (route) {
      case 'dashboard':
        return 'Executive Financial Overview';
      case 'transactions':
        return 'Transaction Ledger';
      case 'budgets':
        return 'Budget Limits & Allocation';
      case 'insights':
        return 'FinTrack Shield Insights';
      default:
        return 'Financial Overview';
    }
  };

  return (
    <header className="app-header" role="banner">
      <div className="header-left">
        <button
          className="mobile-nav-toggle"
          onClick={onToggleMobileNav}
          aria-label="Open navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="header-title-section">
          <h2>{getPageTitle(activeRoute)}</h2>
        </div>
      </div>

      <div className="header-right">
        {/* State Simulator Controls (for testing Loading, Empty, and Error states) */}
        {onChangeStateMode && (
          <div className="state-controls-group" role="group" aria-label="Demo state switcher">
            <button
              className={`state-btn ${stateMode === 'loaded' ? 'active' : ''}`}
              onClick={() => onChangeStateMode('loaded')}
              title="Show standard loaded state"
            >
              Normal
            </button>
            <button
              className={`state-btn ${stateMode === 'loading' ? 'active' : ''}`}
              onClick={() => onChangeStateMode('loading')}
              title="Preview loading skeleton state"
            >
              Loading
            </button>
            <button
              className={`state-btn ${stateMode === 'empty' ? 'active' : ''}`}
              onClick={() => onChangeStateMode('empty')}
              title="Preview empty state"
            >
              Empty
            </button>
            <button
              className={`state-btn ${stateMode === 'error' ? 'active' : ''}`}
              onClick={() => onChangeStateMode('error')}
              title="Preview error state"
            >
              Error
            </button>
          </div>
        )}

        {/* Shield Security Status Indicator */}
        <div className="status-badge-secure" role="status" aria-label="Security Shield Active">
          <span className="status-dot"></span>
          <span>Shield Active</span>
        </div>
      </div>
    </header>
  );
};
