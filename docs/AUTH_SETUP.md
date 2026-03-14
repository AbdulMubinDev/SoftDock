# Social Login Setup (Google, GitHub) — Free Options

This guide explains how to add **Google** and **GitHub** sign-in to SoftDock. Both are **free** for normal usage (no per-login cost). The frontend already has "Continue with Google" and "Continue with GitHub" buttons; you only need to implement the backend and configure credentials.

---

## 1. Overview

- **Google OAuth 2.0** and **GitHub OAuth** are free. You create an app in each provider’s console, get a client ID and secret, and use them in your Django backend.
- **Flow:** User clicks "Continue with Google" → frontend redirects to your backend → backend redirects to Google/GitHub → user signs in → provider redirects back to your callback → backend creates/gets user and returns JWT (or redirects to frontend with tokens).

---

## 2. Google OAuth (Django)

### 2.1 Create a Google OAuth client (free)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. If asked, configure the **OAuth consent screen** (External, add your app name and support email).
5. Application type: **Web application**.
6. **Authorized redirect URIs:** add:
   - `http://localhost:8000/api/auth/google/callback/` (local)
   - `https://softdock.kybernode.com/api/auth/google/callback/` (production)
7. Copy the **Client ID** and **Client Secret**.

### 2.2 Backend: Django + django-allauth (recommended)

Install:

```bash
pip install django-allauth
```

In `settings.py`:

```python
INSTALLED_APPS += [
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
    }
}

# Redirect after social login (adjust to your frontend)
LOGIN_REDIRECT_URL = 'https://softdock.kybernode.com/login/callback/'  # or use a view that returns JWT
```

Environment variables (do not commit secrets):

```bash
# .env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

In Django, wire them:

```python
# In settings or from env
SOCIALACCOUNT_PROVIDERS['google']['APP'] = {
    'client_id': os.environ['GOOGLE_CLIENT_ID'],
    'secret': os.environ['GOOGLE_CLIENT_SECRET'],
    'key': '',
}
```

### 2.3 URLs for Google

Your backend should expose:

- **Start:** `GET /api/auth/google/login/`  
  - Redirects the user to Google’s consent screen.
- **Callback:** `GET /api/auth/google/callback/`  
  - Handles the redirect from Google, creates or gets the user, then either:
    - Issues a JWT and redirects to the frontend with token in query/fragment, or  
    - Sets an HTTP-only cookie and redirects to the frontend dashboard.

Example using django-allauth (you’d mount these under `/api/auth/google/` and ensure the callback URL matches what you set in Google Console):

- Allauth gives you URLs like `/accounts/google/login/`. You can alias them:
  - `/api/auth/google/login/` → redirect to Allauth’s Google login URL.
  - Allauth’s callback URL must be exactly what you added in Google Console (e.g. `https://softdock.kybernode.com/api/auth/google/callback/`).

### 2.4 Returning JWT to the frontend

After a successful social login in the callback view:

1. Get or create the user from the social account.
2. Generate JWT access + refresh tokens (same as your existing email/password login).
3. Redirect to the frontend callback URL with tokens in the **hash** (so they are not sent to the server):
   - `https://softdock.kybernode.com/login/callback#access_token=...&refresh_token=...`
   - The frontend route `/login/callback` (see `LoginCallback.tsx`) reads the hash, stores tokens in localStorage, fetches `/auth/me/`, and redirects to `/dashboard`.

---

## 3. GitHub OAuth (Django)

### 3.1 Create a GitHub OAuth App (free)

1. **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Authorization callback URL:**  
   - Local: `http://localhost:8000/api/auth/github/callback/`  
   - Prod: `https://softdock.kybernode.com/api/auth/github/callback/`
3. Copy **Client ID** and **Client Secret**.

### 3.2 Backend: django-allauth

Add the GitHub provider:

```python
# settings.py
INSTALLED_APPS += [
    # ...
    'allauth.socialaccount.providers.github',
]
```

Configure the app with env vars:

```python
# GitHub app from env
SOCIALACCOUNT_PROVIDERS['github'] = {
    'APP': {
        'client_id': os.environ['GITHUB_CLIENT_ID'],
        'secret': os.environ['GITHUB_CLIENT_SECRET'],
        'key': '',
    }
}
```

Expose:

- **Start:** `GET /api/auth/github/login/` (redirects to GitHub).
- **Callback:** `GET /api/auth/github/callback/` (same as Google: create/get user, issue JWT, redirect to frontend).

---

## 4. Frontend (already done)

- **Login page:** “Sign in with email” + “or continue with” → **Google** and **GitHub** buttons.
- **Register page:** Same “or sign up with” → **Google** and **GitHub**.
- Buttons point to:
  - Google: `{API_BASE}/auth/google/login/`
  - GitHub: `{API_BASE}/auth/github/login/`

Optional env (in `.env` or Vite):

- `VITE_GOOGLE_LOGIN_ENABLED=false` → hide Google button until backend is ready.
- `VITE_GITHUB_LOGIN_ENABLED=false` → hide GitHub button.

---

## 5. Other free providers

You can add more with django-allauth with no extra cost (same “create app → client ID + secret” model):

- **Microsoft** (`allauth.socialaccount.providers.microsoft`)
- **GitLab** (`allauth.socialaccount.providers.gitlab`)
- **Apple** (optional; requires Apple Developer account)

---

## 6. Summary

| Step | Action |
|------|--------|
| 1 | Create OAuth app in Google Cloud Console and GitHub; get client ID + secret. |
| 2 | Add authorized redirect URIs (callback URLs) in each provider. |
| 3 | Install `django-allauth`, add Google + GitHub providers, set env vars. |
| 4 | Expose `/api/auth/google/login/` and `/api/auth/google/callback/` (same for GitHub). |
| 5 | In callback: get/create user, issue JWT, redirect to frontend with tokens (or cookie). |
| 6 | (Optional) Add a `/login/callback` route on the frontend to read tokens from URL and store them. |

Google and GitHub OAuth are **free** for normal sign-in usage; no per-login fees.
