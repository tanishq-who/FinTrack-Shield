/**
 * FinTrack Shield — Input Validation Middleware
 *
 * Validates request bodies against strict schemas.
 * Returns 400 with specific error messages on failure.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

/**
 * Validate registration input.
 */
function validateRegister(req, res, next) {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters.');
  }
  if (name && name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters.');
  }
  if (!email || !EMAIL_RE.test(email)) {
    errors.push('A valid email address is required.');
  }
  if (!password || !PASSWORD_RE.test(password)) {
    errors.push(
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }
  next();
}

/**
 * Validate login input.
 */
function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !EMAIL_RE.test(email)) {
    errors.push('A valid email address is required.');
  }
  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }
  next();
}

/**
 * Validate transaction input (strictly integer paise).
 */
function validateTransaction(req, res, next) {
  const { type, title, amount, date } = req.body;
  const errors = [];

  if (!type || !['INCOME', 'EXPENSE'].includes(type)) {
    errors.push('Type must be INCOME or EXPENSE.');
  }
  if (!title || typeof title !== 'string' || title.trim().length < 1) {
    errors.push('Title is required.');
  }
  if (amount === undefined || !Number.isInteger(amount) || amount <= 0) {
    errors.push('Amount must be a positive integer in paise (e.g., ₹10.50 = 1050 paise).');
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('Date must be in YYYY-MM-DD format.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }
  next();
}

/**
 * Validate budget input (strictly integer paise).
 */
function validateBudget(req, res, next) {
  const { month, limitAmount } = req.body;
  const errors = [];

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    errors.push('Month must be in YYYY-MM format.');
  }
  if (limitAmount === undefined || !Number.isInteger(limitAmount) || limitAmount <= 0) {
    errors.push('Limit amount must be a positive integer in paise.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateTransaction,
  validateBudget,
};
