import React from 'react';

export const Sidebar = ({
  activeRoute = 'dashboard',
  onNavigate,
  mobileOpen,
  onCloseMobileNav,
  user,
  onLogout,
  onOpenAuth,
  onOpenProfile,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      id: 'budgets',
      label: 'Budgets',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      )
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            id: 'admin',
            label: 'Security Admin',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={onCloseMobileNav}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`} role="navigation" aria-label="Main Navigation">
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-shield-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="brand-text">
            <h1>FinTrack Shield</h1>
            <span>Personal Finance</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  if (onCloseMobileNav) onCloseMobileNav();
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Footer / Profile Area */}
        <div className="sidebar-footer">
          {user ? (
            <>
              <div
                className="user-avatar"
                aria-hidden="true"
                title="Click to view & edit profile"
                onClick={onOpenProfile}
                style={{ cursor: 'pointer' }}
              >
                {(user.name ? user.name.slice(0, 2) : 'FS').toUpperCase()}
              </div>
              <div
                className="user-details"
                style={{ overflow: 'hidden', flex: 1, cursor: 'pointer' }}
                onClick={onOpenProfile}
                title="Click to view & edit profile"
              >
                <span className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                  {user.name || 'FinTrack User'}
                </span>
                <span className="user-role" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', fontSize: '0.72rem' }}>
                  {user.email || user.role}
                </span>
              </div>
              <button
                type="button"
                className="action-icon-btn delete-btn"
                onClick={onLogout}
                title="Sign out of FinTrack Shield"
                aria-label="Sign out"
                style={{ marginLeft: '4px', flexShrink: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onOpenAuth}
            >
              Sign In
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
