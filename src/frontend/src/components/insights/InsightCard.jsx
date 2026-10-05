import React, { useState } from 'react';

/**
 * Reusable InsightCard with expandable 'Why am I seeing this?' transparency drawer
 */
export const InsightCard = ({
  title,
  subtitle,
  icon,
  iconTheme = 'emerald',
  badgeText,
  badgeVariant = 'category',
  children,
  explainer
}) => {
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);

  return (
    <div className="surface-card insight-card" role="region" aria-label={title}>
      {/* Header */}
      <div className="insight-card-header">
        <div className="insight-header-left">
          {icon && (
            <div className={`stat-icon-wrapper stat-icon-${iconTheme}`} aria-hidden="true">
              {icon}
            </div>
          )}
          <div>
            <h3 className="insight-card-title">{title}</h3>
            {subtitle && <p className="insight-card-subtitle">{subtitle}</p>}
          </div>
        </div>

        {badgeText && (
          <span className={`badge badge-${badgeVariant}`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="insight-card-body">
        {children}
      </div>

      {/* "Why am I seeing this?" Section */}
      {explainer && (
        <div className="insight-explainer-section">
          <button
            type="button"
            className="explainer-toggle-btn"
            onClick={() => setIsExplainerOpen(!isExplainerOpen)}
            aria-expanded={isExplainerOpen}
          >
            <span>ℹ️ Why am I seeing this?</span>
            <span className="toggle-chevron" aria-hidden="true">
              {isExplainerOpen ? '▲' : '▼'}
            </span>
          </button>

          {isExplainerOpen && (
            <div className="explainer-content-drawer" role="note">
              <div className="explainer-row">
                <span className="explainer-tag">Data Source:</span>
                <span className="explainer-text">{explainer.dataSource}</span>
              </div>
              <div className="explainer-row">
                <span className="explainer-tag">Algorithmic Rationale:</span>
                <span className="explainer-text">{explainer.reason}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
