import { INITIAL_TRANSACTIONS } from './mockTransactionsData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const USE_MOCK = true; // Easily flip to false once backend teammate connects endpoints

// In-memory persistent store during session
let inMemoryTransactions = [...INITIAL_TRANSACTIONS];

/**
 * Service to manage transaction ledger data.
 * Keeps data access strictly decoupled from React components.
 */
export const transactionService = {
  /**
   * Fetch transactions with optional client or server-side filtering
   */
  async getTransactions(filters = {}) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          let result = [...inMemoryTransactions];

          // 1. Text Search Filter (Title, Description, Merchant)
          if (filters.search && filters.search.trim()) {
            const query = filters.search.toLowerCase().trim();
            result = result.filter(
              (tx) =>
                (tx.title && tx.title.toLowerCase().includes(query)) ||
                (tx.description && tx.description.toLowerCase().includes(query)) ||
                (tx.merchant && tx.merchant.toLowerCase().includes(query))
            );
          }

          // 2. Type Filter (all / income / expense)
          if (filters.type && filters.type !== 'all') {
            result = result.filter((tx) => tx.type === filters.type);
          }

          // 3. Category Filter
          if (filters.category && filters.category !== 'all') {
            result = result.filter((tx) => tx.category === filters.category);
          }

          // 4. Date Range Filter
          if (filters.startDate) {
            result = result.filter((tx) => tx.date >= filters.startDate);
          }
          if (filters.endDate) {
            result = result.filter((tx) => tx.date <= filters.endDate);
          }

          // Default sort: newest date first
          result.sort((a, b) => new Date(b.date) - new Date(a.date));

          resolve(result);
        }, 120);
      });
    }

    // Live API integration
    const params = new URLSearchParams();
    if (filters.search) params.append('q', filters.search);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const res = await fetch(`${API_BASE_URL}/transactions?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.statusText}`);
    return res.json();
  },

  /**
   * Create a new transaction
   */
  async createTransaction(transactionData) {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newTx = {
            ...transactionData,
            id: `tx_${Date.now()}`,
            amount: parseFloat(transactionData.amount)
          };
          inMemoryTransactions = [newTx, ...inMemoryTransactions];
          resolve(newTx);
        }, 150);
      });
    }

    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData)
    });
    if (!res.ok) throw new Error(`Failed to create transaction: ${res.statusText}`);
    return res.json();
  },

  /**
   * Update an existing transaction
   */
  async updateTransaction(id, updatedFields) {
    if (USE_MOCK) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const index = inMemoryTransactions.findIndex((tx) => tx.id === id);
          if (index === -1) {
            return reject(new Error('Transaction not found'));
          }
          const updated = {
            ...inMemoryTransactions[index],
            ...updatedFields,
            amount: parseFloat(updatedFields.amount)
          };
          inMemoryTransactions[index] = updated;
          resolve(updated);
        }, 150);
      });
    }

    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });
    if (!res.ok) throw new Error(`Failed to update transaction: ${res.statusText}`);
    return res.json();
  },

  /**
   * Delete a transaction by ID
   */
  async deleteTransaction(id) {
    if (USE_MOCK) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const index = inMemoryTransactions.findIndex((tx) => tx.id === id);
          if (index === -1) {
            return reject(new Error('Transaction not found'));
          }
          const [removed] = inMemoryTransactions.splice(index, 1);
          resolve(removed);
        }, 150);
      });
    }

    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Failed to delete transaction: ${res.statusText}`);
    return res.json();
  }
};
