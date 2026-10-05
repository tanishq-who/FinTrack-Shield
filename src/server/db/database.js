/**
 * FinTrack Shield — Database Initialization
 *
 * Uses Node 24 native `node:sqlite` (DatabaseSync) for robust, zero-dependency,
 * synchronous SQLite persistence. Zero C++ native compilation required.
 * WAL mode enabled for concurrent reads, foreign keys enforced.
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');
const config = require('../config');

// Ensure data directory exists
const dbDir = path.dirname(config.db.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db;

/**
 * Get or create singleton database connection.
 * @returns {DatabaseSync}
 */
function getDb() {
  if (db) return db;

  db = new DatabaseSync(config.db.path);

  // Security & performance pragmas
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');

  // Apply schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);

  console.log(`✅ SQLite Database initialized via node:sqlite at ${config.db.path}`);
  return db;
}

/**
 * Close database gracefully.
 */
function closeDb() {
  if (db) {
    db.close();
    db = undefined;
    console.log('🔒 Database connection closed.');
  }
}

module.exports = { getDb, closeDb };
