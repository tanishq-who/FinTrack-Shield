import { INITIAL_BUDGETS, CURRENT_BUDGET_MONTH } from './mockBudgetsData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const USE_MOCK = true;

// In-memory store for session continuity
let inMemoryBudgets = [...INITIAL_BUDGETS];

export const budgetService = {
  /**
   * Fetch all category budgets
   */
  async getBudgets(month = CURRENT_BUDGET_MONTH) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const list = inMemoryBudgets.filter(
            (b) => !b.month || b.month === month
          );
          resolve([...list]);
        }, 120);
      });
    }

    const res = await fetch(`${API_BASE_URL}/budgets?month=${encodeURIComponent(month)}`);
    if (!res.ok) throw new Error(`Failed to fetch budgets: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch aggregate budget summary for the month
   */
  async getBudgetOverview(month = CURRENT_BUDGET_MONTH) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const budgets = inMemoryBudgets.filter(
            (b) => !b.month || b.month === month
          );

          const totalBudget = budgets.reduce((acc, b) => acc + (b.limit || 0), 0);
          const totalSpent = budgets.reduce((acc, b) => acc + (b.spent || 0), 0);
          const remaining = Math.max(totalBudget - totalSpent, 0);
          const overBudgetCount = budgets.filter((b) => (b.spent || 0) > (b.limit || 0)).length;
          const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

          resolve({
            month,
            totalBudget,
            totalSpent,
            remaining,
            overBudgetCount,
            percentageUsed: Math.round(percentageUsed * 10) / 10
          });
        }, 120);
      });
    }

    const res = await fetch(`${API_BASE_URL}/budgets/overview?month=${encodeURIComponent(month)}`);
    if (!res.ok) throw new Error(`Failed to fetch budget overview: ${res.statusText}`);
    return res.json();
  },

  /**
   * Create a new category budget
   */
  async createBudget(data) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newBudget = {
            ...data,
            id: `bgt_${Date.now()}`,
            limit: parseFloat(data.limit),
            spent: data.spent !== undefined ? parseFloat(data.spent) : 0,
            month: data.month || CURRENT_BUDGET_MONTH,
            color: data.color || '#10b981'
          };
          inMemoryBudgets = [newBudget, ...inMemoryBudgets];
          resolve(newBudget);
        }, 150);
      });
    }

    const res = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to create budget: ${res.statusText}`);
    return res.json();
  },

  /**
   * Update an existing category budget
   */
  async updateBudget(id, updatedFields) {
    if (USE_MOCK) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const index = inMemoryBudgets.findIndex((b) => b.id === id);
          if (index === -1) {
            return reject(new Error('Budget not found'));
          }
          const updated = {
            ...inMemoryBudgets[index],
            ...updatedFields,
            limit: parseFloat(updatedFields.limit)
          };
          inMemoryBudgets[index] = updated;
          resolve(updated);
        }, 150);
      });
    }

    const res = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });
    if (!res.ok) throw new Error(`Failed to update budget: ${res.statusText}`);
    return res.json();
  },

  /**
   * Delete a category budget by ID
   */
  async deleteBudget(id) {
    if (USE_MOCK) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const index = inMemoryBudgets.findIndex((b) => b.id === id);
          if (index === -1) {
            return reject(new Error('Budget not found'));
          }
          const [removed] = inMemoryBudgets.splice(index, 1);
          resolve(removed);
        }, 150);
      });
    }

    const res = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Failed to delete budget: ${res.statusText}`);
    return res.json();
  }
};
