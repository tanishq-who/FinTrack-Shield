/**
 * FinTrack Shield — AuditLog Model
 *
 * Immutable append-only audit trail for security-relevant events.
 * Supports: SIGNUP, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT,
 *           UNAUTHORIZED_ACCESS, TRANSACTION_CREATE, BUDGET_UPDATE.
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

const AuditLog = {
  /**
   * Record an audit event.
   * @param {{ userId?: string, action: string, metadata?: object, ip?: string }} data
   * @returns {object}
   */
  log({ userId = null, action, metadata = {}, ip = '' }) {
    const db = getDb();
    const id = uuidv4();
    db.prepare(
      `INSERT INTO audit_log (id, user_id, action, metadata, ip)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, userId, action, JSON.stringify(metadata), ip);
    return db.prepare('SELECT * FROM audit_log WHERE id = ?').get(id);
  },

  /**
   * Query audit logs (admin only).
   * @param {{ userId?: string, action?: string, limit?: number, offset?: number }} filters
   * @returns {object[]}
   */
  query({ userId, action, limit = 100, offset = 0 } = {}) {
    const db = getDb();
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];

    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }
    if (action) {
      sql += ' AND action = ?';
      params.push(action);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(sql).all(...params);
  },

  /**
   * Count audit events by action type.
   * @returns {object[]} - [{ action, count }]
   */
  countByAction() {
    const db = getDb();
    return db.prepare(
      'SELECT action, COUNT(*) AS count FROM audit_log GROUP BY action ORDER BY count DESC'
    ).all();
  },
};

module.exports = AuditLog;
