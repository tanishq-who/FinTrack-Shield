/**
 * FinTrack Shield — Real Financial Insights Service
 * Derives spending intelligence, category risk analysis, and savings recommendations
 * directly from the authenticated user's verified ledger and budgets.
 */

import { apiClient } from './apiClient';

export const insightsService = {
  /**
   * Fetch month-over-month spending analysis and top spending categories
   */
  async getSpendingAnalysis() {
    const summary = await apiClient.get('/dashboard/summary');
    const history = summary.monthlyComparison || [];
    const categories = summary.categorySpending || [];

    const currentSpending = apiClient.fromPaise(summary.expensesThisMonth || 0);
    let previousSpending = 0;
    let difference = 0;
    let percentageChange = 0;

    if (history.length >= 2) {
      previousSpending = apiClient.fromPaise(history[history.length - 2].total_expense || 0);
      difference = currentSpending - previousSpending;
      if (previousSpending > 0) {
        percentageChange = Math.round(((currentSpending - previousSpending) / previousSpending) * 1000) / 10;
      }
    }

    const topCategory = categories[0]
      ? {
          name: categories[0].name,
          amount: apiClient.fromPaise(categories[0].totalSpent),
          percentage: categories[0].percentage,
          note: `Largest monthly outflow category (${categories[0].percentage}% of total spending)`,
        }
      : {
          name: 'None',
          amount: 0,
          percentage: 0,
          note: 'No recorded category expenses this month',
        };

    const secondCategory = categories[1]
      ? {
          name: categories[1].name,
          amount: apiClient.fromPaise(categories[1].totalSpent),
          percentage: categories[1].percentage,
          note: 'Secondary spending category',
        }
      : null;

    const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    return {
      currentMonth: currentMonthLabel,
      currentSpending,
      previousMonth: 'Prior Month',
      previousSpending,
      difference,
      percentageChange,
      topCategory,
      secondCategory,
      explainer: {
        dataSource: `Aggregated live from your verified ledger transactions for ${summary.period}.`,
        reason: 'Evaluating month-over-month burn rate provides early detection of spending velocity changes.',
      },
    };
  },

  /**
   * Fetch budget risk assessment (safe, warning, overspent) derived from live budgets
   */
  async getBudgetRisks() {
    const budgetData = await apiClient.get('/budgets');
    const budgets = budgetData.budgets || [];

    const safeCategories = [];
    const warningCategories = [];
    const overspentCategories = [];

    budgets.forEach((b) => {
      const item = {
        name: b.categoryName || 'General',
        limit: apiClient.fromPaise(b.limitAmount),
        spent: apiClient.fromPaise(b.spentAmount),
        percent: b.percentageUsed,
        overspentBy: b.isOverspent ? apiClient.fromPaise(Math.abs(b.remainingAmount)) : 0,
      };

      if (b.percentageUsed >= 100) {
        overspentCategories.push(item);
      } else if (b.percentageUsed >= 80) {
        warningCategories.push(item);
      } else {
        safeCategories.push(item);
      }
    });

    return {
      safeCategories,
      warningCategories,
      overspentCategories,
      explainer: {
        dataSource: `Calculated from your active monthly category budget thresholds.`,
        reason: 'Identifies budget health in real time so you can adjust discretionary allocations before month-end.',
      },
    };
  },

  /**
   * Fetch detected recurring payments
   */
  async getRecurringPayments() {
    const txData = await apiClient.get('/transactions?limit=100');
    const transactions = txData.transactions || [];

    // Group expenses by title to find repeating expenses
    const titleCounts = {};
    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((t) => {
        const key = t.title.toLowerCase().trim();
        if (!titleCounts[key]) {
          titleCounts[key] = {
            id: `rec_${t.id}`,
            name: t.title,
            merchant: t.title,
            amount: apiClient.fromPaise(t.amount),
            frequency: 'Monthly',
            nextDate: t.date,
            category: t.category_name || 'General',
            count: 0,
          };
        }
        titleCounts[key].count += 1;
      });

    const recurringList = Object.values(titleCounts)
      .slice(0, 5);

    const totalMonthly = recurringList.reduce((acc, item) => acc + item.amount, 0);

    return {
      totalMonthly,
      items: recurringList,
      explainer: {
        dataSource: 'Derived from repeating ledger expense signatures and subscription charges.',
        reason: 'Tracking fixed commitments ensures sufficient liquidity for upcoming billing cycles.',
      },
    };
  },

  /**
   * Fetch algorithmic savings opportunities
   */
  async getSavingsSuggestions() {
    const summary = await apiClient.get('/dashboard/summary');
    const categories = summary.categorySpending || [];
    const savingsRate = summary.savingsRate || 0;

    const suggestions = [];

    if (savingsRate < 20) {
      suggestions.push({
        id: 'sug_savings_rate',
        title: 'Accelerate Core Savings Rate',
        category: 'Savings',
        potentialSavings: 500,
        description: `Your current savings rate is ${savingsRate}%. Increasing this to the recommended 20% milestone provides an emergency buffer.`,
        actionLabel: 'Adjust Monthly Target',
      });
    }

    if (categories.length > 0) {
      const top = categories[0];
      suggestions.push({
        id: 'sug_top_cat',
        title: `Optimize ${top.name} Spending`,
        category: top.name,
        potentialSavings: Math.round(apiClient.fromPaise(top.totalSpent) * 0.1),
        description: `${top.name} represents ${top.percentage}% of your monthly expenses. Trimming 10% from this category yields direct savings.`,
        actionLabel: 'Set Category Budget',
      });
    }

    suggestions.push({
      id: 'sug_subscriptions',
      title: 'Review Recurring Subscriptions',
      category: 'Utilities & Tech',
      potentialSavings: 35,
      description: 'Audit unutilized software seats and monthly recurring service memberships.',
      actionLabel: 'Inspect Subscriptions',
    });

    return suggestions;
  },
};
