/**
 * Mock Data for FinTrack Shield Dashboard
 * Structured to mirror the future backend REST API payload contracts.
 */

export const mockSummary = {
  totalBalance: 54230.50,
  monthlyIncome: 9800.00,
  monthlyExpenses: 3640.25,
  savingsRate: 62.86,
  currency: 'USD',
  trends: {
    balanceDelta: 8.4,      // % vs last month
    incomeDelta: 5.2,       // % vs last month
    expenseDelta: -3.8,     // % vs last month (spending down is positive)
    savingsRateDelta: 3.1
  }
};

export const mockIncomeVsExpense = [
  { month: 'May', income: 8400, expense: 3900 },
  { month: 'Jun', income: 8900, expense: 4100 },
  { month: 'Jul', income: 9200, expense: 3750 },
  { month: 'Aug', income: 9100, expense: 4300 },
  { month: 'Sep', income: 9600, expense: 3820 },
  { month: 'Oct', income: 9800, expense: 3640 }
];

export const mockCategorySpending = [
  { id: 'cat_1', category: 'Housing & Rent', amount: 1500.00, percentage: 41.2, color: '#0d9488' },
  { id: 'cat_2', category: 'Food & Dining', amount: 780.50, percentage: 21.4, color: '#10b981' },
  { id: 'cat_3', category: 'Utilities & Tech', amount: 480.00, percentage: 13.2, color: '#3b82f6' },
  { id: 'cat_4', category: 'Transportation', amount: 390.25, percentage: 10.7, color: '#f59e0b' },
  { id: 'cat_5', category: 'Entertainment', amount: 290.50, percentage: 8.0, color: '#8b5cf6' },
  { id: 'cat_6', category: 'Healthcare', amount: 199.00, percentage: 5.5, color: '#ec4899' }
];

export const mockRecentTransactions = [
  {
    id: 'tx_101',
    date: '2026-10-05',
    description: 'Direct Deposit - Engineering Payroll',
    merchant: 'Acme Technologies Inc.',
    category: 'Income',
    type: 'income',
    amount: 4900.00
  },
  {
    id: 'tx_102',
    date: '2026-10-04',
    description: 'Amazon Web Services Cloud Infrastructure',
    merchant: 'AWS Cloud Services',
    category: 'Utilities & Tech',
    type: 'expense',
    amount: 142.80
  },
  {
    id: 'tx_103',
    date: '2026-10-04',
    description: 'Whole Foods Market Grocery',
    merchant: 'Whole Foods Market',
    category: 'Food & Dining',
    type: 'expense',
    amount: 114.50
  },
  {
    id: 'tx_104',
    date: '2026-10-03',
    description: 'Apartment Monthly Lease Payment',
    merchant: 'Skyline Properties Ltd',
    category: 'Housing & Rent',
    type: 'expense',
    amount: 1500.00
  },
  {
    id: 'tx_105',
    date: '2026-10-02',
    description: 'GitHub Enterprise Subscription',
    merchant: 'GitHub Inc.',
    category: 'Utilities & Tech',
    type: 'expense',
    amount: 21.00
  },
  {
    id: 'tx_106',
    date: '2026-10-01',
    description: 'Blue Line Metro Transit Card',
    merchant: 'Metropolitan Transit',
    category: 'Transportation',
    type: 'expense',
    amount: 45.00
  },
  {
    id: 'tx_107',
    date: '2026-09-30',
    description: 'Freelance Security Consulting Audit',
    merchant: 'CyberSafe Partners',
    category: 'Income',
    type: 'income',
    amount: 1250.00
  }
];
