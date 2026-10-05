import React, { useState, useEffect } from 'react';
import { AVAILABLE_BUDGET_CATEGORIES, CURRENT_BUDGET_MONTH } from '../../services/mockBudgetsData';

export const BudgetModal = ({
  isOpen,
  onClose,
  onSubmit,
  budgetToEdit = null
}) => {
  const isEditing = Boolean(budgetToEdit);

  const [formData, setFormData] = useState({
    category: 'Food & Dining',
    limit: '',
    month: CURRENT_BUDGET_MONTH,
    color: '#10b981'
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (budgetToEdit) {
      setFormData({
        category: budgetToEdit.category || 'Food & Dining',
        limit: budgetToEdit.limit !== undefined ? budgetToEdit.limit.toString() : '',
        month: budgetToEdit.month || CURRENT_BUDGET_MONTH,
        color: budgetToEdit.color || '#10b981'
      });
    } else {
      setFormData({
        category: 'Food & Dining',
        limit: '',
        month: CURRENT_BUDGET_MONTH,
        color: '#10b981'
      });
    }
    setErrors({});
  }, [budgetToEdit, isOpen]);

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

    if (!formData.month || !formData.month.trim()) {
      errs.month = 'Budget month cycle is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...formData,
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
              {AVAILABLE_BUDGET_CATEGORIES.map((cat) => (
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
                placeholder="e.g. October 2026"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                required
              />
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
