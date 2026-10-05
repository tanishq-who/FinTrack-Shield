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
 *   GET  /api/health       — public health check
 *   POST /api/auth/*       — authentication (register, login, logout, me)
 *   ALL  /api/categories/* — user & default categories
 *   ALL  /api/transactions/* — income & expense tracking with filters
 *   ALL  /api/budgets/*    — monthly budget progress & limits
 *   GET  /api/dashboard/*  — summary metrics & analytics
 *
 * Database: Node 24 native node:sqlite (WAL mode, foreign keys enforced)
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { getDb, closeDb } = require('./db/database');

// ─── Validate Security Configuration ────────────────────────────────────────────
// In production, server startup must fail clearly if JWT_SECRET is missing.
config.validateConfig(config);


// ─── Initialize Express ─────────────────────────────────────────────────────────
const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// Helmet: secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// CORS: dynamic origin validation supporting CORS_ORIGIN env var and production Vercel frontend
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, health check probes)
    if (!origin) {
      return callback(null, true);
    }

    if (config.cors.isOriginAllowed(origin)) {
      // Reflect exact incoming origin to satisfy Access-Control-Allow-Origin with credentials
      return callback(null, origin);
    }

    // Origin not allowed by CORS policy
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiter: prevent brute-force and abuse
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const { getClientIp } = require('./middleware/audit');
    const AuditLog = require('./models/AuditLog');
    const ip = getClientIp(req);
    try {
      AuditLog.log({
        userId: req.user?.id || null,
        action: 'RATE_LIMITED',
        metadata: {
          endpoint: req.originalUrl || req.path,
          method: req.method,
          ip,
          timestamp: new Date().toISOString(),
        },
        ip,
      });
    } catch (logErr) {
      console.error('Failed to log rate limit event:', logErr.message);
    }
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  },
});
app.use('/api/', limiter);

// Body parser with size limit
app.use(express.json({ limit: '1mb' }));

// ─── Database Initialization ────────────────────────────────────────────────────
getDb(); // Initialize DB and apply schema on startup

// ─── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/health',       require('./routes/health'));
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/categories',   require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets',      require('./routes/budgets'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/admin',        require('./routes/admin'));

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
