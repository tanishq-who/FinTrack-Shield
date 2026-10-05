import React, { useState } from 'react';
import { authService } from '../../services/authService';

export const AuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (mode === 'register') {
      if (formData.password.length < 8) {
        errs.password = 'Password must be at least 8 characters long.';
      } else if (!/[A-Z]/.test(formData.password)) {
        errs.password = 'Password must contain at least one uppercase letter.';
      } else if (!/[a-z]/.test(formData.password)) {
        errs.password = 'Password must contain at least one lowercase letter.';
      } else if (!/\d/.test(formData.password)) {
        errs.password = 'Password must contain at least one digit.';
      }
    }

    if (mode === 'register') {
      if (!formData.name.trim()) {
        errs.name = 'Full name is required.';
      }
      if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);
    try {
      let result;
      if (mode === 'login') {
        result = await authService.login(formData.email, formData.password);
      } else {
        result = await authService.register(formData.name, formData.email, formData.password);
      }

      if (onAuthSuccess) {
        onAuthSuccess(result.user);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setServerError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDemo = () => {
    setMode('login');
    setFormData({
      name: '',
      email: 'demo@fintrack.local',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    setServerError('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-dialog surface-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        style={{ maxWidth: '440px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-shield-icon" style={{ width: '28px', height: '28px' }} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 id="auth-modal-title" className="modal-title">
              {mode === 'login' ? 'Sign In to FinTrack' : 'Create Protected Account'}
            </h3>
          </div>
          {onClose && (
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close authentication dialog"
            >
              ×
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--color-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: 'var(--space-4)',
          }}
          role="tablist"
        >
          <button
            type="button"
            className={`state-btn ${mode === 'login' ? 'active' : ''}`}
            style={{ flex: 1, textAlign: 'center', padding: '8px' }}
            onClick={() => {
              setMode('login');
              setErrors({});
              setServerError('');
            }}
            role="tab"
            aria-selected={mode === 'login'}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`state-btn ${mode === 'register' ? 'active' : ''}`}
            style={{ flex: 1, textAlign: 'center', padding: '8px' }}
            onClick={() => {
              setMode('register');
              setErrors({});
              setServerError('');
            }}
            role="tab"
            aria-selected={mode === 'register'}
          >
            Register
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="form-error-alert" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">
                Full Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="auth-name"
                type="text"
                className={`input-field ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g. Alex Morgan"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                autoComplete="name"
                disabled={loading}
              />
              {errors.name && <span className="field-error-text">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              Email Address <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="auth-email"
              type="email"
              className={`input-field ${errors.email ? 'input-error' : ''}`}
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
            {errors.email && <span className="field-error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">
              Password <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="auth-password"
              type="password"
              className={`input-field ${errors.password ? 'input-error' : ''}`}
              placeholder="••••••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={loading}
            />
            {errors.password && <span className="field-error-text">{errors.password}</span>}
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-confirm-password">
                Confirm Password <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <span className="field-error-text">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          <div style={{ marginTop: 'var(--space-2)' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              disabled={loading}
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : mode === 'login' ? (
                <span>Sign In Securely</span>
              ) : (
                <span>Create Protected Account</span>
              )}
            </button>
          </div>

          {/* Demo account quick fill button */}
          <div style={{ textAlign: 'center', paddingTop: 'var(--space-2)' }}>
            <button
              type="button"
              className="state-btn"
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={handleUseDemo}
              disabled={loading}
            >
              ⚡ Fill Demo Account (demo@fintrack.local)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
