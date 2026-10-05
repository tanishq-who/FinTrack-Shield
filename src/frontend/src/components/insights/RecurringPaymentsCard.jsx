import React from 'react';
import { InsightCard } from './InsightCard';
import { Badge } from '../common/Badge';

export const RecurringPaymentsCard = ({ recurring }) => {
  if (!recurring) return null;

  const { totalMonthly, items = [], explainer } = recurring;

  return (
    <InsightCard
      title="Recurring Subscriptions & Commitments"
      subtitle="Cadence detected from ledger charge history"
      iconTheme="indigo"
      badgeText={`$${totalMonthly.toFixed(2)}/mo`}
      badgeVariant="category"
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      }
      explainer={explainer}
    >
      <div className="recurring-payments-container">
        <div className="recurring-header-note">
          <span className="rec-count-note">{items.length} active recurring commitments detected</span>
        </div>

        <div className="recurring-list" role="list">
          {items.map((item) => (
            <div key={item.id} className="recurring-item" role="listitem">
              <div className="recurring-item-left">
                <div className="recurring-avatar">
                  {item.name.charAt(0)}
                </div>
                <div>
                  <h4 className="recurring-name">{item.name}</h4>
                  <div className="recurring-meta">
                    <Badge variant="category">{item.category}</Badge>
                    <span className="next-date-label">Due: {item.nextDate}</span>
                  </div>
                </div>
              </div>

              <div className="recurring-item-right">
                <span className="recurring-amount tabular-nums">
                  ${item.amount.toFixed(2)}
                </span>
                <span className="recurring-freq">{item.frequency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </InsightCard>
  );
};
