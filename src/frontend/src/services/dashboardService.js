import {
  mockSummary,
  mockIncomeVsExpense,
  mockCategorySpending,
  mockRecentTransactions
} from './mockDashboardData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const USE_MOCK = true; // Toggle to false once backend endpoints are live

/**
 * Service to fetch dashboard metrics.
 * Designed to make backend replacement straightforward without modifying UI components.
 */
export const dashboardService = {
  /**
   * Fetch aggregate summary KPI metrics
   */
  async getSummary(signal) {
    if (USE_MOCK) {
      // Simulate light async resolution
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...mockSummary }), 150);
      });
    }

    const response = await fetch(`${API_BASE_URL}/dashboard/summary`, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load summary: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch income vs expense time-series data
   */
  async getIncomeVsExpense(signal) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockIncomeVsExpense]), 150);
      });
    }

    const response = await fetch(`${API_BASE_URL}/dashboard/income-vs-expense`, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load chart data: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch category-wise spending distribution
   */
  async getCategorySpending(signal) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockCategorySpending]), 150);
      });
    }

    const response = await fetch(`${API_BASE_URL}/dashboard/categories`, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load category spending: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch recent transactions
   */
  async getRecentTransactions(limit = 7, signal) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockRecentTransactions.slice(0, limit)), 150);
      });
    }

    const response = await fetch(`${API_BASE_URL}/transactions?limit=${limit}`, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load transactions: ${response.statusText}`);
    }
    return response.json();
  }
};
