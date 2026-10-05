/**
 * FinTrack Shield — Admin Routes
 *
 * All endpoints require authentication and 'ADMIN' role.
 *
 * GET /api/admin/users      — List all users (safe fields, no password hashes)
 * GET /api/admin/audit-logs — Query audit logs with pagination and filters
 * GET /api/admin/stats      — Aggregated system telemetry and audit counts
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { getDb } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');

// Enforce authentication & ADMIN role across all admin routes
router.use(requireAuth, requireRole('ADMIN'));

/**
 * GET /api/admin/users
 * Returns list of registered users (safe fields only).
 */
router.get('/users', (req, res) => {
  try {
    const users = User.findAll();
    res.json({ users, count: users.length });
  } catch (err) {
    console.error('Admin list users error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

/**
 * GET /api/admin/audit-logs
 * Query params:
 *   - userId: filter by user UUID
 *   - action: filter by action name (e.g. 'SIGNUP', 'LOGIN_SUCCESS', 'TRANSACTION_CREATE')
 *   - limit: page size (default: 50, max: 200)
 *   - offset: pagination offset (default: 0)
 */
router.get('/audit-logs', (req, res) => {
  try {
    const { userId, action, limit = 50, offset = 0 } = req.query;
    const parsedLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

    const logs = AuditLog.query({
      userId: userId || undefined,
      action: action || undefined,
      limit: parsedLimit,
      offset: parsedOffset,
    });

    res.json({
      logs: logs.map((l) => ({
        ...l,
        metadata: typeof l.metadata === 'string' ? JSON.parse(l.metadata || '{}') : l.metadata,
      })),
      limit: parsedLimit,
      offset: parsedOffset,
    });
  } catch (err) {
    console.error('Admin audit logs error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

/**
 * GET /api/admin/stats
 * Summary statistics for administrative visibility.
 */
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    const txCount = db.prepare('SELECT COUNT(*) AS count FROM transactions').get().count;
    const budgetCount = db.prepare('SELECT COUNT(*) AS count FROM budgets').get().count;
    const auditCount = db.prepare('SELECT COUNT(*) AS count FROM audit_log').get().count;
    const actionCounts = AuditLog.countByAction();

    res.json({
      totalUsers: userCount,
      totalTransactions: txCount,
      totalBudgets: budgetCount,
      totalAuditEvents: auditCount,
      eventsByAction: actionCounts,
    });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve system statistics.' });
  }
});

module.exports = router;
