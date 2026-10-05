import React, { useState } from 'react';

export const SavingsSuggestionsCard = ({ suggestions = [] }) => {
  const [openExplainerId, setOpenExplainerId] = useState(null);

  const totalPotentialSavings = suggestions.reduce(
    (acc, s) => acc + (s.estimatedMonthlySavings || 0),
    0
  );

  return (
    <div className="surface-card savings-suggestions-card" role="region" aria-label="Actionable Savings Suggestions">
      <div className="savings-header-row">
        <div>
          <h3 className="insight-card-title">Algorithmic Savings Opportunities</h3>
          <p className="insight-card-subtitle">
            Actionable optimizations to improve monthly net savings rate
          </p>
        </div>
        <div className="total-savings-badge" aria-label={`Total potential savings: $${totalPotentialSavings} per month`}>
          <span>Potential: +${totalPotentialSavings.toFixed(0)}/mo</span>
        </div>
      </div>

      <div className="suggestions-list">
        {suggestions.map((sug) => {
          const isExplainerOpen = openExplainerId === sug.id;
          return (
            <div key={sug.id} className="suggestion-item">
              <div className="suggestion-top">
                <div className="sug-title-group">
                  <span className="sug-spark-icon" aria-hidden="true">💡</span>
                  <h4 className="suggestion-title">{sug.title}</h4>
                </div>
                <span className="savings-amount-pill tabular-nums">
                  Save ~${sug.estimatedMonthlySavings.toFixed(0)}/mo
                </span>
              </div>

              <p className="suggestion-desc">{sug.description}</p>

              {/* Expandable Why Am I Seeing This Explainer */}
              {sug.explainer && (
                <div className="sug-explainer-wrapper">
                  <button
                    type="button"
                    className="explainer-toggle-btn"
                    onClick={() => setOpenExplainerId(isExplainerOpen ? null : sug.id)}
                    aria-expanded={isExplainerOpen}
                  >
                    <span>ℹ️ Why am I seeing this suggestion?</span>
                    <span className="toggle-chevron" aria-hidden="true">
                      {isExplainerOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {isExplainerOpen && (
                    <div className="explainer-content-drawer" role="note">
                      <div className="explainer-row">
                        <span className="explainer-tag">Data Source:</span>
                        <span className="explainer-text">{sug.explainer.dataSource}</span>
                      </div>
                      <div className="explainer-row">
                        <span className="explainer-tag">Trigger Condition:</span>
                        <span className="explainer-text">{sug.explainer.reason}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
