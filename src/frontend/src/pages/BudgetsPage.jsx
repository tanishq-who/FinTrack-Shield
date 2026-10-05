import React, { useState, useEffect, useCallback } from 'react';
import { BudgetOverviewCard } from '../components/budgets/BudgetOverviewCard';
import { BudgetCard } from '../components/budgets/BudgetCard';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { DeleteBudgetModal } from '../components/budgets/DeleteBudgetModal';
import { budgetService } from '../services/budgetService';
import { CURRENT_BUDGET_MONTH } from '../services/mockBudgetsData';

export const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deletingBudget, setDeletingBudget] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadBudgetData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [budgetsData, overviewData] = await Promise.all([
        budgetService.getBudgets(CURRENT_BUDGET_MONTH),
        budgetService.getBudgetOverview(CURRENT_BUDGET_MONTH)
      ]);
      setBudgets(budgetsData);
      setOverview(overviewData);
    } catch (err) {
      setError(err.message || 'Failed to load budget data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  const handleSaveBudget = async (formData) => {
    setActionInProgress(true);
    try {
      if (editingBudget) {
        await budgetService.updateBudget(editingBudget.id, formData);
        showToast(`Budget for "${formData.category}" updated successfully.`);
      } else {
        await budgetService.createBudget(formData);
        showToast(`Budget for "${formData.category}" created.`);
      }
      setIsModalOpen(false);
      setEditingBudget(null);
      await loadBudgetData();
    } catch (err) {
      throw err;
    } finally {
      setActionInProgress(false);
    }
  };

  const handleConfirmDelete = async (id) => {
    setActionInProgress(true);
    try {
      await budgetService.deleteBudget(id);
      showToast('Budget category deleted successfully.');
      setDeletingBudget(null);
      await loadBudgetData();
    } catch (err) {
      showToast(`Error deleting budget: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <main className="page-content" id="budgets-content">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title">Budgets</h1>
            <span className="current-month-badge" aria-label={`Current month: ${CURRENT_BUDGET_MONTH}`}>
              {CURRENT_BUDGET_MONTH}
            </span>
          </div>
          <p className="page-description">
            Plan, allocate, and monitor your monthly spending thresholds across categories.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
          aria-label="Create a new budget category"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Create Budget</span>
        </button>
      </section>

      {/* 2. States & Content */}
      {loading ? (
        <div aria-busy="true" aria-label="Loading budget data">
          {/* Skeleton Overview */}
          <div className="surface-card skeleton-card" style={{ height: '180px', marginBottom: '1.5rem' }}>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
          </div>

          {/* Skeleton Budget Grid */}
          <div className="budgets-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="surface-card skeleton-card" style={{ height: '160px' }}>
                <div className="skeleton skeleton-title" style={{ width: '50%' }}></div>
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
              </div>
            ))}
          </div>
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
          <h3 className="state-title">Unable to Load Budgets</h3>
          <p className="state-description">{error}</p>
          <button className="state-action-btn" onClick={loadBudgetData}>
            Retry
          </button>
        </div>
      ) : budgets.length === 0 ? (
        <div className="surface-card state-container" role="status">
          <div className="state-icon-box state-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="state-title">No Budget Allocations Found</h3>
          <p className="state-description">
            You haven't set up any category budgets for {CURRENT_BUDGET_MONTH}. Create your first budget limit to begin proactive spending tracking.
          </p>
          <button
            className="state-action-btn"
            onClick={() => {
              setEditingBudget(null);
              setIsModalOpen(true);
            }}
          >
            + Create First Budget
          </button>
        </div>
      ) : (
        <>
          {/* 2. Budget Overview KPI Component */}
          <section aria-label="Monthly Budget Summary">
            <BudgetOverviewCard overview={overview} />
          </section>

          {/* 3. Category Budgets Grid */}
          <section aria-label="Category Budget Limits">
            <div className="section-header-compact">
              <h3 className="section-subheading">Category Allocations & Status</h3>
              <div className="status-legend-group">
                <span className="legend-item-pill">
                  <span className="dot dot-safe"></span> Safe (&lt;80%)
                </span>
                <span className="legend-item-pill">
                  <span className="dot dot-warning"></span> Approaching Limit (80-99%)
                </span>
                <span className="legend-item-pill">
                  <span className="dot dot-overspent"></span> Over Budget (&ge;100%)
                </span>
              </div>
            </div>

            <div className="budgets-grid">
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={(b) => {
                    setEditingBudget(b);
                    setIsModalOpen(true);
                  }}
                  onDelete={(b) => setDeletingBudget(b)}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Create / Edit Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSubmit={handleSaveBudget}
        budgetToEdit={editingBudget}
      />

      {/* Delete Confirmation Modal */}
      <DeleteBudgetModal
        isOpen={Boolean(deletingBudget)}
        budget={deletingBudget}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleConfirmDelete}
        deleting={actionInProgress}
      />
    </main>
  );
};
