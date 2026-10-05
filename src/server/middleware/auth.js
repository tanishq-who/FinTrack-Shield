/**
 * FinTrack Shield — Authentication Middleware
 *
 * Verifies JWT tokens and enforces role-based access control (USER / ADMIN).
 * Attaches `req.user` ({ id, email, role }) on success.
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Require a valid JWT in the Authorization header.
 * Format: Authorization: Bearer <token>
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

/**
 * Require the authenticated user to have one of the specified roles.
 * Must be used AFTER requireAuth.
 * @param  {...string} roles - e.g. requireRole('ADMIN')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}

/**
 * Generate a signed JWT for a user.
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string}
 */
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

module.exports = { requireAuth, requireRole, signToken };
