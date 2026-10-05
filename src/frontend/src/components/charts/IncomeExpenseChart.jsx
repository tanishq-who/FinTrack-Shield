import React, { useState } from 'react';

/**
 * Accessible SVG Grouped Bar Chart comparing Income vs Expenses
 */
export const IncomeExpenseChart = ({ data = [] }) => {
  const [activeItem, setActiveItem] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="surface-card">
        <div className="surface-card-header">
          <h3 className="surface-card-title">Income vs Expenses</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-dark-muted)' }}>
          No historical cash flow data available.
        </div>
      </div>
    );
  }

  // Calculate chart metrics
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 10000);
  const roundedMax = Math.ceil(maxVal / 2000) * 2000;

  const chartHeight = 200;
  const chartWidth = 520;
  const paddingX = 45;
  const paddingY = 20;

  const availableWidth = chartWidth - paddingX * 2;
  const groupWidth = availableWidth / data.length;
  const barWidth = Math.min(groupWidth * 0.32, 22);

  return (
    <div className="surface-card">
      <div className="surface-card-header">
        <div>
          <h3 className="surface-card-title">Cash Flow: Income vs Expenses</h3>
          <p className="surface-card-subtitle">Monthly cash inflow compared to operational expenses</p>
        </div>
        <div className="chart-legend" aria-hidden="true">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: 'var(--color-emerald-500)' }}></span>
            <span>Income</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#0f172a' }}></span>
            <span>Expenses</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
          className="chart-svg"
          role="img"
          aria-label="Bar chart displaying monthly income versus expense comparisons."
        >
          {/* Background Grid Lines & Y-Axis Labels */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = chartHeight - ratio * (chartHeight - paddingY);
            const val = Math.round(ratio * roundedMax);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - 10}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                  fontFamily="Inter, sans-serif"
                >
                  ${(val / 1000).toFixed(0)}k
                </text>
              </g>
            );
          })}

          {/* Render Bars for Each Month */}
          {data.map((d, index) => {
            const groupX = paddingX + index * groupWidth + (groupWidth - barWidth * 2 - 6) / 2;

            const incomeHeight = ((d.income / roundedMax) * (chartHeight - paddingY));
            const incomeY = chartHeight - incomeHeight;

            const expenseHeight = ((d.expense / roundedMax) * (chartHeight - paddingY));
            const expenseY = chartHeight - expenseHeight;

            const isHovered = activeItem && activeItem.month === d.month;

            return (
              <g
                key={d.month}
                onMouseEnter={() => setActiveItem(d)}
                onMouseLeave={() => setActiveItem(null)}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${d.month}: Income $${d.income.toLocaleString()}, Expense $${d.expense.toLocaleString()}`}
                style={{ cursor: 'pointer' }}
              >
                {/* Income Bar (Emerald) */}
                <rect
                  x={groupX}
                  y={incomeY}
                  width={barWidth}
                  height={Math.max(incomeHeight, 2)}
                  rx="3"
                  fill={isHovered ? 'var(--color-emerald-600)' : 'var(--color-emerald-500)'}
                  transition="fill 0.15s ease"
                />

                {/* Expense Bar (Navy Dark) */}
                <rect
                  x={groupX + barWidth + 4}
                  y={expenseY}
                  width={barWidth}
                  height={Math.max(expenseHeight, 2)}
                  rx="3"
                  fill={isHovered ? '#334155' : '#0f172a'}
                  transition="fill 0.15s ease"
                />

                {/* Month Label */}
                <text
                  x={groupX + barWidth + 2}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="500"
                  fill={isHovered ? '#0f172a' : '#64748b'}
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Focus Tooltip */}
        {activeItem && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              gap: '12px',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <strong>{activeItem.month}</strong>
            <span style={{ color: 'var(--color-emerald-500)' }}>
              In: ${activeItem.income.toLocaleString()}
            </span>
            <span style={{ color: '#cbd5e1' }}>
              Out: ${activeItem.expense.toLocaleString()}
            </span>
            <span style={{ color: '#60a5fa' }}>
              Net: +${(activeItem.income - activeItem.expense).toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
