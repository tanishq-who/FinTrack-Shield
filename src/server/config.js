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
      ? path.resolve(__dirname, '..', process.env.DB_PATH)
      : path.join(__dirname, '..', 'data', 'fintrack.db'),
  },

  cors: {
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
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

