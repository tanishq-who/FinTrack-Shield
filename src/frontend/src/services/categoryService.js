/**
 * FinTrack Shield — Category Service
 * Loads user and system default categories from backend /api/categories.
 */

import { apiClient } from './apiClient';

let cachedCategories = null;

export const categoryService = {
  /**
   * Get list of categories (system defaults + user custom)
   */
  async getCategories(forceRefresh = false) {
    if (cachedCategories && !forceRefresh) {
      return cachedCategories;
    }

    try {
      const data = await apiClient.get('/categories');
      cachedCategories = data.categories || [];
      return cachedCategories;
    } catch (err) {
      console.warn('Failed to load categories from API, using fallback:', err.message);
      return cachedCategories || [];
    }
  },

  /**
   * Find category by name or return null
   */
  async findByName(name) {
    const list = await this.getCategories();
    return list.find((c) => c.name.toLowerCase() === (name || '').toLowerCase()) || null;
  },

  /**
   * Create custom category
   */
  async createCategory({ name, icon = 'tag', color = '#10b981' }) {
    const data = await apiClient.post('/categories', { name, icon, color });
    if (cachedCategories && data.category) {
      cachedCategories.push(data.category);
    }
    return data.category;
  },
};
