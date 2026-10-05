/**
 * FinTrack Shield — Transaction Model
 *
 * All amounts are stored as INTEGER paise (1 INR = 100 paise).
 * Transactions are strictly row-level scoped to the authenticated user.
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

const ALLOWED_SORT_FIELDS = {
  date: 't.date',
  amount: 't.amount',
  title: 't.title',
  created_at: 't.created_at',
};

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
    ).run(id, userId, type, title.trim(), amount, categoryId, date, notes ? notes.trim() : '');
    return this.findById(id, userId);
  },

  /**
   * Find a single transaction by ID (scoped to user, joined with category).
   * @param {string} id
   * @param {string} userId
   * @returns {object|undefined}
   */
  findById(id, userId) {
    const db = getDb();
    return db.prepare(
      `SELECT t.*,
              c.name AS category_name,
              c.icon AS category_icon,
              c.color AS category_color
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.id = ? AND t.user_id = ?`
    ).get(id, userId);
  },

  /**
   * Search, filter, sort, and paginate transactions for a user.
   * @param {string} userId
   * @param {object} options
   * @returns {{ transactions: object[], pagination: object }}
   */
  findAll(userId, {
    type,
    categoryId,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    search,
    sortBy = 'date',
    sortOrder = 'DESC',
    page = 1,
    limit = 20,
  } = {}) {
    const db = getDb();

    let whereClause = 'WHERE t.user_id = ?';
    const params = [userId];

    if (type && ['INCOME', 'EXPENSE'].includes(type)) {
      whereClause += ' AND t.type = ?';
      params.push(type);
    }
    if (categoryId) {
      whereClause += ' AND t.category_id = ?';
      params.push(categoryId);
    }
    if (startDate) {
      whereClause += ' AND t.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND t.date <= ?';
      params.push(endDate);
    }
    if (minAmount !== undefined && minAmount !== null && !isNaN(minAmount)) {
      whereClause += ' AND t.amount >= ?';
      params.push(parseInt(minAmount, 10));
    }
    if (maxAmount !== undefined && maxAmount !== null && !isNaN(maxAmount)) {
      whereClause += ' AND t.amount <= ?';
      params.push(parseInt(maxAmount, 10));
    }
    if (search && search.trim().length > 0) {
      whereClause += ' AND (t.title LIKE ? OR t.notes LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    // Total matching records count
    const countSql = `SELECT COUNT(*) AS total FROM transactions t ${whereClause}`;
    const totalRow = db.prepare(countSql).get(...params);
    const total = totalRow ? totalRow.total : 0;

    // Sorting
    const sortCol = ALLOWED_SORT_FIELDS[sortBy] || 't.date';
    const sortDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
      SELECT t.*,
             c.name AS category_name,
             c.icon AS category_icon,
             c.color AS category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDir}, t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, limitNum, offset];
    const transactions = db.prepare(dataSql).all(...dataParams);

    return {
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
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
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?'
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
      type || null,
      title !== undefined ? title.trim() : null,
      amount || null,
      categoryId !== undefined ? categoryId : null,
      date || null,
      notes !== undefined ? notes.trim() : null,
      id,
      userId
    );

    return this.findById(id, userId);
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
    return db.prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'INCOME'  THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS total_expense
       FROM transactions
       WHERE user_id = ? AND strftime('%Y-%m', date) = ?`
    ).get(userId, month);
  },

  /**
   * Get all-time balance for a user.
   * @param {string} userId
   * @returns {{ total_income: number, total_expense: number, balance: number }}
   */
  getAllTimeTotals(userId) {
    const db = getDb();
    const row = db.prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'INCOME'  THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS total_expense
       FROM transactions
       WHERE user_id = ?`
    ).get(userId);

    const totalIncome = row ? row.total_income : 0;
    const totalExpense = row ? row.total_expense : 0;
    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense,
    };
  },

  /**
   * Get category-wise spending breakdown for a user in a given month.
   * @param {string} userId
   * @param {string} month - YYYY-MM
   * @returns {object[]}
   */
  getCategorySpending(userId, month) {
    const db = getDb();
    return db.prepare(
      `SELECT
         COALESCE(c.id, 'uncategorized') AS category_id,
         COALESCE(c.name, 'Uncategorized') AS category_name,
         COALESCE(c.icon, '📁') AS category_icon,
         COALESCE(c.color, '#64748b') AS category_color,
         SUM(t.amount) AS total_spent
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ?
         AND t.type = 'EXPENSE'
         AND strftime('%Y-%m', t.date) = ?
       GROUP BY t.category_id
       ORDER BY total_spent DESC`
    ).all(userId, month);
  },

  /**
   * Get monthly comparison for the last N months.
   * @param {string} userId
   * @param {number} monthsCount
   * @returns {object[]}
   */
  getMonthlyHistory(userId, monthsCount = 6) {
    const db = getDb();
    return db.prepare(
      `SELECT
         strftime('%Y-%m', date) AS month,
         COALESCE(SUM(CASE WHEN type = 'INCOME'  THEN amount ELSE 0 END), 0) AS income,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS expense
       FROM transactions
       WHERE user_id = ?
       GROUP BY strftime('%Y-%m', date)
       ORDER BY month DESC
       LIMIT ?`
    ).all(userId, monthsCount).reverse();
  },
};

module.exports = Transaction;
