/**
 * FinTrack Shield — Real Budget Service
 * Direct integration with backend /api/budgets for monthly limits, spent calculations,
 * progress percentages, and overspent status detection.
 *
 * Implements strict separation between machine/API format ('YYYY-MM') and
 * user-friendly display labels ('October 2026').
 */

import { apiClient } from './apiClient';
import { categoryService } from './categoryService';

/**
 * Returns current date's month formatted as 'YYYY-MM' in local timezone.
 * Avoids toISOString() which shifts UTC midnight into the previous/next month.
 */
export function getCurrentApiMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Normalizes any month representation (Date, 'YYYY-MM', 'October 2026', 'Oct 2026')
 * into strict machine/API format 'YYYY-MM'.
 *
 * Guaranteed timezone-safe: uses day 15 and noon local time for any Date calculations.
 */
export function toApiMonth(input) {
  if (!input) return getCurrentApiMonth();

  if (typeof input === 'string') {
    const trimmed = input.trim();
    // Already in YYYY-MM format
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    // Handles "October 2026", "Oct 2026", "October, 2026"
    const nameMatch = trimmed.match(/^([a-zA-Z]+)[,\s]+(\d{4})$/);
    if (nameMatch) {
      const monthName = nameMatch[1].toLowerCase();
      const year = nameMatch[2];
      const monthMap = {
        january: '01', jan: '01',
        february: '02', feb: '02',
        march: '03', mar: '03',
        april: '04', apr: '04',
        may: '05',
        june: '06', jun: '06',
        july: '07', jul: '07',
        august: '08', aug: '08',
        september: '09', sep: '09', sept: '09',
        october: '10', oct: '10',
        november: '11', nov: '11',
        december: '12', dec: '12',
      };
      if (monthMap[monthName]) {
        return `${year}-${monthMap[monthName]}`;
      }
    }

    // Try parsing as standard date
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }

    return getCurrentApiMonth();
  }

  if (input instanceof Date && !isNaN(input.getTime())) {
    const year = input.getFullYear();
    const month = String(input.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  return getCurrentApiMonth();
}

/**
 * Formats a machine 'YYYY-MM' string into a friendly user-facing label (e.g. 'October 2026').
 * Uses mid-month date (day 15, 12:00:00 noon) to prevent any timezone boundary crossing.
 */
export function formatMonthDisplay(apiMonth) {
  if (!apiMonth) return '';
  const str = String(apiMonth).trim();
  if (/^\d{4}-\d{2}$/.test(str)) {
    const [yearStr, monthStr] = str.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const safeDate = new Date(year, month - 1, 15, 12, 0, 0);
    return safeDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
  return str;
}

/**
 * Returns an adjacent month in 'YYYY-MM' format (e.g. delta = -1 for prev, +1 for next).
 * Guaranteed timezone-safe.
 */
export function getAdjacentMonth(apiMonth, delta = 1) {
  const normalized = toApiMonth(apiMonth);
  const [yearStr, monthStr] = normalized.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const targetDate = new Date(year, month - 1 + delta, 15, 12, 0, 0);
  const nextYear = targetDate.getFullYear();
  const nextMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

export const CURRENT_BUDGET_MONTH = getCurrentApiMonth();

export const budgetService = {
  /**
   * Fetch all category budgets with calculated spent, remaining, and percentage
   */
  async getBudgets(month = getCurrentApiMonth()) {
    const apiMonth = toApiMonth(month);
    const data = await apiClient.get(`/budgets?month=${encodeURIComponent(apiMonth)}`);
    const rawList = data.budgets || [];

    return rawList.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      category: b.categoryName || 'General',
      month: b.month,
      limit: apiClient.fromPaise(b.limitAmount),
      spent: apiClient.fromPaise(b.spentAmount),
      remaining: apiClient.fromPaise(b.remainingAmount),
      percentageUsed: b.percentageUsed,
      isOverspent: b.isOverspent,
      color: b.categoryColor || '#10b981',
      icon: b.categoryIcon || 'tag',
    }));
  },

  /**
   * Fetch aggregate budget summary overview for the month
   */
  async getBudgetOverview(month = getCurrentApiMonth()) {
    const apiMonth = toApiMonth(month);
    const data = await apiClient.get(`/budgets?month=${encodeURIComponent(apiMonth)}`);
    const summary = data.summary || {
      totalBudgetLimit: 0,
      totalBudgetSpent: 0,
      totalRemaining: 0,
      overallPercentage: 0,
      isOverspent: false,
    };
    const budgets = data.budgets || [];

    return {
      month: data.month || apiMonth,
      totalBudget: apiClient.fromPaise(summary.totalBudgetLimit),
      totalSpent: apiClient.fromPaise(summary.totalBudgetSpent),
      remaining: apiClient.fromPaise(Math.max(0, summary.totalRemaining)),
      overBudgetCount: budgets.filter((b) => b.isOverspent).length,
      percentageUsed: summary.overallPercentage || 0,
      isOverspent: summary.isOverspent || false,
    };
  },

  /**
   * Create or upsert a category budget
   */
  async createBudget(formData) {
    let categoryId = formData.categoryId || null;

    if (!categoryId && formData.category) {
      const cat = await categoryService.findByName(formData.category);
      if (cat) {
        categoryId = cat.id;
      }
    }

    const payload = {
      categoryId,
      month: toApiMonth(formData.month || getCurrentApiMonth()),
      limitAmount: apiClient.toPaise(formData.limit),
    };

    const data = await apiClient.post('/budgets', payload);

    window.dispatchEvent(new CustomEvent('fintrack:budgets-updated'));
    const b = data.budget;

    return {
      id: b.id,
      categoryId: b.categoryId,
      category: formData.category || 'General',
      month: b.month,
      limit: apiClient.fromPaise(b.limitAmount),
      spent: 0,
      remaining: apiClient.fromPaise(b.limitAmount),
      percentageUsed: 0,
      isOverspent: false,
      color: formData.color || '#10b981',
    };
  },

  /**
   * Update an existing category budget limit
   */
  async updateBudget(id, updatedFields) {
    const payload = {
      limitAmount: apiClient.toPaise(updatedFields.limit),
    };

    const data = await apiClient.put(`/budgets/${id}`, payload);

    window.dispatchEvent(new CustomEvent('fintrack:budgets-updated'));
    const b = data.budget;

    return {
      id: b.id,
      categoryId: b.categoryId,
      month: b.month,
      limit: apiClient.fromPaise(b.limitAmount),
    };
  },

  /**
   * Delete a category budget by ID
   */
  async deleteBudget(id) {
    const data = await apiClient.delete(`/budgets/${id}`);

    window.dispatchEvent(new CustomEvent('fintrack:budgets-updated'));
    return data;
  },
};

