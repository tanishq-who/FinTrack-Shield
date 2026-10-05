import React, { useEffect } from 'react';

export const DeleteConfirmationModal = ({
  isOpen,
  transaction,
  onClose,
  onConfirm,
  deleting = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-dialog delete-dialog surface-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <div className="delete-icon-box" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>

        <h3 id="delete-dialog-title" className="delete-title">
          Confirm Deletion
        </h3>

        <p className="delete-description">
          Are you sure you want to delete <strong>{transaction.title}</strong> for{' '}
          <strong>${transaction.amount.toFixed(2)}</strong>? This action will remove the record from your ledger and cannot be undone.
        </p>

        <div className="modal-actions-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onConfirm(transaction.id)}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};
