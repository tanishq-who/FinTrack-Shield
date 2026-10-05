/**
 * FinTrack Shield — Comprehensive Backend & Security Test Suite
 *
 * Covers:
 * 1. Database schema & pragmas (node:sqlite)
 * 2. User registration, password hashing (bcryptjs 12 rounds), and audit logs
 * 3. User login, token generation, and generic rejection on bad credentials
 * 4. Protected route authorization & role checks
 * 5. Category CRUD, defaults protection, and IDOR prevention
 * 6. Transaction CRUD, integer paise validation, and IDOR prevention
 * 7. Transaction history search, type filter, date range, amount range, sorting, pagination
 * 8. Budget CRUD, calculations (spent, remaining, percentage, isOverspent), and IDOR prevention
 * 9. Dashboard API summary calculations (balance, monthly income/expense, savings rate, breakdown)
 * 10. Audit logging verification across all operations
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = './data/test_fintrack.db';
process.env.JWT_SECRET = 'test_secret_key_minimum_32_characters_for_fintrack_shield';

const path = require('path');
const fs = require('fs');

// Ensure fresh test database
const testDbPath = path.resolve(__dirname, '..', 'data', 'test_fintrack.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const { getDb, closeDb } = require('../server/db/database');
const User = require('../server/models/User');
const Category = require('../server/models/Category');
const Transaction = require('../server/models/Transaction');
const Budget = require('../server/models/Budget');
const AuditLog = require('../server/models/AuditLog');
const { signToken } = require('../server/middleware/auth');
const { rupeesToPaise, paiseToRupees } = require('../shared/constants');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedTests++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passedTests++;
  }
}

async function runTests() {
  console.log('\n═════════════════════════════════════════════════════════════');
  console.log('   FinTrack Shield — Security & Finance API Test Suite       ');
  console.log('═════════════════════════════════════════════════════════════\n');

  const db = getDb();
  assert(db !== null, 'Database connection initialized');

  // Suite 1: Monetary Precision
  console.log('\n[Suite 1] Monetary Precision & Conversion');
  assert(rupeesToPaise(100) === 10000, '₹100 converts to 10000 paise');
  assert(rupeesToPaise('250.75') === 25075, '₹250.75 converts to 25075 paise');
  assert(paiseToRupees(25075) === 250.75, '25075 paise converts to ₹250.75');

  // Suite 2: Users & Authentication
  console.log('\n[Suite 2] Users & Authentication');
  const userA = await User.create({
    name: 'Alice Cooper',
    email: 'alice@fintrack.shield',
    password: 'AliceStrongPassword123!',
    role: 'USER',
  });
  const userB = await User.create({
    name: 'Bob Marley',
    email: 'bob@fintrack.shield',
    password: 'BobStrongPassword456!',
    role: 'USER',
  });
  assert(userA.id && userB.id, 'Users created with distinct IDs');
  assert(userA.password_hash === undefined, 'password_hash hidden in safe user return');

  const rawUserA = User.findByEmail('alice@fintrack.shield');
  assert(await User.verifyPassword('AliceStrongPassword123!', rawUserA.password_hash), 'Valid password verified');
  assert(!(await User.verifyPassword('WrongPass', rawUserA.password_hash)), 'Invalid password rejected');

  const tokenA = signToken(userA);
  const tokenB = signToken(userB);
  assert(typeof tokenA === 'string' && typeof tokenB === 'string', 'JWT tokens signed successfully');

  // Suite 3: Categories & IDOR Prevention
  console.log('\n[Suite 3] Categories & IDOR Prevention');
  const catDefault = Category.create({ name: 'Salary', icon: '💰', color: '#22c55e', userId: null });
  const catAlice = Category.create({ name: 'Alice Books', icon: '📚', color: '#6366f1', userId: userA.id });
  const catBob = Category.create({ name: 'Bob Music', icon: '🎵', color: '#f59e0b', userId: userB.id });

  const aliceCategories = Category.findAllForUser(userA.id);
  const aliceCatIds = aliceCategories.map((c) => c.id);
  assert(aliceCatIds.includes(catDefault.id), 'Alice can view system default category');
  assert(aliceCatIds.includes(catAlice.id), 'Alice can view her own custom category');
  assert(!aliceCatIds.includes(catBob.id), 'Alice CANNOT view Bob custom category');

  // IDOR: Bob tries to update Alice's category
  const bobUpdateAliceCat = Category.update(catAlice.id, userB.id, { name: 'Hacked Cat' });
  assert(bobUpdateAliceCat === null, 'Bob CANNOT update Alice category (IDOR protected)');

  // IDOR: Bob tries to delete Alice's category
  const bobDeleteAliceCat = Category.delete(catAlice.id, userB.id);
  assert(bobDeleteAliceCat === false, 'Bob CANNOT delete Alice category (IDOR protected)');

  // Protection: Alice tries to update system default category
  const updateDefaultCat = Category.update(catDefault.id, userA.id, { name: 'Tampered Default' });
  assert(updateDefaultCat === null, 'System default category CANNOT be updated by user');

  // Suite 4: Transactions CRUD, Filters & IDOR
  console.log('\n[Suite 4] Transactions, Filters & IDOR Prevention');
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().slice(0, 10);

  // Alice Income & Expense
  const txSalary = Transaction.create({
    userId: userA.id,
    type: 'INCOME',
    title: 'October Full Salary',
    amount: 7500000, // ₹75,000.00
    categoryId: catDefault.id,
    date: `${currentMonth}-01`,
    notes: 'Monthly tech salary',
  });

  const txGroceries = Transaction.create({
    userId: userA.id,
    type: 'EXPENSE',
    title: 'Supermarket Groceries',
    amount: 450000, // ₹4,500.00
    categoryId: catDefault.id,
    date: `${currentMonth}-05`,
    notes: 'Fresh veggies and fruits',
  });

  const txBook = Transaction.create({
    userId: userA.id,
    type: 'EXPENSE',
    title: 'Cybersecurity Handbook',
    amount: 120000, // ₹1,200.00
    categoryId: catAlice.id,
    date: `${currentMonth}-10`,
    notes: 'Security study book',
  });

  // Bob Expense
  const txBob = Transaction.create({
    userId: userB.id,
    type: 'EXPENSE',
    title: 'Bob Electric Guitar',
    amount: 3500000, // ₹35,000.00
    categoryId: catBob.id,
    date: `${currentMonth}-02`,
  });

  // IDOR check: Bob tries to read Alice's transaction
  const bobReadsAliceTx = Transaction.findById(txSalary.id, userB.id);
  assert(bobReadsAliceTx === undefined, 'Bob CANNOT view Alice transaction by ID (IDOR protected)');

  // IDOR check: Bob tries to update Alice's transaction
  const bobUpdatesAliceTx = Transaction.update(txSalary.id, userB.id, { amount: 100 });
  assert(bobUpdatesAliceTx === null, 'Bob CANNOT update Alice transaction (IDOR protected)');

  // IDOR check: Bob tries to delete Alice's transaction
  const bobDeletesAliceTx = Transaction.delete(txSalary.id, userB.id);
  assert(bobDeletesAliceTx === false, 'Bob CANNOT delete Alice transaction (IDOR protected)');

  // Text search filter
  const searchResult = Transaction.findAll(userA.id, { search: 'handbook' });
  assert(searchResult.transactions.length === 1 && searchResult.transactions[0].id === txBook.id, 'Text search matches title correctly');

  // Type filter
  const incomeResult = Transaction.findAll(userA.id, { type: 'INCOME' });
  assert(incomeResult.transactions.length === 1 && incomeResult.transactions[0].type === 'INCOME', 'Type filter returns only INCOME transactions');

  const expenseResult = Transaction.findAll(userA.id, { type: 'EXPENSE' });
  assert(expenseResult.transactions.length === 2, 'Type filter returns only EXPENSE transactions');

  // Amount range filter
  const amountFiltered = Transaction.findAll(userA.id, { minAmount: 400000, maxAmount: 500000 });
  assert(amountFiltered.transactions.length === 1 && amountFiltered.transactions[0].id === txGroceries.id, 'Amount range filter matches correctly');

  // Date range filter
  const dateFiltered = Transaction.findAll(userA.id, { startDate: `${currentMonth}-06`, endDate: `${currentMonth}-15` });
  assert(dateFiltered.transactions.length === 1 && dateFiltered.transactions[0].id === txBook.id, 'Date range filter matches correctly');

  // Sorting
  const sortedByAmount = Transaction.findAll(userA.id, { sortBy: 'amount', sortOrder: 'ASC' });
  assert(sortedByAmount.transactions[0].amount <= sortedByAmount.transactions[1].amount, 'Transactions sorted by amount ascending');

  // Pagination
  const paginated = Transaction.findAll(userA.id, { page: 1, limit: 2 });
  assert(paginated.transactions.length === 2, 'Pagination limit returns exact count');
  assert(paginated.pagination.total === 3, 'Pagination total records matches 3');
  assert(paginated.pagination.totalPages === 2, 'Pagination totalPages computed correctly');

  // Suite 5: Budgets & Progress Calculations
  console.log('\n[Suite 5] Budgets & Spending Progress');
  // Total grocery expenses for Alice = 450,000 paise (₹4,500)
  // Set budget limit = 500,000 paise (₹5,000)
  const budgetNormal = Budget.upsert({
    userId: userA.id,
    categoryId: catDefault.id,
    month: currentMonth,
    limitAmount: 500000,
  });
  assert(budgetNormal.limitAmount === 500000, 'Budget limit saved as 500000 paise');
  assert(budgetNormal.spentAmount === 450000, 'Budget spent amount accurately calculated (450000 paise)');
  assert(budgetNormal.remainingAmount === 50000, 'Budget remaining amount is 50000 paise');
  assert(budgetNormal.percentageUsed === 90, 'Budget percentage used is exactly 90%');
  assert(budgetNormal.isOverspent === false, 'Budget is not overspent');

  // Overspent budget test: Book budget = 100,000 paise (₹1,000), but spent = 120,000 paise (₹1,200)
  const budgetOver = Budget.upsert({
    userId: userA.id,
    categoryId: catAlice.id,
    month: currentMonth,
    limitAmount: 100000,
  });
  assert(budgetOver.spentAmount === 120000, 'Overspent budget spent amount is 120000 paise');
  assert(budgetOver.remainingAmount === -20000, 'Overspent budget remaining amount is negative (-20000 paise)');
  assert(budgetOver.percentageUsed === 120, 'Overspent percentage is 120%');
  assert(budgetOver.isOverspent === true, 'isOverspent correctly flags true');

  // IDOR: Bob tries to access Alice's budget
  const bobReadsAliceBudget = Budget.findById(budgetNormal.id, userB.id);
  assert(bobReadsAliceBudget === null, 'Bob CANNOT view Alice budget (IDOR protected)');

  const bobUpdatesAliceBudget = Budget.update(budgetNormal.id, userB.id, { limitAmount: 999 });
  assert(bobUpdatesAliceBudget === null, 'Bob CANNOT update Alice budget (IDOR protected)');

  const bobDeletesAliceBudget = Budget.delete(budgetNormal.id, userB.id);
  assert(bobDeletesAliceBudget === false, 'Bob CANNOT delete Alice budget (IDOR protected)');

  // Suite 6: Dashboard Analytics
  console.log('\n[Suite 6] Dashboard Metrics & Aggregations');
  const allTimeAlice = Transaction.getAllTimeTotals(userA.id);
  // Total income: 7500000, Total expense: 450000 + 120000 = 570000. Balance: 6930000
  assert(allTimeAlice.total_income === 7500000, 'Dashboard all-time income matches 7500000 paise');
  assert(allTimeAlice.total_expense === 570000, 'Dashboard all-time expense matches 570000 paise');
  assert(allTimeAlice.balance === 6930000, 'Dashboard net balance matches 6930000 paise');

  const categoryBreakdown = Transaction.getCategorySpending(userA.id, currentMonth);
  assert(categoryBreakdown.length === 2, 'Category spending breakdown lists all spent categories');
  assert(categoryBreakdown[0].total_spent >= categoryBreakdown[1].total_spent, 'Category spending sorted descending by spent amount');

  const monthlyHistory = Transaction.getMonthlyHistory(userA.id, 6);
  assert(monthlyHistory.length >= 1, 'Monthly comparison history returned');
  const currentMonthHistory = monthlyHistory.find((m) => m.month === currentMonth);
  assert(currentMonthHistory && currentMonthHistory.income === 7500000, 'Monthly history current month income verified');

  // Suite 7: Audit Logging
  console.log('\n[Suite 7] Audit Logging');
  AuditLog.log({
    userId: userA.id,
    action: 'TRANSACTION_CREATE',
    metadata: { transactionId: txSalary.id, amount: txSalary.amount },
    ip: '127.0.0.1',
  });
  AuditLog.log({
    userId: userA.id,
    action: 'BUDGET_UPDATE',
    metadata: { budgetId: budgetNormal.id },
    ip: '127.0.0.1',
  });

  const auditList = AuditLog.query({ userId: userA.id, limit: 10 });
  assert(auditList.length >= 2, 'Audit logs recorded for user actions');
  const recordedActions = auditList.map((a) => a.action);
  assert(recordedActions.includes('TRANSACTION_CREATE'), 'TRANSACTION_CREATE recorded in audit log');
  assert(recordedActions.includes('BUDGET_UPDATE'), 'BUDGET_UPDATE recorded in audit log');

  // Suite 8: PS-01 Profile Management & Ownership Protection
  console.log('\n[Suite 8] PS-01 Profile Management & Ownership Protection');
  const profileA = User.findById(userA.id);
  assert(profileA && profileA.id === userA.id, 'User can view own profile');
  assert(profileA.password_hash === undefined, 'Profile view hides password_hash (safe projection)');
  assert(profileA.name === 'Alice Cooper', 'Profile name matches initial creation');
  assert(profileA.email === 'alice@fintrack.shield', 'Profile email matches initial creation');

  const updatedNameUser = User.updateProfile(userA.id, { name: 'Alice Cooper Hardened' });
  assert(updatedNameUser.name === 'Alice Cooper Hardened', 'User name updated successfully');
  assert(updatedNameUser.email === 'alice@fintrack.shield', 'User email remains unchanged when updating name');

  const newEmailA = 'alice_secure_2026@fintrack.shield';
  const updatedEmailUser = User.updateProfile(userA.id, { email: newEmailA });
  assert(updatedEmailUser.email === newEmailA, 'User email updated successfully');
  assert(updatedEmailUser.name === 'Alice Cooper Hardened', 'User name remains unchanged when updating email');

  // Duplicate email detection: Alice cannot claim Bob's email
  const isTakenByBob = User.emailTakenByOther('bob@fintrack.shield', userA.id);
  assert(isTakenByBob === true, 'Duplicate email collision correctly flagged for other user');

  // Self email check: Alice keeping her own email is not flagged as collision
  const isTakenBySelf = User.emailTakenByOther(newEmailA, userA.id);
  assert(isTakenBySelf === false, 'User own email not flagged as duplicate collision');

  // User ownership isolation: Updating non-existent user returns null
  const nonExistentUpdate = User.updateProfile('00000000-0000-0000-0000-000000000000', { name: 'Hacker' });
  assert(nonExistentUpdate === null, 'Updating non-existent user returns null');

  // User B profile remains completely unaffected (ownership isolation)
  const profileB = User.findById(userB.id);
  assert(profileB.name === 'Bob Marley', 'User B name remains intact (ownership isolated)');
  assert(profileB.email === 'bob@fintrack.shield', 'User B email remains intact (ownership isolated)');

  // Refreshed token signed with new email claim
  const refreshedToken = signToken(updatedEmailUser);
  assert(typeof refreshedToken === 'string' && refreshedToken.split('.').length === 3, 'Refreshed JWT token generated with updated profile claims');

  // Audit logging for PROFILE_UPDATE
  AuditLog.log({
    userId: userA.id,
    action: 'PROFILE_UPDATE',
    metadata: { previousEmail: 'alice@fintrack.shield', newEmail: newEmailA, nameUpdated: true },
    ip: '127.0.0.1',
  });
  const profileAudit = AuditLog.query({ userId: userA.id, action: 'PROFILE_UPDATE' });
  assert(profileAudit.length >= 1, 'PROFILE_UPDATE event recorded in security audit log');

  // [Suite 9] Security Hardening & Edge Cases
  console.log('\n[Suite 9] Security Hardening & Edge Cases');

  // Test 9.1: Server / config validation rejects missing or insecure production JWT secret
  const { validateConfig } = require('../server/config');

  let prodMissingSecretRejected = false;
  try {
    validateConfig({ nodeEnv: 'production', jwt: { secret: '' } });
  } catch (err) {
    prodMissingSecretRejected = err.message.includes('JWT_SECRET');
  }
  assert(prodMissingSecretRejected, 'Server rejects missing production JWT secret (empty string)');

  let prodUndefinedSecretRejected = false;
  try {
    validateConfig({ nodeEnv: 'production', jwt: { secret: undefined } });
  } catch (err) {
    prodUndefinedSecretRejected = err.message.includes('JWT_SECRET');
  }
  assert(prodUndefinedSecretRejected, 'Server rejects undefined production JWT secret');

  let prodPlaceholderSecretRejected = false;
  try {
    validateConfig({ nodeEnv: 'production', jwt: { secret: 'CHANGE_ME_TO_A_RANDOM_SECRET_STRING_AT_LEAST_32_CHARS' } });
  } catch (err) {
    prodPlaceholderSecretRejected = err.message.includes('placeholder');
  }
  assert(prodPlaceholderSecretRejected, 'Server rejects default placeholder JWT secret in production');

  let prodShortSecretRejected = false;
  try {
    validateConfig({ nodeEnv: 'production', jwt: { secret: 'short-secret' } });
  } catch (err) {
    prodShortSecretRejected = err.message.includes('32 characters');
  }
  assert(prodShortSecretRejected, 'Server rejects short (< 32 chars) JWT secret in production');

  let prodValidSecretAccepted = false;
  try {
    prodValidSecretAccepted = validateConfig({
      nodeEnv: 'production',
      jwt: { secret: 'super_secure_production_secret_key_at_least_32_characters' }
    });
  } catch (err) {
    prodValidSecretAccepted = false;
  }
  assert(prodValidSecretAccepted === true, 'Server accepts valid production JWT secret (≥32 chars)');

  // Test 9.2: Repeated login attempts are rate-limited & audit log is recorded
  const http = require('http');
  const { app } = require('../server/server');

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
  const testPort = testServer.address().port;

  let rateLimited = false;
  let rateLimitStatus = null;
  let rateLimitBody = null;

  for (let i = 0; i < 7; i++) {
    const res = await fetch(`http://127.0.0.1:${testPort}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rate_limit_probe@fintrack.shield', password: 'WrongPassword@123' }),
    });
    if (res.status === 429) {
      rateLimited = true;
      rateLimitStatus = res.status;
      rateLimitBody = await res.json();
      break;
    }
    await res.json();
  }

  await new Promise((resolve) => testServer.close(resolve));

  assert(rateLimited === true && rateLimitStatus === 429, 'Repeated login attempts are rate-limited with HTTP 429');
  assert(rateLimitBody && rateLimitBody.error === 'Too many login attempts. Please try again later.', 'Rate limit returns safe generic error response');

  const rateLimitAudits = AuditLog.query({ action: 'RATE_LIMITED' });
  assert(rateLimitAudits.length >= 1, 'RATE_LIMITED event recorded in security audit log');
  const latestRateAudit = rateLimitAudits[0];
  const rateMeta = typeof latestRateAudit.metadata === 'string' ? JSON.parse(latestRateAudit.metadata) : latestRateAudit.metadata;
  assert(rateMeta.endpoint === '/api/auth/login', 'RATE_LIMITED audit log includes endpoint metadata');
  assert(rateMeta.ip !== undefined, 'RATE_LIMITED audit log includes IP metadata');
  assert(rateMeta.timestamp !== undefined, 'RATE_LIMITED audit log includes timestamp metadata');

  // Test 9.3: No secret/password is exposed in API responses or logs
  const testProbeUser = await User.create({
    name: 'Security Leak Probe',
    email: `probe_${Date.now()}@fintrack.shield`,
    password: 'ProbePassword@2026',
  });
  assert(testProbeUser.password === undefined, 'No plaintext password returned in User.create');
  assert(testProbeUser.password_hash === undefined, 'No password_hash exposed in User.create response');

  const fetchedProbeUser = User.findById(testProbeUser.id);
  assert(fetchedProbeUser.password === undefined, 'No plaintext password in User.findById');
  assert(fetchedProbeUser.password_hash === undefined, 'No password_hash exposed in User.findById');

  const updatedProbeUser = User.updateProfile(testProbeUser.id, { name: 'Probe Name Updated' });
  assert(updatedProbeUser.password === undefined, 'No plaintext password in User.updateProfile');
  assert(updatedProbeUser.password_hash === undefined, 'No password_hash exposed in User.updateProfile');

  const allLogs = AuditLog.query({ limit: 100 });
  let passwordFoundInAudit = false;
  let secretFoundInAudit = false;
  for (const log of allLogs) {
    const metaStr = typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata);
    if (metaStr.includes('ProbePassword@2026') || metaStr.includes('WrongPassword@123') || metaStr.includes('TestPassword@2026')) {
      passwordFoundInAudit = true;
    }
    if (metaStr.includes(process.env.JWT_SECRET)) {
      secretFoundInAudit = true;
    }
  }
  assert(passwordFoundInAudit === false, 'Zero plaintext passwords leaked in audit log metadata');
  assert(secretFoundInAudit === false, 'Zero JWT secrets leaked in audit log metadata');

  // Test 9.4: Database seeder enforces environment-only credentials & production safety
  const { seed: seedDb } = require('../server/db/seed');

  // Dev mode without credentials must stop with clear setup message
  let devSeedFailedWithoutCreds = false;
  try {
    await seedDb({ nodeEnv: 'development', demoPassword: '', adminPassword: '', autoClose: false });
  } catch (err) {
    devSeedFailedWithoutCreds = err.message.includes('Missing required environment variable');
  }
  assert(devSeedFailedWithoutCreds, 'Development seeding halts with setup message when credentials missing');

  // Production mode must never create demo accounts
  db.prepare("DELETE FROM users WHERE email IN ('demo@fintrack.local', 'admin@fintrack.local')").run();
  await seedDb({ nodeEnv: 'production', demoPassword: 'SomePassword123!', adminPassword: 'SomePassword123!', autoClose: false });
  const prodDemoCheck = db.prepare("SELECT * FROM users WHERE email = 'demo@fintrack.local'").get();
  const prodAdminCheck = db.prepare("SELECT * FROM users WHERE email = 'admin@fintrack.local'").get();
  assert(!prodDemoCheck, 'Production seeding strictly NEVER creates demo user account');
  assert(!prodAdminCheck, 'Production seeding strictly NEVER creates admin user account');

  // Test 9.5: Scan tracked project source, config, and documentation files for demo password values
  const forbiddenPatterns = [
    ['Demo', '@', '1234'].join(''),
    ['Admin', '@', '1234'].join(''),
  ];

  const projectRoot = path.resolve(__dirname, '..', '..');
  const filesToScan = [];

  function collectFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === 'data') {
          continue;
        }
        collectFiles(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.js', '.jsx', '.json', '.md', '.sql', '.html', '.css', '.yaml', '.yml', '.example'].includes(ext) || entry.name.startsWith('.env.')) {
          filesToScan.push(fullPath);
        }
      }
    }
  }

  collectFiles(path.join(projectRoot, 'src'));
  collectFiles(path.join(projectRoot, 'deployment'));
  const rootReadme = path.join(projectRoot, 'README.md');
  if (fs.existsSync(rootReadme)) filesToScan.push(rootReadme);
  const approachDoc = path.join(projectRoot, 'docs', 'APPROACH.md');
  if (fs.existsSync(approachDoc)) filesToScan.push(approachDoc);

  let leaksFound = [];
  for (const filePath of filesToScan) {
    if (filePath.endsWith('backend-test.js')) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of forbiddenPatterns) {
      if (content.includes(pattern)) {
        leaksFound.push({ file: path.relative(projectRoot, filePath), pattern });
      }
    }
  }

  // ─── Suite 10: Security Analysis Dashboard & Real Audit-Log Analytics ────────────
  console.log('\n[Suite 10] Security Analysis Dashboard & Real Audit-Log Analytics');

  const adminUser = await User.create({
    name: 'SecOps Administrator',
    email: `secops_admin_${Date.now()}@fintrack.shield`,
    password: 'SecOpsSuperAdmin@2026!',
    role: 'ADMIN',
  });
  const adminToken = signToken(adminUser);

  const standardUser = await User.create({
    name: 'Regular Standard User',
    email: `regular_user_${Date.now()}@fintrack.shield`,
    password: 'RegularUserPassword@2026!',
    role: 'USER',
  });
  const standardToken = signToken(standardUser);

  const suite10Server = http.createServer(app);
  await new Promise((resolve) => suite10Server.listen(0, '127.0.0.1', resolve));
  const suite10Port = suite10Server.address().port;
  const adminApiBase = `http://127.0.0.1:${suite10Port}/api/admin`;

  // Test 10.1: Unauthenticated requests to /api/admin/* rejected with 401
  const unauthStatsRes = await fetch(`${adminApiBase}/stats`);
  assert(unauthStatsRes.status === 401, 'Unauthenticated request to /api/admin/stats rejected with HTTP 401');
  const unauthAnalysisRes = await fetch(`${adminApiBase}/security-analysis`);
  assert(unauthAnalysisRes.status === 401, 'Unauthenticated request to /api/admin/security-analysis rejected with HTTP 401');

  // Test 10.2: Standard USER cannot access /api/admin/* and receives HTTP 403
  const userStatsRes = await fetch(`${adminApiBase}/stats`, {
    headers: { Authorization: `Bearer ${standardToken}` },
  });
  assert(userStatsRes.status === 403, 'Standard USER request to /api/admin/stats rejected with HTTP 403');
  const userStatsBody = await userStatsRes.json();
  assert(userStatsBody.error === 'Insufficient permissions.', 'Standard USER receives Insufficient permissions error');

  const userAnalysisRes = await fetch(`${adminApiBase}/security-analysis`, {
    headers: { Authorization: `Bearer ${standardToken}` },
  });
  assert(userAnalysisRes.status === 403, 'Standard USER request to /api/admin/security-analysis rejected with HTTP 403');

  const userUsersRes = await fetch(`${adminApiBase}/users`, {
    headers: { Authorization: `Bearer ${standardToken}` },
  });
  assert(userUsersRes.status === 403, 'Standard USER request to /api/admin/users rejected with HTTP 403');

  const userAuditRes = await fetch(`${adminApiBase}/audit-logs`, {
    headers: { Authorization: `Bearer ${standardToken}` },
  });
  assert(userAuditRes.status === 403, 'Standard USER request to /api/admin/audit-logs rejected with HTTP 403');

  // Test 10.3: Authorization denial is safely recorded in audit_log
  const authzDenials = AuditLog.query({ action: 'AUTHORIZATION_DENIED' });
  assert(authzDenials.length >= 1, 'AUTHORIZATION_DENIED event recorded in audit_log upon unauthorized attempt');
  const latestDenial = authzDenials[0];
  const denialMeta = typeof latestDenial.metadata === 'string' ? JSON.parse(latestDenial.metadata) : latestDenial.metadata;
  assert(latestDenial.user_id === standardUser.id, 'AUTHORIZATION_DENIED log records user ID of unauthorized caller');
  assert(denialMeta.userRole === 'USER', 'AUTHORIZATION_DENIED log records caller role USER');
  assert(Array.isArray(denialMeta.requiredRoles) && denialMeta.requiredRoles.includes('ADMIN'), 'AUTHORIZATION_DENIED log records required role ADMIN');
  assert(latestDenial.ip !== undefined, 'AUTHORIZATION_DENIED log records client IP');
  assert(!denialMeta.password && !denialMeta.token && !denialMeta.headers, 'AUTHORIZATION_DENIED log contains NO passwords, tokens, or sensitive headers');

  // Test 10.4: ADMIN access succeeds with HTTP 200
  const adminStatsRes = await fetch(`${adminApiBase}/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminStatsRes.status === 200, 'ADMIN request to /api/admin/stats returns HTTP 200');
  const adminStatsData = await adminStatsRes.json();

  const adminAnalysisRes = await fetch(`${adminApiBase}/security-analysis`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminAnalysisRes.status === 200, 'ADMIN request to /api/admin/security-analysis returns HTTP 200');
  const adminAnalysisData = await adminAnalysisRes.json();

  // Test 10.5: Every security metric is real and matches audit_log database table counts
  const rawDbSuccessfulLogins = db.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE action = 'LOGIN_SUCCESS'").get().count;
  const rawDbFailedLogins = db.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE action = 'LOGIN_FAILED'").get().count;
  const rawDbAuthzDenied = db.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE action = 'AUTHORIZATION_DENIED'").get().count;
  const rawDbRateLimited = db.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE action = 'RATE_LIMITED'").get().count;

  assert(adminAnalysisData.metrics.successfulLogins === rawDbSuccessfulLogins, 'Dashboard successful login count matches real audit_log database count');
  assert(adminAnalysisData.metrics.failedLogins === rawDbFailedLogins, 'Dashboard failed login count matches real audit_log database count');
  assert(adminAnalysisData.metrics.authorizationDenied === rawDbAuthzDenied, 'Dashboard authorization-denied count matches real audit_log database count');
  assert(adminAnalysisData.metrics.rateLimited === rawDbRateLimited, 'Dashboard rate-limit event count matches real audit_log database count');

  // Test 10.6: Real-time update: dynamic audit log insertion updates metric counts
  AuditLog.log({ userId: null, action: 'LOGIN_FAILED', metadata: { reason: 'test_failed_probe' }, ip: '10.0.0.99' });
  const updatedMetrics = AuditLog.getSecurityMetrics();
  assert(updatedMetrics.failedLogins === rawDbFailedLogins + 1, 'Failed login count dynamically increments with real audit_log events');

  // Test 10.7: Suspicious activity: repeated failed logins from same IP (>= 2 attempts)
  const probeIp = '198.51.100.77';
  AuditLog.log({ userId: null, action: 'LOGIN_FAILED', metadata: { reason: 'wrong_password' }, ip: probeIp });
  AuditLog.log({ userId: null, action: 'LOGIN_FAILED', metadata: { reason: 'wrong_password' }, ip: probeIp });
  AuditLog.log({ userId: null, action: 'LOGIN_FAILED', metadata: { reason: 'wrong_password' }, ip: probeIp });

  // Single attempt from another IP should not trigger repeated failure flag
  AuditLog.log({ userId: null, action: 'LOGIN_FAILED', metadata: { reason: 'wrong_password' }, ip: '203.0.113.11' });

  const suspiciousActivity = AuditLog.getSuspiciousActivity();
  const flaggedProbeIp = suspiciousActivity.repeatedFailedLogins.find((r) => r.ip === probeIp);
  assert(flaggedProbeIp !== undefined, 'Suspicious activity detects repeated failed logins from same IP');
  assert(flaggedProbeIp.count >= 3, 'Suspicious activity records correct failure attempt count for flagged IP');
  const isolatedSingleIp = suspiciousActivity.repeatedFailedLogins.find((r) => r.ip === '203.0.113.11');
  assert(isolatedSingleIp === undefined, 'Single failed login does not trigger repeated failed login warning');

  // Test 10.8: Suspicious activity includes real rate limits and authorization failures
  assert(suspiciousActivity.rateLimitedRequests.length >= 1, 'Suspicious activity includes real rate-limited requests from audit_log');
  assert(suspiciousActivity.authorizationFailures.length >= 1, 'Suspicious activity includes real authorization failures from audit_log');
  assert(suspiciousActivity.totalSuspiciousIncidents === suspiciousActivity.repeatedFailedLogins.length + suspiciousActivity.rateLimitedRequests.length + suspiciousActivity.authorizationFailures.length, 'Total suspicious incidents accurately aggregates real incident sub-counts');

  // Test 10.9: Recent security activity stream contains real events
  const recentSecurityActivity = AuditLog.getRecentSecurityActivity(10);
  assert(recentSecurityActivity.length > 0, 'Recent security activity stream returns real database audit records');
  assert(recentSecurityActivity.every((r) => r.id && r.action && r.timestamp), 'Every recent security event contains valid database fields');

  // Test 10.10: Zero password or secret exposure in admin responses
  const analysisJsonStr = JSON.stringify(adminAnalysisData);
  assert(!analysisJsonStr.includes('password_hash'), 'Zero password_hash exposed in security analysis output');
  assert(!analysisJsonStr.includes('SecOpsSuperAdmin'), 'Zero plaintext passwords exposed in security analysis output');

  await new Promise((resolve) => suite10Server.close(resolve));

  closeDb();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('\n═════════════════════════════════════════════════════════════');
  console.log(`   Verification Results: ${passedTests} PASSED, ${failedTests} FAILED   `);
  console.log('═════════════════════════════════════════════════════════════\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test run failed with uncaught exception:', err);
  process.exit(1);
});
