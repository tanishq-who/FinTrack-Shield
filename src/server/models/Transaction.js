/**
 * FinTrack Shield — Transaction Model
 *
 * All amounts are stored as INTEGER paise (1 INR = 100 paise).
 * Transactions are always row-level scoped to the authenticated user.
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

const Transaction = {
  /**
   * Create a new transaction.
   * @param {{ userId: string, type: 'INCOME'|'EXPENSE', title: string, amount: number, categoryId?: string, date: string, notes?: string }} data
   * @returns {object}
   */
  create({ userId, type, title, amount, categoryId = null, date, notes = '' }) {
    const db = getDb();
    const id = uuidv4();
    db.prepare(
      `INSERT INTO transactions (id, user_id, type, title, amount, category_id, date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, userId, type, title, amount, categoryId, date, notes);
    return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  },

  /**
   * Find a single transaction by ID (scoped to user).
   * @param {string} id
   * @param {string} userId
   * @returns {object|undefined}
   */
  findById(id, userId) {
    const db = getDb();
    return db.prepare(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
    ).get(id, userId);
  },

  /**
   * List transactions for a user with optional filters.
   * @param {string} userId
   * @param {{ type?: string, categoryId?: string, startDate?: string, endDate?: string, limit?: number, offset?: number }} filters
   * @returns {object[]}
   */
  findAll(userId, { type, categoryId, startDate, endDate, limit = 50, offset = 0 } = {}) {
    const db = getDb();
    let sql = 'SELECT * FROM transactions WHERE user_id = ?';
    const params = [userId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }
    if (startDate) {
      sql += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  },

  /**
   * Update a transaction (scoped to user).
   * @param {string} id
   * @param {string} userId
   * @param {object} data
   * @returns {object|null}
   */
  update(id, userId, { type, title, amount, categoryId, date, notes }) {
    const db = getDb();
    const existing = db.prepare(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
    ).get(id, userId);
    if (!existing) return null;

    db.prepare(
      `UPDATE transactions SET
         type        = COALESCE(?, type),
         title       = COALESCE(?, title),
         amount      = COALESCE(?, amount),
         category_id = COALESCE(?, category_id),
         date        = COALESCE(?, date),
         notes       = COALESCE(?, notes)
       WHERE id = ? AND user_id = ?`
    ).run(
      type || null, title || null, amount || null,
      categoryId !== undefined ? categoryId : null,
      date || null, notes !== undefined ? notes : null,
      id, userId
    );

    return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  },

  /**
   * Delete a transaction (scoped to user).
   * @param {string} id
   * @param {string} userId
   * @returns {boolean}
   */
  delete(id, userId) {
    const db = getDb();
    const result = db.prepare(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?'
    ).run(id, userId);
    return result.changes > 0;
  },

  /**
   * Get monthly summary for a user (total income/expense per month).
   * @param {string} userId
   * @param {string} month - YYYY-MM
   * @returns {{ total_income: number, total_expense: number }}
   */
  getMonthlySummary(userId, month) {
    const db = getDb();
    const row = db.prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'INCOME'  THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS total_expense
       FROM transactions
       WHERE user_id = ? AND strftime('%Y-%m', date) = ?`
    ).get(userId, month);
    return row;
  },
};

module.exports = Transaction;
