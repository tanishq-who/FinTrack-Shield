/**
 * FinTrack Shield — Health Check Route
 *
 * GET /api/health — Returns server status, uptime, and DB connectivity.
 * Public endpoint for monitoring & deployment verification.
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

router.get('/', (req, res) => {
  let dbOk = false;
  try {
    const db = getDb();
    const row = db.prepare('SELECT 1 AS ok').get();
    dbOk = row && row.ok === 1;
  } catch {
    dbOk = false;
  }

  res.json({
    status: dbOk ? 'healthy' : 'degraded',
    service: 'FinTrack Shield API',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    database: dbOk ? 'connected' : 'error',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
