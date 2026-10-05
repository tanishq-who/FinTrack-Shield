import React, { useState } from 'react';

/**
 * Accessible SVG Donut Chart & Category Breakdown List
 */
export const CategorySpendingChart = ({ categories = [] }) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const totalSpent = categories.reduce((sum, item) => sum + item.amount, 0);

  // Donut geometry
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="surface-card">
      <div className="surface-card-header">
        <div>
          <h3 className="surface-card-title">Spending by Category</h3>
          <p className="surface-card-subtitle">Expense distribution for current period</p>
        </div>
      </div>

      <div className="category-breakdown">
        {/* SVG Donut Visual */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
            role="img"
            aria-label="Donut chart showing proportional spending across categories"
          >
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* Segment Arcs */}
            {categories.map((cat) => {
              const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += cat.percentage;

              const isHovered = hoveredCategory && hoveredCategory.id === cat.id;

              return (
                <circle
                  key={cat.id}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={cat.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    cursor: 'pointer',
                    transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                    opacity: hoveredCategory && !isHovered ? 0.45 : 1
                  }}
                  onMouseEnter={() => setHoveredCategory(cat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={`${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage}%)`}
                />
              );
            })}
          </svg>

          {/* Center Info in Donut */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dark-muted)', fontWeight: 500 }}>
              {hoveredCategory ? hoveredCategory.category : 'Total Outflow'}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-dark)' }}>
              ${(hoveredCategory ? hoveredCategory.amount : totalSpent).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {hoveredCategory && (
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: hoveredCategory.color }}>
                {hoveredCategory.percentage}%
              </div>
            )}
          </div>
        </div>

        {/* Category List */}
        <div className="category-list" role="list">
          {categories.map((cat) => {
            const isHovered = hoveredCategory && hoveredCategory.id === cat.id;
            return (
              <div
                key={cat.id}
                className="category-item"
                role="listitem"
                onMouseEnter={() => setHoveredCategory(cat)}
                onMouseLeave={() => setHoveredCategory(null)}
                style={{
                  padding: '4px 6px',
                  borderRadius: '6px',
                  backgroundColor: isHovered ? 'var(--color-surface-alt)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div className="category-item-left">
                  <span className="category-color-bar" style={{ backgroundColor: cat.color }}></span>
                  <span className="category-name">{cat.category}</span>
                </div>
                <div className="category-item-right">
                  <span className="category-amount tabular-nums">
                    ${cat.amount.toFixed(2)}
                  </span>
                  <span className="category-percent tabular-nums">
                    {cat.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
