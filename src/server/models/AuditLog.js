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

  /**
   * Get exact security metric counts derived directly from audit_log table.
   * - successful login count ('LOGIN_SUCCESS')
   * - failed login count ('LOGIN_FAILED')
   * - authorization-denied count ('AUTHORIZATION_DENIED')
   * - rate-limit event count ('RATE_LIMITED')
   * @returns {{ successfulLogins: number, failedLogins: number, authorizationDenied: number, rateLimited: number }}
   */
  getSecurityMetrics() {
    const db = getDb();
    const successfulLogins = db.prepare(
      "SELECT COUNT(*) AS count FROM audit_log WHERE action = 'LOGIN_SUCCESS'"
    ).get().count;
    const failedLogins = db.prepare(
      "SELECT COUNT(*) AS count FROM audit_log WHERE action = 'LOGIN_FAILED'"
    ).get().count;
    const authorizationDenied = db.prepare(
      "SELECT COUNT(*) AS count FROM audit_log WHERE action = 'AUTHORIZATION_DENIED'"
    ).get().count;
    const rateLimited = db.prepare(
      "SELECT COUNT(*) AS count FROM audit_log WHERE action = 'RATE_LIMITED'"
    ).get().count;

    return {
      successfulLogins,
      failedLogins,
      authorizationDenied,
      rateLimited,
    };
  },

  /**
   * Retrieve recent security-related activity directly from audit_log table.
   * @param {number} limit
   * @returns {object[]}
   */
  getRecentSecurityActivity(limit = 20) {
    const db = getDb();
    const rows = db.prepare(
      `SELECT * FROM audit_log
       WHERE action IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'AUTHORIZATION_DENIED', 'RATE_LIMITED', 'SIGNUP', 'LOGOUT', 'PROFILE_UPDATE')
       ORDER BY timestamp DESC
       LIMIT ?`
    ).all(limit);

    return rows.map((row) => ({
      ...row,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata || '{}') : (row.metadata || {}),
    }));
  },

  /**
   * Compute suspicious activity strictly from real application audit events:
   * - repeated failed logins from the same IP (threshold: >= 2 attempts)
   * - rate-limited requests ('RATE_LIMITED')
   * - authorization failures ('AUTHORIZATION_DENIED')
   * @returns {object}
   */
  getSuspiciousActivity() {
    const db = getDb();

    // 1. Repeated failed logins grouped by IP (threshold: >= 2 attempts)
    const repeatedFailedRows = db.prepare(
      `SELECT ip, COUNT(*) AS count, MIN(timestamp) AS first_seen, MAX(timestamp) AS last_seen
       FROM audit_log
       WHERE action = 'LOGIN_FAILED' AND ip IS NOT NULL AND ip != ''
       GROUP BY ip
       HAVING count >= 2
       ORDER BY count DESC`
    ).all();

    const repeatedFailedLogins = repeatedFailedRows.map((r) => ({
      ip: r.ip,
      count: r.count,
      firstSeen: r.first_seen,
      lastSeen: r.last_seen,
      severity: r.count >= 5 ? 'CRITICAL' : r.count >= 3 ? 'HIGH' : 'MEDIUM',
    }));

    // 2. Rate-limited requests (latest 50 events)
    const rateLimitedRows = db.prepare(
      `SELECT * FROM audit_log
       WHERE action = 'RATE_LIMITED'
       ORDER BY timestamp DESC
       LIMIT 50`
    ).all();

    const rateLimitedRequests = rateLimitedRows.map((r) => ({
      ...r,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : (r.metadata || {}),
    }));

    // 3. Authorization failures (latest 50 events)
    const authFailureRows = db.prepare(
      `SELECT * FROM audit_log
       WHERE action = 'AUTHORIZATION_DENIED'
       ORDER BY timestamp DESC
       LIMIT 50`
    ).all();

    const authorizationFailures = authFailureRows.map((r) => ({
      ...r,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata || '{}') : (r.metadata || {}),
    }));

    const totalSuspiciousIncidents =
      repeatedFailedLogins.length + rateLimitedRequests.length + authorizationFailures.length;

    return {
      repeatedFailedLogins,
      rateLimitedRequests,
      authorizationFailures,
      totalSuspiciousIncidents,
    };
  },

  /**
   * Comprehensive security analysis payload for the admin dashboard.
   * @returns {object}
   */
  getSecurityAnalysis() {
    return {
      metrics: this.getSecurityMetrics(),
      recentActivity: this.getRecentSecurityActivity(25),
      suspiciousActivity: this.getSuspiciousActivity(),
    };
  },
};

module.exports = AuditLog;
