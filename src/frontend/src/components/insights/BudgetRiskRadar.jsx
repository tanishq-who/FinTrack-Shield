import React from 'react';
import { InsightCard } from './InsightCard';

export const BudgetRiskRadar = ({ risks }) => {
  if (!risks) return null;

  const { safeCategories = [], warningCategories = [], overspentCategories = [], explainer } = risks;

  const hasRisks = overspentCategories.length > 0 || warningCategories.length > 0;

  return (
    <InsightCard
      title="Budget Threshold Risk Radar"
      subtitle="Early-warning indicators for current billing cycle"
      iconTheme={hasRisks ? 'danger' : 'emerald'}
      badgeText={hasRisks ? 'Attention Required' : 'All Clear'}
      badgeVariant={hasRisks ? 'expense' : 'income'}
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      }
      explainer={explainer}
    >
      <div className="risk-radar-container">
        {/* 1. Over Budget Group */}
        {overspentCategories.length > 0 && (
          <div className="risk-group group-overspent">
            <div className="risk-group-header">
              <span className="risk-dot dot-overspent"></span>
              <h4 className="risk-group-title">Over Budget ({overspentCategories.length})</h4>
            </div>
            <div className="risk-items-list">
              {overspentCategories.map((cat) => (
                <div key={cat.name} className="risk-item">
                  <div className="risk-item-top">
                    <span className="risk-cat-name">{cat.name}</span>
                    <span className="risk-cat-val tabular-nums" style={{ color: 'var(--color-danger)' }}>
                      ${cat.spent} / ${cat.limit} ({cat.percent}%)
                    </span>
                  </div>
                  <div className="budget-progress-track">
                    <div
                      className="budget-progress-fill"
                      style={{ width: '100%', backgroundColor: 'var(--color-danger)' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Warning / Approaching Limit Group */}
        {warningCategories.length > 0 && (
          <div className="risk-group group-warning">
            <div className="risk-group-header">
              <span className="risk-dot dot-warning"></span>
              <h4 className="risk-group-title">Near Budget Limit ({warningCategories.length})</h4>
            </div>
            <div className="risk-items-list">
              {warningCategories.map((cat) => (
                <div key={cat.name} className="risk-item">
                  <div className="risk-item-top">
                    <span className="risk-cat-name">{cat.name}</span>
                    <span className="risk-cat-val tabular-nums" style={{ color: 'var(--color-warning)' }}>
                      ${cat.spent} / ${cat.limit} ({cat.percent}%)
                    </span>
                  </div>
                  <div className="budget-progress-track">
                    <div
                      className="budget-progress-fill"
                      style={{ width: `${cat.percent}%`, backgroundColor: 'var(--color-warning)' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Safe Group */}
        {safeCategories.length > 0 && (
          <div className="risk-group group-safe">
            <div className="risk-group-header">
              <span className="risk-dot dot-safe"></span>
              <h4 className="risk-group-title">Safe Categories ({safeCategories.length})</h4>
            </div>
            <div className="risk-items-list">
              {safeCategories.map((cat) => (
                <div key={cat.name} className="risk-item">
                  <div className="risk-item-top">
                    <span className="risk-cat-name">{cat.name}</span>
                    <span className="risk-cat-val tabular-nums" style={{ color: 'var(--color-emerald-600)' }}>
                      ${cat.spent} / ${cat.limit} ({cat.percent}%)
                    </span>
                  </div>
                  <div className="budget-progress-track">
                    <div
                      className="budget-progress-fill"
                      style={{ width: `${cat.percent}%`, backgroundColor: 'var(--color-emerald-500)' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </InsightCard>
  );
};
