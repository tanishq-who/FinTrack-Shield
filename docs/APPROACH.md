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
- **Backend Framework:** Express.js (v4) — Lightweight, battle-tested HTTP server.
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
| **Phase 4: Polish & Deployment**| 18h – 24h | Frontend integration sync, live cloud deployment, final docs & commit freeze | Live deployment URL check | `Planned` |

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

---

## 6. Testing, Security Verification & Deployment Record

### 6.1 Testing & Security Verification Strategy
- **Unit & Integration Tests:** Automated test suite in `src/test/backend-test.js` covering schema initialization, user registration, duplicate prevention, password verification, audit logging, category/transaction/budget models, integer paise math, and complete IDOR isolation across multiple users (49 automated tests passing).
- **Static Analysis & Linting:** Dependency review ensuring zero native build dependencies.

### 6.2 Deployment Verification
- **Live Deployment Platform:** (To be configured — Render / Railway / Vercel)
- **Deployment URL:** (Pending — will be recorded in `metadata/submission.yaml` and `deployment/README.md`)
- **Health Check Endpoint:** `GET /api/health`
