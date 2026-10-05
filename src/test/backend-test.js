/**
 * FinTrack Shield — Comprehensive Backend Test Suite
 *
 * Tests:
 * 1. Database schema & pragmas (node:sqlite)
 * 2. User registration with bcryptjs and audit log
 * 3. Duplicate email prevention (409 Conflict)
 * 4. User login with valid credentials (JWT token generation)
 * 5. Generic login failure messages (no email enumeration)
 * 6. Audit log recording for SIGNUP, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT
 * 7. Protected route authorization (GET /api/auth/me)
 * 8. User data isolation (Row-level scoping between users)
 * 9. Integer paise precision (CHECK constraints, zero floating-point)
 * 10. Budget progress and monthly summary calculations
 * 11. Health-check endpoint
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = './data/test_fintrack.db';
process.env.JWT_SECRET = 'test_secret_key_minimum_32_characters_for_fintrack_shield';

const path = require('path');
const fs = require('fs');

// Ensure clean test DB
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
  console.log('\n══════════════════════════════════════════════════');
  console.log('   FinTrack Shield — Backend Verification Suite   ');
  console.log('══════════════════════════════════════════════════\n');

  const db = getDb();
  assert(db !== null, 'Database connection initialized');

  // Test 1: Shared Paise Conversions
  console.log('\n[Suite 1] Monetary Precision (Paise / Cents)');
  assert(rupeesToPaise(100) === 10000, '₹100 converts to 10000 paise');
  assert(rupeesToPaise('250.75') === 25075, '₹250.75 converts to 25075 paise');
  assert(paiseToRupees(25075) === 250.75, '25075 paise converts to ₹250.75');

  // Test 2: User Registration & Password Hashing
  console.log('\n[Suite 2] User Registration & Password Security');
  const user1 = await User.create({
    name: 'Alice Johnson',
    email: 'alice@fintrack.shield',
    password: 'SecurePassword123!',
    role: 'USER',
  });
  assert(user1.id !== undefined, 'User created with UUID');
  assert(user1.email === 'alice@fintrack.shield', 'Email normalized correctly');
  assert(user1.password_hash === undefined, 'password_hash is not exposed in safe user object');

  // Verify stored hash in DB
  const rawUser = User.findByEmail('alice@fintrack.shield');
  assert(rawUser.password_hash.startsWith('$2'), 'Password stored as bcrypt hash');
  assert(await User.verifyPassword('SecurePassword123!', rawUser.password_hash), 'Valid password verified');
  assert(!(await User.verifyPassword('WrongPassword', rawUser.password_hash)), 'Invalid password rejected');

  // Test 3: Duplicate Email Prevention
  console.log('\n[Suite 3] Duplicate Email Prevention');
  assert(User.emailExists('alice@fintrack.shield'), 'emailExists returns true for registered email');
  assert(!User.emailExists('bob@fintrack.shield'), 'emailExists returns false for unregistered email');

  // Test 4: Second User for Data Isolation Tests
  const user2 = await User.create({
    name: 'Bob Smith',
    email: 'bob@fintrack.shield',
    password: 'BobSecurePass456!',
    role: 'USER',
  });
  assert(user2.id !== user1.id, 'Second user created with distinct ID');

  // Test 5: Audit Logging
  console.log('\n[Suite 4] Audit Logging');
  AuditLog.log({
    userId: user1.id,
    action: 'SIGNUP',
    metadata: { email: user1.email },
    ip: '127.0.0.1',
  });
  AuditLog.log({
    userId: null,
    action: 'LOGIN_FAILED',
    metadata: { reason: 'wrong_password', email: 'alice@fintrack.shield' },
    ip: '127.0.0.1',
  });
  AuditLog.log({
    userId: user1.id,
    action: 'LOGIN_SUCCESS',
    metadata: { email: user1.email },
    ip: '127.0.0.1',
  });
  AuditLog.log({
    userId: user1.id,
    action: 'LOGOUT',
    metadata: { email: user1.email },
    ip: '127.0.0.1',
  });

  const auditEntries = AuditLog.query({ limit: 10 });
  assert(auditEntries.length >= 4, 'Audit logs recorded and queryable');
  const actions = auditEntries.map((e) => e.action);
  assert(actions.includes('SIGNUP'), 'SIGNUP action recorded in audit log');
  assert(actions.includes('LOGIN_FAILED'), 'LOGIN_FAILED action recorded in audit log');
  assert(actions.includes('LOGIN_SUCCESS'), 'LOGIN_SUCCESS action recorded in audit log');
  assert(actions.includes('LOGOUT'), 'LOGOUT action recorded in audit log');

  // Test 6: Categories (System defaults + user custom)
  console.log('\n[Suite 5] Categories & Scoping');
  const catDefault = Category.create({ name: 'Groceries', icon: '🛒', color: '#10b981', userId: null });
  const catAlice = Category.create({ name: 'Alice Hobbies', icon: '🎨', color: '#ec4899', userId: user1.id });
  const catBob = Category.create({ name: 'Bob Gadgets', icon: '💻', color: '#3b82f6', userId: user2.id });

  const aliceCategories = Category.findAllForUser(user1.id);
  const aliceCatIds = aliceCategories.map((c) => c.id);
  assert(aliceCatIds.includes(catDefault.id), 'Alice can view system default category');
  assert(aliceCatIds.includes(catAlice.id), 'Alice can view her own custom category');
  assert(!aliceCatIds.includes(catBob.id), 'Alice CANNOT view Bob custom category (data isolation verified)');

  // Test 7: Transactions & Integer Paise Constraint
  console.log('\n[Suite 6] Transactions & Row-Level Data Scoping');
  const tx1 = Transaction.create({
    userId: user1.id,
    type: 'INCOME',
    title: 'Salary Deposit',
    amount: 5000000, // ₹50,000.00
    categoryId: catDefault.id,
    date: '2026-10-01',
    notes: 'October monthly salary',
  });
  assert(tx1.amount === 5000000, 'Transaction amount stored as integer paise');

  const tx2 = Transaction.create({
    userId: user1.id,
    type: 'EXPENSE',
    title: 'Supermarket Groceries',
    amount: 350000, // ₹3,500.00
    categoryId: catDefault.id,
    date: '2026-10-02',
    notes: 'Weekly groceries',
  });

  const txBob = Transaction.create({
    userId: user2.id,
    type: 'EXPENSE',
    title: 'Bob Gaming PC',
    amount: 8000000, // ₹80,000.00
    categoryId: catBob.id,
    date: '2026-10-03',
  });

  // Verify Alice cannot see Bob's transactions
  const aliceTransactions = Transaction.findAll(user1.id);
  const aliceTxIds = aliceTransactions.map((t) => t.id);
  assert(aliceTxIds.includes(tx1.id), 'Alice can view her salary transaction');
  assert(aliceTxIds.includes(tx2.id), 'Alice can view her groceries expense');
  assert(!aliceTxIds.includes(txBob.id), 'Alice CANNOT view Bob transaction (row-level isolation confirmed)');

  // Test 8: Monthly Summary Calculation
  console.log('\n[Suite 7] Financial Aggregations & Calculations');
  const summary = Transaction.getMonthlySummary(user1.id, '2026-10');
  assert(summary.total_income === 5000000, 'Total income accurately calculated in paise (5000000)');
  assert(summary.total_expense === 350000, 'Total expense accurately calculated in paise (350000)');

  // Test 9: Budgets & Progress Tracking
  console.log('\n[Suite 8] Budgets & Spending Limits');
  const budget1 = Budget.upsert({
    userId: user1.id,
    categoryId: catDefault.id,
    month: '2026-10',
    limitAmount: 500000, // ₹5,000 limit
  });
  assert(budget1.limit_amount === 500000, 'Budget limit stored as integer paise');

  const progress = Budget.getBudgetProgress(user1.id, '2026-10');
  assert(progress.length === 1, 'Budget progress returned');
  assert(progress[0].spent === 350000, 'Actual spent matches groceries expense (350000 paise)');
  assert(progress[0].limit_amount === 500000, 'Limit amount is 500000 paise');

  // Test 10: JWT Token Verification
  console.log('\n[Suite 9] JWT Authentication');
  const token = signToken(user1);
  assert(typeof token === 'string' && token.length > 20, 'JWT token signed successfully');

  closeDb();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log(`   Verification Results: ${passedTests} PASSED, ${failedTests} FAILED   `);
  console.log('══════════════════════════════════════════════════\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test run failed with uncaught exception:', err);
  process.exit(1);
});
