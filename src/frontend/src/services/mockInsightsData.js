/**
 * Mock Financial Insights Data for FinTrack Shield
 * Mirrors future backend analytics and intelligence models.
 */

export const MOCK_SPENDING_ANALYSIS = {
  currentMonth: 'October 2026',
  currentSpending: 3640.25,
  previousMonth: 'September 2026',
  previousSpending: 3820.50,
  difference: -180.25,
  percentageChange: -4.7, // spending down is positive
  topCategory: {
    name: 'Housing & Rent',
    amount: 1500.00,
    percentage: 41.2,
    note: 'Primary fixed residence lease'
  },
  secondCategory: {
    name: 'Food & Dining',
    amount: 780.50,
    percentage: 21.4,
    note: 'Groceries & dining'
  },
  explainer: {
    dataSource: 'Aggregated from 12 verified ledger transactions and monthly billing statements between September 1 and October 5, 2026.',
    reason: 'Evaluating month-over-month burn rate provides early detection of spending velocity changes and protects your savings rate.'
  }
};

export const MOCK_BUDGET_RISKS = {
  safeCategories: [
    { name: 'Shopping', limit: 250, spent: 85, percent: 34.0 },
    { name: 'Healthcare', limit: 250, spent: 110, percent: 44.0 },
    { name: 'Entertainment', limit: 300, spent: 175, percent: 58.3 }
  ],
  warningCategories: [
    { name: 'Food & Dining', limit: 800, spent: 780.50, percent: 97.6 },
    { name: 'Utilities & Tech', limit: 500, spent: 480.00, percent: 96.0 }
  ],
  overspentCategories: [
    { name: 'Transportation', limit: 350, spent: 390.25, percent: 111.5, overspentBy: 40.25 }
  ],
  explainer: {
    dataSource: 'Calculated directly from October 2026 category limits cross-referenced with your ledger debits.',
    reason: 'Flags categories nearing or breaching thresholds so you can adjust discretionary spending before the monthly billing cycle concludes.'
  }
};

export const MOCK_RECURRING_PAYMENTS = {
  totalMonthly: 1723.80,
  items: [
    {
      id: 'rec_1',
      name: 'Apartment Monthly Lease',
      merchant: 'Skyline Properties Ltd',
      amount: 1500.00,
      frequency: 'Monthly',
      nextDate: '2026-11-03',
      category: 'Housing & Rent'
    },
    {
      id: 'rec_2',
      name: 'AWS Cloud Infrastructure',
      merchant: 'Amazon Web Services',
      amount: 142.80,
      frequency: 'Monthly',
      nextDate: '2026-11-04',
      category: 'Utilities & Tech'
    },
    {
      id: 'rec_3',
      name: 'Metro Transit Card Pass',
      merchant: 'Metropolitan Transit',
      amount: 45.00,
      frequency: 'Monthly',
      nextDate: '2026-11-01',
      category: 'Transportation'
    },
    {
      id: 'rec_4',
      name: 'GitHub Enterprise Seat',
      merchant: 'GitHub Inc.',
      amount: 21.00,
      frequency: 'Monthly',
      nextDate: '2026-11-02',
      category: 'Utilities & Tech'
    },
    {
      id: 'rec_5',
      name: 'Figma Professional Plan',
      merchant: 'Figma Inc.',
      amount: 15.00,
      frequency: 'Monthly',
      nextDate: '2026-10-22',
      category: 'Utilities & Tech'
    }
  ],
  explainer: {
    dataSource: 'Identified by cadence pattern recognition on recurring charge timestamps over the past 90 days.',
    reason: 'Provides full visibility into fixed monthly outflows, highlighting opportunities to cancel unused or duplicate software subscriptions.'
  }
};

export const MOCK_SAVINGS_SUGGESTIONS = [
  {
    id: 'sug_1',
    title: 'Food & Dining Delivery Optimization',
    estimatedMonthlySavings: 85.00,
    category: 'Food & Dining',
    impact: 'High',
    description: 'You had 4 food deliveries with delivery and convenience surcharges totaling $85. Shifting 2 restaurant orders to home-cooked meals per week recovers this expenditure.',
    explainer: {
      dataSource: 'Analyzed food delivery merchant entries in your October transactions.',
      reason: 'Food & Dining has reached 97.6% of its monthly allocation early in the cycle.'
    }
  },
  {
    id: 'sug_2',
    title: 'Transportation Trip Consolidation',
    estimatedMonthlySavings: 40.00,
    category: 'Transportation',
    impact: 'Medium',
    description: 'Transportation is 11.5% ($40.25) over budget. Combining weekend errands into single rideshare routes or using regional rail off-peak fares will eliminate budget overruns.',
    explainer: {
      dataSource: 'Airport rideshare and transit ledger records from September 18 to October 1.',
      reason: 'Transportation is your only category currently flagged as Over Budget.'
    }
  },
  {
    id: 'sug_3',
    title: 'Surplus Cash Yield Optimization',
    estimatedMonthlySavings: 140.00,
    category: 'Investments & Cash',
    impact: 'High',
    description: 'Your checking balance of $54,230.50 exceeds standard 3-month operational reserves ($15,000). Moving $35,000 into a 4.8% APY vault yields ~$140/month in passive risk-free interest.',
    explainer: {
      dataSource: 'Current liquid balance ($54,230.50) compared to average monthly outflow ($3,640.25).',
      reason: 'Over 60% of liquid assets are sitting idle in zero-yield checking.'
    }
  }
];
