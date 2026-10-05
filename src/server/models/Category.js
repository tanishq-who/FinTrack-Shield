/**
 * FinTrack Shield — Category Model
 *
 * Manages default (system) categories and user-custom categories.
 * Default categories have user_id = NULL and are visible to all users.
 * Custom categories are owned by a specific user.
 */

const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');

const Category = {
  /**
   * Get all categories visible to a user (defaults + user's own).
   * @param {string} userId
   * @returns {object[]}
   */
  findAllForUser(userId) {
    const db = getDb();
    return db.prepare(
      `SELECT id, name, icon, color, user_id, (user_id IS NULL) AS is_default
       FROM categories
       WHERE user_id IS NULL OR user_id = ?
       ORDER BY (user_id IS NULL) DESC, name ASC`
    ).all(userId);
  },

  /**
   * Find a single category by ID (accessible if default or owned by user).
   * @param {string} id
   * @param {string} userId
   * @returns {object|undefined}
   */
  findById(id, userId) {
    const db = getDb();
    return db.prepare(
      `SELECT id, name, icon, color, user_id, (user_id IS NULL) AS is_default
       FROM categories
       WHERE id = ? AND (user_id IS NULL OR user_id = ?)`
    ).get(id, userId);
  },

  /**
   * Create a user-custom category.
   * @param {{ name: string, icon?: string, color?: string, userId: string }} data
   * @returns {object}
   */
  create({ name, icon = '📁', color = '#6366f1', userId }) {
    const db = getDb();
    const id = uuidv4();
    db.prepare(
      `INSERT INTO categories (id, name, icon, color, user_id)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, name.trim(), icon.trim(), color.trim(), userId);
    return this.findById(id, userId);
  },

  /**
   * Update a user-owned category (cannot update default categories).
   * @param {string} id
   * @param {string} userId
   * @param {{ name?: string, icon?: string, color?: string }} data
   * @returns {object|null}
   */
  update(id, userId, { name, icon, color }) {
    const db = getDb();
    // Verify it exists and is owned by this user
    const existing = db.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).get(id, userId);
    if (!existing) return null;

    db.prepare(
      `UPDATE categories SET
         name  = COALESCE(?, name),
         icon  = COALESCE(?, icon),
         color = COALESCE(?, color)
       WHERE id = ? AND user_id = ?`
    ).run(
      name !== undefined ? name.trim() : null,
      icon !== undefined ? icon.trim() : null,
      color !== undefined ? color.trim() : null,
      id,
      userId
    );

    return this.findById(id, userId);
  },

  /**
   * Delete a user-owned category (cannot delete default categories).
   * @param {string} id
   * @param {string} userId
   * @returns {boolean}
   */
  delete(id, userId) {
    const db = getDb();
    const result = db.prepare(
      'DELETE FROM categories WHERE id = ? AND user_id = ?'
    ).run(id, userId);
    return result.changes > 0;
  },
};

module.exports = Category;
