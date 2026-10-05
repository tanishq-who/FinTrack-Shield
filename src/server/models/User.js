/**
 * FinTrack Shield — User Model
 *
 * Handles user CRUD, password hashing (bcryptjs, 12 rounds),
 * and secure lookup. Never returns password_hash in safe lookups.
 */

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');

const SALT_ROUNDS = 12;

/** Fields safe to return in API responses */
const SAFE_FIELDS = 'id, name, email, role, created_at';

const User = {
  /**
   * Create a new user with hashed password.
   * @param {{ name: string, email: string, password: string, role?: string }} data
   * @returns {Promise<{ id: string, name: string, email: string, role: string, created_at: string }>}
   */
  async create({ name, email, password, role = 'USER' }) {
    const db = getDb();
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, name, email.toLowerCase().trim(), passwordHash, role);

    return db.prepare(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`).get(id);
  },

  /**
   * Find user by email (includes password_hash for auth verification).
   * @param {string} email
   * @returns {object|undefined}
   */
  findByEmail(email) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  },

  /**
   * Find user by ID (safe — no password_hash).
   * @param {string} id
   * @returns {object|undefined}
   */
  findById(id) {
    const db = getDb();
    return db.prepare(`SELECT ${SAFE_FIELDS} FROM users WHERE id = ?`).get(id);
  },

  /**
   * Verify a plaintext password against a stored hash.
   * @param {string} plaintext
   * @param {string} hash
   * @returns {Promise<boolean>}
   */
  async verifyPassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
  },

  /**
   * List all users (admin only, no password_hash).
   * @returns {object[]}
   */
  findAll() {
    const db = getDb();
    return db.prepare(`SELECT ${SAFE_FIELDS} FROM users ORDER BY created_at DESC`).all();
  },

  /**
   * Check if an email is already registered.
   * @param {string} email
   * @returns {boolean}
   */
  emailExists(email) {
    const db = getDb();
    const row = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email.toLowerCase().trim());
    return !!row;
  },
};

module.exports = User;
