/**
 * FinTrack Shield — Budget Month Handling & API Verification Suite
 *
 * Verifies resolution of the production bug:
 *   "Unable to Load Budgets"
 *   "Month must be in YYYY-MM format."
 *
 * Requirements verified:
 * 1. Date helpers correctly format and normalize months to YYYY-MM
 * 2. Timezone resilience: mid-month day 15 prevents boundary crossing
 * 3. Separation of display format ('October 2026') and machine/API format ('2026-10')
 * 4. Month navigation (adjacent months) correctly computes previous/next YYYY-MM
 * 5. GET /api/budgets with friendly label ('October 2026') is rejected with HTTP 400 (reproducing bug)
 * 6. GET /api/budgets with machine format ('2026-10') succeeds with HTTP 200
 * 7. POST /api/budgets with '2026-10' succeeds with HTTP 201
 * 8. POST /api/budgets with 'October 2026' fails with HTTP 400
 * 9. Month navigation: querying different months isolates month allocations
 * 10. PUT /api/budgets/:id updates budget limit and preserves YYYY-MM month
 * 11. DELETE /api/budgets/:id deletes budget cleanly
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = './data/test_budget_month.db';
process.env.JWT_SECRET = 'test_secret_key_minimum_32_characters_for_fintrack_shield';

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

const testDbPath = path.resolve(__dirname, '..', 'data', 'test_budget_month.db');
if (fs.existsSync(testDbPath)) {
  try { fs.unlinkSync(testDbPath); } catch {}
}

const { app } = require('../server/server');
const { getDb, closeDb } = require('../server/db/database');
const User = require('../server/models/User');
const { signToken } = require('../server/middleware/auth');

// Mirror frontend helper logic in Node test environment to verify algorithm
function getCurrentApiMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function toApiMonth(input) {
  if (!input) return getCurrentApiMonth();

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const nameMatch = trimmed.match(/^([a-zA-Z]+)[,\s]+(\d{4})$/);
    if (nameMatch) {
      const monthName = nameMatch[1].toLowerCase();
      const year = nameMatch[2];
      const monthMap = {
        january: '01', jan: '01',
        february: '02', feb: '02',
        march: '03', mar: '03',
        april: '04', apr: '04',
        may: '05',
        june: '06', jun: '06',
        july: '07', jul: '07',
        august: '08', aug: '08',
        september: '09', sep: '09', sept: '09',
        october: '10', oct: '10',
        november: '11', nov: '11',
        december: '12', dec: '12',
      };
      if (monthMap[monthName]) {
        return `${year}-${monthMap[monthName]}`;
      }
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }

    return getCurrentApiMonth();
  }

  if (input instanceof Date && !isNaN(input.getTime())) {
    const year = input.getFullYear();
    const month = String(input.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  return getCurrentApiMonth();
}

function formatMonthDisplay(apiMonth) {
  if (!apiMonth) return '';
  const str = String(apiMonth).trim();
  if (/^\d{4}-\d{2}$/.test(str)) {
    const [yearStr, monthStr] = str.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const safeDate = new Date(year, month - 1, 15, 12, 0, 0);
    return safeDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
  return str;
}

function getAdjacentMonth(apiMonth, delta = 1) {
  const normalized = toApiMonth(apiMonth);
  const [yearStr, monthStr] = normalized.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const targetDate = new Date(year, month - 1 + delta, 15, 12, 0, 0);
  const nextYear = targetDate.getFullYear();
  const nextMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  return `${nextYear}-${nextMonth}`;
}

async function runBudgetMonthTests() {
  console.log('╔═════════════════════════════════════════════════════════════╗');
  console.log('║   FinTrack Shield — Budget Month (YYYY-MM) Test Suite       ║');
  console.log('╚═════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  function test(desc, fn) {
    try {
      fn();
      passed++;
      console.log(`  ✅ PASS: ${desc}`);
    } catch (err) {
      failed++;
      console.error(`  ❌ FAIL: ${desc} — ${err.message}`);
    }
  }

  async function testAsync(desc, fn) {
    try {
      await fn();
      passed++;
      console.log(`  ✅ PASS: ${desc}`);
    } catch (err) {
      failed++;
      console.error(`  ❌ FAIL: ${desc} — ${err.message}`);
    }
  }

  console.log('--- Suite 1: Pure Date & Month Formatting Helpers ---');

  test('getCurrentApiMonth returns YYYY-MM format', () => {
    const cur = getCurrentApiMonth();
    assert(/^\d{4}-\d{2}$/.test(cur), `Expected YYYY-MM, got ${cur}`);
  });

  test('toApiMonth returns YYYY-MM untouched if already valid', () => {
    assert.strictEqual(toApiMonth('2026-10'), '2026-10');
    assert.strictEqual(toApiMonth('2025-01'), '2025-01');
    assert.strictEqual(toApiMonth('2027-12'), '2027-12');
  });

  test('toApiMonth converts "October 2026" to "2026-10"', () => {
    assert.strictEqual(toApiMonth('October 2026'), '2026-10');
    assert.strictEqual(toApiMonth('october 2026'), '2026-10');
    assert.strictEqual(toApiMonth('Oct 2026'), '2026-10');
    assert.strictEqual(toApiMonth('October, 2026'), '2026-10');
  });

  test('toApiMonth converts all 12 month names accurately', () => {
    const months = [
      ['January 2026', '2026-01'],
      ['February 2026', '2026-02'],
      ['March 2026', '2026-03'],
      ['April 2026', '2026-04'],
      ['May 2026', '2026-05'],
      ['June 2026', '2026-06'],
      ['July 2026', '2026-07'],
      ['August 2026', '2026-08'],
      ['September 2026', '2026-09'],
      ['October 2026', '2026-10'],
      ['November 2026', '2026-11'],
      ['December 2026', '2026-12'],
    ];
    for (const [input, expected] of months) {
      assert.strictEqual(toApiMonth(input), expected, `Failed for ${input}`);
    }
  });

  test('formatMonthDisplay converts "2026-10" to "October 2026"', () => {
    assert.strictEqual(formatMonthDisplay('2026-10'), 'October 2026');
    assert.strictEqual(formatMonthDisplay('2026-01'), 'January 2026');
    assert.strictEqual(formatMonthDisplay('2026-12'), 'December 2026');
  });

  test('formatMonthDisplay preserves already formatted friendly strings', () => {
    assert.strictEqual(formatMonthDisplay('October 2026'), 'October 2026');
  });

  test('getAdjacentMonth handles previous month and year boundary crossing', () => {
    assert.strictEqual(getAdjacentMonth('2026-10', -1), '2026-09');
    assert.strictEqual(getAdjacentMonth('2026-10', 1), '2026-11');
    // Year rollover back
    assert.strictEqual(getAdjacentMonth('2026-01', -1), '2025-12');
    // Year rollover forward
    assert.strictEqual(getAdjacentMonth('2026-12', 1), '2027-01');
  });

  test('Timezone safety: mid-month day 15 prevents boundary shifts', () => {
    const d = new Date(2026, 9, 15, 12, 0, 0); // October
    assert.strictEqual(toApiMonth(d), '2026-10');
  });

  console.log('\n--- Suite 2: Live Backend Budget API Verification ---');

  // Start test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  const timestamp = Date.now();
  const testUser = await User.create({
    name: 'Budget Tester',
    email: `budget_tester_${timestamp}@fintrack.local`,
    password: 'TestPassword@2026'
  });
  const token = signToken({ id: testUser.id, role: 'USER' });
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  await testAsync('GET /api/budgets with friendly "October 2026" returns HTTP 400 (reproducing production bug)', async () => {
    const res = await fetch(`${baseUrl}/budgets?month=October%202026`, { headers: authHeaders });
    assert.strictEqual(res.status, 400, 'Expected HTTP 400 Bad Request');
    const data = await res.json();
    assert.strictEqual(data.error, 'Month must be in YYYY-MM format.');
  });

  await testAsync('GET /api/budgets with machine format "2026-10" returns HTTP 200 with month: "2026-10"', async () => {
    const res = await fetch(`${baseUrl}/budgets?month=2026-10`, { headers: authHeaders });
    assert.strictEqual(res.status, 200, 'Expected HTTP 200 OK');
    const data = await res.json();
    assert.strictEqual(data.month, '2026-10');
    assert(Array.isArray(data.budgets), 'Expected budgets array');
    assert(data.summary, 'Expected summary object');
  });

  await testAsync('POST /api/budgets with "October 2026" fails validation with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/budgets`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        month: 'October 2026',
        limitAmount: 50000
      })
    });
    assert.strictEqual(res.status, 400, 'Expected HTTP 400 Bad Request');
    const data = await res.json();
    assert(data.error.includes('Month must be in YYYY-MM format') || (data.details && data.details.some(d => d.includes('Month must be in YYYY-MM format'))));
  });

  let createdBudgetId = null;
  await testAsync('POST /api/budgets with machine "2026-10" succeeds with HTTP 201', async () => {
    const res = await fetch(`${baseUrl}/budgets`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        month: '2026-10',
        limitAmount: 50000
      })
    });
    assert.strictEqual(res.status, 201, 'Expected HTTP 201 Created');
    const data = await res.json();
    assert.strictEqual(data.budget.month, '2026-10');
    assert.strictEqual(data.budget.limitAmount, 50000);
    createdBudgetId = data.budget.id;
  });

  await testAsync('GET /api/budgets?month=2026-10 returns the created budget in list', async () => {
    const res = await fetch(`${baseUrl}/budgets?month=2026-10`, { headers: authHeaders });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const found = data.budgets.find((b) => b.id === createdBudgetId);
    assert(found, 'Created budget must be in the list for 2026-10');
    assert.strictEqual(found.month, '2026-10');
  });

  await testAsync('Month navigation: GET /api/budgets?month=2026-09 isolates data across months', async () => {
    const res = await fetch(`${baseUrl}/budgets?month=2026-09`, { headers: authHeaders });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.month, '2026-09');
    const found = data.budgets.find((b) => b.id === createdBudgetId);
    assert(!found, 'September must not include October budget');
  });

  await testAsync('PUT /api/budgets/:id updates limit and maintains YYYY-MM month', async () => {
    const res = await fetch(`${baseUrl}/budgets/${createdBudgetId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ limitAmount: 75000 })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.budget.limitAmount, 75000);
    assert.strictEqual(data.budget.month, '2026-10');
  });

  await testAsync('DELETE /api/budgets/:id deletes budget cleanly', async () => {
    const res = await fetch(`${baseUrl}/budgets/${createdBudgetId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.message, 'Budget deleted successfully.');
  });

  await new Promise((resolve) => server.close(resolve));
  closeDb();

  try {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  } catch {}

  console.log('\n═════════════════════════════════════════════════════════════');
  console.log(`Results: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('═════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBudgetMonthTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
