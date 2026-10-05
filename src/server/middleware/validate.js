/**
 * FinTrack Shield — Input Validation Middleware
 *
 * Validates request bodies and parameters against strict schemas.
 * Rejects invalid inputs early with 400 Bad Request.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

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
 * Validate Category creation input.
 */
function validateCategory(req, res, next) {
  const { name, icon, color } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    errors.push('Category name is required.');
  }
  if (name && name.trim().length > 50) {
    errors.push('Category name must not exceed 50 characters.');
  }
  if (icon && (typeof icon !== 'string' || icon.trim().length > 10)) {
    errors.push('Icon must be 10 characters or fewer.');
  }
  if (color && !HEX_COLOR_RE.test(color)) {
    errors.push('Color must be a valid hex color code (e.g. #6366f1).');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }
  next();
}

/**
 * Validate Category update input.
 */
function validateCategoryUpdate(req, res, next) {
  const { name, icon, color } = req.body;
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50)) {
    errors.push('Category name must be between 1 and 50 characters.');
  }
  if (icon !== undefined && (typeof icon !== 'string' || icon.trim().length > 10)) {
    errors.push('Icon must be 10 characters or fewer.');
  }
  if (color !== undefined && !HEX_COLOR_RE.test(color)) {
    errors.push('Color must be a valid hex color code (e.g. #6366f1).');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }
  next();
}

/**
 * Validate transaction creation input (strictly integer paise).
 */
function validateTransaction(req, res, next) {
  const { type, title, amount, date, notes } = req.body;
  const errors = [];

  if (!type || !['INCOME', 'EXPENSE'].includes(type)) {
    errors.push('Type must be either INCOME or EXPENSE.');
  }
  if (!title || typeof title !== 'string' || title.trim().length < 1) {
    errors.push('Title is required.');
  }
  if (title && title.trim().length > 100) {
    errors.push('Title must not exceed 100 characters.');
  }
  if (amount === undefined || !Number.isInteger(amount) || amount <= 0) {
    errors.push('Amount must be a positive integer in paise (e.g. ₹10.50 = 1050 paise).');
  }
  if (!date || !DATE_RE.test(date)) {
    errors.push('Date must be in YYYY-MM-DD format.');
  }
  if (notes && (typeof notes !== 'string' || notes.length > 500)) {
    errors.push('Notes must be 500 characters or fewer.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }
  next();
}

/**
 * Validate transaction update input.
 */
function validateTransactionUpdate(req, res, next) {
  const { type, title, amount, date, notes } = req.body;
  const errors = [];

  if (type !== undefined && !['INCOME', 'EXPENSE'].includes(type)) {
    errors.push('Type must be either INCOME or EXPENSE.');
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 1 || title.trim().length > 100)) {
    errors.push('Title must be between 1 and 100 characters.');
  }
  if (amount !== undefined && (!Number.isInteger(amount) || amount <= 0)) {
    errors.push('Amount must be a positive integer in paise.');
  }
  if (date !== undefined && !DATE_RE.test(date)) {
    errors.push('Date must be in YYYY-MM-DD format.');
  }
  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
    errors.push('Notes must be 500 characters or fewer.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }
  next();
}

/**
 * Validate budget creation/upsert input (strictly integer paise).
 */
function validateBudget(req, res, next) {
  const { month, limitAmount } = req.body;
  const errors = [];

  if (!month || !MONTH_RE.test(month)) {
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

/**
 * Validate budget update input.
 */
function validateBudgetUpdate(req, res, next) {
  const { limitAmount } = req.body;
  const errors = [];

  if (limitAmount === undefined || !Number.isInteger(limitAmount) || limitAmount <= 0) {
    errors.push('Limit amount must be a positive integer in paise.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }
  next();
}

/**
 * Validate user profile update input.
 */
function validateProfileUpdate(req, res, next) {
  const { name, email } = req.body;
  const errors = [];

  if (name === undefined && email === undefined) {
    return res.status(400).json({ error: 'At least one field (name or email) must be provided.' });
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters.');
    } else if (name.trim().length > 100) {
      errors.push('Name must not exceed 100 characters.');
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      errors.push('A valid email address is required.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed.', details: errors });
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCategory,
  validateCategoryUpdate,
  validateTransaction,
  validateTransactionUpdate,
  validateBudget,
  validateBudgetUpdate,
  validateProfileUpdate,
};

