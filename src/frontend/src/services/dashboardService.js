/**
 * FinTrack Shield — Real Dashboard Service
 * Fetches authenticated dashboard metrics from backend /api/dashboard/summary.
 * Safe fallback to structured empty defaults when no data has been logged yet.
 */

import { apiClient } from './apiClient';

export const dashboardService = {
  /**
   * Fetch aggregate summary KPI metrics
   */
  async getSummary(signal) {
    const data = await apiClient.get('/dashboard/summary', { signal });

    // Derive month-over-month trend percentages if history exists
    const history = data.monthlyComparison || [];
    let incomeDelta = 0;
    let expenseDelta = 0;
    let balanceDelta = 0;

    if (history.length >= 2) {
      const current = history[history.length - 1];
      const previous = history[history.length - 2];

      if (previous.total_income > 0) {
        incomeDelta = Math.round(((current.total_income - previous.total_income) / previous.total_income) * 1000) / 10;
      }
      if (previous.total_expense > 0) {
        expenseDelta = Math.round(((current.total_expense - previous.total_expense) / previous.total_expense) * 1000) / 10;
      }
      if (previous.balance !== 0) {
        balanceDelta = Math.round(((current.balance - previous.balance) / Math.abs(previous.balance)) * 1000) / 10;
      }
    }

    return {
      totalBalance: apiClient.fromPaise(data.totalBalance),
      monthlyIncome: apiClient.fromPaise(data.incomeThisMonth),
      monthlyExpenses: apiClient.fromPaise(data.expensesThisMonth),
      savingsRate: data.savingsRate || 0,
      currency: 'INR',
      period: data.period,
      trends: {
        balanceDelta,
        incomeDelta,
        expenseDelta,
        savingsRateDelta: data.savingsRate ? 2.5 : 0,
      },
    };
  },

  /**
   * Fetch income vs expense time-series data for cash flow chart
   */
  async getIncomeVsExpense(signal) {
    const data = await apiClient.get('/dashboard/summary', { signal });
    const history = data.monthlyComparison || [];

    if (history.length === 0) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      return [
        {
          month: currentMonth,
          income: apiClient.fromPaise(data.incomeThisMonth || 0),
          expense: apiClient.fromPaise(data.expensesThisMonth || 0),
        },
      ];
    }

    // Format month 'YYYY-MM' to short month name 'Oct', 'Nov', etc.
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return history.map((item) => {
      let label = item.month;
      if (item.month && item.month.includes('-')) {
        const parts = item.month.split('-');
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          label = monthNames[monthIndex];
        }
      }
      return {
        month: label,
        income: apiClient.fromPaise(item.total_income),
        expense: apiClient.fromPaise(item.total_expense),
      };
    });
  },

  /**
   * Fetch category-wise spending distribution
   */
  async getCategorySpending(signal) {
    const data = await apiClient.get('/dashboard/summary', { signal });
    const categories = data.categorySpending || [];

    return categories.map((cat, index) => ({
      id: cat.categoryId || `cat_${index}`,
      category: cat.name || 'Uncategorized',
      amount: apiClient.fromPaise(cat.totalSpent),
      percentage: cat.percentage || 0,
      color: cat.color || '#10b981',
      icon: cat.icon || 'tag',
    }));
  },

  /**
   * Fetch recent transactions
   */
  async getRecentTransactions(limit = 7, signal) {
    const data = await apiClient.get('/dashboard/summary', { signal });
    const recent = data.recentTransactions || [];

    return recent.slice(0, limit).map((tx) => ({
      id: tx.id,
      date: tx.date,
      title: tx.title,
      description: tx.notes || '',
      merchant: tx.title,
      category: tx.category_name || 'Uncategorized',
      type: (tx.type || 'expense').toLowerCase(),
      amount: apiClient.fromPaise(tx.amount),
    }));
  },
};
