# Netlify Deployment Guide for Sahakar Seva

This project is configured for one-click or Git deployment to **Netlify** with full support for:
- **Vite React Single Page Application (SPA)** with clean client-side routing.
- **Serverless Express API (`/api/*`)** via Netlify Functions powered by `serverless-http`.
- **Firebase Authentication & Firestore** with domain authorization tips.
- **Persistent SQLite Database** with automatic fallback to `/tmp` storage and in-memory cache in serverless runtime.

---

## 🚀 Quick Deployment Methods

### Option A: Deploy via GitHub & Netlify Web UI (Recommended)

1. **Push your repository to GitHub / GitLab**.
2. Go to **[app.netlify.com](https://app.netlify.com/)** and log in.
3. Click **Add new site** → **Import an existing project**.
4. Select your repository. Netlify will automatically read `netlify.toml` with:
   - **Base directory**: (Leave blank / root)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
5. **Add Environment Variables**:
   Under **Site configuration** → **Environment variables**:
   | Variable | Recommended Value | Note |
   |---|---|---|
   | `NODE_VERSION` | `22` | Node 22 runtime for native SQLite |
   | `NODE_ENV` | `production` | Production mode |
   | `GEMINI_API_KEY` | `AIzaSy...` | (Optional) For AI demand forecasting |
6. Click **Deploy site**.

---

### Option B: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
2. Login and deploy:
   ```bash
   netlify login
   netlify init
   ```
3. Deploy to production:
   ```bash
   netlify deploy --prod
   ```

---

## 🔐 Authorize Netlify Domain in Firebase

Once deployed, your Netlify site will be assigned a URL like:
`https://your-site-name.netlify.app`

To prevent `auth/unauthorized-domain` errors when logging in with Google:
1. Open [Firebase Console → Authentication → Settings](https://console.firebase.google.com/project/gen-lang-client-0694832781/authentication/settings).
2. Under **Authorized domains**, click **Add domain**.
3. Enter:
   ```
   your-site-name.netlify.app
   ```
4. Click **Save**.

---

## 🛠️ Architecture on Netlify

- **Frontend**: Vite builds into `dist/`. All non-API routes are rewritten to `/index.html` as defined in `netlify.toml`.
- **Backend API**: All requests to `/api/*` are transparently rewritten to `/.netlify/functions/api/*` and dispatched by `server/app.ts` via `serverless-http`.
- **Database**: SQLite stores data in the system `/tmp` partition with automatic fallback to in-memory mode if disk writes are restricted.
