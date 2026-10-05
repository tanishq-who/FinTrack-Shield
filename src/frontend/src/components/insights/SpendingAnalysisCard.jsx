import React from 'react';
import { InsightCard } from './InsightCard';

export const SpendingAnalysisCard = ({ analysis }) => {
  if (!analysis) return null;

  const {
    currentMonth,
    currentSpending = 0,
    previousMonth,
    previousSpending = 0,
    difference = 0,
    percentageChange = 0,
    topCategory,
    secondCategory,
    explainer
  } = analysis;

  const isReduced = difference < 0;
  const isStable = difference === 0;
  const maxSpend = Math.max(Number(currentSpending) || 0, Number(previousSpending) || 0, 1);

  const badgeText = isReduced
    ? `Spending Down ${Math.abs(percentageChange || 0)}%`
    : isStable
    ? 'Spending Stable'
    : `Spending Up ${Math.abs(percentageChange || 0)}%`;

  return (
    <InsightCard
      title="Monthly Spending Velocity"
      subtitle={`${currentMonth} vs ${previousMonth}`}
      iconTheme="teal"
      badgeText={badgeText}
      badgeVariant={isReduced ? 'income' : (isStable ? 'category' : 'expense')}
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
              ${(Number(currentSpending) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="comparison-bar-track">
            <div
              className="comparison-bar-fill fill-current"
              style={{ width: `${Math.min(100, Math.max(0, ((Number(currentSpending) || 0) / maxSpend) * 100))}%` }}
            ></div>
          </div>
        </div>

        {/* Previous Month Bar */}
        <div className="comparison-bar-row">
          <div className="comparison-label-group">
            <span className="month-name-label">{previousMonth}</span>
            <span className="month-amount-label tabular-nums" style={{ color: 'var(--color-text-dark-muted)' }}>
              ${(Number(previousSpending) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="comparison-bar-track">
            <div
              className="comparison-bar-fill fill-previous"
              style={{ width: `${Math.min(100, Math.max(0, ((Number(previousSpending) || 0) / maxSpend) * 100))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Difference summary note */}
      <div className="comparison-delta-callout">
        <span className="delta-icon">{isReduced ? '📉' : (isStable ? '⚖️' : '📈')}</span>
        <p className="delta-text">
          {isStable ? (
            'Spending matches prior month levels.'
          ) : (
            <>
              You spent <strong>${Math.abs(difference || 0).toFixed(2)}</strong> ({Math.abs(percentageChange || 0)}%){' '}
              {isReduced ? 'less than last month' : 'more than last month'}.
            </>
          )}
        </p>
      </div>

      {/* Top Spending Categories Subsection */}
      {topCategory && topCategory.name !== 'None' && (
        <div className="top-category-highlight">
          <span className="top-cat-badge">#1 Top Expenditure</span>
          <div className="top-cat-details">
            <div>
              <h4 className="top-cat-name">{topCategory.name}</h4>
              <p className="top-cat-note">{topCategory.note}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="top-cat-amount tabular-nums">
                ${Number(topCategory.amount || 0).toFixed(2)}
              </span>
              <span className="top-cat-percent tabular-nums">
                ({topCategory.percentage || 0}% of total outflow)
              </span>
            </div>
          </div>
        </div>
      )}
    </InsightCard>
  );
};
