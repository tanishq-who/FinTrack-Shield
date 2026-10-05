# FinTrack Shield — Secure Personal Finance Management
**Build Secure 24 Hackathon — Abhedya (VBIT Cybersecurity Forum)**
**Problem Statement:** PS-01 — Personal Finance Management

FinTrack Shield is a secure, hardened personal finance platform engineered for zero-trust client environments. It guarantees complete user data isolation, exact integer-precision accounting, and comprehensive security auditing.

---

## 1. Core Features & Capabilities

1. **Authentication & Session Security**:
   - Secure registration and login with bcrypt password hashing (12 salt rounds).
   - Stateless signed JWT tokens (`Authorization: Bearer <token>`) with automatic client injection.
   - Generic error messages on login failures preventing account enumeration.
   - Session guard redirecting unauthenticated users away from protected pages.

2. **Integer Paise Financial Accounting**:
   - Stores all monetary amounts in integer paise (1 INR = 100 paise; e.g. ₹250.75 = 25075 paise).
   - Completely eliminates floating-point rounding errors and precision vulnerabilities.

3. **Transaction Management & CSV/JSON Export**:
   - Create, read, update, and delete income and expense records.
   - Real-time text search, type filter, category filter, date range, and amount range filtering.
   - Sorting and pagination.
   - One-click secure CSV export (`GET /api/transactions/export?format=csv`) and JSON export.

4. **Monthly Category Budgets**:
   - Monthly category spending limits and progress tracking.
   - Live calculations for spent amount, remaining amount, percentage utilized, and overspent status.

5. **Live Dashboard & Insights**:
   - Dynamic calculations derived from database transactions (total net balance, monthly income, monthly expenses, savings rate, 6-month historical cashflow trends, and category spending breakdown).
   - Event-driven frontend state synchronization (`fintrack:transactions-updated`).

6. **Defense-in-Depth Security & IDOR Prevention**:
   - Enforces `WHERE user_id = req.user.id` on every database query.
   - Zero Insecure Direct Object References (IDOR): Users can never read, modify, or delete another user's records.
   - System default categories are globally accessible but strictly read-only for standard users.

7. **Role-Based Access Control (RBAC) & Audit Center**:
   - Two distinct roles: `USER` and `ADMIN`.
   - Security Administrator console (`GET /api/admin/*`) providing live system telemetry, registered user list, and immutable audit logs.
   - Append-only audit trail logging `SIGNUP`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `TRANSACTION_CREATE`, and `BUDGET_UPDATE`.

8. **Crash-Resilient SQLite Persistence**:
   - Powered by Node.js 24 native `node:sqlite` (`DatabaseSync`) storing data permanently at `src/data/fintrack.db`.
   - Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and Foreign Key enforcement (`PRAGMA foreign_keys = ON;`).
   - Zero native C++ compilation needed (bypasses Windows MSBuild/Visual Studio toolchain requirements).

9. **Mandatory PS-01 Profile Management & User-Ownership Protection**:
   - Authenticated users can view their profile identity (`GET /api/auth/me`) with safe projection (hiding password hash).
   - Authenticated users can securely update their own profile details (`PUT /api/auth/me`), including full name and notification email.
   - Strict user-ownership protection: Derives user identity exclusively from cryptographically verified JWT (`req.user.id`). Arbitrary client user ID parameters are completely ignored.
   - Input validation: Minimum 2 to 100 characters for name, strict RFC email regex validation.
   - Cross-user duplicate conflict prevention: 409 Conflict returned if another account holds the email, while permitting users to retain their existing email without error.
   - Refreshed JWT token issued upon profile update with updated claims.
   - Security audit logging: Every profile modification is recorded as `PROFILE_UPDATE` in the immutable audit trail.
   - Responsive user profile modal (`ProfileModal.jsx`) triggered from both Sidebar avatar and Navbar profile controls.

---

## 2. Repository Layout

```
├── AGENTS.md                  ← AI agent behavioral contract & logging gate (Trust Root)
├── README.md                  ← Project documentation & getting started guide
├── PARTICIPANT_RULES.md       ← Competition rules
│
├── docs/                      ← Autonomous documentation layer
│   ├── APPROACH.md            ← Architecture decisions, threat model & engineering journal
│   └── logs.txt               ← Turn-by-turn prompt, file location & timeline log
│
├── metadata/                  ← Submission metadata
│   ├── team.yaml              ← Team information (2 or 4 members)
│   └── submission.yaml        ← Final submission details
│
├── src/                       ← Application source code
│   ├── config.js              ← Central configuration
│   ├── server.js              ← Express API server entry
│   ├── db/                    ← SQLite schema, initialization, and seed scripts
│   ├── models/                ← Data models (User, Transaction, Category, Budget, AuditLog)
│   ├── routes/                ← REST API routes (auth, transactions, budgets, categories, dashboard, admin, health)
│   ├── middleware/            ← Security middlewares (auth, validation, audit)
│   ├── test/                  ← Test suites (backend-test.js, e2e-verify.js, persistence-verify.js)
│   └── frontend/              ← React 18 + Vite frontend application
│
└── deployment/                ← Deployment configuration & operational guide
    └── README.md              ← Deployment record & evaluator instructions
```

---

## 3. Quick Start & Local Execution

### 1. Prerequisites
- **Node.js**: v22+ or v24+
- **NPM**: v10+

### 2. Setup & Seed Database
```powershell
# In project root:
cd src
npm install
node server/db/seed.js
```
*Creates `src/data/fintrack.db` and seeds default categories, sample transactions, demo account, and admin account.*

### 3. Launch Services

#### Terminal 1 — Backend API (Port 3001)
```powershell
cd src
node server.js
```

#### Terminal 2 — Frontend Application (Port 3000)
```powershell
cd src/frontend
npm install
npm run dev
```

Open your browser at: **`http://localhost:3000`**

---

## 4. Evaluator Test Accounts

| Account | Email | Password | Role | Description |
|---------|-------|----------|------|-------------|
| **Demo User** | `demo@fintrack.local` | Sourced from `DEMO_USER_PASSWORD` | `USER` | Pre-loaded with current-month salary credit, expense transactions, and category budgets. |
| **Security Admin** | `admin@fintrack.local` | Sourced from `ADMIN_PASSWORD` | `ADMIN` | Privileged access to Security & Audit Center (`/admin`), user registry, and system audit trail. |

*(You can also click **Register** to create a fresh user account).*

---

## 5. Automated Verification Test Suites

Run all automated test suites to verify system integrity:

```powershell
cd src

# 1. API, Security & Profile Tests (64 checks: IDOR, paise math, JWT, validation, profile ownership)
node test/backend-test.js

# 2. Complete End-to-End Verification (12 functional & security checks)
node test/e2e-verify.js

# 3. PS-01 Dedicated Profile Management & Security Test Suite
node test/profile-test.js

# 4. Database Persistence Across Restart Test
node test/persistence-verify.js

# 5. Frontend Production Build Check
cd frontend
cmd.exe /c "npm run build"
```

**Verification Status:**
- `backend-test.js`: **64 PASSED, 0 FAILED** (100%)
- `e2e-verify.js`: **12 PASSED, 0 FAILED** (100%)
- `profile-test.js`: **ALL PS-01 PROFILE MANAGEMENT CHECKS PASSED** (100%)
- `persistence-verify.js`: **ALL PERSISTENCE CHECKS PASSED**
- `npm run build`: **68 modules transformed, 0 errors** in 12s
