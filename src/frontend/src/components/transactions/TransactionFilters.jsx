import React, { useState, useEffect } from 'react';
import { TRANSACTION_CATEGORIES } from '../../services/mockTransactionsData';
import { categoryService } from '../../services/categoryService';

export const TransactionFilters = ({
  filters,
  onChange,
  onReset,
  totalCount,
  filteredCount
}) => {
  const [categories, setCategories] = useState(TRANSACTION_CATEGORIES);

  useEffect(() => {
    categoryService.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats.map((c) => c.name));
      }
    }).catch(() => {});
  }, []);
  const isFiltered =
    filters.search ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.startDate ||
    filters.endDate;

  return (
    <div className="surface-card filters-card" role="search" aria-label="Transaction filters">
      <div className="filters-top-row">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            className="filter-input search-input"
            placeholder="Search by title, description, or merchant..."
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            aria-label="Search transactions"
          />
        </div>

        {/* Type Toggle Buttons (All, Income, Expense) */}
        <div className="type-toggle-group" role="group" aria-label="Filter by transaction type">
          {['all', 'income', 'expense'].map((t) => (
            <button
              key={t}
              type="button"
              className={`type-btn ${filters.type === t ? 'active' : ''}`}
              onClick={() => onChange('type', t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="filters-bottom-row">
        {/* Category Dropdown */}
        <div className="filter-field">
          <label htmlFor="category-filter" className="filter-label">Category</label>
          <select
            id="category-filter"
            className="filter-select"
            value={filters.category}
            onChange={(e) => onChange('category', e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Date Range: Start Date */}
        <div className="filter-field">
          <label htmlFor="start-date-filter" className="filter-label">From</label>
          <input
            id="start-date-filter"
            type="date"
            className="filter-input date-input"
            value={filters.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
          />
        </div>

        {/* Date Range: End Date */}
        <div className="filter-field">
          <label htmlFor="end-date-filter" className="filter-label">To</label>
          <input
            id="end-date-filter"
            type="date"
            className="filter-input date-input"
            value={filters.endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
          />
        </div>

        {/* Count & Reset Actions */}
        <div className="filter-actions-right">
          <span className="results-count-badge" aria-live="polite">
            Showing <strong>{filteredCount}</strong> of {totalCount}
          </span>

          {isFiltered && (
            <button
              type="button"
              className="clear-filters-btn"
              onClick={onReset}
              aria-label="Clear all applied filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
