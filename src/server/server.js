/**
 * FinTrack Shield — Express Server Entry Point
 *
 * Security middleware stack:
 *   1. Helmet — secure HTTP headers
 *   2. CORS — restricted to allowed origins
 *   3. Rate limiter — abuse & brute-force prevention
 *   4. JSON body parser — with size limit
 *   5. Trust proxy — for correct IP in audit logs
 *
 * Routes:
 *   GET  /api/health      — public health check
 *   POST /api/auth/*      — authentication (register, login, logout, me)
 *
 * The server initializes the SQLite database (node:sqlite) on startup.
 * Graceful shutdown closes the DB connection.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { getDb, closeDb } = require('./db/database');

// ─── Initialize Express ─────────────────────────────────────────────────────────
const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// Helmet: secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// CORS: restrict to allowed origins
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiter: prevent brute-force and abuse
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// Body parser with size limit
app.use(express.json({ limit: '1mb' }));

// ─── Database Initialization ────────────────────────────────────────────────────
getDb(); // Initialize DB and apply schema on startup

// ─── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/health', require('./routes/health'));
app.use('/api/auth',   require('./routes/auth'));

// ─── 404 Handler ────────────────────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// ─── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: config.isDev
      ? err.message
      : 'An internal server error occurred.',
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────────
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(config.port, () => {
    console.log(`
    ╔══════════════════════════════════════════════════╗
    ║   FinTrack Shield API                            ║
    ║   Running on http://localhost:${config.port}             ║
    ║   Environment: ${config.nodeEnv.padEnd(16)}          ║
    ║   Health: http://localhost:${config.port}/api/health     ║
    ╚══════════════════════════════════════════════════╝
    `);
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────────
  function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = { app, server };
