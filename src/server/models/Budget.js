/**
 * FinTrack Shield — Budget Model
 *
 * Budgets set spending limits per category per month.
 * limit_amount is stored as INTEGER paise (never floating-point).
 * Each (user, category, month) combination is unique.
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

const Budget = {
  /**
   * Create or update (upsert) a budget for a category+month.
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

    return db.prepare(
      `SELECT * FROM budgets
       WHERE user_id = ? AND COALESCE(category_id, '') = COALESCE(?, '') AND month = ?`
    ).get(userId, categoryId, month);
  },

  /**
   * Find all budgets for a user in a given month.
   * @param {string} userId
   * @param {string} month - YYYY-MM
   * @returns {object[]}
   */
  findByMonth(userId, month) {
    const db = getDb();
    return db.prepare(
      `SELECT b.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.month = ?
       ORDER BY c.name`
    ).all(userId, month);
  },

  /**
   * Find a specific budget by ID (scoped to user).
   * @param {string} id
   * @param {string} userId
   * @returns {object|undefined}
   */
  findById(id, userId) {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM budgets WHERE id = ? AND user_id = ?'
    ).get(id, userId);
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

  /**
   * Get budget vs actual spending for a user in a month.
   * @param {string} userId
   * @param {string} month - YYYY-MM
   * @returns {object[]} - each row has limit_amount and spent (both paise integers)
   */
  getBudgetProgress(userId, month) {
    const db = getDb();
    return db.prepare(
      `SELECT
         b.id, b.category_id, b.month, b.limit_amount,
         c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
         COALESCE(SUM(t.amount), 0) AS spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t
         ON t.user_id = b.user_id
         AND t.category_id = b.category_id
         AND t.type = 'EXPENSE'
         AND strftime('%Y-%m', t.date) = b.month
       WHERE b.user_id = ? AND b.month = ?
       GROUP BY b.id
       ORDER BY c.name`
    ).all(userId, month);
  },
};

module.exports = Budget;
