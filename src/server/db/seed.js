/**
 * FinTrack Shield — Database Seed Script
 *
 * Seeds:
 * 1. Default categories (system-wide, user_id = NULL)
 * 2. Demo user account (demo@fintrack.local, role: 'USER' - development only via DEMO_USER_PASSWORD)
 * 3. Admin user account (admin@fintrack.local, role: 'ADMIN' - development only via ADMIN_PASSWORD)
 * 4. Realistic demo transactions & budgets for the demo account
 * 5. Corresponding immutable audit log trail
 *
 * Run with: npm run seed
 */

require('../config'); // Load environment configuration
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getDb, closeDb } = require('./database');

const SALT_ROUNDS = 12;

const DEFAULT_CATEGORIES = [
  { name: 'Salary',            icon: '💰', color: '#22c55e' },
  { name: 'Food & Dining',     icon: '🍔', color: '#f97316' },
  { name: 'Transport',         icon: '🚗', color: '#3b82f6' },
  { name: 'Shopping',          icon: '🛒', color: '#a855f7' },
  { name: 'Bills & Utilities', icon: '📄', color: '#ef4444' },
  { name: 'Entertainment',     icon: '🎬', color: '#ec4899' },
  { name: 'Health',             icon: '🏥', color: '#14b8a6' },
  { name: 'Education',          icon: '📚', color: '#6366f1' },
  { name: 'Investments',        icon: '📈', color: '#eab308' },
  { name: 'Other',              icon: '📁', color: '#64748b' },
];

async function seed(options = {}) {
  const db = getDb();
  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const isProduction = (options.nodeEnv || process.env.NODE_ENV) === 'production';

  // Demo credentials must be read strictly from environment variables
  const demoPassword = options.demoPassword !== undefined ? options.demoPassword : process.env.DEMO_USER_PASSWORD;
  const adminPassword = options.adminPassword !== undefined ? options.adminPassword : process.env.ADMIN_PASSWORD;

  // 1. Insert default categories
  const insertCat = db.prepare(
    `INSERT OR IGNORE INTO categories (id, name, icon, color, user_id)
     VALUES (?, ?, ?, ?, NULL)`
  );

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      insertCat.run(uuidv4(), cat.name, cat.icon, cat.color);
    }
    db.exec('COMMIT;');
    console.log(`✅ Seeded ${DEFAULT_CATEGORIES.length} default categories.`);
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  // Lookup categories by name
  const catRows = db.prepare('SELECT id, name FROM categories WHERE user_id IS NULL').all();
  const catMap = {};
  for (const c of catRows) {
    catMap[c.name] = c.id;
  }

  // Enforce seeding rules:
  // In production, never create demo or administrative accounts
  if (isProduction) {
    console.log('🔒 Production mode: Demo and administrator account creation is strictly disabled.');
  } else {
    // In development, if required credentials are missing, stop with a clear setup message
    if (!demoPassword || !adminPassword) {
      const missing = [];
      if (!demoPassword) missing.push('DEMO_USER_PASSWORD');
      if (!adminPassword) missing.push('ADMIN_PASSWORD');
      const setupMsg = `Database seeding stopped: Missing required environment variable(s): ${missing.join(', ')}.\n` +
        `Please set ${missing.join(' and ')} in your environment or src/.env before seeding development accounts.`;
      console.error(`❌ ${setupMsg}`);
      throw new Error(setupMsg);
    }
  }

  // 2. Demo User Account (development only, when credentials supplied via env)
  let demoUser = null;
  if (!isProduction && demoPassword) {
    demoUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@fintrack.local');
    if (!demoUser) {
      const hash = await bcrypt.hash(demoPassword, SALT_ROUNDS);
      const demoId = uuidv4();
      db.prepare(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES (?, ?, ?, ?, ?)`
      ).run(demoId, 'Demo User', 'demo@fintrack.local', hash, 'USER');
      demoUser = { id: demoId };
      console.log('✅ Demo account created: demo@fintrack.local');

      db.prepare(
        `INSERT INTO audit_log (id, user_id, action, metadata)
         VALUES (?, ?, ?, ?)`
      ).run(uuidv4(), demoId, 'SEED_DEMO_ACCOUNT', JSON.stringify({ note: 'Auto-seeded user for testing' }));
    } else {
      console.log('ℹ️  Demo account already exists.');
    }
  }

  // 3. Admin Account (development only, when credentials supplied via env)
  let adminUser = null;
  if (!isProduction && adminPassword) {
    adminUser = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@fintrack.local');
    if (!adminUser) {
      const adminHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      const adminId = uuidv4();
      db.prepare(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES (?, ?, ?, ?, ?)`
      ).run(adminId, 'Security Admin', 'admin@fintrack.local', adminHash, 'ADMIN');
      adminUser = { id: adminId };
      console.log('✅ Admin account created: admin@fintrack.local');

      db.prepare(
        `INSERT INTO audit_log (id, user_id, action, metadata)
         VALUES (?, ?, ?, ?)`
      ).run(uuidv4(), adminId, 'SEED_ADMIN_ACCOUNT', JSON.stringify({ note: 'Auto-seeded administrator' }));
    } else {
      console.log('ℹ️  Admin account already exists.');
    }
  }


  // 4. Sample Transactions for Demo User (if demo user exists and none exist)
  if (demoUser && demoUser.id) {
    const existingTx = db.prepare('SELECT COUNT(*) AS count FROM transactions WHERE user_id = ?').get(demoUser.id);
    if (existingTx.count === 0) {
      const sampleTxs = [
        {
          type: 'INCOME',
          title: 'Monthly Salary Credit',
          amount: 8500000, // ₹85,000.00 in paise
          categoryId: catMap['Salary'] || null,
          date: `${currentMonth}-01`,
          notes: 'Direct employer bank deposit',
        },
        {
          type: 'EXPENSE',
          title: 'Organic Food Market',
          amount: 425000, // ₹4,250.00
          categoryId: catMap['Food & Dining'] || null,
          date: `${currentMonth}-02`,
          notes: 'Weekly fresh groceries',
        },
        {
          type: 'EXPENSE',
          title: 'City Metro Transit Card',
          amount: 150000, // ₹1,500.00
          categoryId: catMap['Transport'] || null,
          date: `${currentMonth}-03`,
          notes: 'Monthly public transport pass',
        },
        {
          type: 'EXPENSE',
          title: 'High-Speed Fiber Broadband',
          amount: 189900, // ₹1,899.00
          categoryId: catMap['Bills & Utilities'] || null,
          date: `${currentMonth}-04`,
          notes: 'Home internet subscription',
        },
        {
          type: 'EXPENSE',
          title: 'Weekend Bistro Dining',
          amount: 285000, // ₹2,850.00
          categoryId: catMap['Food & Dining'] || null,
          date: `${currentMonth}-05`,
          notes: 'Dinner with colleagues',
        },
      ];

      const insertTx = db.prepare(
        `INSERT INTO transactions (id, user_id, type, title, amount, category_id, date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const tx of sampleTxs) {
        insertTx.run(uuidv4(), demoUser.id, tx.type, tx.title, tx.amount, tx.categoryId, tx.date, tx.notes);
      }
      console.log(`✅ Seeded ${sampleTxs.length} sample transactions for demo user.`);
    }

    // 5. Sample Budgets for Demo User (if none exist)
    const existingBudgets = db.prepare('SELECT COUNT(*) AS count FROM budgets WHERE user_id = ? AND month = ?').get(demoUser.id, currentMonth);
    if (existingBudgets.count === 0) {
      const sampleBudgets = [
        {
          categoryId: catMap['Food & Dining'] || null,
          limitAmount: 1200000, // ₹12,000.00
        },
        {
          categoryId: catMap['Transport'] || null,
          limitAmount: 400000, // ₹4,000.00
        },
        {
          categoryId: catMap['Bills & Utilities'] || null,
          limitAmount: 600000, // ₹6,000.00
        },
      ];

      const insertBudget = db.prepare(
        `INSERT INTO budgets (id, user_id, category_id, month, limit_amount)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(user_id, category_id, month) DO UPDATE SET limit_amount = excluded.limit_amount`
      );

      for (const b of sampleBudgets) {
        insertBudget.run(uuidv4(), demoUser.id, b.categoryId, currentMonth, b.limitAmount);
      }
      console.log(`✅ Seeded ${sampleBudgets.length} monthly budgets for demo user.`);
    }
  }

  if (options.autoClose !== false) {
    closeDb();
  }
  console.log('🌱 Seed complete.');
}

if (require.main === module) {
  seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}

module.exports = { seed };

