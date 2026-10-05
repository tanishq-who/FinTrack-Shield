import React from 'react';
import { Badge } from '../common/Badge';

/**
 * Recent Transactions Table component for Dashboard
 */
export const RecentTransactionsTable = ({ transactions = [], onViewAll }) => {
  return (
    <div className="surface-card">
      <div className="surface-card-header">
        <div>
          <h3 className="surface-card-title">Recent Transactions</h3>
          <p className="surface-card-subtitle">Real-time ledger entries from linked accounts</p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="nav-link"
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-emerald-600)' }}
          >
            View All Ledger Entries →
          </button>
        )}
      </div>

      <div className="table-wrapper">
        <table className="finance-table" role="table" aria-label="Recent Transactions">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Description / Merchant</th>
              <th scope="col">Category</th>
              <th scope="col">Type</th>
              <th scope="col" style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <tr key={tx.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-dark-muted)' }}>
                    {tx.date}
                  </td>
                  <td>
                    <div className="table-tx-title">{tx.description}</div>
                    {tx.merchant && (
                      <div className="table-tx-merchant">{tx.merchant}</div>
                    )}
                  </td>
                  <td>
                    <Badge variant="category">{tx.category}</Badge>
                  </td>
                  <td>
                    <Badge variant={isIncome ? 'income' : 'expense'}>
                      {tx.type}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={isIncome ? 'amount-income tabular-nums' : 'amount-expense tabular-nums'}>
                      {isIncome ? '+ $' : '- $'}
                      {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
