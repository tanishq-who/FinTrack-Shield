import React, { useState, useEffect } from 'react';
import { AVAILABLE_BUDGET_CATEGORIES } from '../../services/mockBudgetsData';
import { categoryService } from '../../services/categoryService';
import {
  getCurrentApiMonth,
  toApiMonth,
  formatMonthDisplay
} from '../../services/budgetService';

export const BudgetModal = ({
  isOpen,
  onClose,
  onSubmit,
  budgetToEdit = null,
  initialMonth = null
}) => {
  const isEditing = Boolean(budgetToEdit);
  const [availableCategories, setAvailableCategories] = useState(AVAILABLE_BUDGET_CATEGORIES);

  useEffect(() => {
    categoryService.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setAvailableCategories(cats.map((c) => c.name));
      }
    }).catch(() => {});
  }, [isOpen]);

  const defaultApiMonth = toApiMonth(budgetToEdit?.month || initialMonth || getCurrentApiMonth());

  const [formData, setFormData] = useState({
    category: 'Food & Dining',
    limit: '',
    month: defaultApiMonth,
    color: '#10b981'
  });

  const [monthInput, setMonthInput] = useState(formatMonthDisplay(defaultApiMonth));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (budgetToEdit) {
      const m = toApiMonth(budgetToEdit.month || initialMonth || getCurrentApiMonth());
      setFormData({
        category: budgetToEdit.category || 'Food & Dining',
        limit: budgetToEdit.limit !== undefined ? budgetToEdit.limit.toString() : '',
        month: m,
        color: budgetToEdit.color || '#10b981'
      });
      setMonthInput(formatMonthDisplay(m));
    } else {
      const m = toApiMonth(initialMonth || getCurrentApiMonth());
      setFormData({
        category: 'Food & Dining',
        limit: '',
        month: m,
        color: '#10b981'
      });
      setMonthInput(formatMonthDisplay(m));
    }
    setErrors({});
  }, [budgetToEdit, isOpen, initialMonth]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMonthChange = (e) => {
    const val = e.target.value;
    setMonthInput(val);
    const parsed = toApiMonth(val);
    setFormData((prev) => ({ ...prev, month: parsed }));
  };

  const validate = () => {
    const errs = {};

    if (!formData.category || !formData.category.trim()) {
      errs.category = 'Category is required.';
    }

    if (!formData.limit || formData.limit.trim() === '') {
      errs.limit = 'Monthly budget limit is required.';
    } else {
      const parsed = parseFloat(formData.limit);
      if (isNaN(parsed) || parsed <= 0) {
        errs.limit = 'Limit must be a valid number greater than $0.';
      }
    }

    if (!monthInput || !monthInput.trim()) {
      errs.month = 'Budget month cycle is required.';
    } else {
      const parsed = toApiMonth(monthInput);
      if (!/^\d{4}-\d{2}$/.test(parsed)) {
        errs.month = 'Invalid month. Use YYYY-MM (e.g. 2026-10) or Month YYYY (e.g. October 2026).';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const finalApiMonth = toApiMonth(formData.month || monthInput);
      await onSubmit({
        ...formData,
        month: finalApiMonth,
        limit: parseFloat(formData.limit)
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save category budget.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-dialog surface-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-modal-title"
      >
        <div className="modal-header">
          <h3 id="budget-modal-title" className="modal-title">
            {isEditing ? 'Edit Category Budget' : 'Create Category Budget'}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {errors.form && (
          <div className="form-error-alert" role="alert">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {/* Category Selection */}
          <div className="form-group">
            <label htmlFor="budget-category" className="form-label">
              Category <span className="required-star">*</span>
            </label>
            <select
              id="budget-category"
              className={`form-select ${errors.category ? 'input-error' : ''}`}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <span className="field-error-text">{errors.category}</span>}
          </div>

          {/* Monthly Budget Amount & Month */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="budget-limit" className="form-label">
                Monthly Budget Limit ($) <span className="required-star">*</span>
              </label>
              <input
                id="budget-limit"
                type="number"
                step="1"
                min="1"
                className={`form-input tabular-nums ${errors.limit ? 'input-error' : ''}`}
                placeholder="e.g. 500.00"
                value={formData.limit}
                onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                required
              />
              {errors.limit && <span className="field-error-text">{errors.limit}</span>}
            </div>

            <div className="form-group flex-1">
              <label htmlFor="budget-month" className="form-label">
                Budget Month <span className="required-star">*</span>
              </label>
              <input
                id="budget-month"
                type="text"
                className={`form-input ${errors.month ? 'input-error' : ''}`}
                placeholder="e.g. October 2026 or 2026-10"
                value={monthInput}
                onChange={handleMonthChange}
                required
              />
              <span className="field-hint" style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '3px' }}>
                API Month: <strong className="tabular-nums" style={{ color: 'var(--color-emerald-500)' }}>{toApiMonth(formData.month || monthInput)}</strong>
              </span>
              {errors.month && <span className="field-error-text">{errors.month}</span>}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Budget' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
