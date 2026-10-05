import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'users'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, logsData, usersData] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/audit-logs?limit=50'),
        apiClient.get('/admin/users'),
      ]);
      setStats(statsData);
      setAuditLogs(logsData.logs || []);
      setUsers(usersData.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load administrator data. Admin privileges required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const getActionBadgeClass = (action) => {
    if (action.includes('FAILED') || action.includes('UNAUTHORIZED') || action.includes('DELETE')) {
      return 'badge-danger';
    }
    if (action.includes('SUCCESS') || action.includes('SIGNUP') || action.includes('SEED')) {
      return 'badge-success';
    }
    return 'badge-primary';
  };

  return (
    <main className="page-content" id="admin-content">
      {/* 1. Page Header */}
      <section className="page-header-row">
        <div>
          <h1 className="page-title">Security & Audit Center</h1>
          <p className="page-description">
            Privileged administrative console: telemetry, user registry, and immutable security audit logs.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadAdminData}
          disabled={loading}
          aria-label="Refresh audit logs"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>Refresh Audit</span>
        </button>
      </section>

      {/* 2. Stats Grid */}
      {stats && (
        <section className="stats-grid" aria-label="System Metrics" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="surface-card stat-card">
            <div className="stat-header">
              <span className="stat-title">Registered Users</span>
              <span className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                👥
              </span>
            </div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-footer text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Across USER & ADMIN roles
            </div>
          </div>

          <div className="surface-card stat-card">
            <div className="stat-header">
              <span className="stat-title">Total Transactions</span>
              <span className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                💳
              </span>
            </div>
            <div className="stat-value">{stats.totalTransactions}</div>
            <div className="stat-footer text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Stored with integer paise
            </div>
          </div>

          <div className="surface-card stat-card">
            <div className="stat-header">
              <span className="stat-title">Monthly Budgets</span>
              <span className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                🎯
              </span>
            </div>
            <div className="stat-value">{stats.totalBudgets}</div>
            <div className="stat-footer text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Active spending limits
            </div>
          </div>

          <div className="surface-card stat-card">
            <div className="stat-header">
              <span className="stat-title">Audit Trail Records</span>
              <span className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                🛡️
              </span>
            </div>
            <div className="stat-value">{stats.totalAuditEvents}</div>
            <div className="stat-footer text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Immutable SQLite log entries
            </div>
          </div>
        </section>
      )}

      {/* 3. View Switcher */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Logs ({auditLogs.length})
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
        >
          User Registry ({users.length})
        </button>
      </div>

      {/* 4. Table Views */}
      {loading ? (
        <div className="surface-card" style={{ padding: '2rem' }}>
          <div className="skeleton skeleton-title"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-text" style={{ height: '36px', margin: '12px 0' }}></div>
          ))}
        </div>
      ) : error ? (
        <div className="surface-card state-container" role="alert">
          <div className="state-icon-box state-error-icon">⚠️</div>
          <h3 className="state-title">Access Restricted</h3>
          <p className="state-description">{error}</p>
        </div>
      ) : activeTab === 'audit' ? (
        <div className="surface-card transactions-table-container">
          <table className="transactions-table" aria-label="System Audit Logs">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>User ID</th>
                <th>IP Address</th>
                <th>Context Metadata</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No audit records logged yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 19) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`} style={{ fontSize: '0.75rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      {log.user_id ? log.user_id.slice(0, 8) + '...' : 'System / Anonymous'}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{log.ip || '127.0.0.1'}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <code>{JSON.stringify(log.metadata || {})}</code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="surface-card transactions-table-container">
          <table className="transactions-table" aria-label="Registered Users">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{u.id.slice(0, 8)}...</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' : 'badge-primary'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {u.created_at ? u.created_at.slice(0, 10) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
};
