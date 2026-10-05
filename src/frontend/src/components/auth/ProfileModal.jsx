import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

export const ProfileModal = ({ isOpen, onClose, user, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
      setErrors({});
      setServerError('');
      setSuccessMessage('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (serverError) {
      setServerError('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      errs.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    } else if (formData.name.trim().length > 100) {
      errs.name = 'Name must not exceed 100 characters.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Check if anything actually changed
    const nameChanged = formData.name.trim() !== (user?.name || '').trim();
    const emailChanged = formData.email.trim().toLowerCase() !== (user?.email || '').trim().toLowerCase();

    if (!nameChanged && !emailChanged) {
      onClose();
      return;
    }

    setLoading(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const res = await authService.updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
      });

      setSuccessMessage('Profile updated successfully.');
      if (onProfileUpdated) {
        onProfileUpdated(res.user);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setServerError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={onClose}
    >
      <div
        className="surface-card modal-card"
        style={{ maxWidth: '440px', width: '100%', margin: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 id="profile-modal-title" className="modal-title">
              Manage Profile
            </h2>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
              Update your account identity and notification email
            </p>
          </div>
          <button
            type="button"
            className="action-icon-btn"
            onClick={onClose}
            aria-label="Close profile modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Server Success or Error Alerts */}
        {successMessage && (
          <div
            role="status"
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: 'var(--space-3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>⚠️</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* User ID (Read-only) */}
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>
              Account UUID (Immutable)
            </label>
            <input
              type="text"
              className="form-input"
              value={user?.id || '—'}
              readOnly
              disabled
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                backgroundColor: 'var(--color-slate-100)',
                color: 'var(--color-text-muted)',
                cursor: 'not-allowed',
              }}
            />
          </div>

          {/* Role (Read-only badge) */}
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>
              Access Role
            </label>
            <div>
              <span
                className={`badge ${user?.role === 'ADMIN' ? 'badge-danger' : 'badge-primary'}`}
                style={{ fontSize: '0.75rem' }}
              >
                {user?.role || 'USER'}
              </span>
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label htmlFor="profile-name" className="form-label">
              Full Name <span style={{ color: 'var(--color-rose-500)' }}>*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g. Alice Sharma"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading}
              autoComplete="name"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label htmlFor="profile-email" className="form-label">
              Email Address <span style={{ color: 'var(--color-rose-500)' }}>*</span>
            </label>
            <input
              id="profile-email"
              type="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-4)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
