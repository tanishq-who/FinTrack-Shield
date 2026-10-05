import React from 'react';

/**
 * Reusable StatCard component for KPI metrics
 */
export const StatCard = ({
  label,
  value,
  trend,
  trendPositive,
  trendPeriod = 'vs last month',
  icon,
  iconTheme = 'emerald',
  prefix = '$'
}) => {
  const formattedValue = typeof value === 'number'
    ? `${prefix}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : value;

  return (
    <div className="stat-card" tabIndex={0} role="region" aria-label={`${label}: ${formattedValue}`}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <div className={`stat-icon-wrapper stat-icon-${iconTheme}`} aria-hidden="true">
          {icon}
        </div>
      </div>

      <div className="stat-value tabular-nums">
        {formattedValue}
      </div>

      {trend !== undefined && (
        <div className="stat-footer">
          <span
            className={`trend-badge ${
              trendPositive === true
                ? 'trend-positive'
                : trendPositive === false
                ? 'trend-negative'
                : 'trend-neutral'
            }`}
          >
            {trendPositive === true ? '↑ +' : trendPositive === false ? '↓ ' : ''}
            {Math.abs(trend)}%
          </span>
          <span className="stat-period-note">{trendPeriod}</span>
        </div>
      )}
    </div>
  );
};
