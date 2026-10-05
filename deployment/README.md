# Deployment Documentation — FinTrack Shield (PS-01)
## Build Secure 24 Hackathon — Abhedya (VBIT Cybersecurity Forum)

This document provides exact, reproducible instructions for deploying **FinTrack Shield** to a real public production environment.

---

## 1. Production Architecture Overview

```
                               ┌─────────────────────────────────────────────────┐
                               │                 Client Browser                  │
                               └───────────────────────┬─────────────────────────┘
                                                       │
                           HTTPS Requests              │ HTTPS REST API
                           (SPA Navigation)            │ (/api/*, Bearer JWT)
                                                       ▼
                        ┌────────────────────────────────────────────────────────┐
                        │                   Vercel Frontend                      │
                        │   * Static Vite + React 18 SPA bundle                  │
                        │   * Built from: src/frontend                           │
                        │   * Client-side SPA rewrites: vercel.json              │
                        │   * VITE_API_URL -> Backend /api                       │
                        └──────────────────────────────┬─────────────────────────┘
                                                       │
                                                       │ Secure CORS Allowed
                                                       ▼
                        ┌────────────────────────────────────────────────────────┐
                        │               Railway / Render Backend                 │
                        │   * Express.js REST API                                │
                        │   * Sourced from: src/ (Node.js 22+ / 24+)             │
                        │   * Security Stack: Helmet, Strict CORS, Rate Limiting │
                        │   * JWT Auth (strictly enforced 32+ char secret)       │
                        │   * Health Check: GET /api/health                      │
                        └──────────────────────────────┬─────────────────────────┘
                                                       │
                                                       │ Node 24 native node:sqlite
                                                       ▼
                        ┌────────────────────────────────────────────────────────┐
                        │            Persistent Disk Volume (/data)              │
                        │   * Path: /data/fintrack.db (configured via DB_PATH)   │
                        │   * WAL Mode (Write-Ahead Logging)                     │
                        │   * Foreign keys & Row-Level User Isolation (IDOR-safe)│
                        │   * Survives container restarts, deploys & restarts    │
                        └────────────────────────────────────────────────────────┘
```

---

## 2. Required Environment Variables

### 2.1 Backend Environment Variables (Railway / Render)

Configure these in the Railway or Render dashboard under **Variables / Environment**:

| Variable Name | Description | Example / Recommended Production Value | Required? |
|---|---|---|---|
| `NODE_ENV` | Application environment mode | `production` | **Yes** |
| `PORT` | Server listen port | `3001` (or platform `$PORT`) | **Yes** |
| `DB_PATH` | Path to persistent SQLite database on volume mount | `/data/fintrack.db` | **Yes** |
| `JWT_SECRET` | Cryptographically secure token signing key (min 32 chars) | `<generate-using-openssl-rand-hex-32>` | **Yes** (Startup fails if missing/weak) |
| `JWT_EXPIRES_IN` | Token expiration time | `8h` | Optional (default: `8h`) |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins | `https://fin-track-shield.vercel.app` | **Yes** |
| `RATE_LIMIT_WINDOW_MS` | General API rate limiter window (milliseconds) | `900000` (15 minutes) | Optional (default: 15m) |
| `RATE_LIMIT_MAX` | Max general API requests per IP per window | `100` | Optional (default: 100) |
| `LOGIN_RATE_LIMIT_WINDOW_MS` | Login rate limiter window (milliseconds) | `900000` (15 minutes) | Optional (default: 15m) |
| `LOGIN_RATE_LIMIT_MAX` | Max login attempts per IP per window | `5` | Optional (default: 5) |

> 🔒 **Security Notice for `JWT_SECRET`**:
> Generate a strong production secret using:
> ```bash
> openssl rand -hex 32
> ```
> FinTrack Shield strictly validates that `JWT_SECRET` in production is at least 32 characters long and does not contain default placeholders (`CHANGE_ME`). Startup is aborted immediately if this condition is not met.

### 2.2 Frontend Environment Variables (Vercel)

Configure this in the Vercel dashboard under **Project Settings → Environment Variables**:

| Variable Name | Description | Example Production Value | Required? |
|---|---|---|---|
| `VITE_API_URL` | Base URL of deployed backend REST API including `/api` | `https://fintrack-shield-production.up.railway.app/api` | **Yes** |

> ⚠️ **Build-Time Variable**: In Vite, `VITE_*` variables are embedded into static assets at build time. When you change `VITE_API_URL`, you must trigger a redeploy on Vercel for the change to take effect.

---

## 3. Step-by-Step Backend Deployment

Choose either **Option A (Railway)** or **Option B (Render)**.

### Option A: Railway (Recommended)

1. **Log in to Railway**:
   - Navigate to [railway.app](https://railway.app) and sign in with GitHub.

2. **Create New Project**:
   - Click **+ New Project** → **Deploy from GitHub repo**.
   - Select your team's repository (`tanishq-who/FinTrack-Shield`).

3. **Configure Service Settings**:
   - Go to your service's **Settings** tab:
     - **Root Directory**: Set to `src`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start` (or `node server/server.js`)

4. **Attach a Persistent Volume for SQLite**:
   - In the service canvas, click **+ Add Volume** (or click on the service → **Volumes** tab → **Add Volume**).
   - Set **Mount Path**: `/data`
   - Volume Name: `fintrack-data`
   - *This ensures `/data/fintrack.db` persists across deploys and container recycles.*

5. **Set Environment Variables**:
   - Open the **Variables** tab and add:
     ```env
     NODE_ENV=production
     PORT=3001
     DB_PATH=/data/fintrack.db
     JWT_SECRET=<32+ random characters generated via openssl rand -hex 32>
     CORS_ORIGIN=https://fin-track-shield.vercel.app
     ```
     *(If you haven't deployed the frontend yet, set `CORS_ORIGIN=http://localhost:3000` temporarily, then update it once Vercel gives you your frontend URL).*

6. **Generate Domain**:
   - Go to **Settings** → **Networking** → **Public Networking** → Click **Generate Domain**.
   - Note your public backend URL (e.g., `https://fintrack-backend.up.railway.app`).

7. **Verify Deployment & Health Check**:
   - In your browser or terminal, verify:
     ```bash
     curl -i https://<your-backend-subdomain>.up.railway.app/api/health
     ```
   - Expected Response (`HTTP 200 OK`):
     ```json
     {
       "status": "healthy",
       "service": "FinTrack Shield API",
       "version": "1.0.0",
       "uptime": 12,
       "database": "connected",
       "timestamp": "2026-10-05T..."
     }
     ```

---

### Option B: Render

1. **Log in to Render**:
   - Navigate to [render.com](https://render.com) and sign in.

2. **Create Web Service**:
   - Click **New +** → **Web Service** → Connect your GitHub repository.

3. **Configure Service Details**:
   - **Name**: `fintrack-shield-api`
   - **Region**: Choose the closest region (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: `src`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/server.js`

4. **Add Persistent Disk**:
   - Scroll down to **Disks** → Click **Add Disk**:
     - **Name**: `fintrack-disk`
     - **Mount Path**: `/data`
     - **Size**: 1 GB

5. **Configure Environment Variables**:
   - Under **Environment Variables**, add:
     ```env
     NODE_ENV=production
     DB_PATH=/data/fintrack.db
     JWT_SECRET=<32+ random characters generated via openssl rand -hex 32>
     CORS_ORIGIN=https://<your-subdomain>.vercel.app
     ```

6. **Set Health Check Path**:
   - Under **Advanced Settings**, set **Health Check Path** to `/api/health`.

7. **Deploy and Verify**:
   - Click **Create Web Service**. Wait for the build and deployment to complete.
   - Test the public endpoint: `https://<your-service>.onrender.com/api/health`.

---

## 4. Step-by-Step Frontend Deployment (Vercel)

1. **Log in to Vercel**:
   - Navigate to [vercel.com](https://vercel.com) and sign in with GitHub.

2. **Import Project**:
   - Click **Add New...** → **Project**.
   - Select your repository (`tanishq-who/FinTrack-Shield`).

3. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `src/frontend`
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `dist` (Default)
   - **Install Command**: `npm install` (Default)

4. **Add Environment Variable**:
   - Expand the **Environment Variables** section:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://<your-backend-subdomain>.up.railway.app/api` (use your actual deployed backend URL from Step 3, ending with `/api`)

5. **Deploy**:
   - Click **Deploy**.
   - Vercel installs dependencies, compiles Vite assets into `src/frontend/dist`, and applies the SPA routing rules defined in `src/frontend/vercel.json`.
   - When finished, Vercel provides your live production URL:
     `https://<your-project-name>.vercel.app`

6. **Update Backend CORS Configuration**:
   - Return to Railway or Render.
   - Update `CORS_ORIGIN` to your exact Vercel URL:
     ```env
     CORS_ORIGIN=https://fin-track-shield.vercel.app
     ```
   - Redeploy or restart the backend service to apply the origin change.

---

## 5. Post-Deployment Verification & Smoke Testing

Perform these verification checks against the live public deployment:

### 1. Backend Health Check
```bash
curl -i https://<your-backend-service>.up.railway.app/api/health
```
- Confirm HTTP status `200 OK`.
- Confirm JSON body contains `"status":"healthy"` and `"database":"connected"`.

### 2. Frontend Access & SPA Routing
- Open `https://<your-project-name>.vercel.app` in your browser.
- Verify the FinTrack Shield login/landing interface loads with secure HTTPS.
- Refresh the page on sub-routes (e.g., `#dashboard`, `#transactions`) to verify client routing operates without 404 errors.

### 3. User Registration & Authentication
- Click **Get Started** or **Register**.
- Create a test account (e.g. `testuser@example.com`).
- Verify instant login, receipt of JWT token, and transition to the Personal Finance Dashboard.

### 4. Ledger & Budget Operation
- Add an Income transaction (e.g., ₹50,000 "Freelance Development").
- Add an Expense transaction (e.g., ₹1,200 "Groceries").
- Verify that summary balances, savings rate, and category charts update accurately.
- Set a monthly budget for "Groceries" and confirm progress calculation.

### 5. Data Persistence Across Redeployments
- Trigger a redeployment or restart of the backend service in Railway/Render.
- Refresh the frontend application once the backend is back online.
- Verify that your transactions and budgets remain intact, confirming that `/data/fintrack.db` is successfully mounted on the persistent platform volume.

### 6. Export Test
- Click **Export CSV** on the Transactions view.
- Verify the CSV download contains only transactions belonging to the authenticated user.

---

## 6. Updating Submission Metadata

After public deployment, update `metadata/submission.yaml` with your live URLs:

```yaml
submission:
  team_id: "team-yp"
  problem_statement: "PS-01 Personal Finance"
  project_name: "FinTrack Shield"
  repository: "https://github.com/tanishq-who/FinTrack-Shield.git"
  commit_sha: "<frozen-commit-sha>"
  deployment_url: "https://fin-track-shield.vercel.app"
  health_url: "https://fintrack-shield-production.up.railway.app/api/health"
  submitted_at: "2026-10-06T10:00:00+05:30"
```
