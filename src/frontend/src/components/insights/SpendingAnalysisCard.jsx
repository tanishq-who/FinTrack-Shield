import React from 'react';
import { InsightCard } from './InsightCard';

export const SpendingAnalysisCard = ({ analysis }) => {
  if (!analysis) return null;

  const {
    currentMonth,
    currentSpending,
    previousMonth,
    previousSpending,
    difference,
    percentageChange,
    topCategory,
    secondCategory,
    explainer
  } = analysis;

  const isReduced = difference < 0;
  const maxSpend = Math.max(currentSpending, previousSpending, 1);

  return (
    <InsightCard
      title="Monthly Spending Velocity"
      subtitle={`${currentMonth} vs ${previousMonth}`}
      iconTheme="teal"
      badgeText={isReduced ? 'Spending Down 4.7%' : 'Spending Increased'}
      badgeVariant={isReduced ? 'income' : 'expense'}
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      }
      explainer={explainer}
    >
      {/* Month-over-month visual bars */}
      <div className="spending-comparison-container">
        {/* Current Month Bar */}
        <div className="comparison-bar-row">
          <div className="comparison-label-group">
            <span className="month-name-label">{currentMonth}</span>
            <span className="month-amount-label tabular-nums">
              ${currentSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="comparison-bar-track">
            <div
              className="comparison-bar-fill fill-current"
              style={{ width: `${(currentSpending / maxSpend) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Previous Month Bar */}
        <div className="comparison-bar-row">
          <div className="comparison-label-group">
            <span className="month-name-label">{previousMonth}</span>
            <span className="month-amount-label tabular-nums" style={{ color: 'var(--color-text-dark-muted)' }}>
              ${previousSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="comparison-bar-track">
            <div
              className="comparison-bar-fill fill-previous"
              style={{ width: `${(previousSpending / maxSpend) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Difference summary note */}
      <div className="comparison-delta-callout">
        <span className="delta-icon">{isReduced ? '📉' : '📈'}</span>
        <p className="delta-text">
          You spent <strong>${Math.abs(difference).toFixed(2)}</strong> ({Math.abs(percentageChange)}%){' '}
          {isReduced ? 'less than last month' : 'more than last month'}.
        </p>
      </div>

      {/* Top Spending Categories Subsection */}
      {topCategory && (
        <div className="top-category-highlight">
          <span className="top-cat-badge">#1 Top Expenditure</span>
          <div className="top-cat-details">
            <div>
              <h4 className="top-cat-name">{topCategory.name}</h4>
              <p className="top-cat-note">{topCategory.note}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="top-cat-amount tabular-nums">
                ${topCategory.amount.toFixed(2)}
              </span>
              <span className="top-cat-percent tabular-nums">
                ({topCategory.percentage}% of total outflow)
              </span>
            </div>
          </div>
        </div>
      )}
    </InsightCard>
  );
};
