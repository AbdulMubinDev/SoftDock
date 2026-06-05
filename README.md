# SoftDock

**AI-driven software issue resolution platform** — debug faster with streaming, context-aware answers powered by your own API keys.

Built by [Kybernode](https://kybernode.com) as a portfolio project demonstrating full-stack AI application development.

---

## What is SoftDock?

Developers often lose hours chasing errors across docs, GitHub issues, and Stack Overflow — then paste fragments into a general AI that lacks the right context. SoftDock is a focused debugging assistant that:

- Maintains **workspace-isolated** issue threads with **streaming AI responses**
- Uses a **BYOK (Bring Your Own Key)** model — you connect your own provider keys; SoftDock does not resell AI access
- Builds **resolution memory** on paid tiers — previously solved issues inform future debugging sessions
- Supports **file attachments** (logs, screenshots, config files) on supported plans
- Runs a **knowledge ingestion pipeline** (backend) for uploading docs and URLs into workspace context

Unlike ChatGPT or Claude.ai, SoftDock is built around *your* stack traces, logs, and project history — not generic training data alone.

---

## Features

| Area | Details |
|------|---------|
| **Auth** | Email/password registration, JWT sessions, optional Google & GitHub OAuth |
| **Workspaces** | Multi-workspace support with plan-based limits |
| **Issue chat** | Create threads, send messages, stream AI replies over WebSocket |
| **AI providers** | Anthropic, OpenAI, Google Gemini, Groq, xAI, OpenRouter (BYOK) |
| **Attachments** | Images, logs, JSON, XML, and more (plan-gated) |
| **History** | Browse and filter resolved/archived issues |
| **Settings** | Profile, encrypted API keys, workspace management |
| **Plans** | Free, Starter, Pro, Founding Member — limits enforced in backend |

---

## Tech stack

### Backend
- **Django 5** + Django REST Framework
- **Django Channels** + **Daphne** — WebSocket streaming
- **Celery** + **Redis** — async document processing
- **PostgreSQL** — primary database (Docker)
- **Anthropic / OpenAI SDKs** — multi-provider AI with key fallback chain
- **Fernet encryption** — API keys encrypted at rest

### Frontend
- **React 19** + **TypeScript**
- **Vite 8** — build tooling
- **Tailwind CSS v4** — dark-first Kybernode design system
- **Zustand** — global state (auth, workspaces, issues)
- **React Router** — client-side routing

### Infrastructure
- **Docker Compose** — PostgreSQL, Redis, backend, Celery, nginx + static frontend
- **Nginx** — reverse proxy (`/api`, `/ws`, `/media`, `/admin` → backend; `/` → React)

---

## Quick start (Docker)

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine + Compose.

```bash
git clone https://github.com/AbdulMubinDev/SoftDock.git
cd SoftDock

# 1. Configure secrets
cp .env.example .env
```

Edit `.env` and set `SECRET_KEY` and `ENCRYPTION_KEY`:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

```bash
# 2. Start the full stack
docker compose up --build -d

# 3. Open the app
# http://localhost:8080
```

**First-time setup in the UI:**
1. Register an account
2. Go to **Settings → API Keys** and add a provider key (e.g. OpenAI or Groq)
3. Open **Dashboard** and start a new issue

**Create a Django admin user:**

```bash
docker compose exec backend python manage.py createsuperuser
# Admin: http://localhost:8080/admin/
```

More commands and troubleshooting: [`docs/DOCKER.md`](docs/DOCKER.md)

---

## Architecture

```
Browser
   │
   ▼
┌─────────────────────────────────────┐
│  web (nginx :8080)                  │
│  /          → React static (Vite)   │
│  /api/      → backend :8000         │
│  /ws/       → backend (WebSocket)   │
│  /media/    → backend               │
└─────────────────────────────────────┘
   │
   ├──► backend (Daphne ASGI)
   │         ├── PostgreSQL (db)
   │         └── Redis (Channels)
   │
   └──► celery (background tasks)
```

**Request flow:** User message → REST API saves to DB → WebSocket consumer streams AI tokens → full response saved as assistant message.

---

## Project structure

```
SoftDock/
├── backend/                 # Django project
│   ├── accounts/            # Users, JWT auth, encrypted API keys, OAuth
│   ├── workspaces/          # Workspace CRUD and membership
│   ├── issues/              # Issue threads, messages, attachments, AI client
│   ├── knowledge/           # Document ingestion (Celery pipeline)
│   ├── streaming/           # WebSocket consumers
│   └── core/                # Settings, ASGI, Celery config
├── frontend/                # React + Vite SPA
│   └── src/
│       ├── pages/           # Dashboard, History, Settings, Landing, …
│       ├── components/      # Layout, chat, landing sections
│       └── lib/             # API client, Zustand stores
├── docker/                  # nginx config, web Dockerfile
├── docs/                    # Setup guides and project spec
├── scripts/                 # clean-local.sh, run-docker.sh
├── docker-compose.yml
└── .env.example
```

---

## Environment variables

All configuration lives in `.env` at the project root. See [`.env.example`](.env.example).

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Django secret (required) |
| `ENCRYPTION_KEY` | Fernet key for BYOK encryption (required when `DEBUG=False`) |
| `DEBUG` | `False` for production-like runs |
| `WEB_PORT` | Host port for nginx (default `8080`) |
| `POSTGRES_*` | Database credentials |
| `GOOGLE_*` / `GITHUB_*` | Optional OAuth credentials |

Optional social login setup: [`docs/AUTH_SETUP.md`](docs/AUTH_SETUP.md)

---

## Local development (without Docker)

If you prefer running services natively:

1. Start **PostgreSQL** (or use SQLite by omitting `DATABASE_URL`) and **Redis**
2. `cd backend && python -m venv .venv && pip install -r requirements.txt`
3. Copy `backend/.env.example` → `backend/.env`, run `python manage.py migrate`
4. Start Daphne: `daphne -b 127.0.0.1 -p 8000 core.asgi:application`
5. Start Celery: `celery -A core worker --loglevel=info`
6. `cd frontend && npm install && npm run dev` → http://localhost:5173

Set `VITE_API_URL=http://127.0.0.1:8000/api` and `VITE_WS_URL=ws://127.0.0.1:8000/ws` in `frontend/.env`.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [`docs/DOCKER.md`](docs/DOCKER.md) | Docker Compose reference |
| [`docs/SETUP_CHECKLIST.md`](docs/SETUP_CHECKLIST.md) | End-to-end setup checklist |
| [`docs/AUTH_SETUP.md`](docs/AUTH_SETUP.md) | Google / GitHub OAuth |
| [`docs/SoftDock_Project_Document.md`](docs/SoftDock_Project_Document.md) | Full product spec and API reference |
| [`docs/external_services_need.md`](docs/external_services_need.md) | Redis, AI keys, PostgreSQL notes |

---

## Roadmap / known gaps

- **Knowledge Base UI** — backend pipeline exists; frontend page and AI context injection not wired yet
- **Billing** — plan limits are coded; Paddle/checkout integration is not connected
- **Production VPS deploy** — Docker is ready locally; nginx on Contabo/Cloudflare is documented in the project spec

---

## License

Portfolio / demonstration project by Kybernode. See repository for usage terms.

---

## Links

- **Repository:** https://github.com/AbdulMubinDev/SoftDock
- **Kybernode:** https://kybernode.com
