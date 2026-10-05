/**
 * FinTrack Shield — Shared Constants
 * Shared between client and server layers.
 */

// User roles
const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
};

// Transaction types
const TRANSACTION_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
};

// Currency precision: 1 INR = 100 paise
const PAISE_PER_RUPEE = 100;

/**
 * Converts Rupees to integer Paise (e.g., 250.50 -> 25050)
 * @param {number|string} rupees 
 * @returns {number} integer paise
 */
function rupeesToPaise(rupees) {
  const parsed = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(parsed)) {
    throw new Error('Invalid rupee amount');
  }
  return Math.round(parsed * PAISE_PER_RUPEE);
}

/**
 * Converts integer Paise to Rupees formatted for display (e.g., 25050 -> 250.50)
 * @param {number} paise 
 * @returns {number} rupees float for display
 */
function paiseToRupees(paise) {
  if (!Number.isInteger(paise)) {
    throw new Error('Paise amount must be an integer');
  }
  return paise / PAISE_PER_RUPEE;
}

// Audit log action types
const AUDIT_ACTIONS = {
  SIGNUP: 'SIGNUP',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  TRANSACTION_CREATE: 'TRANSACTION_CREATE',
  TRANSACTION_UPDATE: 'TRANSACTION_UPDATE',
  TRANSACTION_DELETE: 'TRANSACTION_DELETE',
  BUDGET_CREATE: 'BUDGET_CREATE',
  BUDGET_UPDATE: 'BUDGET_UPDATE',
  BUDGET_DELETE: 'BUDGET_DELETE',
  CATEGORY_CREATE: 'CATEGORY_CREATE',
  CATEGORY_UPDATE: 'CATEGORY_UPDATE',
  CATEGORY_DELETE: 'CATEGORY_DELETE',
};

module.exports = {
  ROLES,
  TRANSACTION_TYPES,
  PAISE_PER_RUPEE,
  rupeesToPaise,
  paiseToRupees,
  AUDIT_ACTIONS,
};
