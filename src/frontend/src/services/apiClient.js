/**
 * FinTrack Shield — Frontend API Client
 * Centralized fetch client with JWT authentication, error formatting, and currency conversion.
 */

const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');
const TOKEN_KEY = 'fintrack_token';
const USER_KEY = 'fintrack_user';

export const apiClient = {
  get baseUrl() {
    return API_BASE_URL;
  },

  getBaseUrl() {
    return API_BASE_URL;
  },

  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Storage error:', e);
    }
  },

  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.error('Storage error:', e);
    }
  },

  clearAuth() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Storage error:', e);
    }
  },

  /**
   * Core authenticated request wrapper
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        // If unauthorized, clear invalid session and notify application
        if (token) {
          this.clearAuth();
          window.dispatchEvent(new CustomEvent('fintrack:unauthorized'));
        }
      }

      const contentType = response.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        const errorMessage = (data && data.error) || (data && data.message) || `Request failed with status ${response.status}`;
        const err = new Error(errorMessage);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err;
      }
      throw err;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },

  // ─── Monetary Conversion Helpers ──────────────────────────────────────────
  /**
   * Convert human currency units (Rupees/Dollars) to integer paise/cents.
   * Prevents IEEE 754 floating-point inaccuracies.
   */
  toPaise(amount) {
    if (amount === undefined || amount === null || amount === '') return 0;
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  },

  /**
   * Convert integer paise/cents back to decimal units.
   */
  fromPaise(paise) {
    if (paise === undefined || paise === null) return 0;
    return Number(paise) / 100;
  },

  /**
   * Format decimal currency with 2 decimal places.
   */
  formatAmount(val) {
    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },
};
