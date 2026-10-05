/**
 * FinTrack Shield — Real Transaction Service
 * Direct integration with backend /api/transactions with search, filters, pagination,
 * and integer paise currency management.
 */

import { apiClient } from './apiClient';
import { categoryService } from './categoryService';

export const transactionService = {
  /**
   * Fetch transactions with search, filter, and pagination options
   */
  async getTransactions(filters = {}) {
    const params = new URLSearchParams();

    // 1. Text Search
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }

    // 2. Type Filter (income / expense)
    if (filters.type && filters.type !== 'all') {
      params.append('type', filters.type.toUpperCase());
    }

    // 3. Category Filter
    if (filters.category && filters.category !== 'all') {
      // Find category ID by name if category name was passed
      const category = await categoryService.findByName(filters.category);
      if (category) {
        params.append('categoryId', category.id);
      }
    } else if (filters.categoryId) {
      params.append('categoryId', filters.categoryId);
    }

    // 4. Date Range
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }

    // 5. Amount Range
    if (filters.minAmount !== undefined && filters.minAmount !== '') {
      params.append('minAmount', apiClient.toPaise(filters.minAmount));
    }
    if (filters.maxAmount !== undefined && filters.maxAmount !== '') {
      params.append('maxAmount', apiClient.toPaise(filters.maxAmount));
    }

    // 6. Sorting & Pagination
    params.append('sortBy', filters.sortBy || 'date');
    params.append('sortOrder', filters.sortOrder || 'DESC');
    params.append('page', filters.page || 1);
    params.append('limit', filters.limit || 50);

    const data = await apiClient.get(`/transactions?${params.toString()}`);
    const rawList = data.transactions || [];

    // Map backend transaction representation to frontend component schema
    const formatted = rawList.map((tx) => ({
      id: tx.id,
      date: tx.date,
      title: tx.title,
      description: tx.notes || '',
      merchant: tx.title,
      category: tx.category_name || 'Uncategorized',
      categoryId: tx.category_id,
      type: (tx.type || 'expense').toLowerCase(),
      amount: apiClient.fromPaise(tx.amount),
    }));

    // Expose pagination metadata if needed
    formatted.pagination = data.pagination;
    return formatted;
  },

  /**
   * Create a new transaction
   */
  async createTransaction(transactionData) {
    let categoryId = transactionData.categoryId || null;

    // Resolve categoryId from category name if missing
    if (!categoryId && transactionData.category && transactionData.category !== 'all') {
      const cat = await categoryService.findByName(transactionData.category);
      if (cat) {
        categoryId = cat.id;
      }
    }

    const payload = {
      type: (transactionData.type || 'expense').toUpperCase(),
      title: (transactionData.title || transactionData.merchant || 'Untitled Transaction').trim(),
      amount: apiClient.toPaise(transactionData.amount),
      categoryId,
      date: transactionData.date || new Date().toISOString().slice(0, 10),
      notes: (transactionData.description || transactionData.notes || '').trim(),
    };

    const data = await apiClient.post('/transactions', payload);

    // Notify listeners (e.g. dashboard) that transactions changed
    window.dispatchEvent(new CustomEvent('fintrack:transactions-updated'));

    const tx = data.transaction;
    return {
      id: tx.id,
      date: tx.date,
      title: tx.title,
      description: tx.notes || '',
      merchant: tx.title,
      category: tx.category_name || transactionData.category || 'Uncategorized',
      categoryId: tx.category_id,
      type: (tx.type || 'expense').toLowerCase(),
      amount: apiClient.fromPaise(tx.amount),
    };
  },

  /**
   * Update an existing transaction
   */
  async updateTransaction(id, updatedFields) {
    let categoryId = updatedFields.categoryId;

    if (!categoryId && updatedFields.category && updatedFields.category !== 'all') {
      const cat = await categoryService.findByName(updatedFields.category);
      if (cat) {
        categoryId = cat.id;
      }
    }

    const payload = {
      type: updatedFields.type ? updatedFields.type.toUpperCase() : undefined,
      title: updatedFields.title !== undefined ? updatedFields.title.trim() : undefined,
      amount: updatedFields.amount !== undefined ? apiClient.toPaise(updatedFields.amount) : undefined,
      categoryId,
      date: updatedFields.date,
      notes: updatedFields.description !== undefined ? updatedFields.description.trim() : undefined,
    };

    const data = await apiClient.put(`/transactions/${id}`, payload);

    // Notify listeners (e.g. dashboard) that transactions changed
    window.dispatchEvent(new CustomEvent('fintrack:transactions-updated'));

    const tx = data.transaction;
    return {
      id: tx.id,
      date: tx.date,
      title: tx.title,
      description: tx.notes || '',
      merchant: tx.title,
      category: tx.category_name || updatedFields.category || 'Uncategorized',
      categoryId: tx.category_id,
      type: (tx.type || 'expense').toLowerCase(),
      amount: apiClient.fromPaise(tx.amount),
    };
  },

  /**
   * Delete a transaction by ID
   */
  async deleteTransaction(id) {
    const data = await apiClient.delete(`/transactions/${id}`);

    // Notify listeners (e.g. dashboard) that transactions changed
    window.dispatchEvent(new CustomEvent('fintrack:transactions-updated'));
    return data;
  },

  /**
   * Export authenticated user transactions to CSV file
   */
  async exportCsv() {
    const token = apiClient.getToken() || localStorage.getItem('fintrack_auth_token');
    const res = await fetch(`${apiClient.baseUrl}/transactions/export?format=csv`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error('Failed to export transactions.');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

