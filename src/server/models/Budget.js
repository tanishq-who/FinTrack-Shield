/**
 * FinTrack Shield — Budget Model
 *
 * Sets spending limits per category per month.
 * limit_amount and spent_amount are strictly INTEGER paise.
 * Calculates spent, remaining, percentage used, and overspent status.
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

function formatBudgetWithProgress(row) {
  const limitAmount = row.limit_amount || 0;
  const spentAmount = row.spent || 0;
  const remainingAmount = limitAmount - spentAmount;
  const percentageUsed = limitAmount > 0
    ? Math.round((spentAmount / limitAmount) * 10000) / 100
    : 0;
  const isOverspent = spentAmount > limitAmount;

  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    categoryName: row.category_name || (row.category_id ? 'Custom Category' : 'Total Monthly Budget'),
    categoryIcon: row.category_icon || '🎯',
    categoryColor: row.category_color || '#6366f1',
    month: row.month,
    limitAmount,
    spentAmount,
    remainingAmount,
    percentageUsed,
    isOverspent,
  };
}

const Budget = {
  /**
   * Create or update (upsert) a budget for a category + month.
   * @param {{ userId: string, categoryId?: string, month: string, limitAmount: number }} data
   * @returns {object}
   */
  upsert({ userId, categoryId = null, month, limitAmount }) {
    const db = getDb();
    const id = uuidv4();

    db.prepare(
      `INSERT INTO budgets (id, user_id, category_id, month, limit_amount)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, category_id, month)
       DO UPDATE SET limit_amount = excluded.limit_amount`
    ).run(id, userId, categoryId, month, limitAmount);

    return this.findProgressByMonthAndCategory(userId, month, categoryId);
  },

  /**
   * Find budget with progress by user, month, and categoryId.
   */
  findProgressByMonthAndCategory(userId, month, categoryId) {
    const db = getDb();
    const row = db.prepare(
      `SELECT
         b.id, b.user_id, b.category_id, b.month, b.limit_amount,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         COALESCE(SUM(t.amount), 0) AS spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t
         ON t.user_id = b.user_id
         AND (
           (b.category_id IS NOT NULL AND t.category_id = b.category_id)
           OR (b.category_id IS NULL)
         )
         AND t.type = 'EXPENSE'
         AND strftime('%Y-%m', t.date) = b.month
       WHERE b.user_id = ?
         AND b.month = ?
         AND (b.category_id = ? OR (b.category_id IS NULL AND ? IS NULL))
       GROUP BY b.id`
    ).get(userId, month, categoryId || null, categoryId || null);

    return row ? formatBudgetWithProgress(row) : null;
  },

  /**
   * Find a specific budget by ID (scoped to user).
   * @param {string} id
   * @param {string} userId
   * @returns {object|null}
   */
  findById(id, userId) {
    const db = getDb();
    const row = db.prepare(
      `SELECT
         b.id, b.user_id, b.category_id, b.month, b.limit_amount,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         COALESCE(SUM(t.amount), 0) AS spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t
         ON t.user_id = b.user_id
         AND (
           (b.category_id IS NOT NULL AND t.category_id = b.category_id)
           OR (b.category_id IS NULL)
         )
         AND t.type = 'EXPENSE'
         AND strftime('%Y-%m', t.date) = b.month
       WHERE b.id = ? AND b.user_id = ?
       GROUP BY b.id`
    ).get(id, userId);

    return row ? formatBudgetWithProgress(row) : null;
  },

  /**
   * Get all budgets with spent, remaining, percentage, and overspent for a month.
   * @param {string} userId
   * @param {string} month - YYYY-MM
   * @returns {object[]}
   */
  getBudgetProgress(userId, month) {
    const db = getDb();
    const rows = db.prepare(
      `SELECT
         b.id, b.user_id, b.category_id, b.month, b.limit_amount,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         COALESCE(SUM(t.amount), 0) AS spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t
         ON t.user_id = b.user_id
         AND (
           (b.category_id IS NOT NULL AND t.category_id = b.category_id)
           OR (b.category_id IS NULL)
         )
         AND t.type = 'EXPENSE'
         AND strftime('%Y-%m', t.date) = b.month
       WHERE b.user_id = ? AND b.month = ?
       GROUP BY b.id
       ORDER BY (b.category_id IS NULL) DESC, c.name ASC`
    ).all(userId, month);

    return rows.map(formatBudgetWithProgress);
  },

  /**
   * Update an existing budget by ID (scoped to user).
   * @param {string} id
   * @param {string} userId
   * @param {{ limitAmount: number }} data
   * @returns {object|null}
   */
  update(id, userId, { limitAmount }) {
    const db = getDb();
    const existing = db.prepare(
      'SELECT id FROM budgets WHERE id = ? AND user_id = ?'
    ).get(id, userId);
    if (!existing) return null;

    db.prepare(
      'UPDATE budgets SET limit_amount = ? WHERE id = ? AND user_id = ?'
    ).run(limitAmount, id, userId);

    return this.findById(id, userId);
  },

  /**
   * Delete a budget (scoped to user).
   * @param {string} id
   * @param {string} userId
   * @returns {boolean}
   */
  delete(id, userId) {
    const db = getDb();
    const result = db.prepare(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?'
    ).run(id, userId);
    return result.changes > 0;
  },
};

module.exports = Budget;
