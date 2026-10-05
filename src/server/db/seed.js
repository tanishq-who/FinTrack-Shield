/**
 * FinTrack Shield — Database Seed Script
 *
 * Seeds default categories and an optional demo account for local testing.
 * Run with: npm run seed
 *
 * Demo account (dev only):
 *   email:    demo@fintrack.local
 *   password: Demo@1234
 */

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

async function seed() {
  const db = getDb();

  // Insert default categories (user_id = NULL → available to all users)
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

  // Demo account — for local testing
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@fintrack.local');
  if (!existing) {
    const hash = await bcrypt.hash('Demo@1234', SALT_ROUNDS);
    const demoId = uuidv4();
    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`
    ).run(demoId, 'Demo User', 'demo@fintrack.local', hash, 'USER');
    console.log('✅ Demo account created: demo@fintrack.local / Demo@1234');

    // Audit log the seed action
    db.prepare(
      `INSERT INTO audit_log (id, user_id, action, metadata)
       VALUES (?, ?, ?, ?)`
    ).run(uuidv4(), demoId, 'SEED_DEMO_ACCOUNT', JSON.stringify({ note: 'Auto-seeded for testing' }));
  } else {
    console.log('ℹ️  Demo account already exists, skipping.');
  }

  closeDb();
  console.log('🌱 Seed complete.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
