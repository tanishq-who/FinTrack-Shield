import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Badge } from '../components/common/Badge';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import { TransactionModal } from '../components/transactions/TransactionModal';
import { DeleteConfirmationModal } from '../components/transactions/DeleteConfirmationModal';
import { transactionService } from '../services/transactionService';

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: ''
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Transactions from service
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.getTransactions(filters);
      setTransactions(data);
    } catch (err) {
      setError(err.message || 'Failed to load transaction ledger.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      startDate: '',
      endDate: ''
    });
  };

  // Add / Edit Transaction Handler
  const handleSaveTransaction = async (formData) => {
    setActionInProgress(true);
    try {
      if (editingTransaction) {
        await transactionService.updateTransaction(editingTransaction.id, formData);
        showToast(`Transaction "${formData.title}" updated successfully.`);
      } else {
        await transactionService.createTransaction(formData);
        showToast(`Transaction "${formData.title}" added to ledger.`);
      }
      setIsModalOpen(false);
      setEditingTransaction(null);
      await loadTransactions();
    } catch (err) {
      throw err;
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete Transaction Handler
  const handleConfirmDelete = async (id) => {
    setActionInProgress(true);
    try {
      await transactionService.deleteTransaction(id);
      showToast('Transaction deleted successfully.');
      setDeletingTransaction(null);
      await loadTransactions();
    } catch (err) {
      showToast(`Error deleting transaction: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Export CSV Handler
  const handleExportCsv = async () => {
    try {
      setActionInProgress(true);
      await transactionService.exportCsv();
      showToast('Transactions exported to CSV successfully.');
    } catch (err) {
      showToast(`Export failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const isFilterActive =
    filters.search ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.startDate ||
    filters.endDate;

  return (
    <main className="page-content" id="transactions-content">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification" role="status" aria-live="polite">
          <span className="toast-dot"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Header */}
      <section className="page-header-row">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-description">
            Track and manage your income and expenses with real-time audit verification.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCsv}
            disabled={actionInProgress || transactions.length === 0}
            aria-label="Export transactions to CSV"
            title="Download CSV export"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            aria-label="Add a new transaction"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Transaction</span>
          </button>
        </div>
      </section>

      {/* 2. Search and Filters Bar */}
      <section aria-label="Transaction Filters">
        <TransactionFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          totalCount={transactions.length}
          filteredCount={transactions.length}
        />
      </section>

      {/* 3. States & Transactions Ledger */}
      {loading ? (
        <div className="surface-card" style={{ padding: '2rem' }} aria-busy="true" aria-label="Loading transactions">
          <div className="skeleton skeleton-title"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-text" style={{ height: '36px', margin: '12px 0' }}></div>
          ))}
        </div>
      ) : error ? (
        <div className="surface-card state-container" role="alert">
          <div className="state-icon-box state-error-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="state-title">Error Loading Transactions</h3>
          <p className="state-description">{error}</p>
          <button className="state-action-btn" onClick={loadTransactions}>
            Retry
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="surface-card state-container" role="status">
          <div className="state-icon-box state-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="state-title">
            {isFilterActive ? 'No Matching Transactions' : 'No Transactions Recorded'}
          </h3>
          <p className="state-description">
            {isFilterActive
              ? 'No ledger records match your active search and filter criteria. Try resetting or broadening your filters.'
              : 'Your transaction ledger is currently empty. Click "Add Transaction" above to log your first income or expense.'}
          </p>
          {isFilterActive ? (
            <button className="state-action-btn" onClick={handleResetFilters}>
              Reset Filters
            </button>
          ) : (
            <button
              className="state-action-btn"
              onClick={() => {
                setEditingTransaction(null);
                setIsModalOpen(true);
              }}
            >
              + Add First Transaction
            </button>
          )}
        </div>
      ) : (
        <section aria-label="Transactions Ledger">
          {/* Desktop Table View */}
          <div className="surface-card desktop-tx-table-card">
            <div className="table-wrapper">
              <table className="finance-table" role="table" aria-label="Complete transaction ledger">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Title & Merchant</th>
                    <th scope="col">Category</th>
                    <th scope="col">Type</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Amount</th>
                    <th scope="col" style={{ textAlign: 'center', width: '120px' }}>Actions</th>
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
                          <div className="table-tx-title">{tx.title}</div>
                          {tx.merchant && tx.merchant !== tx.title && (
                            <div className="table-tx-merchant">{tx.merchant}</div>
                          )}
                          {tx.description && (
                            <div className="table-tx-desc">{tx.description}</div>
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
                        <td style={{ textAlign: 'center' }}>
                          <div className="action-buttons-group">
                            <button
                              type="button"
                              className="action-icon-btn edit-btn"
                              title="Edit transaction"
                              onClick={() => {
                                setEditingTransaction(tx);
                                setIsModalOpen(true);
                              }}
                              aria-label={`Edit ${tx.title}`}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="action-icon-btn delete-btn"
                              title="Delete transaction"
                              onClick={() => setDeletingTransaction(tx)}
                              aria-label={`Delete ${tx.title}`}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards View */}
          <div className="mobile-tx-cards-container" role="feed" aria-label="Mobile transaction records">
            {transactions.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div key={tx.id} className="surface-card mobile-tx-card" role="article">
                  <div className="mobile-card-top">
                    <span className="mobile-card-date">{tx.date}</span>
                    <Badge variant={isIncome ? 'income' : 'expense'}>{tx.type}</Badge>
                  </div>

                  <div className="mobile-card-main">
                    <h4 className="mobile-card-title">{tx.title}</h4>
                    {tx.merchant && tx.merchant !== tx.title && (
                      <span className="mobile-card-merchant">{tx.merchant}</span>
                    )}
                    {tx.description && (
                      <p className="mobile-card-desc">{tx.description}</p>
                    )}
                  </div>

                  <div className="mobile-card-footer">
                    <Badge variant="category">{tx.category}</Badge>
                    <span className={isIncome ? 'amount-income tabular-nums' : 'amount-expense tabular-nums'}>
                      {isIncome ? '+ $' : '- $'}
                      {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="mobile-card-actions">
                    <button
                      type="button"
                      className="btn btn-secondary mobile-action-btn"
                      onClick={() => {
                        setEditingTransaction(tx);
                        setIsModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger mobile-action-btn"
                      onClick={() => setDeletingTransaction(tx)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSaveTransaction}
        transactionToEdit={editingTransaction}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(deletingTransaction)}
        transaction={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
        deleting={actionInProgress}
      />
    </main>
  );
};
