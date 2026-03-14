# SoftDock — Complete Setup Checklist

Use this list to finish setting up SoftDock end-to-end. Tick items as you complete them.

---

## 1. Frontend (React/Vite) — mostly done

| # | Task | Status / Notes |
|---|------|----------------|
| 1.1 | Copy `frontend/.env.example` → `frontend/.env` or `frontend/.env.local` | Set `VITE_API_URL` and `VITE_WS_URL` to your backend (e.g. `http://localhost:8000/api` for local dev). |
| 1.2 | Run `npm install` and `npm run build` in `frontend/` | Confirm build succeeds. |
| 1.3 | (Optional) Hide social login until backend is ready | Set `VITE_GOOGLE_LOGIN_ENABLED=false` and/or `VITE_GITHUB_LOGIN_ENABLED=false` in `.env`. |

---

## 2. Backend (Django) — to be built

| # | Task | Status / Notes |
|---|------|----------------|
| 2.1 | Create Django project (e.g. `backend/` or `softdock/backend/`) | Per `SoftDock_Project_Document.md`: core, accounts, workspaces, issues, knowledge, billing, streaming. |
| 2.2 | Configure PostgreSQL and run migrations | Create DB, set `DATABASE_URL` in backend `.env`. |
| 2.3 | Implement auth endpoints | `POST /api/auth/register/`, `POST /api/auth/login/`, `POST /api/auth/token/refresh/`, `GET/PUT /api/auth/me/`. |
| 2.4 | (Optional) Add social login | See `AUTH_SETUP.md`: django-allauth, Google/GitHub OAuth, callback URLs, JWT in redirect to `/login/callback#access_token=...`. |

---

## 3. Backend environment variables

Create a `.env` (or use env vars) in the backend root. You need at least:

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Django secret key. |
| `DEBUG` | `False` in production. |
| `ALLOWED_HOSTS` | e.g. `softdock.kybernode.com,localhost`. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `REDIS_URL` | For Celery (e.g. `redis://localhost:6379/0`). |
| `ENCRYPTION_KEY` | Fernet key for encrypting user API keys. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Only if you add Google login (see `AUTH_SETUP.md`). |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Only if you add GitHub login. |
| (Optional) `PADDLE_*` | For billing (vendor ID, API key, webhook secret). |

---

## 4. Database and services

| # | Task | Status / Notes |
|---|------|----------------|
| 4.1 | Install and run PostgreSQL | Create database and user; run Django migrations. |
| 4.2 | Install and run Redis | Required for Celery (doc ingestion, etc.). |
| 4.3 | Run Celery worker (and beat if needed) | After Django and Redis are configured. |

---

## 5. Social login (Google / GitHub) — optional

| # | Task | Status / Notes |
|---|------|----------------|
| 5.1 | Create Google OAuth client | Google Cloud Console → OAuth 2.0 Client ID; set redirect URI to `https://yourdomain.com/api/auth/google/callback/`. |
| 5.2 | Create GitHub OAuth App | GitHub → Developer settings → OAuth Apps; set callback to `https://yourdomain.com/api/auth/github/callback/`. |
| 5.3 | Implement backend OAuth start + callback | e.g. `/api/auth/google/login/`, `/api/auth/google/callback/` (and same for GitHub). Callback: create/get user, issue JWT, redirect to `https://yoursite.com/login/callback#access_token=...&refresh_token=...`. |
| 5.4 | Frontend callback page | Already implemented: `/login/callback` reads tokens from hash and redirects to dashboard. |

Full steps: **`docs/AUTH_SETUP.md`**.

---

## 6. Deployment (production)

| # | Task | Status / Notes |
|---|------|----------------|
| 6.1 | Point domain to server | e.g. `softdock.kybernode.com` → your VPS IP. |
| 6.2 | Nginx (or similar) | Proxy `/api/` and `/ws/` to Django (e.g. port 8000); proxy `/` to frontend (e.g. port 3000 or serve static build). |
| 6.3 | SSL | e.g. Cloudflare or Certbot; ensure `https://` and `wss://` work. |
| 6.4 | Run Django (e.g. Gunicorn + Uvicorn) | ASGI for WebSockets (Channels). |
| 6.5 | Serve frontend | Build with `npm run build`; serve `frontend/dist/` via Nginx or a static host. |
| 6.6 | Set production env vars | Frontend: `VITE_API_URL`, `VITE_WS_URL` point to production API/WS. Backend: production `ALLOWED_HOSTS`, `DATABASE_URL`, secrets, OAuth callbacks. |

---

## 7. Quick reference — what you need to provide

- **Backend:** Django project, DB, Redis, env vars, auth + (optional) OAuth endpoints.  
- **Frontend:** `.env` with `VITE_API_URL` and `VITE_WS_URL`; optional flags to hide social buttons.  
- **Social login:** OAuth app credentials (Google/GitHub) and backend callback that issues JWT and redirects to `/login/callback#access_token=...&refresh_token=...`.  
- **Deployment:** Server, Nginx, SSL, process manager (e.g. systemd or PM2) for Django and Celery.

For OAuth details, see **`AUTH_SETUP.md`**. For architecture and APIs, see **`SoftDock_Project_Document.md`**.
