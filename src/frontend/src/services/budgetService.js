/**
 * FinTrack Shield — Real Budget Service
 * Direct integration with backend /api/budgets for monthly limits, spent calculations,
 * progress percentages, and overspent status detection.
 */

import { apiClient } from './apiClient';
import { categoryService } from './categoryService';

export const CURRENT_BUDGET_MONTH = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

export const budgetService = {
  /**
   * Fetch all category budgets with calculated spent, remaining, and percentage
   */
  async getBudgets(month = CURRENT_BUDGET_MONTH) {
    const data = await apiClient.get(`/budgets?month=${encodeURIComponent(month)}`);
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
  async getBudgetOverview(month = CURRENT_BUDGET_MONTH) {
    const data = await apiClient.get(`/budgets?month=${encodeURIComponent(month)}`);
    const summary = data.summary || {
      totalBudgetLimit: 0,
      totalBudgetSpent: 0,
      totalRemaining: 0,
      overallPercentage: 0,
      isOverspent: false,
    };
    const budgets = data.budgets || [];

    return {
      month: data.month || month,
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
      month: formData.month || CURRENT_BUDGET_MONTH,
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
