import React, { useState, useEffect } from 'react';
import { TRANSACTION_CATEGORIES } from '../../services/mockTransactionsData';
import { categoryService } from '../../services/categoryService';

export const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  transactionToEdit = null
}) => {
  const isEditing = Boolean(transactionToEdit);
  const [availableCategories, setAvailableCategories] = useState(TRANSACTION_CATEGORIES);

  useEffect(() => {
    categoryService.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setAvailableCategories(cats.map((c) => c.name));
      }
    }).catch(() => {});
  }, [isOpen]);

  const [formData, setFormData] = useState({
    type: 'expense',
    title: '',
    amount: '',
    category: 'Food & Dining',
    date: new Date().toISOString().split('T')[0],
    description: '',
    merchant: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        type: transactionToEdit.type || 'expense',
        title: transactionToEdit.title || '',
        amount: transactionToEdit.amount !== undefined ? transactionToEdit.amount.toString() : '',
        category: transactionToEdit.category || 'Food & Dining',
        date: transactionToEdit.date || new Date().toISOString().split('T')[0],
        description: transactionToEdit.description || '',
        merchant: transactionToEdit.merchant || ''
      });
    } else {
      setFormData({
        type: 'expense',
        title: '',
        amount: '',
        category: 'Food & Dining',
        date: new Date().toISOString().split('T')[0],
        description: '',
        merchant: ''
      });
    }
    setErrors({});
  }, [transactionToEdit, isOpen]);

  // Handle escape key to close
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

    if (!formData.title.trim()) {
      errs.title = 'Title or Merchant name is required.';
    }

    if (!formData.amount || formData.amount.trim() === '') {
      errs.amount = 'Amount is required.';
    } else {
      const parsed = parseFloat(formData.amount);
      if (isNaN(parsed) || parsed <= 0) {
        errs.amount = 'Amount must be a valid number greater than 0.';
      }
    }

    if (!formData.category) {
      errs.category = 'Category selection is required.';
    }

    if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      errs.date = 'A valid date is required (YYYY-MM-DD).';
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
        amount: parseFloat(formData.amount),
        merchant: formData.merchant.trim() || formData.title.trim()
      });
      onClose();
    } catch (err) {
      setErrors({ form: err.message || 'Failed to save transaction.' });
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
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">
            {isEditing ? 'Edit Transaction' : 'Record New Transaction'}
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
          {/* Transaction Type Toggle */}
          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <div className="type-toggle-selector" role="radiogroup" aria-label="Transaction Type">
              <button
                type="button"
                className={`type-select-btn expense ${formData.type === 'expense' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'expense' })}
                role="radio"
                aria-checked={formData.type === 'expense'}
              >
                Expense (Outflow)
              </button>
              <button
                type="button"
                className={`type-select-btn income ${formData.type === 'income' ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'income' })}
                role="radio"
                aria-checked={formData.type === 'income'}
              >
                Income (Inflow)
              </button>
            </div>
          </div>

          {/* Title & Amount Grid */}
          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="tx-title" className="form-label">
                Title / Payee <span className="required-star">*</span>
              </label>
              <input
                id="tx-title"
                type="text"
                className={`form-input ${errors.title ? 'input-error' : ''}`}
                placeholder="e.g. AWS Cloud, Whole Foods"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              {errors.title && <span className="field-error-text">{errors.title}</span>}
            </div>

            <div className="form-group flex-1">
              <label htmlFor="tx-amount" className="form-label">
                Amount ($) <span className="required-star">*</span>
              </label>
              <input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0.01"
                className={`form-input tabular-nums ${errors.amount ? 'input-error' : ''}`}
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              {errors.amount && <span className="field-error-text">{errors.amount}</span>}
            </div>
          </div>

          {/* Category & Date Grid */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="tx-category" className="form-label">
                Category <span className="required-star">*</span>
              </label>
              <select
                id="tx-category"
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

            <div className="form-group flex-1">
              <label htmlFor="tx-date" className="form-label">
                Date <span className="required-star">*</span>
              </label>
              <input
                id="tx-date"
                type="date"
                className={`form-input ${errors.date ? 'input-error' : ''}`}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              {errors.date && <span className="field-error-text">{errors.date}</span>}
            </div>
          </div>

          {/* Optional Description / Memo */}
          <div className="form-group">
            <label htmlFor="tx-description" className="form-label">
              Description / Notes <span className="optional-tag">(Optional)</span>
            </label>
            <textarea
              id="tx-description"
              className="form-textarea"
              rows="3"
              placeholder="Additional details, tax category, or invoice memo..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Modal Actions Footer */}
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
              {submitting ? 'Saving...' : isEditing ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
