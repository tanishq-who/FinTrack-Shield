import React from 'react';
import { formatMonthDisplay } from '../../services/budgetService';

/**
 * Budget Overview KPI Card
 */
export const BudgetOverviewCard = ({ overview }) => {
  if (!overview) return null;

  const { totalBudget, totalSpent, remaining, overBudgetCount, percentageUsed, month } = overview;
  const friendlyMonth = formatMonthDisplay(month);

  let progressColor = 'var(--color-emerald-500)';
  if (percentageUsed >= 100) {
    progressColor = 'var(--color-danger)';
  } else if (percentageUsed >= 80) {
    progressColor = 'var(--color-warning)';
  }

  return (
    <div className="surface-card budget-overview-card" role="region" aria-label="Monthly Budget Overview">
      <div className="budget-overview-header">
        <div>
          <span
            className="budget-month-pill"
            aria-label={`Current budget cycle: ${friendlyMonth} (${month})`}
            data-month={month}
          >
            📅 {friendlyMonth}
          </span>
          <h2 className="budget-overview-title">Monthly Budget Allocation</h2>
        </div>

        <div>
          {overBudgetCount > 0 ? (
            <span className="budget-alert-pill alert-danger" role="status">
              ⚠️ {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over budget
            </span>
          ) : (
            <span className="budget-alert-pill alert-success" role="status">
              ✓ All categories within safe limits
            </span>
          )}
        </div>
      </div>

      <div className="budget-overview-grid">
        <div className="overview-metric-item">
          <span className="metric-label">Total Monthly Budget</span>
          <span className="metric-value tabular-nums">
            ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="overview-metric-item">
          <span className="metric-label">Total Outflow (Spent)</span>
          <span className="metric-value tabular-nums" style={{ color: percentageUsed >= 100 ? 'var(--color-danger)' : 'var(--color-text-dark)' }}>
            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="overview-metric-item">
          <span className="metric-label">Net Remaining Balance</span>
          <span className="metric-value tabular-nums" style={{ color: 'var(--color-emerald-600)' }}>
            ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="overview-metric-item">
          <span className="metric-label">Total Budget Utilization</span>
          <span className="metric-value tabular-nums" style={{ color: progressColor }}>
            {percentageUsed}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="budget-progress-container" aria-label={`Budget utilized: ${percentageUsed}%`}>
        <div className="budget-progress-track">
          <div
            className="budget-progress-fill"
            style={{
              width: `${Math.min(percentageUsed, 100)}%`,
              backgroundColor: progressColor
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};
