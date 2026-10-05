/**
 * FinTrack Shield — Centralized Server Configuration
 * Sourced securely from environment variables.
 */

const path = require('path');
const fs = require('fs');

// Look for .env in src/ or src/server/ or project root
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '..', '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}

/**
 * Validates critical configuration for security and integrity.
 * In production, server startup must fail clearly if JWT_SECRET is missing or insecure.
 * @param {object} cfg
 */
function validateConfig(cfg = config) {
  if (cfg.nodeEnv === 'production') {
    if (!cfg.jwt || !cfg.jwt.secret || typeof cfg.jwt.secret !== 'string' || cfg.jwt.secret.trim() === '') {
      throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
    }
    if (cfg.jwt.secret.includes('CHANGE_ME') || cfg.jwt.secret.length < 32) {
      throw new Error('FATAL: JWT_SECRET in production must be at least 32 characters and cannot be a default placeholder.');
    }
  }
  return true;
}

/**
 * Normalizes an origin string by trimming, removing quotes, stripping trailing slashes,
 * and converting to lowercase for reliable comparison.
 * @param {string} origin
 * @returns {string}
 */
function normalizeOrigin(origin) {
  if (!origin || typeof origin !== 'string') return '';
  return origin.trim().replace(/^['"]+|['"]+$/g, '').replace(/\/+$/, '').toLowerCase();
}

/**
 * Returns dynamic list of allowed origins from process.env.CORS_ORIGIN and defaults.
 * @returns {string[]}
 */
function getAllowedOrigins() {
  const origins = new Set();

  // Known default development origins and production Vercel frontend
  const defaults = [
    'https://fin-track-shield.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];
  defaults.forEach((d) => {
    const norm = normalizeOrigin(d);
    if (norm) origins.add(norm);
  });

  if (process.env.CORS_ORIGIN) {
    const parts = process.env.CORS_ORIGIN.split(',');
    for (const part of parts) {
      const norm = normalizeOrigin(part);
      if (norm) {
        origins.add(norm);
      }
    }
  }

  return Array.from(origins);
}

/**
 * Validates if an incoming request Origin is permitted by CORS policy.
 * @param {string} incomingOrigin
 * @returns {boolean}
 */
function isOriginAllowed(incomingOrigin) {
  if (!incomingOrigin) return true; // Allow non-browser, server-to-server, health check requests
  const normalized = normalizeOrigin(incomingOrigin);
  const allowed = getAllowedOrigins();
  return allowed.includes(normalized);
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  jwt: {
    get secret() {
      return process.env.JWT_SECRET;
    },
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  db: {
    path: process.env.DB_PATH
      ? (path.isAbsolute(process.env.DB_PATH)
          ? path.normalize(process.env.DB_PATH)
          : path.resolve(__dirname, '..', process.env.DB_PATH))
      : path.join(__dirname, '..', 'data', 'fintrack.db'),
  },

  cors: {
    get origin() {
      return getAllowedOrigins();
    },
    normalizeOrigin,
    getAllowedOrigins,
    isOriginAllowed,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    loginWindowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5,
  },

  validateConfig,
};

module.exports = config;

