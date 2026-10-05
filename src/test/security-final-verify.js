/**
 * FinTrack Shield — Final Security Verification Test Suite
 *
 * Grounded strictly in real HTTP API calls and the persistent SQLite database.
 * Verifies all 7 security requirements:
 * 1. IDOR (Cross-user read, update, delete, export isolation)
 * 2. SQL Injection Prevention (parameterized queries across login, search, filters, CRUD)
 * 3. XSS Safety (payload handling, database persistence, safe React text encoding)
 * 4. Login Rate Limiting & Real Audit Logging (HTTP 429 + RATE_LIMITED event)
 * 5. Export Data Scoping (CSV & JSON scoped strictly to authenticated user)
 * 6. Role-Based Access Control (RBAC 403 on USER, 200 on ADMIN)
 * 7. Security Analysis Dashboard (100% derived from real audit_log database records)
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = './data/test_security_verify.db';
process.env.JWT_SECRET = 'super_secure_verification_secret_key_at_least_32_characters_2026';

const http = require('http');
const path = require('path');
const fs = require('fs');

// Ensure fresh test database for clean verification
const testDbPath = path.resolve(__dirname, '..', 'data', 'test_security_verify.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const { getDb, closeDb } = require('../server/db/database');
const { app } = require('../server/server');
const User = require('../server/models/User');
const Category = require('../server/models/Category');
const Transaction = require('../server/models/Transaction');
const Budget = require('../server/models/Budget');
const AuditLog = require('../server/models/AuditLog');
const { signToken } = require('../server/middleware/auth');

let passedAssertions = 0;
let failedAssertions = 0;
const resultsByCheck = {
  check1_idor: { name: 'IDOR Cross-User Isolation', passed: true, details: [] },
  check2_sqli: { name: 'SQL Injection Prevention', passed: true, details: [] },
  check3_xss: { name: 'XSS Payload & Rendering Safety', passed: true, details: [] },
  check4_rate_limit: { name: 'Login Rate Limiting & Audit Logging', passed: true, details: [] },
  check5_export: { name: 'Scoped CSV/JSON Export', passed: true, details: [] },
  check6_rbac: { name: 'Role-Based Access Control (RBAC)', passed: true, details: [] },
  check7_dashboard: { name: 'Security Dashboard Real-Data Provenance', passed: true, details: [] },
};

function verify(checkKey, condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: [${checkKey}] ${message}`);
    failedAssertions++;
    resultsByCheck[checkKey].passed = false;
    resultsByCheck[checkKey].details.push(`FAILED: ${message}`);
    throw new Error(`[${checkKey}] ${message}`);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passedAssertions++;
    resultsByCheck[checkKey].details.push(`PASSED: ${message}`);
  }
}

async function runSecurityVerification() {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║   FinTrack Shield — Real API & Database Security Audit      ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n');

  const db = getDb();
  verify('check1_idor', db !== null, 'Real SQLite database initialized');

  // Start real Express server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`Live HTTP Test Server listening at http://127.0.0.1:${port}\n`);

  // Setup test accounts: User A (Attacker/Auditor), User B (Victim), and Admin
  const userA = await User.create({
    name: 'Auditor Alice',
    email: `alice_${Date.now()}@fintrack.shield`,
    password: 'AliceStrongPassword123!',
    role: 'USER',
  });
  const tokenA = signToken(userA);

  const userB = await User.create({
    name: 'Victim Bob',
    email: `bob_${Date.now()}@fintrack.shield`,
    password: 'BobStrongPassword456!',
    role: 'USER',
  });
  const tokenB = signToken(userB);

  const admin = await User.create({
    name: 'Chief Security Officer',
    email: `cso_${Date.now()}@fintrack.shield`,
    password: 'CSOSuperSecurePassword@2026!',
    role: 'ADMIN',
  });
  const tokenAdmin = signToken(admin);

  // User B creates financial assets: transaction and budget
  const catB = Category.create({ name: 'Bob Secret Vault', icon: '🔒', color: '#dc2626', userId: userB.id });
  const txB = Transaction.create({
    userId: userB.id,
    categoryId: catB.id,
    type: 'EXPENSE',
    amount: 500000, // ₹5000.00 in paise
    date: '2026-10-05',
    title: 'Bob Confidential Asset Purchase',
    notes: 'Highly classified personal transaction notes',
  });
  const budgetB = Budget.upsert({
    userId: userB.id,
    categoryId: catB.id,
    month: '2026-10',
    limitAmount: 1000000, // ₹10000.00
  });

  // User A also creates an ordinary transaction
  const catA = Category.create({ name: 'Alice Groceries', icon: '🛒', color: '#10b981', userId: userA.id });
  const txA = Transaction.create({
    userId: userA.id,
    categoryId: catA.id,
    type: 'EXPENSE',
    amount: 150000, // ₹1500.00
    date: '2026-10-05',
    title: 'Alice Organic Market',
    notes: 'Standard personal grocery shopping',
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // CHECK 1: IDOR (Insecure Direct Object Reference) Protection
  // ═════════════════════════════════════════════════════════════════════════════
  console.log('\n[CHECK 1] IDOR: Cross-User Read, Edit, Delete, Export & Profile Access');

  // 1.1 Read User B's transaction
  const getOtherTx = await fetch(`${baseUrl}/transactions/${txB.id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  verify('check1_idor', getOtherTx.status === 404, 'User A cannot read User B transaction by ID (HTTP 404)');

  // 1.2 Edit User B's transaction
  const updateOtherTx = await fetch(`${baseUrl}/transactions/${txB.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ title: 'Hacked by Alice', amount: 100 }),
  });
  verify('check1_idor', updateOtherTx.status === 404, 'User A cannot edit User B transaction by ID (HTTP 404)');

  // 1.3 Delete User B's transaction
  const deleteOtherTx = await fetch(`${baseUrl}/transactions/${txB.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  verify('check1_idor', deleteOtherTx.status === 404, 'User A cannot delete User B transaction by ID (HTTP 404)');

  // 1.4 Read User B's budget
  const getOtherBudget = await fetch(`${baseUrl}/budgets/${budgetB.id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  verify('check1_idor', getOtherBudget.status === 404, 'User A cannot read User B budget by ID (HTTP 404)');

  // 1.5 Edit User B's budget
  const updateOtherBudget = await fetch(`${baseUrl}/budgets/${budgetB.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ limitAmount: 100 }),
  });
  verify('check1_idor', updateOtherBudget.status === 404, 'User A cannot edit User B budget by ID (HTTP 404)');

  // 1.6 Delete User B's budget
  const deleteOtherBudget = await fetch(`${baseUrl}/budgets/${budgetB.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  verify('check1_idor', deleteOtherBudget.status === 404, 'User A cannot delete User B budget by ID (HTTP 404)');

  // 1.7 Confirm User B assets in DB are completely untouched
  const verifiedTxB = Transaction.findById(txB.id, userB.id);
  verify('check1_idor', verifiedTxB.title === 'Bob Confidential Asset Purchase', 'User B transaction data remains intact');
  const verifiedBudgetB = Budget.findById(budgetB.id, userB.id);
  verify('check1_idor', verifiedBudgetB.limitAmount === 1000000, 'User B budget limit remains intact');

  // ═════════════════════════════════════════════════════════════════════════════
  // CHECK 2: SQL Injection Prevention (Parameterized Queries)
  // ═════════════════════════════════════════════════════════════════════════════
  console.log('\n[CHECK 2] SQL Injection: Login, Search, Filters, and Transaction Fields');

  // 2.1 SQLi in login email
  const sqliLoginPayloads = [
    "' OR '1'='1",
    "admin' --",
    "' UNION SELECT 1, 'admin@fintrack.shield', 'dummy', 'ADMIN', '2026-10-05' --",
  ];
  for (const payload of sqliLoginPayloads) {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload, password: 'arbitrary_password' }),
    });
    verify('check2_sqli', res.status === 401 || res.status === 400, `SQL injection in login payload "${payload}" safely rejected`);
  }

  // 2.2 SQLi in transaction search parameter
  const searchSqliRes = await fetch(`${baseUrl}/transactions?search=${encodeURIComponent("' OR 1=1 --")}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  verify('check2_sqli', searchSqliRes.status === 200, 'Search endpoint with SQLi payload returns HTTP 200 without crashing');
  const searchSqliData = await searchSqliRes.json();
  // Must NOT leak User B's transactions or bypass user isolation
  const searchContainsBob = searchSqliData.transactions.some((t) => t.id === txB.id);
  verify('check2_sqli', !searchContainsBob, 'SQL injection in search DOES NOT bypass WHERE user_id isolation');

  // 2.3 SQLi in transaction filter parameters (type, minAmount, sort)
  const filterSqliRes = await fetch(`${baseUrl}/transactions?type=${encodeURIComponent("EXPENSE' OR '1'='1")}&minAmount=0`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  verify('check2_sqli', filterSqliRes.status === 200, 'Filter endpoint with SQLi string returns HTTP 200 without syntax error');
  const filterData = await filterSqliRes.json();
  const filterContainsBob = filterData.transactions.some((t) => t.id === txB.id);
  verify('check2_sqli', !filterContainsBob, 'Filter SQL injection DOES NOT leak cross-user rows');

  // 2.4 SQLi in transaction creation payload (stored SQLi)
  const sqliTxRes = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      categoryId: catA.id,
      type: 'EXPENSE',
      amount: 10000,
      date: '2026-10-05',
      title: "SQLi Probe '; DROP TABLE transactions; --",
      notes: "Notes with ' OR '1'='1' UNION SELECT * FROM users --",
    }),
  });
  verify('check2_sqli', sqliTxRes.status === 201, 'Transaction with SQL statements created safely as literal strings');
  // Confirm transactions table was NOT dropped
  const tableCheck = db.prepare("SELECT count(*) as count FROM transactions").get();
  verify('check2_sqli', tableCheck.count > 0, 'Transactions table remains intact (DROP TABLE attack prevented)');

  // ═════════════════════════════════════════════════════════════════════════════
  // CHECK 3: XSS (Cross-Site Scripting) Payload & Rendering Safety
  // ═════════════════════════════════════════════════════════════════════════════
  console.log('\n[CHECK 3] XSS: Safe Payload Storage & React Auto-Encoding');

  const xssPayloads = {
    title: "<script>alert('XSS-TITLE')</script>",
    notes: "<img src=x onerror=alert('XSS-NOTE')>",
    category: "<svg onload=alert('XSS-CAT')>",
    profile: "<b>Alice</b><script>fetch('/steal?token=' + localStorage.getItem('token'))</script>",
  };

  // 3.1 Create transaction with XSS payloads
  const xssTxRes = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      categoryId: catA.id,
      type: 'INCOME',
      amount: 50000,
      date: '2026-10-05',
      title: xssPayloads.title,
      notes: xssPayloads.notes,
    }),
  });
  verify('check3_xss', xssTxRes.status === 201, 'Transaction with XSS payloads stored safely in SQLite');
  const xssTxData = await xssTxRes.json();
  verify('check3_xss', xssTxData.transaction.title === xssPayloads.title, 'XSS string stored verbatim without raw execution in database');

  // 3.2 Update profile with XSS payload
  const xssProfileRes = await fetch(`${baseUrl}/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ name: xssPayloads.profile }),
  });
  verify('check3_xss', xssProfileRes.status === 200, 'Profile name with XSS payload updated safely');

  // 3.3 Verify frontend codebase has zero dangerouslySetInnerHTML
  const frontendSrc = path.resolve(__dirname, '..', 'frontend', 'src');
  function scanFrontendForDangerousHtml(dir) {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) count += scanFrontendForDangerousHtml(full);
      else if (['.jsx', '.js', '.html'].includes(path.extname(entry.name))) {
        const code = fs.readFileSync(full, 'utf-8');
        if (code.includes('dangerouslySetInnerHTML')) count++;
      }
    }
    return count;
  }
  const dangerousHtmlCount = scanFrontendForDangerousHtml(frontendSrc);
  verify('check3_xss', dangerousHtmlCount === 0, 'Frontend React codebase contains zero dangerouslySetInnerHTML occurrences (XSS safe)');

  // ═════════════════════════════════════════════════════════════════════════════
  // CHECK 4: Login Rate Limiting & Real RATE_LIMITED Audit Event
  // ═════════════════════════════════════════════════════════════════════════════
  console.log('\n[CHECK 4] Login Rate Limiting: 429 Throttle & RATE_LIMITED Audit Log');

  let rateLimitHit = false;
  let rateLimitResponse = null;

  // Perform consecutive rapid login attempts to trigger the 5-attempt rate limiter
  for (let i = 0; i < 8; i++) {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `rate_probe_${Date.now()}@fintrack.shield`, password: 'WrongPassword@123' }),
    });
    if (res.status === 429) {
      rateLimitHit = true;
      rateLimitResponse = await res.json();
      break;
    }
    await res.json();
  }

  verify('check4_rate_limit', rateLimitHit === true, 'Repeated login attempts trigger HTTP 429 rate limit');
  verify('check4_rate_limit', rateLimitResponse && rateLimitResponse.error === 'Too many login attempts. Please try again later.', 'Generic safe 429 rate limit message returned');

  // Verify real RATE_LIMITED event in audit_log
  const rateLimitEvents = AuditLog.query({ action: 'RATE_LIMITED' });
  verify('check4_rate_limit', rateLimitEvents.length >= 1, 'RATE_LIMITED event recorded in immutable SQLite audit_log');
  const latestRateEvent = rateLimitEvents[0];
  const rateMeta = typeof latestRateEvent.metadata === 'string' ? JSON.parse(latestRateEvent.metadata) : latestRateEvent.metadata;
  verify('check4_rate_limit', rateMeta.endpoint === '/api/auth/login', 'RATE_LIMITED event logs endpoint /api/auth/login');
  verify('check4_rate_limit', latestRateEvent.ip !== undefined, 'RATE_LIMITED event logs client IP address');

  // ═════════════════════════════════════════════════════════════════════════════
  // CHECK 5: Export Isolation (CSV & JSON)
  // ═════════════════════════════════════════════════════════════════════════════
  console.log('\n[CHECK 5] Scoped Export: CSV and JSON Contain Only Authenticated User Data');

  // 5.1 User A CSV Export
  const csvRes = await fetch(`${baseUrl}/transactions/export?format=csv`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  verify('check5_export', csvRes.status === 200, 'CSV export returns HTTP 200');
  const csvContent = await csvRes.text();
  verify('check5_export', csvContent.includes('Alice Organic Market'), 'CSV export includes User A transactions');
  verify('check5_export', !csvContent.includes(txB.id), 'CSV export DOES NOT include User B transaction ID');
  verify('check5_export', !csvContent.includes('Bob Confidential Asset Purchase'), 'CSV export DOES NOT include User B transaction title');

  // 5.2 User A JSON Export
  const jsonRes = await fetch(`${baseUrl}/transactions/export?format=json`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  verify('check5_export', jsonRes.status === 200, 'JSON export returns HTTP 200');
  const jsonExport = await jsonRes.json();
  verify('check5_export', Array.isArray(jsonExport.transactions), 'JSON export returns transaction list');
  const userAOnlyInJson = jsonExport.transactions.every((t) => t.user_id === userA.id);
  verify('check5_export', userAOnlyInJson, 'Every transaction in JSON export belongs strictly to User A');
  const jsonContainsBob = jsonExport.transactions.some((t) => t.id === txB.id);
  verify('check5_export', !jsonContainsBob, 'JSON export strictly excludes User B records');

  // ═════════════════════════════════════════════════════════════════════════════
  // CHECK 6: Role-Based Access Control (RBAC)
  // ═════════════════════════════════════════════════════════════════════════════
  console.log('\n[CHECK 6] RBAC: Standard USER Receives 403 on /api/admin/*; ADMIN Receives 200');

  // 6.1 USER role calls /api/admin/* endpoints
  const adminEndpoints = ['/admin/users', '/admin/stats', '/admin/audit-logs', '/admin/security-analysis'];
  for (const ep of adminEndpoints) {
    const res = await fetch(`${baseUrl}${ep}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    verify('check6_rbac', res.status === 403, `Standard USER received HTTP 403 on ${ep}`);
    const body = await res.json();
    verify('check6_rbac', body.error === 'Insufficient permissions.', `Standard USER received Insufficient permissions on ${ep}`);
  }

  // 6.2 ADMIN role calls /api/admin/* endpoints
  const adminStatsRes = await fetch(`${baseUrl}/admin/stats`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  verify('check6_rbac', adminStatsRes.status === 200, 'ADMIN successfully accesses /api/admin/stats (HTTP 200)');

  const adminAnalysisRes = await fetch(`${baseUrl}/admin/security-analysis`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  verify('check6_rbac', adminAnalysisRes.status === 200, 'ADMIN successfully accesses /api/admin/security-analysis (HTTP 200)');

  // 6.3 Verify safe AUTHORIZATION_DENIED audit log
  const authzDenials = AuditLog.query({ action: 'AUTHORIZATION_DENIED' });
  verify('check6_rbac', authzDenials.length >= 4, 'AUTHORIZATION_DENIED events recorded for all 4 rejected attempts');
  const sampleDenial = authzDenials[0];
  const denialMeta = typeof sampleDenial.metadata === 'string' ? JSON.parse(sampleDenial.metadata) : sampleDenial.metadata;
  verify('check6_rbac', sampleDenial.user_id === userA.id, 'AUTHORIZATION_DENIED record identifies caller user ID');
  verify('check6_rbac', denialMeta.userRole === 'USER', 'AUTHORIZATION_DENIED record captures caller role USER');
  verify('check6_rbac', Array.isArray(denialMeta.requiredRoles) && denialMeta.requiredRoles.includes('ADMIN'), 'AUTHORIZATION_DENIED captures required role ADMIN');
  verify('check6_rbac', !denialMeta.password && !denialMeta.token && !denialMeta.headers, 'AUTHORIZATION_DENIED contains NO credentials or tokens');

  // ═════════════════════════════════════════════════════════════════════════════
  // CHECK 7: Security Dashboard Real-Data Provenance
  // ═════════════════════════════════════════════════════════════════════════════
  console.log('\n[CHECK 7] Security Dashboard: Metrics Derived 100% from Real audit_log Records');

  const dashRes = await fetch(`${baseUrl}/admin/security-analysis`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  const dashData = await dashRes.json();

  // Compare every metric against direct raw SQL count on the audit_log table
  const sqlSuccessLogins = db.prepare("SELECT COUNT(*) as count FROM audit_log WHERE action = 'LOGIN_SUCCESS'").get().count;
  const sqlFailedLogins = db.prepare("SELECT COUNT(*) as count FROM audit_log WHERE action = 'LOGIN_FAILED'").get().count;
  const sqlAuthzDenied = db.prepare("SELECT COUNT(*) as count FROM audit_log WHERE action = 'AUTHORIZATION_DENIED'").get().count;
  const sqlRateLimited = db.prepare("SELECT COUNT(*) as count FROM audit_log WHERE action = 'RATE_LIMITED'").get().count;

  verify('check7_dashboard', dashData.metrics.successfulLogins === sqlSuccessLogins, `Dashboard successful login count (${dashData.metrics.successfulLogins}) matches real DB count (${sqlSuccessLogins})`);
  verify('check7_dashboard', dashData.metrics.failedLogins === sqlFailedLogins, `Dashboard failed login count (${dashData.metrics.failedLogins}) matches real DB count (${sqlFailedLogins})`);
  verify('check7_dashboard', dashData.metrics.authorizationDenied === sqlAuthzDenied, `Dashboard authorization-denied count (${dashData.metrics.authorizationDenied}) matches real DB count (${sqlAuthzDenied})`);
  verify('check7_dashboard', dashData.metrics.rateLimited === sqlRateLimited, `Dashboard rate-limit event count (${dashData.metrics.rateLimited}) matches real DB count (${sqlRateLimited})`);

  // Confirm suspicious activity is grounded in real events
  verify('check7_dashboard', Array.isArray(dashData.suspiciousActivity.repeatedFailedLogins), 'Suspicious activity includes repeated failed logins list');
  verify('check7_dashboard', Array.isArray(dashData.suspiciousActivity.rateLimitedRequests), 'Suspicious activity includes rate limited requests list');
  verify('check7_dashboard', Array.isArray(dashData.suspiciousActivity.authorizationFailures), 'Suspicious activity includes authorization failures list');
  verify('check7_dashboard', dashData.suspiciousActivity.rateLimitedRequests.length === sqlRateLimited, 'Rate-limited list in suspicious activity equals exact DB count');
  verify('check7_dashboard', dashData.suspiciousActivity.authorizationFailures.length === sqlAuthzDenied, 'Authorization failure list in suspicious activity equals exact DB count');

  // Confirm zero password or token leakage in dashboard output
  const dashString = JSON.stringify(dashData);
  verify('check7_dashboard', !dashString.includes('password_hash'), 'Security dashboard payload contains zero password_hash fields');
  verify('check7_dashboard', !dashString.includes('AliceStrongPassword'), 'Security dashboard payload contains zero plaintext passwords');

  // Close test server and cleanup test database
  await new Promise((resolve) => server.close(resolve));
  closeDb();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('\n═════════════════════════════════════════════════════════════');
  console.log(`   Final Security Verification: ${passedAssertions} PASSED, ${failedAssertions} FAILED   `);
  console.log('═════════════════════════════════════════════════════════════\n');

  console.log('Summary of 7 Security Dimensions:');
  for (const [key, result] of Object.entries(resultsByCheck)) {
    console.log(`  ${result.passed ? '✅ PASS' : '❌ FAIL'}: ${result.name} (${result.details.length} assertions)`);
  }

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runSecurityVerification().catch((err) => {
  console.error('\n❌ Security verification failed with uncaught exception:', err);
  process.exit(1);
});
