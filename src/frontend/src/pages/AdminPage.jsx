import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export const AdminPage = () => {
  const [stats, setStats] = useState(null);
  const [securityAnalysis, setSecurityAnalysis] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('suspicious'); // 'suspicious' | 'recent' | 'audit' | 'users'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, analysisData, logsData, usersData] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/security-analysis'),
        apiClient.get('/admin/audit-logs?limit=50'),
        apiClient.get('/admin/users'),
      ]);
      setStats(statsData);
      setSecurityAnalysis(analysisData);
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
    if (
      action.includes('FAILED') ||
      action.includes('DENIED') ||
      action.includes('UNAUTHORIZED') ||
      action.includes('RATE_LIMITED') ||
      action.includes('DELETE')
    ) {
      return 'badge-danger';
    }
    if (action.includes('SUCCESS') || action.includes('SIGNUP') || action.includes('SEED')) {
      return 'badge-success';
    }
    return 'badge-primary';
  };

  const metrics = securityAnalysis?.metrics || stats?.securityMetrics || {
    successfulLogins: 0,
    failedLogins: 0,
    authorizationDenied: 0,
    rateLimited: 0,
  };

  const suspicious = securityAnalysis?.suspiciousActivity || stats?.suspiciousActivity || {
    repeatedFailedLogins: [],
    rateLimitedRequests: [],
    authorizationFailures: [],
    totalSuspiciousIncidents: 0,
  };

  const recentActivity = securityAnalysis?.recentActivity || stats?.recentSecurityActivity || [];

  return (
    <main className="page-content" id="admin-content">
      {/* 1. Page Header */}
      <section className="page-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h1 className="page-title">Security &amp; Audit Center</h1>
            {suspicious.totalSuspiciousIncidents > 0 ? (
              <span className="badge badge-danger" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                ⚠️ {suspicious.totalSuspiciousIncidents} Suspicious Incident{suspicious.totalSuspiciousIncidents > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="badge badge-income" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                🛡️ Security Posture Normal
              </span>
            )}
          </div>
          <p className="page-description">
            Privileged administrative console: real-time security analysis, threat detection, and immutable audit logs.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadAdminData}
          disabled={loading}
          aria-label="Refresh security audit data"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span>Refresh Analysis</span>
        </button>
      </section>

      {/* 2. Security Metrics Cards (Derived directly from audit_log table) */}
      <section className="stats-grid" aria-label="Security Metrics" style={{ marginBottom: 'var(--space-5)' }}>
        <div className="surface-card stat-card" id="metric-successful-logins">
          <div className="stat-header">
            <span className="stat-title">Successful Logins</span>
            <span className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              🛡️
            </span>
          </div>
          <div className="stat-value">{metrics.successfulLogins}</div>
          <div className="stat-footer text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            Real LOGIN_SUCCESS audit events
          </div>
        </div>

        <div className="surface-card stat-card" id="metric-failed-logins">
          <div className="stat-header">
            <span className="stat-title">Failed Logins</span>
            <span className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              🔑
            </span>
          </div>
          <div className="stat-value">{metrics.failedLogins}</div>
          <div className="stat-footer text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            Real LOGIN_FAILED audit events
          </div>
        </div>

        <div className="surface-card stat-card" id="metric-authz-denied">
          <div className="stat-header">
            <span className="stat-title">Authorization Denied</span>
            <span className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              🚫
            </span>
          </div>
          <div className="stat-value">{metrics.authorizationDenied}</div>
          <div className="stat-footer text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            Real AUTHORIZATION_DENIED events
          </div>
        </div>

        <div className="surface-card stat-card" id="metric-rate-limited">
          <div className="stat-header">
            <span className="stat-title">Rate-Limit Events</span>
            <span className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              ⏱️
            </span>
          </div>
          <div className="stat-value">{metrics.rateLimited}</div>
          <div className="stat-footer text-muted" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            Real RATE_LIMITED throttle records
          </div>
        </div>
      </section>

      {/* 3. System Telemetry Bar */}
      {stats && (
        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-surface-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-5)',
            fontSize: '0.82rem',
            color: 'var(--color-text-dark-muted)',
            alignItems: 'center',
          }}
          aria-label="System Telemetry Overview"
        >
          <span style={{ fontWeight: 600, color: 'var(--color-text-dark)' }}>System Telemetry:</span>
          <span>👥 Registered Users: <strong style={{ color: 'var(--color-text-dark)' }}>{stats.totalUsers}</strong></span>
          <span>•</span>
          <span>💳 Transactions: <strong style={{ color: 'var(--color-text-dark)' }}>{stats.totalTransactions}</strong></span>
          <span>•</span>
          <span>🎯 Active Budgets: <strong style={{ color: 'var(--color-text-dark)' }}>{stats.totalBudgets}</strong></span>
          <span>•</span>
          <span>📜 Total Audit Entries: <strong style={{ color: 'var(--color-text-dark)' }}>{stats.totalAuditEvents}</strong></span>
        </section>
      )}

      {/* 4. Tab Navigation Switcher */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'suspicious' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('suspicious')}
          id="tab-btn-suspicious"
        >
          Suspicious Activity ({suspicious.totalSuspiciousIncidents})
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'recent' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('recent')}
          id="tab-btn-recent"
        >
          Recent Security Activity ({recentActivity.length})
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('audit')}
          id="tab-btn-audit"
        >
          All Audit Trail ({auditLogs.length})
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
          id="tab-btn-users"
        >
          User Registry ({users.length})
        </button>
      </div>

      {/* 5. Content Views */}
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
      ) : activeTab === 'suspicious' ? (
        /* ─── TAB 1: Suspicious Activity (Defined only from real events) ─── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Sub-panel 1: Repeated Failed Logins by IP */}
          <div className="surface-card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-dark)', margin: 0 }}>
                  Repeated Failed Logins by IP Address
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dark-muted)', margin: '4px 0 0 0' }}>
                  Client IPs with 2 or more failed login attempts recorded in the database.
                </p>
              </div>
              <span className={`badge ${suspicious.repeatedFailedLogins.length > 0 ? 'badge-danger' : 'badge-income'}`}>
                {suspicious.repeatedFailedLogins.length} Flagged IP{suspicious.repeatedFailedLogins.length !== 1 ? 's' : ''}
              </span>
            </div>

            {suspicious.repeatedFailedLogins.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-dark-muted)', fontSize: '0.85rem' }}>
                🛡️ No repeated failed logins detected. All IP addresses are within normal single-attempt margins.
              </div>
            ) : (
              <div className="transactions-table-container">
                <table className="transactions-table" aria-label="Repeated Failed Logins by IP">
                  <thead>
                    <tr>
                      <th>Client IP</th>
                      <th>Failed Attempts</th>
                      <th>Severity</th>
                      <th>First Observed</th>
                      <th>Last Observed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspicious.repeatedFailedLogins.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.ip}</td>
                        <td>
                          <span className="badge badge-danger" style={{ fontWeight: 700 }}>
                            {item.count} attempts
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${item.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {item.firstSeen ? item.firstSeen.replace('T', ' ').slice(0, 19) : '—'}
                        </td>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {item.lastSeen ? item.lastSeen.replace('T', ' ').slice(0, 19) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sub-panel 2: Rate-Limited Requests */}
          <div className="surface-card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-dark)', margin: 0 }}>
                  Rate-Limited Requests
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dark-muted)', margin: '4px 0 0 0' }}>
                  Requests throttled by the application rate limiter and recorded in audit logs.
                </p>
              </div>
              <span className={`badge ${suspicious.rateLimitedRequests.length > 0 ? 'badge-danger' : 'badge-income'}`}>
                {suspicious.rateLimitedRequests.length} Event{suspicious.rateLimitedRequests.length !== 1 ? 's' : ''}
              </span>
            </div>

            {suspicious.rateLimitedRequests.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-dark-muted)', fontSize: '0.85rem' }}>
                ✅ No rate-limited requests recorded. Application traffic is within configured limits.
              </div>
            ) : (
              <div className="transactions-table-container">
                <table className="transactions-table" aria-label="Rate Limited Requests">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Client IP</th>
                      <th>Endpoint</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspicious.rateLimitedRequests.map((event) => (
                      <tr key={event.id}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {event.timestamp ? event.timestamp.replace('T', ' ').slice(0, 19) : '—'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{event.ip || '127.0.0.1'}</td>
                        <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>
                          <code>{event.metadata?.endpoint || '/api/auth/login'}</code>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{event.metadata?.method || 'POST'}</td>
                        <td>
                          <span className="badge badge-danger">HTTP 429</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sub-panel 3: Authorization Failures */}
          <div className="surface-card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-dark)', margin: 0 }}>
                  Authorization Failures
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dark-muted)', margin: '4px 0 0 0' }}>
                  Attempts by standard accounts or unauthorized roles to access protected administrative resources.
                </p>
              </div>
              <span className={`badge ${suspicious.authorizationFailures.length > 0 ? 'badge-danger' : 'badge-income'}`}>
                {suspicious.authorizationFailures.length} Rejection{suspicious.authorizationFailures.length !== 1 ? 's' : ''}
              </span>
            </div>

            {suspicious.authorizationFailures.length === 0 ? (
              <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-dark-muted)', fontSize: '0.85rem' }}>
                ✅ No authorization failures recorded. Role-based access control integrity is intact.
              </div>
            ) : (
              <div className="transactions-table-container">
                <table className="transactions-table" aria-label="Authorization Failures">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User ID</th>
                      <th>Client IP</th>
                      <th>Attempted Endpoint</th>
                      <th>User Role</th>
                      <th>Required Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspicious.authorizationFailures.map((event) => (
                      <tr key={event.id}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {event.timestamp ? event.timestamp.replace('T', ' ').slice(0, 19) : '—'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {event.user_id ? event.user_id.slice(0, 8) + '...' : 'Anonymous'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{event.ip || '127.0.0.1'}</td>
                        <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>
                          <code>{event.metadata?.endpoint || '—'}</code>
                        </td>
                        <td>
                          <span className="badge badge-category">{event.metadata?.userRole || 'USER'}</span>
                        </td>
                        <td>
                          <span className="badge badge-danger">
                            {Array.isArray(event.metadata?.requiredRoles)
                              ? event.metadata.requiredRoles.join(', ')
                              : 'ADMIN'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'recent' ? (
        /* ─── TAB 2: Recent Security Activity ─── */
        <div className="surface-card transactions-table-container">
          <table className="transactions-table" aria-label="Recent Security Activity">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Security Action</th>
                <th>User ID</th>
                <th>Client IP</th>
                <th>Audit Context</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No security events logged yet.
                  </td>
                </tr>
              ) : (
                recentActivity.map((log) => (
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
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{log.ip || '127.0.0.1'}</td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <code>{JSON.stringify(log.metadata || {})}</code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'audit' ? (
        /* ─── TAB 3: All Audit Trail ─── */
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
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{log.ip || '127.0.0.1'}</td>
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
        /* ─── TAB 4: User Registry ─── */
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

