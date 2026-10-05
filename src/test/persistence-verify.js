/**
 * FinTrack Shield — Persistence & Database Integrity Test
 *
 * Verifies:
 * 1. User, Category, Transaction, Budget, and AuditLog models operate on SQLite
 * 2. Registration and login work with bcrypt password hashing
 * 3. Transactions and budgets persist across simulated server restarts (close and reopen DB)
 * 4. Dashboard calculates correctly from database transactions
 * 5. Strict user data isolation (User B cannot see User A's data)
 * 6. Integer paise accounting
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Test re-exports from both root and server modules
const config = require('../config');
const { getDb, closeDb } = require('../db/database');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Budget = require('../models/Budget');
const AuditLog = require('../models/AuditLog');

async function runPersistenceTest() {
  console.log('🧪 Starting FinTrack Shield Database Persistence Test...\n');
  console.log(`Database path: ${config.db.path}`);

  const testEmail = `persist_${Date.now()}@fintrack.local`;
  const otherEmail = `other_${Date.now()}@fintrack.local`;
  const password = 'TestPassword@1234';

  // ─── 1. User Registration & Password Hashing ────────────────────────────────
  console.log('1. Testing User Registration...');
  const userA = await User.create({
    name: 'Persistence Tester A',
    email: testEmail,
    password,
  });
  assert(userA.id, 'User A must have an ID');
  assert.strictEqual(userA.email, testEmail.toLowerCase());
  console.log(`   ✅ User A created: ${userA.id} (${userA.email})`);

  // Verify finding by email and password verification
  const foundUser = User.findByEmail(testEmail);
  assert(foundUser, 'User must be found by email');
  assert(foundUser.password_hash, 'User record must have password hash');
  assert(foundUser.password_hash !== password, 'Password must be hashed, not plaintext');
  const passwordValid = await User.verifyPassword(password, foundUser.password_hash);
  assert.strictEqual(passwordValid, true, 'Password verification must succeed');
  console.log('   ✅ Password hash verified with bcryptjs');

  // ─── 2. Categories ──────────────────────────────────────────────────────────
  console.log('\n2. Testing Category Model...');
  const categoriesA = Category.findAllForUser(userA.id);
  assert(categoriesA.length >= 10, 'Should have at least 10 default categories');
  console.log(`   ✅ Found ${categoriesA.length} categories (including system defaults)`);

  const customCat = Category.create({
    name: `Custom Cat ${Date.now()}`,
    icon: '🚀',
    color: '#8b5cf6',
    userId: userA.id,
  });
  assert(customCat.id, 'Custom category must be created');
  console.log(`   ✅ Custom category created: ${customCat.name}`);

  // ─── 3. Transactions (Integer Paise) ────────────────────────────────────────
  console.log('\n3. Testing Transactions & Integer Paise...');
  const tx1 = Transaction.create({
    userId: userA.id,
    type: 'INCOME',
    title: 'Client Payment',
    amount: 15000000, // 1,50,000 INR = 15,000,000 paise
    categoryId: null,
    date: '2026-10-01',
    notes: 'Contract Milestone 1',
  });
  assert.strictEqual(tx1.amount, 15000000);
  console.log(`   ✅ Created Income transaction: ₹${tx1.amount / 100} (${tx1.amount} paise)`);

  const tx2 = Transaction.create({
    userId: userA.id,
    type: 'EXPENSE',
    title: 'Cloud Infrastructure Hosting',
    amount: 250000, // 2,500 INR = 250,000 paise
    categoryId: customCat.id,
    date: '2026-10-02',
    notes: 'Monthly server bill',
  });
  assert.strictEqual(tx2.amount, 250000);
  console.log(`   ✅ Created Expense transaction: ₹${tx2.amount / 100} (${tx2.amount} paise)`);

  // ─── 4. Budgets ─────────────────────────────────────────────────────────────
  console.log('\n4. Testing Budgets...');
  const budget1 = Budget.upsert({
    userId: userA.id,
    categoryId: customCat.id,
    month: '2026-10',
    limitAmount: 500000, // 5,000 INR limit = 500,000 paise
  });
  assert(budget1, 'Budget must be created/retrieved');
  assert.strictEqual(budget1.limitAmount, 500000);
  assert.strictEqual(budget1.spentAmount, 250000);
  assert.strictEqual(budget1.remainingAmount, 250000);
  assert.strictEqual(budget1.percentageUsed, 50);
  assert.strictEqual(budget1.isOverspent, false);
  console.log(`   ✅ Budget progress: ₹${budget1.spentAmount / 100} / ₹${budget1.limitAmount / 100} (50%)`);

  // ─── 5. Audit Log ───────────────────────────────────────────────────────────
  console.log('\n5. Testing Audit Log...');
  const logEntry = AuditLog.log({
    userId: userA.id,
    action: 'TEST_PERSISTENCE',
    metadata: { test: true },
    ip: '127.0.0.1',
  });
  assert(logEntry.id, 'Audit log entry must be created');
  console.log(`   ✅ Audit log recorded: ${logEntry.action} (id: ${logEntry.id})`);

  // ─── 6. User Isolation Verification ─────────────────────────────────────────
  console.log('\n6. Testing User Data Isolation...');
  const userB = await User.create({
    name: 'Persistence Tester B',
    email: otherEmail,
    password,
  });

  const userBTransactions = Transaction.findAll(userB.id);
  assert.strictEqual(userBTransactions.transactions.length, 0, 'User B must see 0 transactions');

  const userBBudgets = Budget.getBudgetProgress(userB.id, '2026-10');
  assert.strictEqual(userBBudgets.length, 0, 'User B must see 0 budgets');

  const crossTx = Transaction.findById(tx1.id, userB.id);
  assert.strictEqual(crossTx, undefined, 'User B must NOT be able to access User A transaction');
  console.log('   ✅ Confirmed: User B has zero access to User A records');

  // ─── 7. SIMULATE RESTART: Close DB Connection ──────────────────────────────
  console.log('\n7. Simulating Server Restart (Closing SQLite DB Connection)...');
  closeDb();
  console.log('   ✅ SQLite connection completely closed.');

  // ─── 8. REOPEN & VERIFY PERSISTENCE ─────────────────────────────────────────
  console.log('\n8. Reopening Database (New Process/Connection)...');
  const reopenedDb = getDb();
  assert(reopenedDb, 'Database connection must be re-established');

  // Verify User A exists
  const reloadedUserA = User.findById(userA.id);
  assert(reloadedUserA, 'User A must still exist in DB after restart');
  assert.strictEqual(reloadedUserA.name, userA.name);
  console.log('   ✅ User A verified after restart');

  // Verify Category exists
  const reloadedCat = Category.findById(customCat.id, userA.id);
  assert(reloadedCat, 'Custom category must still exist in DB after restart');
  assert.strictEqual(reloadedCat.name, customCat.name);
  console.log('   ✅ Custom Category verified after restart');

  // Verify Transactions exist and match
  const reloadedTx1 = Transaction.findById(tx1.id, userA.id);
  assert(reloadedTx1, 'Transaction 1 must still exist after restart');
  assert.strictEqual(reloadedTx1.amount, 15000000);
  assert.strictEqual(reloadedTx1.title, 'Client Payment');

  const reloadedTx2 = Transaction.findById(tx2.id, userA.id);
  assert(reloadedTx2, 'Transaction 2 must still exist after restart');
  assert.strictEqual(reloadedTx2.amount, 250000);
  console.log('   ✅ Both Transactions verified after restart');

  // Verify Budget and its calculated spent amount from transactions
  const reloadedBudget = Budget.findProgressByMonthAndCategory(userA.id, '2026-10', customCat.id);
  assert(reloadedBudget, 'Budget must still exist after restart');
  assert.strictEqual(reloadedBudget.spentAmount, 250000);
  assert.strictEqual(reloadedBudget.limitAmount, 500000);
  console.log('   ✅ Budget and calculated spent verified after restart');

  // Verify Dashboard calculations from DB transactions
  const totals = Transaction.getAllTimeTotals(userA.id);
  assert.strictEqual(totals.total_income, 15000000);
  assert.strictEqual(totals.total_expense, 250000);
  assert.strictEqual(totals.balance, 14750000);
  console.log(`   ✅ Dashboard balance verified from DB: ₹${totals.balance / 100}`);

  // ─── 9. Cleanup Test Data ───────────────────────────────────────────────────
  console.log('\n9. Cleaning up test data...');
  Transaction.delete(tx1.id, userA.id);
  Transaction.delete(tx2.id, userA.id);
  Budget.delete(budget1.id, userA.id);
  Category.delete(customCat.id, userA.id);
  reopenedDb.prepare('DELETE FROM users WHERE id IN (?, ?)').run(userA.id, userB.id);
  reopenedDb.prepare('DELETE FROM audit_log WHERE user_id IN (?, ?)').run(userA.id, userB.id);
  console.log('   ✅ Test records cleaned up.');

  console.log('\n🎉 ALL PERSISTENCE TESTS PASSED SUCCESSFULLY!\n');
}

runPersistenceTest().catch((err) => {
  console.error('\n❌ Persistence test failed:', err);
  process.exit(1);
});
