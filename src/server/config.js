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

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'fintrack_shield_dev_secret_key_change_in_production_2026',
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
  },
};

module.exports = config;
