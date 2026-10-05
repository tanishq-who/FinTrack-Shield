import {
  MOCK_SPENDING_ANALYSIS,
  MOCK_BUDGET_RISKS,
  MOCK_RECURRING_PAYMENTS,
  MOCK_SAVINGS_SUGGESTIONS
} from './mockInsightsData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const USE_MOCK = true;

/**
 * Service to fetch financial insights, analytics, and spending recommendations.
 * Fully decoupled from UI components.
 */
export const insightsService = {
  /**
   * Fetch month-over-month spending analysis and top spending categories
   */
  async getSpendingAnalysis() {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...MOCK_SPENDING_ANALYSIS }), 120);
      });
    }

    const res = await fetch(`${API_BASE_URL}/insights/spending-analysis`);
    if (!res.ok) throw new Error(`Failed to load spending analysis: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch budget risk assessment (safe, warning, overspent)
   */
  async getBudgetRisks() {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...MOCK_BUDGET_RISKS }), 120);
      });
    }

    const res = await fetch(`${API_BASE_URL}/insights/budget-risks`);
    if (!res.ok) throw new Error(`Failed to load budget risks: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch detected recurring subscriptions and contractual commitments
   */
  async getRecurringPayments() {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ ...MOCK_RECURRING_PAYMENTS }), 120);
      });
    }

    const res = await fetch(`${API_BASE_URL}/insights/recurring`);
    if (!res.ok) throw new Error(`Failed to load recurring payments: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch algorithmic savings opportunities
   */
  async getSavingsSuggestions() {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => resolve([...MOCK_SAVINGS_SUGGESTIONS]), 120);
      });
    }

    const res = await fetch(`${API_BASE_URL}/insights/suggestions`);
    if (!res.ok) throw new Error(`Failed to load savings suggestions: ${res.statusText}`);
    return res.json();
  }
};
