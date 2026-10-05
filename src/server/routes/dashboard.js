/**
 * FinTrack Shield — Dashboard Routes
 *
 * GET /api/dashboard/summary — Comprehensive financial overview for authenticated user
 */

const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { requireAuth } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(requireAuth);

/**
 * GET /api/dashboard/summary
 * Returns total balance, current month income/expenses, savings rate,
 * category spending breakdown, recent transactions, and monthly trends.
 */
router.get('/summary', (req, res) => {
  try {
    const userId = req.user.id;
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    // 1. All-time balance
    const allTime = Transaction.getAllTimeTotals(userId);

    // 2. Current month summary
    const monthSummary = Transaction.getMonthlySummary(userId, currentMonth);
    const incomeThisMonth = monthSummary.total_income;
    const expensesThisMonth = monthSummary.total_expense;
    const netSavingsThisMonth = incomeThisMonth - expensesThisMonth;

    // Savings rate: percentage of income saved (0 if no income)
    const savingsRate = incomeThisMonth > 0
      ? Math.max(0, Math.round(((incomeThisMonth - expensesThisMonth) / incomeThisMonth) * 10000) / 100)
      : 0;

    // 3. Category spending breakdown for this month
    const categorySpendingRaw = Transaction.getCategorySpending(userId, currentMonth);
    const categorySpending = categorySpendingRaw.map((c) => ({
      categoryId: c.category_id,
      name: c.category_name,
      icon: c.category_icon,
      color: c.category_color,
      totalSpent: c.total_spent,
      percentage: expensesThisMonth > 0
        ? Math.round((c.total_spent / expensesThisMonth) * 10000) / 100
        : 0,
    }));

    // 4. Recent transactions (latest 5)
    const { transactions: recentTransactions } = Transaction.findAll(userId, {
      limit: 5,
      sortBy: 'date',
      sortOrder: 'DESC',
    });

    // 5. Monthly history trend (past 6 months)
    const monthlyComparison = Transaction.getMonthlyHistory(userId, 6);

    res.json({
      period: currentMonth,
      totalBalance: allTime.balance,
      allTimeIncome: allTime.total_income,
      allTimeExpense: allTime.total_expense,
      incomeThisMonth,
      expensesThisMonth,
      netSavingsThisMonth,
      savingsRate,
      categorySpending,
      recentTransactions,
      monthlyComparison,
    });
  } catch (err) {
    console.error('Dashboard summary error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve dashboard summary.' });
  }
});

module.exports = router;
