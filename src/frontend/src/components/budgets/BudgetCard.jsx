import React from 'react';

export const BudgetCard = ({
  budget,
  onEdit,
  onDelete
}) => {
  const { category, limit, spent = 0, color = '#10b981' } = budget;

  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  const roundedPercent = Math.round(percentage * 10) / 10;
  const remaining = Math.max(limit - spent, 0);
  const isOverspent = spent > limit;
  const overspentAmount = Math.max(spent - limit, 0);

  // Status tiers: Green (<80%), Yellow (80-99.9%), Red (>=100%)
  let statusBadgeClass = 'budget-status-safe';
  let statusText = 'Safe';
  let progressColor = 'var(--color-emerald-500)';

  if (percentage >= 100) {
    statusBadgeClass = 'budget-status-overspent';
    statusText = 'Over Budget';
    progressColor = 'var(--color-danger)';
  } else if (percentage >= 80) {
    statusBadgeClass = 'budget-status-warning';
    statusText = 'Approaching Limit';
    progressColor = 'var(--color-warning)';
  }

  return (
    <div
      className="surface-card budget-category-card"
      tabIndex={0}
      role="article"
      aria-label={`${category} budget: $${spent} spent of $${limit} limit, ${statusText}`}
    >
      <div className="budget-card-header">
        <div className="category-header-left">
          <span className="category-indicator-dot" style={{ backgroundColor: color }}></span>
          <h3 className="category-title">{category}</h3>
        </div>

        <div className="category-header-right">
          <span className={`budget-status-pill ${statusBadgeClass}`}>
            {statusText}
          </span>
          <div className="budget-card-actions">
            <button
              type="button"
              className="action-icon-btn edit-btn"
              title="Edit category budget"
              onClick={() => onEdit(budget)}
              aria-label={`Edit ${category} budget`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              type="button"
              className="action-icon-btn delete-btn"
              title="Delete category budget"
              onClick={() => onDelete(budget)}
              aria-label={`Delete ${category} budget`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="budget-bar-section">
        <div className="budget-bar-labels">
          <span className="spent-label">
            ${spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent
          </span>
          <span className="percent-label tabular-nums" style={{ color: progressColor }}>
            {roundedPercent}%
          </span>
        </div>

        <div className="budget-progress-track">
          <div
            className="budget-progress-fill"
            style={{
              width: `${Math.min(roundedPercent, 100)}%`,
              backgroundColor: progressColor
            }}
          ></div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="budget-card-footer">
        <div className="footer-metric">
          <span className="footer-label">Budget Limit</span>
          <span className="footer-value tabular-nums">
            ${limit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="footer-metric" style={{ textAlign: 'right' }}>
          <span className="footer-label">
            {isOverspent ? 'Overspent By' : 'Remaining'}
          </span>
          <span
            className="footer-value tabular-nums"
            style={{ color: isOverspent ? 'var(--color-danger)' : 'var(--color-emerald-600)' }}
          >
            {isOverspent ? '+ $' : '$'}
            {(isOverspent ? overspentAmount : remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};
