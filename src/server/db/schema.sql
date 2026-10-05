-- FinTrack Shield — Database Schema
-- All monetary values are stored as INTEGER paise (1 INR = 100 paise).
-- Never use REAL/FLOAT for money.

-- ─── Users ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,          -- UUIDv4
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,      -- case-insensitive (enforced in app)
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ─── Categories ─────────────────────────────────────────────────────────────────
-- user_id NULL = system-default category available to everyone
CREATE TABLE IF NOT EXISTS categories (
  id      TEXT PRIMARY KEY,                -- UUIDv4
  name    TEXT NOT NULL,
  icon    TEXT DEFAULT '📁',
  color   TEXT DEFAULT '#6366f1',
  user_id TEXT,                            -- NULL for defaults, FK for user-custom
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Unique per-user category name (NULL user_id = global)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_name
  ON categories(COALESCE(user_id, '__GLOBAL__'), name);

-- ─── Transactions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          TEXT PRIMARY KEY,            -- UUIDv4
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
  title       TEXT NOT NULL,
  amount      INTEGER NOT NULL CHECK (amount > 0),  -- paise (integer cents)
  category_id TEXT,
  date        TEXT NOT NULL,               -- ISO-8601 date YYYY-MM-DD
  notes       TEXT DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user   ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date   ON transactions(user_id, date);

-- ─── Budgets ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id           TEXT PRIMARY KEY,           -- UUIDv4
  user_id      TEXT NOT NULL,
  category_id  TEXT,                       -- NULL = total budget for the month
  month        TEXT NOT NULL,              -- YYYY-MM
  limit_amount INTEGER NOT NULL CHECK (limit_amount > 0),  -- paise
  FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  UNIQUE(user_id, category_id, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- ─── Audit Log ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id        TEXT PRIMARY KEY,              -- UUIDv4
  user_id   TEXT,                          -- NULL for unauthenticated actions
  action    TEXT NOT NULL,                 -- e.g. 'SIGNUP', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED'
  metadata  TEXT DEFAULT '{}',             -- JSON string with extra context
  ip        TEXT DEFAULT '',
  timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_user   ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
