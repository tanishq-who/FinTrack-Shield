/**
 * FinTrack Shield — Budgets Routes
 *
 * GET    /api/budgets     — List budgets for a month with calculated spent, remaining, percentage, and overspent
 * POST   /api/budgets     — Create or upsert a monthly budget
 * PUT    /api/budgets/:id — Update a budget's limit
 * DELETE /api/budgets/:id — Delete a budget
 */

const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { requireAuth } = require('../middleware/auth');
const { validateBudget, validateBudgetUpdate } = require('../middleware/validate');
const { getClientIp } = require('../middleware/audit');

// All budget routes require authentication
router.use(requireAuth);

/**
 * GET /api/budgets
 * Query params:
 *   - month: 'YYYY-MM' (defaults to current month)
 */
router.get('/', (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const month = req.query.month || currentMonth;

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Month must be in YYYY-MM format.' });
    }

    const budgets = Budget.getBudgetProgress(req.user.id, month);

    // Calculate overall month summary across all budgets
    const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.limitAmount, 0);
    const totalBudgetSpent = budgets.reduce((acc, b) => acc + b.spentAmount, 0);
    const totalRemaining = totalBudgetLimit - totalBudgetSpent;
    const overallPercentage = totalBudgetLimit > 0
      ? Math.round((totalBudgetSpent / totalBudgetLimit) * 10000) / 100
      : 0;

    res.json({
      month,
      summary: {
        totalBudgetLimit,
        totalBudgetSpent,
        totalRemaining,
        overallPercentage,
        isOverspent: totalBudgetSpent > totalBudgetLimit,
      },
      budgets,
    });
  } catch (err) {
    console.error('List budgets error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve budgets.' });
  }
});

/**
 * POST /api/budgets
 * Creates or updates a budget for a category and month.
 */
router.post('/', validateBudget, (req, res) => {
  try {
    const { categoryId, month, limitAmount } = req.body;
    const ip = getClientIp(req);

    // If categoryId is specified, verify it exists and is accessible
    if (categoryId) {
      const category = Category.findById(categoryId, req.user.id);
      if (!category) {
        return res.status(400).json({ error: 'The specified category does not exist.' });
      }
    }

    const budget = Budget.upsert({
      userId: req.user.id,
      categoryId: categoryId || null,
      month,
      limitAmount,
    });

    AuditLog.log({
      userId: req.user.id,
      action: 'BUDGET_UPDATE',
      metadata: {
        budgetId: budget.id,
        categoryId: budget.categoryId,
        month: budget.month,
        limitAmount: budget.limitAmount,
      },
      ip,
    });

    res.status(201).json({
      message: 'Budget saved successfully.',
      budget,
    });
  } catch (err) {
    console.error('Save budget error:', err.message);
    res.status(500).json({ error: 'Failed to save budget.' });
  }
});

/**
 * PUT /api/budgets/:id
 * Update an existing budget limit.
 */
router.put('/:id', validateBudgetUpdate, (req, res) => {
  try {
    const { id } = req.params;
    const { limitAmount } = req.body;
    const ip = getClientIp(req);

    const updated = Budget.update(id, req.user.id, { limitAmount });
    if (!updated) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    AuditLog.log({
      userId: req.user.id,
      action: 'BUDGET_UPDATE',
      metadata: {
        budgetId: id,
        limitAmount: updated.limitAmount,
      },
      ip,
    });

    res.json({
      message: 'Budget updated successfully.',
      budget: updated,
    });
  } catch (err) {
    console.error('Update budget error:', err.message);
    res.status(500).json({ error: 'Failed to update budget.' });
  }
});

/**
 * DELETE /api/budgets/:id
 * Delete a budget.
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ip = getClientIp(req);

    const deleted = Budget.delete(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    AuditLog.log({
      userId: req.user.id,
      action: 'BUDGET_DELETE',
      metadata: { budgetId: id },
      ip,
    });

    res.json({ message: 'Budget deleted successfully.' });
  } catch (err) {
    console.error('Delete budget error:', err.message);
    res.status(500).json({ error: 'Failed to delete budget.' });
  }
});

module.exports = router;
