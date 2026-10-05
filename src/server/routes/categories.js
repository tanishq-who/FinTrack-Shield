/**
 * FinTrack Shield — Categories Routes
 *
 * GET    /api/categories     — List all categories visible to user (defaults + user-custom)
 * POST   /api/categories     — Create a user-custom category
 * PUT    /api/categories/:id — Update a user-custom category (cannot edit default or other users' categories)
 * DELETE /api/categories/:id — Delete a user-custom category (cannot delete default or other users' categories)
 */

const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { requireAuth } = require('../middleware/auth');
const { validateCategory, validateCategoryUpdate } = require('../middleware/validate');
const { getClientIp } = require('../middleware/audit');

// All category routes require authentication
router.use(requireAuth);

/**
 * GET /api/categories
 * Returns list of categories visible to the authenticated user.
 */
router.get('/', (req, res) => {
  try {
    const categories = Category.findAllForUser(req.user.id);
    res.json({ categories });
  } catch (err) {
    console.error('List categories error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

/**
 * POST /api/categories
 * Creates a new custom category for the authenticated user.
 */
router.post('/', validateCategory, (req, res) => {
  try {
    const { name, icon, color } = req.body;
    const ip = getClientIp(req);

    const category = Category.create({
      name,
      icon,
      color,
      userId: req.user.id,
    });

    AuditLog.log({
      userId: req.user.id,
      action: 'CATEGORY_CREATE',
      metadata: { categoryId: category.id, name: category.name },
      ip,
    });

    res.status(201).json({
      message: 'Category created successfully.',
      category,
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    console.error('Create category error:', err.message);
    res.status(500).json({ error: 'Failed to create category.' });
  }
});

/**
 * PUT /api/categories/:id
 * Updates a custom category. Fails if category is system default or belongs to another user.
 */
router.put('/:id', validateCategoryUpdate, (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;
    const ip = getClientIp(req);

    const updated = Category.update(id, req.user.id, { name, icon, color });
    if (!updated) {
      return res.status(404).json({
        error: 'Category not found or cannot be modified (system categories cannot be edited).',
      });
    }

    AuditLog.log({
      userId: req.user.id,
      action: 'CATEGORY_UPDATE',
      metadata: { categoryId: id, name: updated.name },
      ip,
    });

    res.json({
      message: 'Category updated successfully.',
      category: updated,
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A category with this name already exists.' });
    }
    console.error('Update category error:', err.message);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

/**
 * DELETE /api/categories/:id
 * Deletes a custom category. Fails if category is system default or belongs to another user.
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ip = getClientIp(req);

    const deleted = Category.delete(id, req.user.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'Category not found or cannot be deleted (system categories cannot be deleted).',
      });
    }

    AuditLog.log({
      userId: req.user.id,
      action: 'CATEGORY_DELETE',
      metadata: { categoryId: id },
      ip,
    });

    res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

module.exports = router;
