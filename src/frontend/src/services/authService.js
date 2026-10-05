/**
 * FinTrack Shield — Authentication Service
 * Manages user authentication, session storage, and profile state.
 */

import { apiClient } from './apiClient';

export const authService = {
  getToken() {
    return apiClient.getToken();
  },

  getCurrentUser() {
    return apiClient.getUser();
  },

  isAuthenticated() {
    return Boolean(apiClient.getToken());
  },

  /**
   * Log in with email and password
   */
  async login(email, password) {
    const data = await apiClient.post('/auth/login', {
      email: email.trim(),
      password,
    });

    if (data.token) {
      apiClient.setToken(data.token);
    }
    if (data.user) {
      apiClient.setUser(data.user);
    }

    window.dispatchEvent(new CustomEvent('fintrack:auth-change', { detail: { user: data.user } }));
    return data;
  },

  /**
   * Register a new user account
   */
  async register(name, email, password) {
    const data = await apiClient.post('/auth/register', {
      name: name.trim(),
      email: email.trim(),
      password,
    });

    if (data.token) {
      apiClient.setToken(data.token);
    }
    if (data.user) {
      apiClient.setUser(data.user);
    }

    window.dispatchEvent(new CustomEvent('fintrack:auth-change', { detail: { user: data.user } }));
    return data;
  },

  /**
   * Log out of current session
   */
  async logout() {
    try {
      if (this.isAuthenticated()) {
        await apiClient.post('/auth/logout', {});
      }
    } catch (e) {
      // Ignore network errors during logout
      console.warn('Logout network notification failed:', e.message);
    } finally {
      apiClient.clearAuth();
      window.dispatchEvent(new CustomEvent('fintrack:auth-change', { detail: { user: null } }));
    }
  },

  /**
   * Fetch latest profile from /api/auth/me
   */
  async getProfile() {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const data = await apiClient.get('/auth/me');
      if (data && data.user) {
        apiClient.setUser(data.user);
        return data.user;
      }
      return null;
    } catch (err) {
      if (err.status === 401) {
        apiClient.clearAuth();
      }
      throw err;
    }
  },

  /**
   * Update authenticated user's own profile
   */
  async updateProfile({ name, email }) {
    const payload = {};
    if (name !== undefined) payload.name = name.trim();
    if (email !== undefined) payload.email = email.trim();

    const data = await apiClient.put('/auth/me', payload);

    if (data.token) {
      apiClient.setToken(data.token);
    }
    if (data.user) {
      apiClient.setUser(data.user);
    }

    window.dispatchEvent(new CustomEvent('fintrack:auth-change', { detail: { user: data.user } }));
    return data;
  },
};

