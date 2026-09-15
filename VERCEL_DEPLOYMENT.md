# Vercel Deployment Guide for Sahakar Seva

This project is fully configured for zero-configuration or one-click deployment on **Vercel** with full support for both the Vite React Single Page Application (SPA) and the serverless Express API backend.

---

## 🚀 Quick Deployment Methods

### Option A: Deploy via GitHub & Vercel Dashboard (Recommended)

1. **Push to GitHub**: Push your repository to your GitHub/GitLab account.
2. **Import Project into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your Git repository and click **Import**.
3. **Configure Project Settings**:
   - **Framework Preset**: Vite (automatically detected from `vercel.json`).
   - **Build Command**: `vite build` (or left default as set in `vercel.json`).
   - **Output Directory**: `dist` (automatically detected).
   - **Node.js Version**: Select **22.x** (configured in `package.json` engines).
4. **Set Environment Variables**:
   In the Vercel project settings, add:
   | Variable | Value | Description |
   |---|---|---|
   | `GEMINI_API_KEY` | `AIzaSy...` | (Optional) Your Google Gemini API Key for AI demand forecasting |
   | `NODE_ENV` | `production` | Production environment |
5. Click **Deploy**.

---

### Option B: Deploy via Vercel CLI

1. Install the Vercel CLI if you haven't already:
   ```bash
   npm i -g vercel
   ```
2. Link and deploy directly from your project directory:
   ```bash
   vercel
   ```
3. To deploy to production:
   ```bash
   vercel --prod
   ```

---

## 🛠️ Architecture & Vercel Specifics

1. **Frontend**:
   - Built with Vite into `dist/`.
   - `vercel.json` includes client-side SPA fallback (`/(.*) -> /index.html`) so refreshing routes works seamlessly.
   - Static assets in `/assets/*` are configured with long-term immutable caching.

2. **Serverless Backend API (`/api/*`)**:
   - All backend routes are served via the Vercel Serverless Function entry point in `api/index.ts`.
   - Requests to `/api/*` are rewritten to `api/index.ts` and dispatched via the Express application in `server/app.ts`.
   - Cross-Origin Resource Sharing (CORS) is enabled so preview URLs can communicate securely.

3. **Persistent SQLite Database in Serverless**:
   - In serverless environments like Vercel, the application directory is read-only.
   - `server/db.ts` automatically detects the Vercel environment (`process.env.VERCEL`) and creates the database in `/tmp` (`os.tmpdir()`), with an automated fallback to in-memory SQLite if file creation fails.
   - System seed records (Admin and Demo accounts) are created idempotently on cold start.

4. **Available API Endpoints**:
   - `GET /api/health` — Service status and Gemini connectivity check
   - `GET /api/db/stats` — Database table counters and telemetry
   - `POST /api/auth/register` — Worker and customer registration
   - `POST /api/auth/login` — Phone/email credential login
   - `GET /api/auth/me` — Session verification
   - `GET /api/workers` — Verified and available artisan roster with filter by trade
   - `POST /api/workers/:id/skill-check` — Competency assessment scoring & seal issuance
   - `GET /api/bookings` — Booking history and active dispatches
   - `POST /api/bookings` — Create a new service request
   - `POST /api/forecast` — AI demand forecasting and weather surge analysis
