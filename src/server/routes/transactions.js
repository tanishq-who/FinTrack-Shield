/**
 * FinTrack Shield — Transactions Routes
 *
 * GET    /api/transactions     — List, filter, search, sort, and paginate user transactions
 * GET    /api/transactions/:id — Get a single transaction by ID (user-scoped)
 * POST   /api/transactions     — Create an income or expense transaction
 * PUT    /api/transactions/:id — Update a transaction (user-scoped)
 * DELETE /api/transactions/:id — Delete a transaction (user-scoped)
 */

const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { requireAuth } = require('../middleware/auth');
const { validateTransaction, validateTransactionUpdate } = require('../middleware/validate');
const { getClientIp } = require('../middleware/audit');

// All transaction routes require authentication
router.use(requireAuth);

/**
 * GET /api/transactions
 * Query filters:
 *   - type: 'INCOME' | 'EXPENSE'
 *   - categoryId: string
 *   - startDate: 'YYYY-MM-DD'
 *   - endDate: 'YYYY-MM-DD'
 *   - minAmount: integer paise
 *   - maxAmount: integer paise
 *   - search: string
 *   - sortBy: 'date' | 'amount' | 'title' | 'created_at' (default: 'date')
 *   - sortOrder: 'ASC' | 'DESC' (default: 'DESC')
 *   - page: integer (default: 1)
 *   - limit: integer (default: 20)
 */
router.get('/', (req, res) => {
  try {
    const {
      type,
      categoryId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const result = Transaction.findAll(req.user.id, {
      type,
      categoryId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    res.json(result);
  } catch (err) {
    console.error('List transactions error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
});

/**
 * GET /api/transactions/export
 * Exports authenticated user's transactions as CSV or JSON.
 * Query params: format ('csv' | 'json', default: 'csv')
 */
router.get('/export', (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const { transactions } = Transaction.findAll(req.user.id, {
      limit: 10000,
      sortBy: 'date',
      sortOrder: 'DESC',
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.json"');
      return res.json({ transactions });
    }

    // Default: CSV format
    const headers = ['ID', 'Date', 'Type', 'Title', 'Amount_INR', 'Category', 'Notes'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      t.type,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      (t.amount / 100).toFixed(2),
      `"${(t.category_name || 'Uncategorized').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fintrack-transactions.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: 'Failed to export transactions.' });
  }
});

/**
 * GET /api/transactions/:id
 * Retrieve a specific transaction. Returns 404 if not found or unauthorized.
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const transaction = Transaction.findById(id, req.user.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }
    res.json({ transaction });
  } catch (err) {
    console.error('Get transaction error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve transaction.' });
  }
});

/**
 * POST /api/transactions
 * Create a new transaction.
 */
router.post('/', validateTransaction, (req, res) => {
  try {
    const { type, title, amount, categoryId, date, notes } = req.body;
    const ip = getClientIp(req);

    // If categoryId is provided, verify it exists and is accessible to user
    if (categoryId) {
      const category = Category.findById(categoryId, req.user.id);
      if (!category) {
        return res.status(400).json({ error: 'The specified category does not exist.' });
      }
    }

    const transaction = Transaction.create({
      userId: req.user.id,
      type,
      title,
      amount,
      categoryId: categoryId || null,
      date,
      notes: notes || '',
    });

    AuditLog.log({
      userId: req.user.id,
      action: 'TRANSACTION_CREATE',
      metadata: {
        transactionId: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        title: transaction.title,
      },
      ip,
    });

    res.status(201).json({
      message: 'Transaction created successfully.',
      transaction,
    });
  } catch (err) {
    console.error('Create transaction error:', err.message);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
});

/**
 * PUT /api/transactions/:id
 * Update a transaction. Returns 404 if not found or unauthorized.
 */
router.put('/:id', validateTransactionUpdate, (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, amount, categoryId, date, notes } = req.body;
    const ip = getClientIp(req);

    // If categoryId is being changed, verify it exists
    if (categoryId) {
      const category = Category.findById(categoryId, req.user.id);
      if (!category) {
        return res.status(400).json({ error: 'The specified category does not exist.' });
      }
    }

    const updated = Transaction.update(id, req.user.id, {
      type,
      title,
      amount,
      categoryId,
      date,
      notes,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    AuditLog.log({
      userId: req.user.id,
      action: 'TRANSACTION_UPDATE',
      metadata: {
        transactionId: id,
        type: updated.type,
        amount: updated.amount,
      },
      ip,
    });

    res.json({
      message: 'Transaction updated successfully.',
      transaction: updated,
    });
  } catch (err) {
    console.error('Update transaction error:', err.message);
    res.status(500).json({ error: 'Failed to update transaction.' });
  }
});

/**
 * DELETE /api/transactions/:id
 * Delete a transaction. Returns 404 if not found or unauthorized.
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ip = getClientIp(req);

    const deleted = Transaction.delete(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    AuditLog.log({
      userId: req.user.id,
      action: 'TRANSACTION_DELETE',
      metadata: { transactionId: id },
      ip,
    });

    res.json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('Delete transaction error:', err.message);
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
});

module.exports = router;
