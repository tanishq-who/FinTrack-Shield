# Project Approach & Architecture — Build Secure 24

**Team ID:** team-yp
**Project Name:** FinTrack Shield — Secure Personal Finance Management
**Team Size:** 2 Members (yagnapriya, tanishq)
**Primary Track / Domain:** PS-01 Personal Finance

---

## 1. Problem Understanding, Scope & Threat Model

### 1.1 Problem Statement & Real-World Motivation
Personal finance applications handle sensitive financial records, income, expenses, categories, and spending habits. A data breach or unauthorized modification can lead to financial fraud, privacy loss, and severe security compromises. FinTrack Shield provides a privacy-first, secure personal finance tracker that allows users to record transactions, configure monthly budgets, and analyze spending while enforcing defense-in-depth security controls.

### 1.2 Target Users & Personas
- **End User (role: USER):** Individuals tracking personal income/expenses, setting monthly budgets, and viewing spending insights. Trust level: authenticated, self-scoped data only.
- **Admin (role: ADMIN):** System administrators who can view audit logs and manage system health. Trust level: elevated, but strictly subject to audit logging.

### 1.3 Threat Model & Attack Surface
- **Critical Assets:** User credentials (password hashes), PII (name, email), financial transaction records, session tokens (JWT), audit logs.
- **Potential Attack Vectors:**
  - Credential stuffing & brute-force login attacks
  - SQL injection via unsanitized user inputs
  - Insecure Direct Object References (IDOR) to access or alter another user's financial records
  - Unauthorized modification of system default categories
  - Privilege escalation (USER → ADMIN)
  - Floating-point precision loss and arithmetic rounding exploits
- **OWASP Top 10 Security Controls:**
  1. **A01 Broken Access Control / IDOR Prevention:** Strict row-level user scoping (`WHERE user_id = ?`) on every query. Server ignores client-supplied userIds and derives identity exclusively from the verified JWT payload.
  2. **A02 Cryptographic Failures:** `bcryptjs` (12 rounds) salted password hashing. Stateless JWT signed with HS256 and 8h lifetime.
  3. **A03 Injection:** Parameterized SQL queries via `node:sqlite` prepared statements. Zero string concatenation.
  4. **A04 Insecure Design:** Defense-in-depth with Helmet HTTP security headers, CORS origin restrictions, and rate limiting (100 req / 15 min).
  5. **A07 Auth Failures:** Generic login error messages preventing user enumeration. Failed login audit logging.
  6. **A09 Logging & Monitoring:** Immutable, append-only `audit_log` recording every authentication, transaction, and budget event.

---

## 2. Technical Architecture & Secure System Design

### 2.1 High-Level Architecture Overview
```
┌────────────────────────┐     ┌────────────────────────┐     ┌──────────────────────┐
│ Teammate's Frontend UI │────▶│ Express API (/api/*)   │────▶│ SQLite DB (WAL Mode) │
│ (Dashboard, Charts)    │◀────│ Helmet, CORS, RateLimit│◀────│ Node 24 node:sqlite  │
└────────────────────────┘     └────────────────────────┘     └──────────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────────┐
                                   │ Append-Only Audit Log│
                                   └──────────────────────┘
```

### 2.2 Directory Layout & Teammate Isolation
To guarantee zero collisions with the teammate's frontend pages and components, the repository cleanly namespaces server logic:

```text
src/
├── server/                     ← Dedicated backend namespace
│   ├── config.js               ← Centralized environment configuration
│   ├── server.js               ← Express server entrypoint & route mounting
│   ├── db/
│   │   ├── database.js         ← node:sqlite singleton (WAL mode, foreign keys)
│   │   ├── schema.sql          ← Strict SQLite DDL with CHECK constraints
│   │   └── seed.js             ← Default category and demo account seed
│   ├── middleware/
│   │   ├── auth.js             ← JWT verification & USER/ADMIN RBAC
│   │   ├── audit.js            ← Client IP extractor for audit trails
│   │   └── validate.js         ← Server-side request body validator
│   ├── models/
│   │   ├── User.js             ← bcryptjs hashing, UUIDv4, safe lookup
│   │   ├── Transaction.js      ← Integer paise, search, filters, pagination
│   │   ├── Category.js         ← Global defaults + user-custom categories
│   │   ├── Budget.js           ← Monthly budget limits in integer paise + progress
│   │   └── AuditLog.js         ← Immutable event logger
│   └── routes/
│       ├── auth.js             ← Register, login, logout, me
│       ├── categories.js       ← Categories listing, create, update, delete
│       ├── transactions.js     ← Transaction CRUD, search, filters, sorting, pagination
│       ├── budgets.js          ← Budget CRUD, progress metrics & overspent calculations
│       ├── dashboard.js        ← Dashboard summary metrics & analytics
│       └── health.js           ← GET /api/health monitoring endpoint
├── shared/
│   └── constants.js            ← Shared roles, paise conversion utilities
└── test/
    └── backend-test.js         ← Automated verification test suite (49 tests)
```

### 2.3 Technology Stack Rationale
- **Backend / API Framework:** Express.js (v4) — Lightweight, battle-tested HTTP server with Helmet, CORS, and rate-limiting middleware.
- **Frontend / Client:** React 18 + Vite — SPA with pure SVG charts, decoupled service layer, dark navy & white surface fintech theme, WCAG AA compliance. Fast bundling, zero heavy chart dependencies, and seamless REST integration.
- **Database & Persistence:** Node.js 24 native `node:sqlite` (`DatabaseSync`) — File-based, zero native compilation, zero external C++ dependencies, synchronous queries eliminating async race conditions, WAL mode for concurrent reads.
- **Authentication & Cryptography:** `bcryptjs` (12 rounds) for salted password hashing + `jsonwebtoken` (HS256) for stateless authentication.

### 2.4 Defense-in-Depth Security Controls
1. **Authentication & Session Security:** Salted bcrypt hashing (12 rounds), short-lived JWT tokens (8h), zero plaintext passwords in responses or logs.
2. **Authorization & Access Control:** Role-based access control (USER / ADMIN), strict row-level object ownership (`user_id` scoping).
3. **Input Validation & Sanitization:** Server-side request validation middleware, parameterized SQL statements, integer paise for all monetary values.
4. **Rate Limiting & Abuse Prevention:** `express-rate-limit` on all `/api/` endpoints (100 req / 15 min window).
5. **Secrets Hygiene:** All sensitive configuration isolated via environment variables (`.env`). Gitignored across all directories.

---

## 3. Implementation Milestones & 24-Hour Timeline

| Milestone / Phase | Time Window | Key Objectives & Deliverables | Security Verification | Status |
|---|---|---|---|---|
| **Phase 1: Foundation & Setup** | 0h – 4h | Onboarding agreement, repo structure, Express server, SQLite DB, models, auth routes, health check | Secret scan & baseline check | `✅ Done` |
| **Phase 2: Core Domain & Auth** | 4h – 12h | Core finance APIs (Categories, Transactions, Budgets, Dashboard Summary) | Automated test suite (49 tests) | `✅ Done` |
| **Phase 3: Security & Hardening**| 12h – 18h | Input validation, IDOR tests, rate limiting, error handling, security middleware, audit trails | Automated test suite & IDOR suite | `✅ Done` |
| **Phase 4: Full-Stack Integration & Polish**| 18h – 24h | Connect Vite React frontend to real backend APIs, live dashboard updates, auth modal, deployment ready | Frontend & backend build & test pass | `✅ Done` |

---

## 4. Architecture Decision Records (ADRs)

### ADR-001: Node 24 Native node:sqlite over better-sqlite3
- **Status:** Accepted
- **Context:** `better-sqlite3` requires a native C++ compiler (Visual Studio / node-gyp), causing installation failures on Windows developer machines without Visual Studio C++ build tools.
- **Options Considered:**
  1. `better-sqlite3` — Fast, but requires external C++ build toolchain.
  2. PostgreSQL / MySQL — Requires running external daemon/server, adding operational complexity.
  3. `node:sqlite` (Node.js 22.5+/24 native `DatabaseSync`) — Built directly into Node.js runtime, zero external dependencies, zero native compilation, full SQLite WAL performance, synchronous API.
- **Decision & Rationale:** Adopted `node:sqlite` (`DatabaseSync`). Provides full relational ACID capabilities and prepared statements with zero setup overhead and zero build failures.
- **Security & Performance Trade-offs:** Eliminates native addon attack surface while maintaining file-based portability.

### ADR-002: Integer Paise for All Monetary Values
- **Status:** Accepted
- **Context:** Financial applications must never use floating-point for money due to IEEE 754 rounding errors (e.g., 0.1 + 0.2 ≠ 0.3).
- **Options Considered:**
  1. Float/REAL columns — Prone to precision and rounding bugs.
  2. Integer paise/cents — Exact integer arithmetic, industry standard.
- **Decision & Rationale:** Store all money as `INTEGER` paise (1 INR = 100 paise) with database-level `CHECK (amount > 0)`.
- **Security & Performance Trade-offs:** Completely eliminates rounding vulnerabilities and financial discrepancies.

### ADR-003: Pure-JavaScript bcryptjs over Native bcrypt
- **Status:** Accepted
- **Context:** Native `bcrypt` requires node-gyp compilation on Windows, which fails without local C++ compilers.
- **Options Considered:**
  1. `bcrypt` — Native C++ binding, compilation dependent.
  2. `bcryptjs` — Pure JavaScript implementation, 100% API compatible, zero build dependencies.
- **Decision & Rationale:** Selected `bcryptjs` with 12 salt rounds for 100% portable, secure password hashing across any operating system.
- **Security & Performance Trade-offs:** Pure JS execution is slightly slower than C++ bindings, which naturally increases resistance to brute-force attacks while remaining under ~250ms per login.

### ADR-004: Clean Backend Namespacing under src/server/
- **Status:** Accepted
- **Context:** Teammates work in parallel on frontend (dashboard, charts, budgets UI) and backend (auth, database, security) in the same repository.
- **Options Considered:**
  1. Mixed flat files in `src/` — High risk of file conflicts and accidentally overwriting teammate components.
  2. Separate `src/server/` and `src/shared/` — Complete separation between backend logic and frontend UI files.
- **Decision & Rationale:** All backend logic is placed inside `src/server/` and shared constants in `src/shared/`. Teammate's frontend files can reside freely in `src/` or `src/client/`.
- **Security & Performance Trade-offs:** Clean trust boundaries and zero merge collisions.

### ADR-005: IDOR Prevention via Strict Row-Level Token Scoping
- **Status:** Accepted
- **Context:** Financial applications are prime targets for Insecure Direct Object Reference (IDOR) attacks, where users change IDs in request parameters to access or delete another user's records.
- **Options Considered:**
  1. Rely on frontend-supplied `userId` — Inherently insecure.
  2. Check ownership in application memory after querying database — Inefficient and error-prone.
  3. Enforce `WHERE user_id = ?` directly in every SQL query using authenticated token claims — Ironclad security.
- **Decision & Rationale:** All data queries (transactions, budgets, custom categories) mandate `user_id = req.user.id`. System default categories (`user_id IS NULL`) are explicitly read-only for standard users.
- **Security & Performance Trade-offs:** Guaranteed data isolation at the persistence layer with zero risk of cross-tenant data leaks.

---

## 5. Engineering Journal & Real-Time Decision Log

### [2026-10-05 12:22 IST] Entry 1: Project Initialization & Scope Lock
- **Focus:** Repository inspection, onboarding, competition rules agreement, team coordination.
- **Key Challenges:** Coordinating parallel frontend/backend work between 2 team members using same repo.
- **Resolution:** Clear file ownership boundaries: backend owns `src/server/`, `src/shared/`. Frontend owns pages/components/styles.

### [2026-10-05 13:00 IST] Entry 2: Backend Foundation & Auth Implementation
- **Focus:** Express server setup, SQLite database with schema, 5 data models, authentication routes, security middleware stack.
- **Key Challenges:** Ensuring integer paise for money, parameterized SQL for injection prevention, generic login errors to prevent enumeration.
- **Resolution:** Complete backend foundation implemented with defense-in-depth: Helmet headers, CORS restriction, rate limiting, bcrypt hashing, JWT auth, input validation, audit logging, and integer-only money storage.

### [2026-10-05 13:55 IST] Entry 3: Node 24 Native node:sqlite Migration & Directory Modularization
- **Focus:** Overcoming Windows native C++ build hurdles by migrating from `better-sqlite3` to Node 24's native `node:sqlite` (`DatabaseSync`) and `bcryptjs`.
- **Key Challenges:** Windows developer environment lacked Visual Studio C++ toolchain for native modules.
- **Resolution:** Converted database connection to native `node:sqlite` and password hashing to `bcryptjs`. Restructured backend into `src/server/` and `src/shared/` for seamless teammate collaboration. Created comprehensive automated verification test suite.

### [2026-10-05 14:10 IST] Entry 4: Implementation of Secure Finance APIs (Categories, Transactions, Budgets, Dashboard)
- **Focus:** Core financial domain implementation with strict IDOR protections, integer paise monetary math, comprehensive filtering/sorting/pagination, budget tracking calculations, and dashboard aggregations.
- **Key Challenges:** Calculating accurate budget progress (spent, remaining, percentage, overspent) in SQL without floating-point math, supporting complex transaction queries (text search, date range, amount range, pagination), and verifying user isolation.
- **Resolution:** Built modular routes for categories, transactions, budgets, and dashboard summary. Verified with 49 automated unit and security tests covering all IDOR attack scenarios.

### [2026-10-05 14:38 IST] Entry 5: Frontend & Backend Full-Stack Integration
- **Focus:** Safely connecting teammate's React 18 / Vite frontend in `src/frontend/` to the real Express/SQLite backend without breaking or redesigning existing UI styles and components.
- **Key Challenges:** Seamless token management across page reloads, converting integer paise into display rupees/dollars, synchronizing real-time dashboard updates across transaction mutations, and gating protected pages while providing demo access.
- **Resolution:** Built centralized `apiClient.js` with Bearer auth injection, 401 handling, and integer paise conversion. Built `authService.js` and `AuthModal.jsx` with full input validation and quick demo account fill. Replaced mock services (`dashboardService.js`, `transactionService.js`, `budgetService.js`, `insightsService.js`, `categoryService.js`) with authenticated REST calls. Updated `App.jsx`, `Layout.jsx`, `Navbar.jsx`, and `Sidebar.jsx` with dynamic user profile information and one-click sign out. Verified clean production build (`vite build` passed in 23s) and test suites.

### [2026-10-05 15:35 IST] Entry 6: Database Persistence & Full Model Verification Across Restarts
- **Focus:** Connecting all five data models (`User`, `Transaction`, `Category`, `Budget`, `AuditLog`) to persistent storage via Node 24 native `node:sqlite`, verifying permanent disk persistence across server restarts, and establishing root forwarding architecture.
- **Key Challenges:** Ensuring seamless import compatibility whether callers require `src/models/` or `src/server/models/`, confirming strict user data isolation at the SQL query level, and validating that dashboard summaries compute purely from persisted database transactions.
- **Resolution:** 
  1. Configured SQLite with Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and enforced relational constraints (`PRAGMA foreign_keys = ON;`) stored at `src/data/fintrack.db`.
  2. Created dual-path re-export modules at `src/config.js`, `src/server.js`, `src/db/`, `src/models/`, `src/routes/`, and `src/middleware/` delegating cleanly to `src/server/`.
  3. Created and executed `src/test/persistence-verify.js`: created user, category, transactions, budget, and audit log, explicitly closed the database connection, re-opened the database in a fresh connection, and confirmed 100% data retention and accurate dashboard balance calculation.
  4. Verified user isolation: User B receives zero records when querying User A's transactions and budgets, and direct ID lookup returns 404/not found.
  5. Both backend test suites (`backend-test.js` [49/49 passed] and `persistence-verify.js` [passed]) and frontend production build (`vite build` [66 modules, 0 errors]) verified clean.

### [2026-10-05 15:50 IST] Entry 7: Final End-to-End Verification, Export & Security Admin Center
- **Focus:** Comprehensive verification across all 11 core application flows: registration, authentication, transaction CRUD, multi-criteria filtering, monthly budget calculations, live dashboard analytics, financial insights, CSV/JSON export, user isolation, admin RBAC, and security audit logs.
- **Key Challenges:** Adding CSV transaction export without route collision (`/export` before `/:id`), establishing privileged administrative console for system telemetry while blocking non-admin access, and populating realistic multi-category demo ledger records.
- **Resolution:**
  1. Built and mounted `/api/transactions/export` supporting RFC-compliant CSV with rupee conversion and JSON formats.
  2. Built `src/server/routes/admin.js` protected by `requireAuth` and `requireRole('ADMIN')` for user inspection, system metrics, and audit log exploration.
  3. Built `AdminPage.jsx` integrated into the React frontend and accessible to users with the `ADMIN` role.
  4. Enhanced database seeder (`seed.js`) to create an administrator account (`admin@fintrack.local`), 10 default categories, and realistic current-month income/expense transactions and budgets for the demo user (`demo@fintrack.local`) using environment-configured passwords.
  5. Authored and executed `src/test/e2e-verify.js` verifying all 11 requirements with 100% pass rate.
  6. Verified frontend production build compiles 67 modules with 0 errors (`vite build` in 29.9s). Updated all deployment, README, and submission documentation.

### [2026-10-05 19:05 IST] Entry 8: PS-01 Profile Management & User-Ownership Protection Verification
- **Focus:** Thorough verification, testing, and hardening of mandatory PS-01 user profile viewing and updating capabilities (`GET /api/auth/me` and `PUT /api/auth/me`).
- **Key Challenges:** Enforcing strict user-ownership so a user can never update another user's profile, validating input fields (name length and email regex), detecting cross-user email collisions without false conflicts when keeping one's own email, re-issuing refreshed JWT tokens upon email change, and maintaining visual design consistency in `ProfileModal.jsx`.
- **Resolution:**
  1. Verified backend routes: `GET /api/auth/me` returns safe user projection (no `password_hash`); `PUT /api/auth/me` extracts `req.user.id` strictly from authenticated JWT token, executes `validateProfileUpdate` middleware, validates cross-user email uniqueness via `User.emailTakenByOther`, and updates `name` and `email` using prepared statements.
  2. Verified audit trail: Every profile change records `PROFILE_UPDATE` in the immutable `audit_log` with client IP and metadata (`previousEmail`, `newEmail`, `nameUpdated`).
  3. Verified frontend integration: `ProfileModal.jsx` matches fintech theme tokens, providing accessible inputs, validation feedback, read-only immutable UUID display, role badge, and seamless state synchronization via `fintrack:auth-change` event.
  4. Expanded test coverage: Added Suite 8 (15 new assertions) to `src/test/backend-test.js` (total 64 passing), added test check 12 to `src/test/e2e-verify.js` (total 12 passing), and ran dedicated `src/test/profile-test.js` (100% passing).
### [2026-10-05 20:00 IST] Entry 9: Security Analysis Dashboard & Real Audit-Log Analytics
- **Focus:** Building the Security Analysis Dashboard backed 100% by real application audit-log data, with zero invented metrics or fake dashboard events.
- **Key Challenges:** Safely logging `AUTHORIZATION_DENIED` events in the `requireRole` authorization middleware without exposing passwords, JWT tokens, Authorization headers, or sensitive request bodies; querying and grouping real suspicious activity (repeated failed logins from the same IP, rate-limited requests, authorization failures); strictly locking down both the frontend view and backend `/api/admin/*` endpoints to authenticated `ADMIN` users; preserving the existing UI design system.
- **Resolution:**
  1. Updated `requireRole` middleware in `src/server/middleware/auth.js` to extract client IP and record `AUTHORIZATION_DENIED` in `AuditLog` with safe contextual metadata (`endpoint`, `method`, `userRole`, `requiredRoles`), strictly omitting tokens, headers, and request bodies before returning HTTP 403.
  2. Implemented `AuditLog.getSecurityMetrics()`, `AuditLog.getRecentSecurityActivity()`, and `AuditLog.getSuspiciousActivity()` in `src/server/models/AuditLog.js` querying exact database records from the `audit_log` table.
  3. Added `GET /api/admin/security-analysis` and enriched `GET /api/admin/stats` in `src/server/routes/admin.js` protected by `requireAuth` and `requireRole('ADMIN')`.
  4. Gated `AdminPage` in `src/frontend/src/App.jsx` with role validation (`user?.role === 'ADMIN'`), presenting a clean access restriction notice for standard `USER` accounts.
  5. Enhanced `AdminPage.jsx` with 4 security KPI cards (Successful Logins, Failed Logins, Authorization Denied, Rate-Limit Events), a dedicated Suspicious Activity panel (repeated failed logins by IP, rate limits, authorization failures), and a live recent security events stream.
  6. Added Suite 10 (29 assertions) to `src/test/backend-test.js` validating RBAC rejection of standard users, safe `AUTHORIZATION_DENIED` logging, metric fidelity against raw SQLite counts, repeated IP threat detection, rate-limit event tracking, and zero secret leakage (total 116 tests passing, 100% pass rate).

---

## 6. Testing, Security Verification & Deployment Record

### 6.1 Testing & Security Verification Strategy
- **Unit & Integration Tests:** Automated test suite in `src/test/backend-test.js` covering schema initialization, user registration, password verification, audit logging, category/transaction/budget models, integer paise math, complete IDOR isolation, PS-01 profile management, security hardening, rate limiting, and real-data Security Analysis Dashboard (116/116 automated tests passing).
- **Dedicated Profile Management Test Suite:** `src/test/profile-test.js` verifying safe profile viewing, name/email updates, duplicate email conflict detection, user-ownership isolation, refreshed JWT generation, and audit logging (100% passing).
- **End-to-End Verification Suite:** Dedicated `src/test/e2e-verify.js` testing 12 core functional & security criteria (12/12 passing).
- **Persistence Verification:** Automated persistence test in `src/test/persistence-verify.js` simulating process termination, connection teardown, and reopening to confirm permanent disk storage in `src/data/fintrack.db`.
- **Static Analysis & Build Verification:** Frontend production build (`cmd.exe /c "npm run build"`) compiles 68 modules with 0 errors.

### 6.2 Deployment Verification
- **Live Deployment Platform:** Local Node.js / Express Container (Ready for Render / Railway / Vercel)
- **Deployment URL:** `http://localhost:3000` (Frontend), `http://localhost:3001` (Backend)
- **Health Check Endpoint:** `GET /api/health`



