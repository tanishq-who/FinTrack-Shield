/**
 * Initial mock budget data for FinTrack Shield
 * Mirrors future backend database models.
 */

export const CURRENT_BUDGET_MONTH = 'October 2026';

export const INITIAL_BUDGETS = [
  {
    id: 'bgt_1',
    category: 'Housing & Rent',
    limit: 1500.00,
    spent: 1500.00,
    month: 'October 2026',
    color: '#0d9488'
  },
  {
    id: 'bgt_2',
    category: 'Food & Dining',
    limit: 800.00,
    spent: 780.50,
    month: 'October 2026',
    color: '#10b981'
  },
  {
    id: 'bgt_3',
    category: 'Utilities & Tech',
    limit: 500.00,
    spent: 480.00,
    month: 'October 2026',
    color: '#3b82f6'
  },
  {
    id: 'bgt_4',
    category: 'Transportation',
    limit: 350.00,
    spent: 390.25, // Overspent!
    month: 'October 2026',
    color: '#f59e0b'
  },
  {
    id: 'bgt_5',
    category: 'Entertainment',
    limit: 300.00,
    spent: 175.00,
    month: 'October 2026',
    color: '#8b5cf6'
  },
  {
    id: 'bgt_6',
    category: 'Healthcare',
    limit: 250.00,
    spent: 110.00,
    month: 'October 2026',
    color: '#ec4899'
  },
  {
    id: 'bgt_7',
    category: 'Shopping',
    limit: 250.00,
    spent: 85.00,
    month: 'October 2026',
    color: '#06b6d4'
  }
];

export const AVAILABLE_BUDGET_CATEGORIES = [
  'Housing & Rent',
  'Food & Dining',
  'Utilities & Tech',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Education',
  'Travel',
  'Other'
];
