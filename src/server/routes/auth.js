/**
 * FinTrack Shield — Authentication Routes
 *
 * POST /api/auth/register — Create a new account
 * POST /api/auth/login    — Sign in and receive a JWT
 * POST /api/auth/logout   — Sign out (audit log recorded; client discards token)
 * GET  /api/auth/me       — Get current authenticated user profile
 *
 * Security controls:
 *   - Passwords hashed with bcryptjs (12 rounds)
 *   - Generic error messages on login failure (no email enumeration)
 *   - Audit logging for signup, login, failed login, and logout
 *   - Zero plaintext passwords in logs or responses
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const config = require('../config');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { requireAuth, signToken } = require('../middleware/auth');
const { validateRegister, validateLogin, validateProfileUpdate } = require('../middleware/validate');
const { getClientIp } = require('../middleware/audit');

// Stricter rate limiter specifically for login attempts
const loginLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindowMs,
  max: config.rateLimit.loginMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = getClientIp(req);
    AuditLog.log({
      userId: null,
      action: 'RATE_LIMITED',
      metadata: {
        endpoint: '/api/auth/login',
        method: req.method,
        ip,
        timestamp: new Date().toISOString(),
      },
      ip,
    });
    return res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
    });
  },
});


/**
 * POST /api/auth/register
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const ip = getClientIp(req);

    // Check if email already exists
    if (User.emailExists(email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Create user (password is securely hashed inside User.create)
    const user = await User.create({ name, email, password });

    // Audit log signup
    AuditLog.log({
      userId: user.id,
      action: 'SIGNUP',
      metadata: { email: user.email },
      ip,
    });

    // Generate stateless token
    const token = signToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      user,
      token,
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = getClientIp(req);

    // Find user by email (includes password_hash for verification)
    const user = User.findByEmail(email);

    if (!user) {
      // Generic message — prevents email enumeration
      AuditLog.log({
        userId: null,
        action: 'LOGIN_FAILED',
        metadata: { reason: 'unknown_email', email: email.toLowerCase().trim() },
        ip,
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify password
    const valid = await User.verifyPassword(password, user.password_hash);
    if (!valid) {
      AuditLog.log({
        userId: user.id,
        action: 'LOGIN_FAILED',
        metadata: { reason: 'wrong_password' },
        ip,
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Audit log successful login
    AuditLog.log({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      metadata: { email: user.email },
      ip,
    });

    // Generate token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', requireAuth, (req, res) => {
  const ip = getClientIp(req);

  AuditLog.log({
    userId: req.user.id,
    action: 'LOGOUT',
    metadata: { email: req.user.email },
    ip,
  });

  res.json({ message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, (req, res) => {
  const user = User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({ user });
});

/**
 * PUT /api/auth/me
 * Update authenticated user's own profile (name, email).
 * Strictly user-ownership protected: uses req.user.id from JWT.
 */
router.put('/me', requireAuth, validateProfileUpdate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const ip = getClientIp(req);
    const userId = req.user.id;

    // Check if new email is already taken by someone else
    if (email && User.emailTakenByOther(email, userId)) {
      return res.status(409).json({ error: 'This email is already in use by another account.' });
    }

    const previousProfile = User.findById(userId);
    if (!previousProfile) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updatedUser = User.updateProfile(userId, { name, email });

    // Generate new signed JWT token with updated email/name claims if email changed
    const refreshedToken = signToken({
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    // Record audit log for profile mutation
    AuditLog.log({
      userId,
      action: 'PROFILE_UPDATE',
      metadata: {
        previousEmail: previousProfile.email,
        newEmail: updatedUser.email,
        nameUpdated: name !== undefined && name !== previousProfile.name,
      },
      ip,
    });

    res.json({
      message: 'Profile updated successfully.',
      user: updatedUser,
      token: refreshedToken,
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

router.loginLimiter = loginLimiter;

module.exports = router;


