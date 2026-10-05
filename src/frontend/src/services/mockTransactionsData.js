/**
 * Initial mock transaction records for FinTrack Shield
 * Mirrors future backend database models.
 */

export const INITIAL_TRANSACTIONS = [
  {
    id: 'tx_101',
    date: '2026-10-05',
    title: 'Engineering Payroll Direct Deposit',
    description: 'Bi-weekly tech payroll disbursement',
    merchant: 'Acme Technologies Inc.',
    category: 'Income',
    type: 'income',
    amount: 4900.00
  },
  {
    id: 'tx_102',
    date: '2026-10-04',
    title: 'AWS Cloud Services',
    description: 'Monthly cloud infrastructure and database hosting',
    merchant: 'Amazon Web Services',
    category: 'Utilities & Tech',
    type: 'expense',
    amount: 142.80
  },
  {
    id: 'tx_103',
    date: '2026-10-04',
    title: 'Whole Foods Grocery',
    description: 'Organic groceries and household supplies',
    merchant: 'Whole Foods Market',
    category: 'Food & Dining',
    type: 'expense',
    amount: 114.50
  },
  {
    id: 'tx_104',
    date: '2026-10-03',
    title: 'Apartment Monthly Lease',
    description: 'Monthly primary residence rent payment',
    merchant: 'Skyline Properties Ltd',
    category: 'Housing & Rent',
    type: 'expense',
    amount: 1500.00
  },
  {
    id: 'tx_105',
    date: '2026-10-02',
    title: 'GitHub Enterprise Subscription',
    description: 'Developer workspace seat subscription',
    merchant: 'GitHub Inc.',
    category: 'Utilities & Tech',
    type: 'expense',
    amount: 21.00
  },
  {
    id: 'tx_106',
    date: '2026-10-01',
    title: 'Metro Transit Monthly Pass',
    description: 'Urban public transit card reload',
    merchant: 'Metropolitan Transit',
    category: 'Transportation',
    type: 'expense',
    amount: 45.00
  },
  {
    id: 'tx_107',
    date: '2026-09-30',
    title: 'Security Consulting Audit',
    description: 'Smart contract vulnerability assessment payout',
    merchant: 'CyberSafe Partners',
    category: 'Income',
    type: 'income',
    amount: 1250.00
  },
  {
    id: 'tx_108',
    date: '2026-09-28',
    title: 'Sweetgreen Salad Lunch',
    description: 'Team working lunch',
    merchant: 'Sweetgreen Downtown',
    category: 'Food & Dining',
    type: 'expense',
    amount: 24.50
  },
  {
    id: 'tx_109',
    date: '2026-09-25',
    title: 'City Health Prescription',
    description: 'Annual wellness medication and vitamins',
    merchant: 'City Health Pharmacy',
    category: 'Healthcare',
    type: 'expense',
    amount: 68.20
  },
  {
    id: 'tx_110',
    date: '2026-09-22',
    title: 'Figma Professional Plan',
    description: 'UI/UX design tool team license',
    merchant: 'Figma Inc.',
    category: 'Utilities & Tech',
    type: 'expense',
    amount: 15.00
  },
  {
    id: 'tx_111',
    date: '2026-09-20',
    title: 'Cinema & IMAX Tickets',
    description: 'Weekend movie with family',
    merchant: 'AMC Theatres',
    category: 'Entertainment',
    type: 'expense',
    amount: 38.00
  },
  {
    id: 'tx_112',
    date: '2026-09-18',
    title: 'Uber Airport Ride',
    description: 'Travel to hackathon conference',
    merchant: 'Uber Technologies',
    category: 'Transportation',
    type: 'expense',
    amount: 54.30
  }
];

export const TRANSACTION_CATEGORIES = [
  'Food & Dining',
  'Utilities & Tech',
  'Housing & Rent',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Income',
  'Shopping',
  'Other'
];
