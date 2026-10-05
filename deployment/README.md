# Deployment Documentation — Build Secure 24
## FinTrack Shield — Secure Personal Finance Management (PS-01)

## Overview

FinTrack Shield is built with an Express.js secure REST API backend backed by SQLite (`node:sqlite`) and a React 18 + Vite frontend application.
The application enforces defense-in-depth:
- Row-level access control (`WHERE user_id = ?`) preventing IDOR
- Integer paise monetary accounting
- Bcrypt 12-round password hashing
- Role-Based Access Control (RBAC: USER and ADMIN)
- Write-Ahead Logging (WAL) SQLite persistence
- Immutable append-only audit trail

---

## Live Deployment & Access Reference

- **Backend API URL:** `http://localhost:3001` (Health: `http://localhost:3001/api/health`)
- **Frontend Application URL:** `http://localhost:3000`
- **Hosting Platform:** Local / Node.js Container (Production deployable to Render / Railway / AWS EC2)
- **Access Credentials for Evaluators:**
  - **Standard User (Finance Ledger & Budgets):**
    - Email: `demo@fintrack.local`
    - Password: Sourced from `DEMO_USER_PASSWORD` environment variable
    - Role: `USER`
    - Pre-seeded with: Monthly salary credit, groceries, transit card, utilities, dining expenses, and 3 monthly category budgets.
  - **Security Administrator (Audit & Telemetry Center):**
    - Email: `admin@fintrack.local`
    - Password: Sourced from `ADMIN_PASSWORD` environment variable
    - Role: `ADMIN`
    - Privileged console: System statistics, registered user list, and complete security audit trail.

---

## Required Environment Variables

### Backend Configuration (`src/.env`)

| Variable Name | Description | Default / Example | Required |
|---------------|-------------|-------------------|----------|
| `PORT` | API server listen port | `3001` | Yes |
| `NODE_ENV` | Runtime environment mode | `development` / `production` | Yes |
| `JWT_SECRET` | Secret key for signing tokens (≥32 chars) | `<secure-random-32-char-secret>` | Yes (Strictly enforced in production) |
| `JWT_EXPIRES_IN` | Token validity duration | `8h` | Yes |
| `DB_PATH` | Relative path to persistent SQLite database | `./data/fintrack.db` | Yes |
| `CORS_ORIGIN` | Comma-separated list of allowed origins | `http://localhost:3000,http://localhost:5173` | Yes |
| `RATE_LIMIT_WINDOW_MS` | General rate limiter time window | `900000` (15 min) | Yes |
| `RATE_LIMIT_MAX` | Max requests per IP per window | `100` | Yes |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | Login rate limiter time window | `900000` (15 min) | Yes |
| `LOGIN_RATE_LIMIT_MAX` | Max login attempts per IP per window | `5` | Yes |
| `DEMO_USER_PASSWORD` | Password for demo user account seed | `<strong-demo-password>` | Required for dev seeding |
| `ADMIN_PASSWORD` | Password for admin user account seed | `<strong-admin-password>` | Required for dev seeding |

### Frontend Configuration (`src/frontend/.env`)

| Variable Name | Description | Default / Example | Required |
|---------------|-------------|-------------------|----------|
| `VITE_API_URL` | Base URL for REST API calls | `/api` (proxied by Vite to `http://localhost:3001`) | Yes |

---

## Build & Launch Instructions

### 1. Prerequisites
- **Node.js**: v22+ or v24+ (uses native `node:sqlite` DatabaseSync)
- **NPM**: v10+

### 2. Install Dependencies
```bash
# Install backend dependencies
cd src
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 3. Initialize & Seed Database
```bash
cd src
node server/db/seed.js
```
*(Creates `src/data/fintrack.db`, runs DDL schema migrations, seeds default categories, demo account, sample ledger records, and admin account).*

### 4. Run Automated Test Verification
```bash
cd src
# Run API, security & profile unit tests (64 checks)
node test/backend-test.js

# Run full End-to-End verification (12 checks)
node test/e2e-verify.js

# Run dedicated PS-01 profile management & security test suite
node test/profile-test.js

# Run database persistence verification
node test/persistence-verify.js
```

### 5. Launch Application Services
```bash
# Terminal 1 — Start Backend Server (Port 3001)
cd src
node server.js

# Terminal 2 — Start Frontend Application (Port 3000)
cd src/frontend
npm run dev
```

### 6. Production Frontend Build
```bash
cd src/frontend
npm run build
```
*(Generates optimized static bundle in `src/frontend/dist/` with zero build warnings).*
